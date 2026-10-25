// Regroupe Wikipedia.gs et Code.gs en un seul fichier à coller dans l'éditeur Apps Script.
// Usage : node scripts/assembler-apps-script.mjs
import fs from "node:fs";

const lire = (f) => fs.readFileSync(new URL(`../apps-script/${f}`, import.meta.url), "utf8");
const entete = "/* Fichier généré par scripts/assembler-apps-script.mjs : à coller tel quel dans Extensions > Apps Script.\n   Pour modifier le code, éditer Code.gs et Wikipedia.gs puis relancer le script. */\n\n";
fs.writeFileSync(new URL("../apps-script/A-COLLER-dans-Apps-Script.gs", import.meta.url), entete + lire("Code.gs") + "\n" + lire("Wikipedia.gs"));
