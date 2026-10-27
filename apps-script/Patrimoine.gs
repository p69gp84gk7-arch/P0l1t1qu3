/**
 * Patrimoine des candidats : la HATVP publie les déclarations de patrimoine des candidats à la
 * présidentielle au moins 15 jours avant le premier tour. Toutes les 6 heures, le script lit la liste
 * des déclarations publiées (open data HATVP) et ajoute celles des candidats dans l'onglet patrimoine.
 * Quand la déclaration existe en XML, les montants sont calculés ; sinon la ligne est créée avec le
 * lien vers la déclaration et les montants restent à saisir.
 *
 * Paramètres (onglet parametres) : maj_patrimoine (oui / non), patrimoine_election (2027),
 * patrimoine_depuis (date à partir de laquelle une déclaration publiée est prise en compte).
 */

var HATVP_LISTE = "https://www.hatvp.fr/livraison/opendata/liste.csv";
var HATVP_DOSSIERS = "https://www.hatvp.fr/livraison/dossiers/";

// Rubriques d'actif de la déclaration et champ qui porte la valeur
var PATRIMOINE_RUBRIQUES = [
  ["immeubleDto", "valeurVenale"], ["sciDto", "valeur"], ["valeursNonEnBourseDto", "valeurActuelle"],
  ["valeursEnBourseDto", "valeur"], ["assuranceVieDto", "valeurRachat"], ["comptesBancaireDto", "valeur"],
  ["bienDiverDto", "valeur"], ["vehiculeDto", "valeur"], ["fondDto", "valeur"], ["autreBienDto", "valeur"],
  ["bienEtrangerDto", "valeur"]
];

/** liste.csv (séparateur ;) en objets indexés par l'en-tête. Fonction pure. */
function hatvpCsv(texte) {
  var l = String(texte).replace(/^﻿/, "").split(/\r?\n/).filter(function (x) { return x.trim(); });
  if (!l.length) return [];
  var h = l[0].split(";");
  return l.slice(1).map(function (ligne) {
    var c = ligne.split(";"), o = {};
    h.forEach(function (k, i) { o[k] = (c[i] || "").replace(/^"|"$/g, "").trim(); });
    return o;
  });
}

/** Déclarations de situation patrimoniale de candidats à la présidentielle publiées depuis une date. Fonction pure. */
function hatvpDeclarationsCandidats(liste, depuis) {
  return liste.filter(function (r) {
    var date = r.date_publication || r.date_depot || "";
    return r.type_document === "dsp" && date >= depuis &&
      (/presiden|candidat/i.test(r.type_mandat) || /candidat/i.test(r.qualite));
  });
}

function patrimoineNombre(s) {
  if (s === null || s === undefined) return null;
  var n = parseFloat(String(s).replace(/[\s  ]/g, "").replace(",", "."));
  return isFinite(n) ? n : null;
}

/** Contenu des éléments <items> d'une rubrique, sans les biens marqués comme non conservés. */
function patrimoineElements(xml, rubrique) {
  var m = String(xml).match(new RegExp("<" + rubrique + ">([\\s\\S]*?)</" + rubrique + ">"));
  if (!m) return [];
  var out = [], re = /<items>((?:(?!<items>)[\s\S])*?)<\/items>/g, x;
  while ((x = re.exec(m[1]))) if (!/<conservee>\s*false\s*<\/conservee>/.test(x[1])) out.push(x[1]);
  return out;
}

function patrimoineChamp(element, champ) {
  var m = element.match(new RegExp("<" + champ + ">([^<]*)</" + champ + ">"));
  return m ? m[1] : null;
}

/**
 * Montants d'une déclaration XML de la HATVP : biens (immeubles comptés pour la quote-part détenue)
 * et dettes (capital restant dû). Fonction pure.
 */
function patrimoineDepuisXml(xml) {
  var biens = 0, dettes = 0;
  PATRIMOINE_RUBRIQUES.forEach(function (r) {
    patrimoineElements(xml, r[0]).forEach(function (it) {
      var v = patrimoineNombre(patrimoineChamp(it, r[1])) || 0;
      if (r[0] === "immeubleDto") {
        var q = patrimoineNombre(patrimoineChamp(it, "quotePart"));
        if (q !== null) v = v * q / 100;
      }
      biens += v;
    });
  });
  patrimoineElements(xml, "passifDto").forEach(function (it) {
    dettes += patrimoineNombre(patrimoineChamp(it, "restantDu")) || 0;
  });
  return { patrimoine: Math.round(biens), dettes: Math.round(dettes) };
}

/** « LE PEN » → « Le Pen », « DUPONT-AIGNAN » → « Dupont-Aignan ». Fonction pure. */
function patrimoineNomPropre(s) {
  return String(s || "").toLowerCase().replace(/(^|[\s\-'’])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
}

/** Clé du candidat (onglet candidats) correspondant à un nom de famille. Fonction pure. */
function patrimoineCle(candidats, election, nomFamille) {
  var cible = wikiSansAccents(nomFamille);
  var c = candidats.filter(function (r) {
    if (String(r.election) !== String(election)) return false;
    var noms = String(r.alias_wikipedia || "").split(";").concat([r.nom, r.nom_court]);
    return noms.some(function (n) { return n && wikiSansAccents(n) === cible; });
  })[0];
  return c ? String(c.cle) : wikiCleNouvelle(nomFamille);
}

function patrimoineMiseAJourManuelle() {
  SpreadsheetApp.getUi().alert(patrimoineMiseAJour(true).message);
}

/** Appelée toutes les 6 heures avec la mise à jour des sondages. */
function patrimoineMiseAJourAuto() {
  if (String(parametre("maj_patrimoine") || "oui").toLowerCase() === "non") return;
  patrimoineMiseAJour(false);
}

function patrimoineMiseAJour(manuelle) {
  var election = String(parametre("patrimoine_election") || "2027");
  var depuis = String(parametre("patrimoine_depuis") || election + "-01-01");
  var aujourdhui = Utilities.formatDate(new Date(), classeur().getSpreadsheetTimeZone(), "yyyy-MM-dd");
  if (!manuelle && aujourdhui < depuis) return { message: "Rien à vérifier avant le " + depuis + "." };
  try {
    var rep = UrlFetchApp.fetch(HATVP_LISTE, { muteHttpExceptions: true });
    if (rep.getResponseCode() !== 200) throw new Error("la HATVP a répondu " + rep.getResponseCode());
    var decl = hatvpDeclarationsCandidats(hatvpCsv(rep.getContentText("UTF-8")), depuis);
    var sh = classeur().getSheetByName("patrimoine");
    if (!sh) throw new Error("onglet patrimoine introuvable");
    var v = sh.getDataRange().getValues(), h = v[0].map(String), col = function (k) { return h.indexOf(k); };
    var candidats = lignes("candidats"), ajoutes = [], completes = [], aSaisir = [];

    decl.forEach(function (d) {
      var nom = patrimoineNomPropre(d.prenom) + " " + patrimoineNomPropre(d.nom);
      var cle = patrimoineCle(candidats, election, d.nom);
      var i = -1;
      for (var j = 1; j < v.length; j++) {
        if (String(v[j][col("election")]) === election && (String(v[j][col("cle")]) === cle || wikiSansAccents(v[j][col("nom")]) === wikiSansAccents(nom))) { i = j; break; }
      }
      if (i > 0 && v[i][col("patrimoine")] !== "" && v[i][col("patrimoine")] !== null) return;

      var montants = null;
      if (d.open_data) {
        var x = UrlFetchApp.fetch(HATVP_DOSSIERS + encodeURIComponent(d.open_data), { muteHttpExceptions: true });
        if (x.getResponseCode() === 200) montants = patrimoineDepuisXml(x.getContentText("UTF-8"));
      }
      if (!montants && i > 0) return; // déjà signalée, montants toujours à saisir
      var lien = d.nom_fichier ? HATVP_DOSSIERS + d.nom_fichier : "https://www.hatvp.fr" + (d.url_dossier || "");
      var source = "Déclaration publiée par la HATVP le " + (d.date_publication || d.date_depot) +
        (montants ? " ; montants calculés depuis la version XML (biens à hauteur de la quote-part détenue, dettes = capital restant dû)." : ".");
      var valeurs = {
        election: election, cle: cle, nom: nom, patrimoine: montants ? montants.patrimoine : "", dettes: montants ? montants.dettes : "",
        source: source, lien: lien, commentaire: montants ? "" : "Montants à saisir depuis la déclaration (lien)."
      };
      if (i > 0) {
        ["patrimoine", "dettes", "source", "lien", "commentaire"].forEach(function (k) { sh.getRange(i + 1, col(k) + 1).setValue(valeurs[k]); });
        completes.push(nom);
      } else {
        var ligne = h.map(function (k) { return valeurs[k] !== undefined ? valeurs[k] : ""; });
        sh.appendRow(ligne);
        var n = sh.getLastRow();
        var cp = "RC" + (col("patrimoine") + 1), cf = "RC" + (col("fortune_estimee") + 1);
        if (col("total") >= 0) sh.getRange(n, col("total") + 1).setFormulaR1C1("=IF(" + cp + "=\"\",\"\"," + cp + "+N(" + cf + "))");
        v.push(ligne);
        (montants ? ajoutes : aSaisir).push(nom);
      }
    });

    var msg = decl.length ? (ajoutes.length + completes.length) + " déclaration(s) de patrimoine " + election + " ajoutée(s) avec montants" +
      (ajoutes.concat(completes).length ? " : " + ajoutes.concat(completes).join(", ") : "") + "." +
      (aSaisir.length ? " Montants à saisir à la main (pas de version XML) : " + aSaisir.join(", ") + "." : "")
      : "Aucune déclaration de candidat " + election + " publiée par la HATVP pour l’instant.";
    if (ajoutes.length || completes.length || aSaisir.length) { journal("patrimoine", msg); viderCache(); }
    return { message: msg };
  } catch (err) {
    journal("erreur patrimoine", String(err && err.message || err));
    return { message: "Échec de la vérification du patrimoine : " + (err && err.message || err) };
  }
}
