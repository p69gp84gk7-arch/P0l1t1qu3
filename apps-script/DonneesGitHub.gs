/**
 * Données préparées chaque jour sur GitHub (.github/workflows/donnees-quotidiennes.yml) et recopiées dans le
 * classeur à chaque mise à jour automatique :
 *  - data/scrutins.json : votes de l'Assemblée nationale (onglets scrutins et scrutins_groupes) ;
 *  - data/tonalite.json : tonalité de la presse qui cite chaque personnalité (onglets tonalite et tonalite_articles) ;
 *  - data/declarations.json : candidatures déclarées, pressenties et retirées d'après Wikipédia (onglet declarations).
 * Ces fichiers sont trop lourds à fabriquer ici (l'open data de l'Assemblée pèse 200 Mo décompressé, et GDELT
 * limite le nombre de requêtes), d'où ce passage par GitHub.
 */

var FICHIERS_GITHUB = ["data/scrutins.json", "data/tonalite.json", "data/declarations.json"];

function donneesGitHubMiseAJourManuelle() {
  SpreadsheetApp.getUi().alert(donneesGitHubMiseAJour(true).message);
}

/** Remplace un onglet par un tableau de valeurs (créé s'il n'existe pas). */
function remplacerOnglet(nom, valeurs) {
  var ss = classeur(), sh = ss.getSheetByName(nom) || ss.insertSheet(nom);
  sh.clearContents();
  if (!valeurs.length) return;
  var largeur = valeurs.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
  var rect = valeurs.map(function (r) { var x = r.slice(); while (x.length < largeur) x.push(""); return x.map(function (v) { return v === null ? "" : v; }); });
  if (sh.getMaxColumns() < largeur) sh.insertColumnsAfter(sh.getMaxColumns(), largeur - sh.getMaxColumns());
  if (sh.getMaxRows() < rect.length) sh.insertRowsAfter(sh.getMaxRows(), rect.length - sh.getMaxRows());
  // texte brut : pas de conversion des dates ni des nombres par la feuille
  sh.getRange(1, 1, rect.length, largeur).setNumberFormat("@").setValues(rect.map(function (r) { return r.map(String); }));
}

function donneesGitHubMiseAJour(force) {
  var branche = String(parametre("script_branche") || "main"), faits = [], erreurs = [];
  FICHIERS_GITHUB.forEach(function (chemin) {
    try {
      var url = "https://raw.githubusercontent.com/" + DEPOT_SCRIPT + "/" + branche + "/" + chemin + "?t=" + Date.now();
      var rep = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (rep.getResponseCode() === 404) return; // pas encore publié sur cette branche
      if (rep.getResponseCode() !== 200) throw new Error("GitHub a répondu " + rep.getResponseCode());
      var json = JSON.parse(rep.getContentText("UTF-8")), cle = "github_" + chemin.replace(/\W+/g, "_");
      if (!force && String(parametre(cle) || "") === String(json.genere_le)) return;
      Object.keys(json.onglets).forEach(function (nom) { remplacerOnglet(nom, json.onglets[nom]); });
      ecrireParametre(cle, "'" + json.genere_le);
      faits.push(chemin + " (" + Object.keys(json.onglets).join(", ") + ")");
    } catch (err) {
      erreurs.push(chemin + " : " + (err && err.message || err));
    }
  });
  var msg = (faits.length ? "Onglets mis à jour depuis GitHub : " + faits.join(" ; ") + "." : "Rien de nouveau sur GitHub.") +
    (erreurs.length ? " Erreurs : " + erreurs.join(" ; ") : "");
  if (faits.length || erreurs.length) { journal("données GitHub", msg); viderCache(); }
  return { message: msg };
}
