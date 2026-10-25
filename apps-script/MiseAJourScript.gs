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
