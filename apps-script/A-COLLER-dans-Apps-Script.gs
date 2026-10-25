/* Fichier généré par scripts/assembler-apps-script.mjs : à coller tel quel dans Extensions > Apps Script.
   Pour modifier le code, éditer les fichiers .gs séparés puis relancer le script. */

/**
 * Script attaché au Google Sheet « Présidentielles – données ».
 *
 * 1. API : publié comme application web, il renvoie tous les onglets en JSON
 *    (c'est ce que lit l'application web). Le classeur lui-même peut rester privé.
 * 2. Mise à jour automatique : toutes les 6 heures, il lit la page Wikipédia des
 *    sondages 2027 et ajoute les nouveaux sondages (1er et 2nd tour) dans le classeur.
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
  if (String(parametre("maj_auto") || "oui").toLowerCase() === "non") return;
  miseAJour();
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

/**
 * Lecture des sondages publiés sur Wikipédia (page « Liste de sondages sur l'élection
 * présidentielle française de 2027 »), à partir du wikicode brut de la page.
 *
 * Ce fichier ne contient que des fonctions pures (aucun appel à SpreadsheetApp) :
 * il est utilisé tel quel par Apps Script et par les tests Node (tests/wikipedia.test.mjs).
 */

var WIKI_MOIS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12
};

/** Nom d'institut tel qu'écrit sur Wikipédia -> nom utilisé dans le Google Sheet. */
var WIKI_INSTITUTS = [
  [/harris|toluna/i, "Harris"], [/opinion\s*way/i, "OpinionWay"], [/ifop/i, "Ifop"],
  [/elabe/i, "Elabe"], [/ipsos/i, "Ipsos"], [/odoxa/i, "Odoxa"], [/cluster\s*17/i, "Cluster17"],
  [/you\s*gov/i, "YouGov"], [/verian|kantar/i, "Verian"], [/\bcsa\b/i, "CSA"], [/\bbva\b/i, "Ipsos"]
];

function wikiSansAccents(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function wikiInstitut(nom) {
  for (var i = 0; i < WIKI_INSTITUTS.length; i++) if (WIKI_INSTITUTS[i][0].test(nom)) return WIKI_INSTITUTS[i][1];
  return String(nom).trim();
}

/** Supprime le balisage wiki courant et renvoie du texte simple. */
function wikiTexte(s) {
  s = String(s || "");
  s = s.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  s = s.replace(/\{\{\s*formatnum\s*:\s*([^}]*)\}\}/gi, "$1");
  s = s.replace(/\{\{\s*(?:blanc|nobr|nowrap)\s*\|([^{}]*)\}\}/gi, "$1");
  s = s.replace(/\{\{[^{}]*\}\}/g, "");
  s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1");
  s = s.replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1");
  s = s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/'{2,}/g, "");
  return s.replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
}

/** Coupe « attributs | contenu » au premier | qui n'est ni dans [[ ]] ni dans {{ }}. */
function wikiCoupeCellule(s) {
  var prof = 0;
  for (var i = 0; i < s.length; i++) {
    var d = s.substr(i, 2);
    if (d === "[[" || d === "{{") { prof++; i++; continue; }
    if (d === "]]" || d === "}}") { prof = Math.max(0, prof - 1); i++; continue; }
    if (s[i] === "|" && prof === 0) {
      if (s[i + 1] === "|") return null;
      return { attrs: s.slice(0, i), contenu: s.slice(i + 1) };
    }
  }
  return { attrs: "", contenu: s };
}

function wikiCellule(brut, entete) {
  var c = wikiCoupeCellule(brut) || { attrs: "", contenu: brut };
  var rs = /rowspan\s*=\s*"?(\d+)/i.exec(c.attrs), cs = /colspan\s*=\s*"?(\d+)/i.exec(c.attrs);
  return { brut: c.contenu.trim(), attrs: c.attrs, rowspan: rs ? +rs[1] : 1, colspan: cs ? +cs[1] : 1, entete: !!entete };
}

/**
 * Découpe le wikicode en tableaux. Chaque tableau garde le titre de section
 * sous lequel il se trouve (pile des titres) et ses lignes, rowspan et colspan résolus :
 * une cellule étalée sur plusieurs lignes est le même objet dans chacune.
 */
function wikiTableaux(wikicode) {
  var lignes = String(wikicode).split("\n"), titres = [], tableaux = [], t = null, ligne = null;
  function finLigne() { if (t && ligne && ligne.length) t.lignesBrutes.push(ligne); ligne = []; }
  for (var i = 0; i < lignes.length; i++) {
    var l = lignes[i], h = /^(=+)\s*(.*?)\s*\1\s*$/.exec(l);
    if (!t && h) { titres = titres.slice(0, h[1].length - 1); titres[h[1].length - 1] = h[2]; continue; }
    if (/^\s*\{\|/.test(l)) { t = { titres: titres.filter(Boolean).slice(), lignesBrutes: [] }; ligne = []; continue; }
    if (!t) continue;
    if (/^\s*\|\}/.test(l)) { finLigne(); t.lignes = wikiGrille(t.lignesBrutes); tableaux.push(t); t = null; continue; }
    if (/^\s*\|-/.test(l)) { finLigne(); continue; }
    if (/^\s*\|\+/.test(l)) continue;
    if (/^\s*!/.test(l)) { l.replace(/^\s*!/, "").split("!!").forEach(function (x) { ligne.push(wikiCellule(x, true)); }); continue; }
    if (/^\s*\|/.test(l)) { l.replace(/^\s*\|/, "").split("||").forEach(function (x) { ligne.push(wikiCellule(x, false)); }); continue; }
    // ligne de continuation : rattachée au contenu de la dernière cellule
    if (ligne && ligne.length) ligne[ligne.length - 1].brut += "\n" + l;
  }
  return tableaux;
}

function wikiGrille(lignesBrutes) {
  var attente = [], grille = [];
  lignesBrutes.forEach(function (cellules) {
    var out = [], col = 0, k = 0;
    function videAttente() {
      while (attente[col] && attente[col].reste > 0) { out[col] = attente[col].cellule; attente[col].reste--; col++; }
    }
    for (k = 0; k < cellules.length; k++) {
      videAttente();
      var c = cellules[k];
      for (var j = 0; j < c.colspan; j++) {
        out[col] = c;
        if (c.rowspan > 1) attente[col] = { reste: c.rowspan - 1, cellule: c };
        col++;
      }
    }
    videAttente();
    for (var x = col; x < attente.length; x++) if (attente[x] && attente[x].reste > 0) { out[x] = attente[x].cellule; attente[x].reste--; }
    grille.push(out);
  });
  return grille;
}

function wikiNombre(s) {
  s = wikiTexte(s).replace(/%/g, "").trim();
  if (/^<\s*1$/.test(s)) return 0.5;
  var m = /^-?\d+(?:[.,]\d+)?/.exec(s.replace(/\s/g, ""));
  return m ? parseFloat(m[0].replace(",", ".")) : null;
}

/** « 21-22 octobre », « 30 septembre-2 octobre 2026 », « 1er-3 octobre » -> AAAA-MM-JJ (dernier jour). */
function wikiDateFin(s, anneeParDefaut, reference) {
  var t = wikiSansAccents(wikiTexte(s)).replace(/1er/g, "1"), re = /(\d{1,2})\s*(?:([a-z]+)\.?)?\s*(\d{4})?/g, m, jour = null, mois = null, an = null;
  while ((m = re.exec(t))) {
    if (m[1] && (!m[2] || WIKI_MOIS[m[2]] || /^(janv|fev|sept|oct|nov|dec)/.test(m[2]))) jour = +m[1];
    if (m[2]) {
      var mm = WIKI_MOIS[m[2]];
      if (!mm) for (var k in WIKI_MOIS) if (k.indexOf(m[2]) === 0) mm = WIKI_MOIS[k];
      if (mm) mois = mm;
    }
    if (m[3]) an = +m[3];
  }
  if (!jour || !mois) return null;
  if (!an) {
    an = anneeParDefaut;
    if (!an && reference) { an = reference.getFullYear(); if (mois > reference.getMonth() + 1) an--; }
  }
  if (!an) return null;
  return an + "-" + ("0" + mois).slice(-2) + "-" + ("0" + jour).slice(-2);
}

function wikiLien(s) {
  var m = /\[(https?:\/\/[^\s\]]+)/.exec(String(s || ""));
  return m ? m[1] : null;
}

/** Valeurs d'une case : « 1,5<br><small>Ruffin</small><hr>2<br><small>Villepin</small> » -> [{v, nom}]. */
function wikiValeurs(brut) {
  return String(brut).split(/<hr\s*\/?>/i).map(function (part) {
    var morceaux = part.split(/<br\s*\/?>/i), v = wikiNombre(morceaux[0]);
    var nom = morceaux.length > 1 ? wikiTexte(morceaux.slice(1).join(" ")).replace(/\s*\([^)]*\)\s*$/, "").trim() : "";
    return { v: v, nom: nom };
  }).filter(function (x) { return x.v != null; });
}

/** Index alias -> clé, à partir de [{cle, nom, alias}] (alias séparés par ;). */
function wikiIndexAlias(candidats) {
  var idx = {};
  candidats.forEach(function (c) {
    [c.nom].concat(String(c.alias || "").split(";")).forEach(function (a) {
      a = wikiSansAccents(a || "");
      if (a) { idx[a] = c.cle; idx[a.split(" ").pop()] = idx[a.split(" ").pop()] || c.cle; }
    });
  });
  return idx;
}

function wikiCleNouvelle(nom) {
  return wikiSansAccents(nom).split(" ").pop().replace(/[^a-z0-9-]/g, "");
}

function wikiEstSondeur(c) { return c && /Sondeur/.test(c.attrs + " " + c.brut) || (c && /\[https?:/.test(c.brut)); }

/**
 * Sondages de premier tour.
 * options : { candidats: [{cle, nom, alias}], depuis: "AAAA-MM-JJ" }
 * Pour un sondage à plusieurs hypothèses, on garde celle qui teste le plus de candidats
 * (la première en cas d'égalité). Renvoie [{inst, d, n, url, s: {cle: score}, noms: {cle: nom}, inconnus: [nom]}].
 */
function wikiSondagesPremierTour(wikicode, options) {
  options = options || {};
  var alias = wikiIndexAlias(options.candidats || []), resultat = [];
  wikiTableaux(wikicode).forEach(function (t) {
    var chemin = t.titres.join(" / ");
    if (!/premier tour/i.test(chemin)) return;
    var an = /(20\d\d)/.exec(t.titres.slice(1).join(" ")), annee = an ? +an[1] : null;
    if (!annee) return;
    var entetes = t.lignes.filter(function (l) { return l.length && l.every(function (c) { return c && c.entete; }); });
    if (!entetes.length) return;
    var noms = entetes[entetes.length - 1].map(function (c) { return wikiTexte(c.brut.split(/<br\s*\/?>/i)[0]); });
    var iInst = noms.findIndex(function (n) { return /sondeur|institut/i.test(n); }),
      iDate = noms.findIndex(function (n) { return /^date/i.test(n); }),
      iN = noms.findIndex(function (n) { return /chantillon/i.test(n); });
    if (iInst < 0 || iDate < 0) return;
    var groupes = [];
    t.lignes.forEach(function (l) {
      var c = l[iInst];
      if (!c || c.entete || !wikiEstSondeur(c)) return;
      var g = groupes[groupes.length - 1];
      if (!g || g.cellule !== c) groupes.push(g = { cellule: c, lignes: [] });
      g.lignes.push(l);
    });
    groupes.forEach(function (g) {
      var hyp = g.lignes.map(function (l) {
        var s = {}, nomsCle = {}, inconnus = [];
        for (var i = 0; i < l.length; i++) {
          if (i === iInst || i === iDate || i === iN || !l[i] || (i > 0 && l[i] === l[i - 1])) continue;
          var col = noms[i] || "", estAutres = /autres|divers/i.test(col);
          wikiValeurs(l[i].brut).forEach(function (x) {
            var nom = x.nom || (estAutres ? "" : col);
            if (!nom) return;
            var cle = alias[wikiSansAccents(nom)] || alias[wikiSansAccents(nom).split(" ").pop()];
            if (!cle) { cle = wikiCleNouvelle(nom); inconnus.push(nom); }
            if (s[cle] == null) s[cle] = x.v;
            if (x.nom && wikiSansAccents(x.nom) !== wikiSansAccents(col)) nomsCle[cle] = x.nom;
          });
        }
        return { s: s, noms: nomsCle, inconnus: inconnus, nb: Object.keys(s).length };
      });
      var best = hyp.reduce(function (a, b) { return b.nb > a.nb ? b : a; }, hyp[0]);
      var l0 = g.lignes[0], d = wikiDateFin(l0[iDate] && l0[iDate].brut, annee);
      if (!d || best.nb < 3 || (options.depuis && d < options.depuis)) return;
      resultat.push({
        inst: wikiInstitut(wikiTexte(g.cellule.brut)), d: d,
        n: iN >= 0 && l0[iN] ? (parseInt(wikiTexte(l0[iN].brut).replace(/\D/g, ""), 10) || null) : null,
        url: wikiLien(g.cellule.brut), s: best.s, noms: best.noms, inconnus: best.inconnus
      });
    });
  });
  return resultat.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
}

/**
 * Sondages de second tour, section « candidats déclarés ou pressentis ».
 * Renvoie [{inst, d, a, b, va, vb, url}] avec a et b les noms affichés en tête de colonne.
 */
function wikiSondagesSecondTour(wikicode, reference) {
  var resultat = [];
  wikiTableaux(wikicode).forEach(function (t) {
    var chemin = t.titres.join(" / ");
    if (!/second tour/i.test(chemin) || !/d[ée]clar[ée]s ou pressentis/i.test(chemin)) return;
    var entetes = t.lignes.filter(function (l) { return l.length && l.every(function (c) { return c && c.entete; }); });
    if (!entetes.length) return;
    var noms = entetes[entetes.length - 1].map(function (c) { return wikiTexte(c.brut.split(/<br\s*\/?>/i)[0]); });
    var iInst = noms.findIndex(function (n) { return /sondeur|institut/i.test(n); }),
      iDate = noms.findIndex(function (n) { return /^date/i.test(n); }),
      iN = noms.findIndex(function (n) { return /chantillon/i.test(n); });
    var cols = noms.map(function (n, i) { return i; }).filter(function (i) { return i !== iInst && i !== iDate && i !== iN; }).slice(0, 2);
    if (iInst < 0 || iDate < 0 || cols.length < 2) return;
    var vus = [];
    t.lignes.forEach(function (l) {
      var c = l[iInst];
      if (!c || c.entete || !wikiEstSondeur(c) || vus.indexOf(c) >= 0) return;
      vus.push(c);
      var va = l[cols[0]] ? wikiNombre(l[cols[0]].brut) : null, vb = l[cols[1]] ? wikiNombre(l[cols[1]].brut) : null;
      var d = wikiDateFin(l[iDate] && l[iDate].brut, null, reference);
      if (va == null || vb == null || !d) return;
      resultat.push({ inst: wikiInstitut(wikiTexte(c.brut)), d: d, a: noms[cols[0]], b: noms[cols[1]], va: va, vb: vb, url: wikiLien(c.brut) });
    });
  });
  return resultat.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
}

/** Vrai si deux sondages sont le même (même institut, fins de terrain à 3 jours près). */
function wikiMemeSondage(a, b) {
  if (wikiInstitut(a.inst) !== wikiInstitut(b.inst)) return false;
  var ta = Date.parse(a.d + "T12:00:00Z"), tb = Date.parse(b.d + "T12:00:00Z");
  return Math.abs(ta - tb) <= 3 * 864e5;
}

/**
 * Mise à jour du script lui-même : une fois par jour (et depuis le menu Sondages),
 * le script lit sa dernière version sur GitHub (branche main) et, si elle a changé,
 * remplace son propre code puis met à jour l'application web publiée (même adresse /exec).
 *
 * Prérequis, une seule fois : activer « API Google Apps Script » sur
 * https://script.google.com/home/usersettings
 */

var DEPOT_SCRIPT = "p69gp84gk7-arch/P0l1t1qu3";
var FICHIERS_SCRIPT = [
  { name: "appsscript", type: "JSON", chemin: "apps-script/appsscript.json" },
  { name: "Code", type: "SERVER_JS", chemin: "apps-script/Code.gs" },
  { name: "Wikipedia", type: "SERVER_JS", chemin: "apps-script/Wikipedia.gs" },
  { name: "MiseAJourScript", type: "SERVER_JS", chemin: "apps-script/MiseAJourScript.gs" }
];

/**
 * Fusionne le contenu actuel du projet avec les fichiers venus de GitHub.
 * Les fichiers du projet qui ne viennent pas de GitHub sont conservés.
 * Renvoie null si rien n'a changé. Fonction pure (testée sous Node).
 */
function scriptFusionnerFichiers(actuels, distants) {
  var noms = distants.map(function (f) { return f.name; });
  var change = distants.some(function (d) {
    var a = actuels.filter(function (f) { return f.name === d.name && f.type === d.type; })[0];
    return !a || a.source !== d.source;
  });
  if (!change) return null;
  var gardes = actuels.filter(function (f) { return noms.indexOf(f.name) < 0; })
    .map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
  return distants.map(function (d) { return { name: d.name, type: d.type, source: d.source }; }).concat(gardes);
}

/** Contrôle minimal des fichiers téléchargés avant de remplacer le code. */
function scriptFichiersValides(distants) {
  var code = distants.filter(function (f) { return f.name === "Code"; })[0];
  var manifeste = distants.filter(function (f) { return f.name === "appsscript"; })[0];
  if (!code || !/function doGet\(/.test(code.source) || !/function miseAJourAuto\(/.test(code.source)) return false;
  try { JSON.parse(manifeste.source); } catch (e) { return false; }
  return distants.every(function (f) { return f.source && f.source.length > 20; });
}

function scriptMiseAJourManuelle() {
  var r = scriptMettreAJour();
  SpreadsheetApp.getUi().alert(r.message);
}

/** Appelée chaque nuit par le déclencheur. Ne fait rien si le paramètre maj_script vaut « non ». */
function scriptMiseAJourAuto() {
  if (String(parametre("maj_script") || "oui").toLowerCase() === "non") return;
  scriptMettreAJour();
}

function scriptMettreAJour() {
  var verrou = LockService.getScriptLock();
  if (!verrou.tryLock(30000)) return { message: "Une mise à jour est déjà en cours." };
  try {
    var branche = String(parametre("script_branche") || "main");
    var distants = FICHIERS_SCRIPT.map(function (f) {
      var url = "https://raw.githubusercontent.com/" + DEPOT_SCRIPT + "/" + branche + "/" + f.chemin + "?t=" + Date.now();
      var rep = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (rep.getResponseCode() !== 200) throw new Error("GitHub a répondu " + rep.getResponseCode() + " pour " + f.chemin);
      return { name: f.name, type: f.type, source: rep.getContentText("UTF-8") };
    });
    if (!scriptFichiersValides(distants)) throw new Error("fichiers GitHub incomplets, mise à jour annulée");

    var id = ScriptApp.getScriptId(), base = "https://script.googleapis.com/v1/projects/" + id;
    var actuel = scriptApi("get", base + "/content");
    var fichiers = scriptFusionnerFichiers(actuel.files || [], distants);
    if (!fichiers) return { message: "Le script est déjà à jour." };

    scriptApi("put", base + "/content", { files: fichiers });
    var deploiements = scriptMettreAJourDeploiements(base);
    var msg = "Script mis à jour depuis GitHub (" + branche + ")" +
      (deploiements ? ", application web republiée (" + deploiements + " déploiement(s))." : ".");
    journal("mise à jour du script", msg);
    viderCache();
    return { message: msg };
  } catch (err) {
    var texte = String(err && err.message || err);
    if (/has not been used|is disabled|PERMISSION_DENIED|403/.test(texte)) {
      texte += " Activez « API Google Apps Script » sur https://script.google.com/home/usersettings puis réessayez.";
    }
    journal("erreur mise à jour du script", texte);
    return { message: "Échec de la mise à jour du script : " + texte };
  } finally {
    verrou.releaseLock();
  }
}

/** Crée une nouvelle version et y fait pointer les déploiements « application web » existants. */
function scriptMettreAJourDeploiements(base) {
  var liste = scriptApi("get", base + "/deployments").deployments || [];
  var web = liste.filter(function (d) {
    var cfg = d.deploymentConfig || {};
    return cfg.versionNumber && (d.entryPoints || []).some(function (e) { return e.entryPointType === "WEB_APP"; });
  });
  if (!web.length) return 0;
  var version = scriptApi("post", base + "/versions", { description: "Mise à jour automatique depuis GitHub" });
  web.forEach(function (d) {
    scriptApi("put", base + "/deployments/" + d.deploymentId, {
      deploymentConfig: {
        scriptId: ScriptApp.getScriptId(), versionNumber: version.versionNumber,
        manifestFileName: "appsscript", description: d.deploymentConfig.description || "Application web"
      }
    });
  });
  return web.length;
}

function scriptApi(methode, url, corps) {
  var options = {
    method: methode, muteHttpExceptions: true, contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  };
  if (corps) options.payload = JSON.stringify(corps);
  var rep = UrlFetchApp.fetch(url, options), texte = rep.getContentText();
  if (rep.getResponseCode() >= 300) throw new Error("API Apps Script " + rep.getResponseCode() + " : " + texte.slice(0, 300));
  return texte ? JSON.parse(texte) : {};
}
