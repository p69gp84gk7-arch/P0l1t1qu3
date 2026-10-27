/**
 * Script attaché au Google Sheet « Présidentielles – données ».
 *
 * 1. API : publié comme application web, il renvoie tous les onglets en JSON
 *    (c'est ce que lit l'application web). Le classeur lui-même peut rester privé.
 * 2. Mise à jour automatique : toutes les 6 heures, il lit la page Wikipédia des
 *    sondages 2027 et ajoute les nouveaux sondages (1er et 2nd tour) dans le classeur,
 *    puis vérifie si la HATVP a publié les déclarations de patrimoine des candidats (Patrimoine.gs).
 *
 * Installation : voir README.md, section « Mise en place ».
 */

// Identifiant du classeur (la partie entre /d/ et /edit dans son adresse).
// Inutile si le script est créé depuis le classeur (Extensions > Apps Script).
var ID_CLASSEUR = "1eobPJfulibdFjZgAsjSOJRuLU1cHX7nXv119nVJF0Ak";

var WIKI_PAGE_DEFAUT = "Liste de sondages sur l'élection présidentielle française de 2027";
var ONGLETS_PRIVES = ["LISEZ-MOI"];
var CACHE_CLE = "api-v1", CACHE_DUREE = 600, CACHE_MORCEAU = 90000;

/* ============================== Menu ============================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Sondages")
    .addItem("Mettre à jour depuis Wikipédia", "miseAJourManuelle")
    .addItem("Vérifier les déclarations de patrimoine (HATVP)", "patrimoineMiseAJourManuelle")
    .addItem("Activer la mise à jour automatique (toutes les 6 h)", "installerDeclencheur")
    .addItem("Désactiver la mise à jour automatique", "supprimerDeclencheurs")
    .addSeparator()
    .addItem("Rafraîchir l’application web maintenant", "viderCache")
    .addItem("Mettre à jour le script depuis GitHub", "scriptMiseAJourManuelle")
    .addToUi();
}

/** Toute modification à la main est visible tout de suite dans l'application. */
function onEdit() { viderCache(); }

function classeur() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(ID_CLASSEUR);
}

/* ============================== API JSON ============================== */

function doGet(e) {
  var sansCache = e && e.parameter && e.parameter.nocache;
  var json = sansCache ? null : lireCache();
  if (!json) {
    json = JSON.stringify(exporterOnglets());
    ecrireCache(json);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function exporterOnglets() {
  var ss = classeur(), tz = ss.getSpreadsheetTimeZone(), onglets = {};
  ss.getSheets().forEach(function (sh) {
    var nom = sh.getName();
    if (ONGLETS_PRIVES.indexOf(nom) >= 0 || sh.getLastRow() < 1) return;
    var valeurs = sh.getDataRange().getValues();
    var entete = valeurs[0].map(function (h) { return h === "" ? "" : String(normaliser(h, "", tz)); });
    onglets[nom] = valeurs
      .filter(function (r, i) { return i === 0 || r.some(function (v) { return v !== "" && v !== null; }); })
      .map(function (r, i) {
        return i === 0 ? entete : r.map(function (v, j) { return normaliser(v, entete[j], tz); });
      });
  });
  return { version: 1, genere_le: new Date().toISOString(), source: "google-sheet", onglets: onglets };
}

function normaliser(v, colonne, tz) {
  if (v === "" || v === null || v === undefined) return null;
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, tz, /^(mois|date_cle)$/.test(colonne) ? "yyyy-MM" : "yyyy-MM-dd");
  }
  return v;
}

function lireCache() {
  var c = CacheService.getScriptCache(), n = c.get(CACHE_CLE + "-n");
  if (!n) return null;
  var cles = [];
  for (var i = 0; i < +n; i++) cles.push(CACHE_CLE + "-" + i);
  var morceaux = c.getAll(cles), out = "";
  for (var j = 0; j < cles.length; j++) { if (morceaux[cles[j]] == null) return null; out += morceaux[cles[j]]; }
  return out;
}

function ecrireCache(json) {
  var c = CacheService.getScriptCache(), valeurs = {}, n = 0;
  for (var i = 0; i < json.length; i += CACHE_MORCEAU) valeurs[CACHE_CLE + "-" + n++] = json.slice(i, i + CACHE_MORCEAU);
  valeurs[CACHE_CLE + "-n"] = String(n);
  try { c.putAll(valeurs, CACHE_DUREE); } catch (err) { /* trop gros pour le cache : on servira sans cache */ }
}

function viderCache() {
  var c = CacheService.getScriptCache(), cles = [CACHE_CLE + "-n"];
  for (var i = 0; i < 40; i++) cles.push(CACHE_CLE + "-" + i);
  c.removeAll(cles);
}

/* ============================== Mise à jour automatique ============================== */

function installerDeclencheur() {
  supprimerDeclencheurs();
  ScriptApp.newTrigger("miseAJourAuto").timeBased().everyHours(6).create();
  ScriptApp.newTrigger("scriptMiseAJourAuto").timeBased().everyDays(1).atHour(5).create();
  journal("déclencheur", "Mise à jour automatique activée : sondages toutes les 6 heures, script chaque nuit");
  try { SpreadsheetApp.getUi().alert("Mise à jour automatique activée : sondages toutes les 6 heures, script chaque nuit."); } catch (e) {}
}

function supprimerDeclencheurs() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (["miseAJourAuto", "scriptMiseAJourAuto"].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
}

function miseAJourManuelle() {
  var r = miseAJour();
  SpreadsheetApp.getUi().alert(r.message);
}

/** Appelée par le déclencheur. Ne fait rien si le paramètre maj_auto vaut « non ». */
function miseAJourAuto() {
  if (String(parametre("maj_auto") || "oui").toLowerCase() !== "non") miseAJour();
  // Patrimoine.gs peut manquer pendant la nuit qui suit son ajout (il arrive à la mise à jour suivante du script).
  if (typeof patrimoineMiseAJourAuto === "function") patrimoineMiseAJourAuto();
}

function miseAJour() {
  var verrou = LockService.getScriptLock();
  if (!verrou.tryLock(30000)) return { message: "Une mise à jour est déjà en cours." };
  try {
    var page = parametre("wikipedia_page") || WIKI_PAGE_DEFAUT;
    var url = "https://fr.wikipedia.org/w/index.php?action=raw&title=" + encodeURIComponent(page);
    var rep = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { "User-Agent": "Sondages-presidentielle (Google Apps Script; mise a jour automatique)" }
    });
    if (rep.getResponseCode() !== 200) throw new Error("Wikipédia a répondu " + rep.getResponseCode());
    var wikicode = rep.getContentText("UTF-8");
    var n1 = importerPremierTour(wikicode), n2 = importerSecondTour(wikicode);
    ecrireParametre("derniere_maj", "'" + Utilities.formatDate(new Date(), classeur().getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm"));
    var msg = n1.ajoutes + " sondage(s) de 1er tour et " + n2 + " de 2nd tour ajoutés." +
      (n1.nouveaux.length ? " Nouveaux candidats à vérifier dans l’onglet candidats : " + n1.nouveaux.join(", ") + "." : "");
    journal("mise à jour Wikipédia", msg);
    viderCache();
    return { message: msg };
  } catch (err) {
    journal("erreur", String(err && err.message || err));
    return { message: "Échec de la mise à jour : " + (err && err.message || err) };
  } finally {
    verrou.releaseLock();
  }
}

function importerPremierTour(wikicode) {
  var ss = classeur(), sh = ss.getSheetByName("sondages_2027");
  var candidats = lignes("candidats").filter(function (c) { return String(c.election) === "2027"; })
    .map(function (c) { return { cle: c.cle, nom: c.nom, alias: c.alias_wikipedia }; });
  var depuis = String(parametre("sondages_2027_depuis") || "2026-01-01");
  var sondages = wikiSondagesPremierTour(wikicode, { candidats: candidats, depuis: depuis });
  var existants = lignes("sondages_2027").map(function (r) { return { inst: r.institut, d: texteDate(r.fin_terrain) }; });
  var nouveaux = sondages.filter(function (p) { return !existants.some(function (e) { return wikiMemeSondage(p, e); }); });
  if (!nouveaux.length) return { ajoutes: 0, nouveaux: [] };

  // Candidats inconnus : nouvelle colonne dans sondages_2027 et nouvelle ligne (non affichée) dans candidats.
  var entete = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), ajoutsCandidats = [];
  nouveaux.forEach(function (p) {
    Object.keys(p.s).forEach(function (cle) {
      if (entete.indexOf(cle) >= 0) return;
      var avant = entete.indexOf("source") + 1 || entete.length + 1;
      sh.insertColumnBefore(avant);
      sh.getRange(1, avant).setValue(cle);
      entete.splice(avant - 1, 0, cle);
      var nom = (p.inconnus.filter(function (n) { return wikiCleNouvelle(n) === cle; })[0]) || cle;
      ajoutsCandidats.push(["2027", cle, nom, null, null, "#A3A3A3", "non", "non", nom]);
    });
  });
  if (ajoutsCandidats.length) {
    var shc = ss.getSheetByName("candidats");
    shc.getRange(shc.getLastRow() + 1, 1, ajoutsCandidats.length, ajoutsCandidats[0].length).setValues(ajoutsCandidats);
  }

  var maintenant = new Date(), lignesAjout = nouveaux.map(function (p) {
    var noms = Object.keys(p.noms).map(function (k) { return k + "=" + p.noms[k]; });
    if (p.s.rn != null && !p.noms.rn) noms.unshift("rn=Marine Le Pen");
    return entete.map(function (h) {
      switch (h) {
        case "institut": return p.inst;
        case "fin_terrain": return dateDepuisTexte(p.d);
        case "echantillon": return p.n || "";
        case "lien": return p.url || "";
        case "noms": return noms.join("; ");
        case "source": return "Wikipédia (auto)";
        case "ajoute_le": return maintenant;
        default: return p.s[h] != null ? p.s[h] : "";
      }
    });
  });
  sh.getRange(sh.getLastRow() + 1, 1, lignesAjout.length, entete.length).setValues(lignesAjout);
  return { ajoutes: lignesAjout.length, nouveaux: ajoutsCandidats.map(function (c) { return c[2]; }) };
}

function importerSecondTour(wikicode) {
  var sh = classeur().getSheetByName("second_tour");
  var duels = wikiSondagesSecondTour(wikicode, new Date());
  var existants = lignes("second_tour").filter(function (r) { return String(r.election) === "2027"; })
    .map(function (r) { return { inst: r.institut, d: texteDate(r.date), a: r.candidat_a, b: r.candidat_b }; });
  var nouveaux = duels.filter(function (x) {
    return !existants.some(function (e) {
      return wikiSansAccents(e.a) === wikiSansAccents(x.a) && wikiSansAccents(e.b) === wikiSansAccents(x.b) && wikiMemeSondage(x, e);
    });
  });
  if (!nouveaux.length) return 0;
  var rows = nouveaux.map(function (x) { return ["2027", x.inst, dateDepuisTexte(x.d), x.a, x.b, x.va, x.vb, "Wikipédia (auto)"]; });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

/* ============================== Outils ============================== */

/** Lignes d'un onglet sous forme d'objets {colonne: valeur}. */
function lignes(onglet) {
  var sh = classeur().getSheetByName(onglet);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v[0].map(String);
  return v.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o; });
}

function parametre(cle) {
  var p = lignes("parametres").filter(function (r) { return r.cle === cle; })[0];
  if (!p || p.valeur === "" || p.valeur === null) return null;
  return Object.prototype.toString.call(p.valeur) === "[object Date]" ? texteDate(p.valeur) : p.valeur;
}

function ecrireParametre(cle, valeur) {
  var sh = classeur().getSheetByName("parametres"), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === cle) { sh.getRange(i + 1, 2).setValue(valeur); return; }
  sh.appendRow([cle, valeur]);
}

function journal(action, details) {
  var sh = classeur().getSheetByName("journal");
  if (sh) sh.appendRow([new Date(), action, details]);
}

function texteDate(v) {
  if (Object.prototype.toString.call(v) === "[object Date]") return Utilities.formatDate(v, classeur().getSpreadsheetTimeZone(), "yyyy-MM-dd");
  return String(v || "").slice(0, 10);
}

function dateDepuisTexte(s) {
  var p = String(s).split("-");
  return new Date(+p[0], +p[1] - 1, +p[2], 12);
}
