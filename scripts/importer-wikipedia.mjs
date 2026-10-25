// Applique au fichier data/snapshot.json la même mise à jour que le script Apps Script :
// ajoute les sondages de 1er et 2nd tour publiés sur Wikipédia et absents du fichier.
//
// Usage : node scripts/importer-wikipedia.mjs [fichier.wiki]
// Sans fichier, la page est téléchargée depuis fr.wikipedia.org.
import fs from "node:fs";
import vm from "node:vm";

const PAGE = "Liste de sondages sur l'élection présidentielle française de 2027";
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../apps-script/Wikipedia.gs", import.meta.url), "utf8"), ctx);

const wikicode = process.argv[2]
  ? fs.readFileSync(process.argv[2], "utf8")
  : await (await fetch(`https://fr.wikipedia.org/w/index.php?action=raw&title=${encodeURIComponent(PAGE)}`, {
    headers: { "User-Agent": "Sondages-presidentielle (mise a jour du fichier de secours)" },
  })).text();

const file = new URL("../data/snapshot.json", import.meta.url);
const snap = JSON.parse(fs.readFileSync(file, "utf8"));
const O = snap.onglets;
const objets = (t) => O[t].slice(1).map((r) => Object.fromEntries(O[t][0].map((h, i) => [h, r[i]])));
const param = (k) => (objets("parametres").find((r) => r.cle === k) || {}).valeur;
const today = new Date().toISOString().slice(0, 10);

/* ---- 1er tour ---- */
const candidats = objets("candidats").filter((c) => c.election === "2027").map((c) => ({ cle: c.cle, nom: c.nom, alias: c.alias_wikipedia }));
const sondages = ctx.wikiSondagesPremierTour(wikicode, { candidats, depuis: param("sondages_2027_depuis") || "2026-01-01" });
const existants = objets("sondages_2027").map((r) => ({ inst: r.institut, d: r.fin_terrain }));
const nouveaux = sondages.filter((p) => !existants.some((e) => ctx.wikiMemeSondage(p, e)));
const S = O.sondages_2027, entete = S[0];
for (const p of nouveaux) {
  for (const cle of Object.keys(p.s)) {
    if (entete.includes(cle)) continue;
    const i = entete.indexOf("source");
    S.forEach((r, j) => r.splice(i, 0, j === 0 ? cle : null));
    const nom = p.inconnus.find((n) => ctx.wikiCleNouvelle(n) === cle) || cle;
    O.candidats.push(["2027", cle, nom, null, null, "#A3A3A3", "non", "non", nom]);
  }
  const noms = Object.entries(p.noms).map(([k, v]) => `${k}=${v}`);
  if (p.s.rn != null && !p.noms.rn) noms.unshift("rn=Marine Le Pen");
  S.push(entete.map((h) => ({
    institut: p.inst, fin_terrain: p.d, echantillon: p.n, lien: p.url, noms: noms.join("; "),
    source: "Wikipédia (auto)", ajoute_le: today,
  })[h] ?? p.s[h] ?? null));
}
S.splice(1, S.length - 1, ...S.slice(1).sort((a, b) => String(a[1]).localeCompare(String(b[1]))));

/* ---- 2nd tour ---- */
const duels = ctx.wikiSondagesSecondTour(wikicode, new Date());
const dejaLa = objets("second_tour").filter((r) => r.election === "2027");
const norm = (s) => ctx.wikiSansAccents(s);
let n2 = 0;
for (const x of duels) {
  if (dejaLa.some((e) => norm(e.candidat_a) === norm(x.a) && norm(e.candidat_b) === norm(x.b) && ctx.wikiMemeSondage(x, { inst: e.institut, d: e.date }))) continue;
  O.second_tour.push(["2027", x.inst, x.d, x.a, x.b, x.va, x.vb, "Wikipédia (auto)"]);
  n2++;
}

const msg = `${nouveaux.length} sondage(s) de 1er tour et ${n2} de 2nd tour ajoutés.`;
O.parametres.forEach((r) => { if (r[0] === "derniere_maj") r[1] = today; });
O.journal.push([today, "mise à jour Wikipédia", msg]);
snap.genere_le = new Date().toISOString();
fs.writeFileSync(file, JSON.stringify(snap));
console.log(msg, nouveaux.map((p) => `${p.inst} ${p.d}`).join(", "));
