// Extrait les données embarquées dans la page d'origine (archive/page-originale.html)
// et les écrit sous forme d'onglets tabulaires dans data/snapshot.json.
// Ce fichier sert à remplir le Google Sheet la première fois et de secours hors ligne.
//
// Usage : node scripts/extraire-page-originale.mjs [archive/page-originale.html] [data/snapshot.json]
import fs from "node:fs";
import vm from "node:vm";

const src = process.argv[2] || "archive/page-originale.html";
const out = process.argv[3] || "data/snapshot.json";
const lines = fs.readFileSync(src, "utf8").split("\n");

// Les constantes de données occupent les lignes 383 à 712, plus quelques blocs plus loin.
const pick = (from, to) => lines.slice(from - 1, to).join("\n");
const findBlock = (name) => {
  const i = lines.findIndex((l) => l.startsWith(`const ${name}=`));
  if (i < 0) throw new Error(`Constante introuvable : ${name}`);
  let j = i;
  while (!/^\s*\};?\s*$|;\s*$/.test(lines[j])) j++;
  return lines.slice(i, j + 1).join("\n");
};
const code = [
  pick(383, 712),
  findBlock("TVAGE"), findBlock("FAM"), findBlock("FAMC"), findBlock("AN"),
  findBlock("VOTE"), findBlock("MTYPE"), findBlock("MOWN"),
  "({RAW,AGE,POPAGE,SV,INST27,INST22,INST17,PUB,MEDIA27,MEDIA22,MEDIA17,LEFT27,RIGHT27,EDGES27,LEFT22,RIGHT22,EDGES22,LEFT17,RIGHT17,EDGES17,TAKE22,TAKE17,POS,C27,C22,C17,POPC,POPN,ERAS,TVAGE,FAM,AN,VOTE,MTYPE,MOWN})",
].join("\n");
const D = vm.runInNewContext(code, {}, { timeout: 5000 });

const yn = (b) => (b ? "oui" : "non");
const T = {};
const tab = (name, header) => (T[name] = [header]);
const add = (name, ...rows) => rows.forEach((r) => T[name].push(r.map((v) => (v === undefined ? null : v))));
const YEARS = ["2017", "2022", "2027"];
const C = { 2017: D.C17, 2022: D.C22, 2027: D.C27 };
const POLLS = { 2017: D.RAW.p17, 2022: D.RAW.p22, 2027: D.RAW.p27 };

/* ---- élections ---- */
tab("elections", ["election", "titre", "sous_titre", "debut", "fin", "date_vote", "en_cours", "note", "a_retenir",
  "r2_date", "r2_a", "r2_b", "r2_score_a", "r2_score_b", "source_age"]);
for (const y of YEARS) {
  const E = D.ERAS[y], R = E.results;
  const sub = y === "2027" ? "Premier tour le 18 avril 2027, second tour le 2 mai." : E.sub;
  add("elections", [y, E.title, sub, E.start, E.end, D.VOTE[y], yn(E.live), E.note, E.take,
    R ? R.r2.d : null, R ? R.r2.a : null, R ? R.r2.b : null, R ? R.r2.va : null, R ? R.r2.vb : null, D.AGE[y].src]);
}

/* ---- candidats ---- */
// Clés présentes dans les sondages mais absentes de la liste affichée (testées ponctuellement).
const EXTRA_NAMES = { ruffin: "Ruffin", villepin: "Villepin", bouamrane: "Bouamrane", knafo: "Knafo", hollande: "Hollande", bertrand: "Bertrand" };
tab("candidats", ["election", "cle", "nom", "nom_court", "parti", "couleur", "visible", "affiche", "alias_wikipedia"]);
const pollKeys = {};
for (const y of YEARS) {
  const E = D.ERAS[y], keys = Object.keys(C[y]);
  for (const k of keys) {
    const c = C[y][k];
    const alias = y === "2027" ? (k === "rn" ? "Le Pen;Bardella" : c.n) : null;
    add("candidats", [y, k, c.n, c.s || null, c.p, c.c, yn(E.visible.includes(k)), "oui", alias]);
  }
  const extras = [...new Set(POLLS[y].flatMap((p) => Object.keys(p.s)))].filter((k) => !keys.includes(k));
  for (const k of extras) {
    if (!EXTRA_NAMES[k]) throw new Error(`Candidat sans nom : ${y}/${k}`);
    add("candidats", [y, k, EXTRA_NAMES[k], null, null, D.POPC[k] || "#A3A3A3", "non", "non", EXTRA_NAMES[k]]);
  }
  pollKeys[y] = [...keys, ...extras];
}

/* ---- sondages de premier tour ---- */
for (const y of YEARS) {
  const keys = pollKeys[y], name = `sondages_${y}`;
  tab(name, ["institut", "fin_terrain", "echantillon", "lien", "noms", ...keys, "source", "ajoute_le"]);
  for (const p of POLLS[y]) {
    const noms = Object.entries(p.names || {}).filter(([k]) => C[y][k] && C[y][k].s).map(([k, v]) => `${k}=${v}`).join("; ");
    add(name, [p.inst, p.d, p.n || null, p.url || null, noms || null, ...keys.map((k) => p.s[k] ?? null), "page d’origine", null]);
  }
}

/* ---- second tour (2017, 2022 ; 2027 vient de Wikipédia) ---- */
tab("second_tour", ["election", "institut", "date", "candidat_a", "candidat_b", "score_a", "score_b", "source"]);
for (const y of ["2017", "2022"]) {
  for (const d of D.RAW["d" + y.slice(2)]) add("second_tour", [y, d.inst, d.d, "Macron", "Le Pen", d.m, d.l, "page d’origine"]);
}

/* ---- résultats ---- */
tab("resultats", ["election", "cle", "score"]);
for (const y of ["2017", "2022"]) for (const [k, v] of Object.entries(D.ERAS[y].results.r1)) add("resultats", [y, k, v]);

/* ---- popularité ---- */
tab("popularite", ["election", "role", "personne", "institut", "mois", "valeur"]);
for (const y of YEARS) {
  const P = D.RAW.pop[y];
  const series = (role, who, w) => {
    for (const [inst, vals] of Object.entries(w.series)) w.months.forEach((m, i) => { if (vals[i] != null) add("popularite", [y, role, who, inst, m, vals[i]]); });
  };
  series("Président", P.pres[0], P.pres[1]);
  for (const [who, w] of P.pm) series("Premier ministre", who, w);
}
tab("personnalites", ["cle", "nom", "couleur"]);
for (const k of Object.keys(D.POPN)) add("personnalites", [k, D.POPN[k], D.POPC[k]]);
tab("popularite_personnalites", ["cle", "mois", "valeur"]);
for (const [k, months] of Object.entries(D.RAW.pop["2027"].cand)) {
  for (const m of Object.keys(months).sort()) add("popularite_personnalites", [k, `2026-${m}`, months[m]]);
}
tab("popularite_age", ["cle", "tranche", "valeur"]);
for (const [k, vals] of Object.entries(D.POPAGE.v)) vals.forEach((v, i) => add("popularite_age", [k, D.POPAGE.groups[i], v]));

/* ---- vote par âge ---- */
tab("vote_age", ["election", "tranche", "cle", "nom", "couleur", "valeur"]);
tab("abstention_age", ["election", "tranche", "valeur"]);
for (const y of YEARS) {
  const A = D.AGE[y];
  A.groups.forEach((g, i) => {
    A.cols.forEach(([k, n, c], j) => add("vote_age", [y, g, k, n, c, A.v[i][j]]));
    if (A.abst) add("abstention_age", [y, g, A.abst[i]]);
  });
}
// Part de chaque tranche d'âge parmi les inscrits (Insee Focus n° 241, liste électorale principale au 24 mai 2021),
// puis parmi les votants : part des inscrits × participation de la tranche, ramenée à 100.
const INSCRITS_AGE = [11.1, 14.5, 22.4, 16.5, 15.5, 20.0];
tab("inscrits_age", ["election", "tranche", "part_inscrits", "abstention", "part_votants"]);
for (const y of YEARS) {
  const A = D.AGE[y];
  if (!A.abst || A.groups.length !== INSCRITS_AGE.length) continue;
  const poids = INSCRITS_AGE.map((p, i) => p * (100 - A.abst[i])), total = poids.reduce((a, b) => a + b, 0);
  A.groups.forEach((g, i) => add("inscrits_age", [y, g, INSCRITS_AGE[i], A.abst[i], Math.round(poids[i] / total * 1000) / 10]));
}

/* ---- Assemblée ---- */
tab("assemblee", ["date_cle", "libelle", "description", "vacants"]);
tab("assemblee_groupes", ["date_cle", "sigle", "nom", "sieges", "couleur", "famille", "president", "position"]);
for (const [k, A] of Object.entries(D.AN)) {
  add("assemblee", [k, A.label, A.sub, A.vac]);
  for (const g of A.g) add("assemblee_groupes", [k, g[0], g[1], g[2], g[3], D.FAM[g[4]], g[5], g[6]]);
}

/* ---- instituts, acteurs publics ---- */
tab("instituts", ["election", "nom", "cle", "etiquettes", "milliardaire", "proprietaire", "dirigeants", "clients", "liens"]);
for (const y of YEARS) for (const i of D["INST" + y.slice(2)]) add("instituts", [y, i.n, i.k, i.tags.join("; "), yn(i.bill), i.own, i.who, i.cli, i.links]);
tab("acteurs_publics", ["nom", "type", "role"]);
for (const p of D.PUB) add("acteurs_publics", [p.n, p.t, p.r]);

/* ---- médias ---- */
tab("medias", ["election", "proprietaire", "groupe", "description", "media", "type", "orientation", "certitude", "detail"]);
for (const y of YEARS) {
  for (const g of D["MEDIA" + y.slice(2)]) {
    if (!g.m.length) add("medias", [y, g.o, g.w, g.d || null, null, null, null, null, null]);
    for (const [n, t, p, c, ds] of g.m) add("medias", [y, g.o, g.w, g.d || null, n, t, D.POS[p], c, ds]);
  }
}

/* ---- liens médias ↔ sondeurs ---- */
tab("liens_acteurs", ["election", "cote", "cle", "nom", "detail"]);
tab("liens", ["election", "de", "vers", "type", "description"]);
for (const y of YEARS) {
  const s = y.slice(2);
  for (const n of D["LEFT" + s]) add("liens_acteurs", [y, "commanditaire", n[0], n[1], n[2] || null]);
  for (const n of D["RIGHT" + s]) add("liens_acteurs", [y, "institut", n[0], n[1], null]);
  for (const e of D["EDGES" + s]) add("liens", [y, e[0], e[1], e[2], e[3]]);
}

/* ---- audiences ---- */
tab("audience_age", ["chaine", "age_moyen", "chaine_info"]);
for (const [n, a, t] of D.TVAGE) add("audience_age", [n, a, yn(t === "i")]);

/* ---- citations dans les médias ---- */
tab("citations", ["personnalite", "bloc", "periode", "publications", "auteurs", "engagement"]);
// Une ligne par personnalité, une colonne par semaine (date de fin de la semaine).
const nbSemaines = Math.max(...D.SV.c.map((c) => c.cw.length));
const CIT_END = Date.UTC(2026, 9, 1);
const iso = (t) => new Date(t).toISOString().slice(0, 10);
tab("citations_semaines", ["personnalite", ...Array.from({ length: nbSemaines }, (_, i) => iso(CIT_END - (nbSemaines - 1 - i) * 7 * 864e5))]);
tab("citations_medias", ["personnalite", "media", "categorie", "publications"]);
tab("citations_journalistes", ["personnalite", "nom", "categorie", "publications"]);
tab("citations_reseaux", ["personnalite", "periode", "reseau", "publications"]);
for (const c of D.SV.c) {
  for (const [per, v] of Object.entries(c.ci)) add("citations", [c.n, c.b, per, v[0], v[1], v[2]]);
  add("citations_semaines", [c.n, ...Array(nbSemaines - c.cw.length).fill(null), ...c.cw]);
  for (const m of c.med) add("citations_medias", [c.n, m[0], m[1], m[2]]);
  for (const j of c.jour) add("citations_journalistes", [c.n, j[0], j[1], j[2]]);
  for (const [per, nets] of Object.entries(c.cir || {})) for (const [net, v] of Object.entries(nets)) add("citations_reseaux", [c.n, per, net, v]);
}
tab("citations_periodes", ["cle", "libelle", "texte"]);
for (const [k, v] of Object.entries(D.SV.per)) add("citations_periodes", [k, v.lib, v.txt]);
tab("medias_infos", ["media", "type", "proprietaire"]);
for (const m of new Set([...Object.keys(D.MTYPE), ...Object.keys(D.MOWN)])) add("medias_infos", [m, D.MTYPE[m] || null, D.MOWN[m] || null]);

/* ---- paramètres et journal ---- */
tab("parametres", ["cle", "valeur"]);
add("parametres",
  ["maj_auto", "oui"],
  ["wikipedia_page", "Liste de sondages sur l'élection présidentielle française de 2027"],
  ["derniere_maj", "2026-10-23"],
  ["popularite_age_source", D.POPAGE.src],
  ["inscrits_age_source", "Insee, Focus n° 241 : électeurs inscrits sur la liste principale par âge au 24 mai 2021 (même répartition appliquée à 2017, faute de chiffres publiés au même format)."],
  ["popularite_source", "Part de « bonnes opinions » dans le baromètre mensuel Ifop-Fiducial pour Paris Match et Sud Radio (pas de vague en août)."],
  ["popularite_commentaire", "En octobre 2026, 41 des 50 personnalités testées reculent ; Raphaël Glucksmann et David Lisnard sont les principales exceptions."],
  ["citations_fin", iso(CIT_END)],
  ["sondages_2027_depuis", "2026-02-20"],
  ["maj_script", "oui"],
  ["script_branche", "main"]);
tab("journal", ["date", "action", "details"]);
add("journal", ["2026-10-23", "import initial", "Données reprises de la page d’origine"]);

const snapshot = { version: 1, genere_le: new Date().toISOString(), source: "page d’origine", onglets: T };
fs.writeFileSync(out, JSON.stringify(snapshot));
for (const [k, v] of Object.entries(T)) console.log(k.padEnd(26), String(v.length - 1).padStart(5), "lignes ×", v[0].length, "colonnes");
