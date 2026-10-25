/* Chargement des données : le Google Sheet (via l'API Apps Script) en priorité,
   sinon le fichier de secours data/snapshot.json. Puis conversion des onglets
   en structures utilisées par app.js. */

const DONNEES_SECOURS = "data/snapshot.json";

async function chargerJSON(url, delai) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), delai);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j || !j.onglets) throw new Error("réponse sans onglets");
    return j;
  } finally {
    clearTimeout(t);
  }
}

async function chargerDonnees() {
  const api = (window.CONFIG && window.CONFIG.API_URL) || "";
  if (api) {
    try {
      return { json: await chargerJSON(api, 15000), origine: "sheet" };
    } catch (e) {
      console.warn("Google Sheet indisponible, données de secours utilisées :", e);
    }
  }
  return { json: await chargerJSON(DONNEES_SECOURS, 15000), origine: "secours" };
}

/* ---------- outils ---------- */
const oui = (v) => v === true || /^(oui|vrai|true|x|1)$/i.test(String(v ?? "").trim());
const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
};
const txt = (v) => (v === null || v === undefined ? "" : String(v));
const jour = (v) => txt(v).slice(0, 10);
const mois = (v) => txt(v).slice(0, 7);
const sansAccents = (s) => txt(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function lignes(onglets, nom) {
  const t = onglets[nom];
  if (!t || !t.length) return [];
  const h = t[0].map((x) => txt(x).trim());
  return t.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? null])));
}

function grouper(rows, cle) {
  const out = new Map();
  for (const r of rows) {
    const k = txt(typeof cle === "function" ? cle(r) : r[cle]);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push(r);
  }
  return out;
}

/* ---------- conversion ---------- */
const COLONNES_SONDAGE = new Set(["institut", "fin_terrain", "echantillon", "lien", "noms", "source", "ajoute_le"]);
const POS_NOMS = ["Gauche radicale", "Gauche", "Centre-gauche", "Centre", "Centre-droit", "Droite", "Droite conserv. / identitaire"];
const FAM_NOMS = ["Gauche radicale", "Écologistes", "Socialistes", "Centre indépendant", "Bloc central", "Droite", "Extrême droite", "Non-inscrits"];

function sondages(onglets, annee) {
  const t = onglets[`sondages_${annee}`];
  if (!t) return [];
  const h = t[0].map((x) => txt(x).trim()), cles = h.filter((k) => k && !COLONNES_SONDAGE.has(k));
  return lignes(onglets, `sondages_${annee}`)
    .filter((r) => r.institut && /^\d{4}-\d\d-\d\d/.test(jour(r.fin_terrain)))
    .map((r) => {
      const s = {};
      for (const k of cles) { const v = num(r[k]); if (v !== null) s[k] = v; }
      const names = {};
      txt(r.noms).split(";").forEach((x) => { const [k, ...v] = x.split("="); if (k && v.length) names[k.trim()] = v.join("=").trim(); });
      return { inst: txt(r.institut).trim(), d: jour(r.fin_terrain), n: num(r.echantillon), url: /^https?:\/\//.test(txt(r.lien)) ? txt(r.lien) : "", s, names };
    })
    .sort((a, b) => a.d.localeCompare(b.d));
}

function popularite(rows) {
  const serie = (rs) => {
    const months = [...new Set(rs.map((r) => mois(r.mois)))].sort(), series = {};
    for (const r of rs) {
      const i = txt(r.institut);
      (series[i] = series[i] || months.map(() => null))[months.indexOf(mois(r.mois))] = num(r.valeur);
    }
    return { months, series };
  };
  const pres = grouper(rows.filter((r) => /pr[ée]sident/i.test(txt(r.role))), "personne");
  const pm = grouper(rows.filter((r) => /ministre/i.test(txt(r.role))), "personne");
  const [presNom, presRows] = [...pres.entries()].pop() || ["", []];
  return { pres: [presNom, serie(presRows)], pm: [...pm.entries()].map(([n, rs]) => [n, serie(rs)]) };
}

/** Moyenne des duels de 2nd tour : mesures des 61 derniers jours, ou les 3 plus récentes si le duel est rare. */
function duels2027(rows) {
  const r2 = rows.map((r) => ({ inst: txt(r.institut), d: jour(r.date), a: txt(r.candidat_a), b: txt(r.candidat_b), va: num(r.score_a), vb: num(r.score_b) }))
    .filter((x) => x.a && x.b && x.va !== null && x.vb !== null && x.d);
  if (!r2.length) return [];
  const T = Math.max(...r2.map((x) => Date.parse(x.d))), JOUR = 864e5;
  const out = [];
  for (const [, ms] of grouper(r2, (x) => [sansAccents(x.a), sansAccents(x.b)].sort().join("|"))) {
    ms.sort((x, y) => x.d.localeCompare(y.d));
    const last = ms[ms.length - 1];
    if (T - Date.parse(last.d) > 183 * JOUR) continue;
    let w = ms.filter((x) => T - Date.parse(x.d) <= 61 * JOUR);
    if (w.length < 2) w = ms.slice(-3);
    const a = last.a, sa = (x) => (sansAccents(x.a) === sansAccents(a) ? x.va : x.vb);
    const avgA = Math.round((w.reduce((s, x) => s + sa(x), 0) / w.length) * 10) / 10;
    out.push({ a, b: sansAccents(last.a) === sansAccents(a) ? last.b : last.a, n: w.length, avgA, avgB: Math.round((100 - avgA) * 10) / 10, last: { inst: last.inst, d: last.d } });
  }
  return out.sort((x, y) => y.n - x.n || y.last.d.localeCompare(x.last.d));
}

function construireModele(json) {
  const O = json.onglets, L = (n) => lignes(O, n);
  const PARAM = Object.fromEntries(L("parametres").map((r) => [txt(r.cle), r.valeur]));

  /* candidats */
  const C = {}, VIS = {}, tousCandidats = L("candidats");
  for (const r of tousCandidats) {
    const y = txt(r.election);
    C[y] = C[y] || {}; VIS[y] = VIS[y] || [];
    if (!oui(r.affiche)) continue;
    C[y][txt(r.cle)] = { n: txt(r.nom), s: txt(r.nom_court) || undefined, p: txt(r.parti), c: txt(r.couleur) || "#888888" };
    if (oui(r.visible)) VIS[y].push(txt(r.cle));
  }
  const couleurs27 = {};
  for (const r of tousCandidats.filter((r) => txt(r.election) === "2027")) {
    [r.nom, r.nom_court, ...txt(r.alias_wikipedia).split(";")].forEach((a) => { if (txt(a)) couleurs27[sansAccents(a)] = txt(r.couleur); });
  }
  const couleurDuel = (nom) => couleurs27[sansAccents(nom)] || couleurs27[sansAccents(nom).split(" ").pop()] || "#8A94A6";

  /* sondages */
  const second = L("second_tour");
  const d1x = (y) => second.filter((r) => txt(r.election) === y).map((r) => ({ inst: txt(r.institut), d: jour(r.date), m: num(r.score_a), l: num(r.score_b) }))
    .filter((x) => x.m !== null).sort((a, b) => a.d.localeCompare(b.d));
  const pop = {};
  for (const [y, rs] of grouper(L("popularite"), "election")) pop[y] = popularite(rs);
  const cand = {};
  for (const r of L("popularite_personnalites")) { const k = txt(r.cle); (cand[k] = cand[k] || {})[mois(r.mois)] = num(r.valeur); }
  if (pop["2027"]) pop["2027"].cand = cand;
  const RAW = {
    p17: sondages(O, "2017"), p22: sondages(O, "2022"), p27: sondages(O, "2027"),
    r2_27: duels2027(second.filter((r) => txt(r.election) === "2027")),
    d17: d1x("2017"), d22: d1x("2022"), pop,
  };

  /* personnalités et popularité par âge */
  const POPN = {}, POPC = {};
  for (const r of L("personnalites")) { POPN[txt(r.cle)] = txt(r.nom); POPC[txt(r.cle)] = txt(r.couleur); }
  const pa = L("popularite_age"), groupesAge = [...new Set(pa.map((r) => txt(r.tranche)))], v = {};
  for (const r of pa) (v[txt(r.cle)] = v[txt(r.cle)] || groupesAge.map(() => null))[groupesAge.indexOf(txt(r.tranche))] = num(r.valeur);
  const POPAGE = { src: txt(PARAM.popularite_age_source), groups: groupesAge, v };

  /* vote par âge */
  const elections = L("elections"), abst = L("abstention_age"), AGE = {};
  for (const [y, rs] of grouper(L("vote_age"), "election")) {
    const groups = [...new Set(rs.map((r) => txt(r.tranche)))], cols = [];
    for (const r of rs) if (!cols.some((c) => c[0] === txt(r.cle))) cols.push([txt(r.cle), txt(r.nom), txt(r.couleur)]);
    const vals = groups.map((g) => cols.map((c) => { const x = rs.find((r) => txt(r.tranche) === g && txt(r.cle) === c[0]); return x ? num(x.valeur) : null; }));
    const ab = groups.map((g) => { const x = abst.find((r) => txt(r.election) === y && txt(r.tranche) === g); return x ? num(x.valeur) : null; });
    const e = elections.find((r) => txt(r.election) === y) || {};
    AGE[y] = { src: txt(e.source_age), groups, cols, v: vals, abst: ab.some((x) => x !== null) ? ab : null };
  }

  /* instituts, médias, liens */
  const parElection = (n) => grouper(L(n), "election");
  const inst = parElection("instituts"), med = parElection("medias"), acteurs = parElection("liens_acteurs"), liens = parElection("liens");
  const INST = (y) => (inst.get(y) || []).map((r) => ({
    n: txt(r.nom), k: txt(r.cle) || txt(r.nom), tags: txt(r.etiquettes).split(";").map((t) => t.trim()).filter(Boolean),
    bill: oui(r.milliardaire), own: txt(r.proprietaire), who: txt(r.dirigeants), cli: txt(r.clients), links: txt(r.liens),
  }));
  const MEDIA = (y) => [...grouper(med.get(y) || [], "proprietaire").entries()].map(([o, rs]) => ({
    o, w: txt(rs[0].groupe), d: txt(rs[0].description),
    m: rs.filter((r) => txt(r.media)).map((r) => [txt(r.media), txt(r.type), Math.max(0, POS_NOMS.indexOf(txt(r.orientation))), txt(r.certitude), txt(r.detail)]),
  }));
  const LEFT = (y) => (acteurs.get(y) || []).filter((r) => txt(r.cote) !== "institut").map((r) => [txt(r.cle), txt(r.nom), txt(r.detail)]);
  const RIGHT = (y) => (acteurs.get(y) || []).filter((r) => txt(r.cote) === "institut").map((r) => [txt(r.cle), txt(r.nom)]);
  const EDGES = (y) => (liens.get(y) || []).map((r) => [txt(r.de), txt(r.vers), txt(r.type), txt(r.description)]);

  /* élections */
  const resultats = grouper(L("resultats"), "election"), ERAS = {}, VOTE = {};
  const majTexte = PARAM.derniere_maj ? ` Données mises à jour le ${new Date(jour(PARAM.derniere_maj) + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.` : "";
  for (const e of elections) {
    const y = txt(e.election), live = oui(e.en_cours), res = resultats.get(y);
    VOTE[y] = jour(e.date_vote);
    ERAS[y] = {
      title: txt(e.titre), sub: txt(e.sous_titre) + (live ? majTexte : ""), C: C[y] || {}, polls: RAW["p" + y.slice(2)] || [],
      start: jour(e.debut), end: jour(e.fin), live, visible: VIS[y] || [], note: txt(e.note),
      inst: INST(y), media: MEDIA(y), left: LEFT(y), right: RIGHT(y), edges: EDGES(y), take: txt(e.a_retenir),
    };
    if (!live && res) {
      ERAS[y].results = {
        d: VOTE[y], r1: Object.fromEntries(res.map((r) => [txt(r.cle), num(r.score)])),
        r2: { d: jour(e.r2_date), a: txt(e.r2_a), b: txt(e.r2_b), va: num(e.r2_score_a), vb: num(e.r2_score_b) },
      };
      ERAS[y].duels = RAW["d" + y.slice(2)];
    }
  }

  /* Assemblée */
  const AN = {}, groupes = grouper(L("assemblee_groupes"), (r) => mois(r.date_cle));
  for (const r of L("assemblee")) {
    const k = mois(r.date_cle);
    AN[k] = {
      label: txt(r.libelle), sub: txt(r.description), vac: num(r.vacants) || 0,
      g: (groupes.get(k) || []).map((g) => [txt(g.sigle), txt(g.nom), num(g.sieges) || 0, txt(g.couleur), Math.max(0, FAM_NOMS.indexOf(txt(g.famille))), txt(g.president) || "—", txt(g.position) || "—"]),
    };
  }

  /* citations */
  const cit = L("citations"), SVc = [];
  // citations_semaines : une ligne par personnalité, une colonne par semaine (en-tête AAAA-MM-JJ).
  const ts = O.citations_semaines || [[]], enteteSem = ts[0].map((h) => txt(h).trim());
  const colsSem = enteteSem.map((h, i) => [jour(h), i]).filter(([h]) => /^\d{4}-\d\d-\d\d$/.test(h)).sort((a, b) => a[0].localeCompare(b[0]));
  const toutesSemaines = colsSem.map(([h]) => h), iNom = enteteSem.indexOf("personnalite");
  const semaines = new Map(ts.slice(1).map((r) => [txt(r[iNom]), colsSem.map(([, i]) => num(r[i]) || 0)]));
  const cm = grouper(L("citations_medias"), "personnalite");
  const cj = grouper(L("citations_journalistes"), "personnalite"), cr = grouper(L("citations_reseaux"), "personnalite");
  for (const [n, rs] of grouper(cit, "personnalite")) {
    const ci = {}, cir = {};
    for (const r of rs) ci[txt(r.periode)] = [num(r.publications) || 0, num(r.auteurs) || 0, num(r.engagement) || 0];
    for (const r of cr.get(n) || []) (cir[txt(r.periode)] = cir[txt(r.periode)] || {})[txt(r.reseau)] = num(r.publications) || 0;
    SVc.push({
      n, b: txt(rs[0].bloc), ci, cir, cw: semaines.get(n) || toutesSemaines.map(() => 0),
      med: (cm.get(n) || []).map((r) => [txt(r.media), txt(r.categorie), num(r.publications) || 0]),
      jour: (cj.get(n) || []).map((r) => [txt(r.nom), txt(r.categorie), num(r.publications) || 0]),
    });
  }
  const SV = { c: SVc, weeks: toutesSemaines, per: Object.fromEntries(L("citations_periodes").map((r) => [txt(r.cle), { lib: txt(r.libelle), txt: txt(r.texte) }])) };

  const MTYPE = {}, MOWN = {};
  for (const r of L("medias_infos")) { if (r.type) MTYPE[txt(r.media)] = txt(r.type); if (r.proprietaire) MOWN[txt(r.media)] = txt(r.proprietaire); }

  return {
    RAW, AGE, POPAGE, SV, PUB: L("acteurs_publics").map((r) => ({ n: txt(r.nom), t: txt(r.type), r: txt(r.role) })),
    C27: C["2027"] || {}, POPC, POPN, ERAS, VOTE, AN, MTYPE, MOWN, PARAM, couleurDuel,
    TVAGE: L("audience_age").map((r) => [txt(r.chaine), num(r.age_moyen), oui(r.chaine_info) ? "i" : "g"]),
  };
}

