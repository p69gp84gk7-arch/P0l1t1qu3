// Regroupe les fichiers .gs en un seul fichier à coller dans l'éditeur Apps Script (première installation).
// Ensuite, le script se met à jour seul depuis GitHub (voir apps-script/MiseAJourScript.gs).
// Usage : node scripts/assembler-apps-script.mjs
import fs from "node:fs";

export const FICHIERS = ["Code.gs", "Wikipedia.gs", "MiseAJourScript.gs", "Patrimoine.gs"];
const lire = (f) => fs.readFileSync(new URL(`../apps-script/${f}`, import.meta.url), "utf8");
const entete = "/* Fichier généré par scripts/assembler-apps-script.mjs : à coller tel quel dans Extensions > Apps Script.\n   Pour modifier le code, éditer les fichiers .gs séparés puis relancer le script. */\n\n";

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync(new URL("../apps-script/A-COLLER-dans-Apps-Script.gs", import.meta.url), entete + FICHIERS.map(lire).join("\n"));
}
