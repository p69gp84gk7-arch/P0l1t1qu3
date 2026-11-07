// Tonalité des articles de presse qui citent chaque personnalité (onglet Citations).
// Source : GDELT (projet GDELT, base mondiale d'articles de presse en ligne), API DOC 2.0, mode « tonechart » :
// répartition des articles en langue française des 30 derniers jours selon leur tonalité, mesurée
// automatiquement d'après les mots positifs et négatifs du texte, avec des exemples de titres.
// Attention : c'est le ton de l'article entier (un article sur un attentat est négatif même s'il ne
// critique pas la personne citée), pas une opinion pour ou contre la personnalité.
//
// Écrit data/tonalite.json au format des onglets du Google Sheet (« tonalite » et « tonalite_articles ») ;
// Apps Script (DonneesGitHub.gs) le recopie dans le classeur. Exécuté chaque jour par
// .github/workflows/donnees-quotidiennes.yml.
//
// Usage : node scripts/importer-tonalite.mjs [data/snapshot.json] [data/tonalite.json]
import fs from "node:fs";

export const ENTETE_TONALITE = ["personnalite", "periode_debut", "periode_fin", "articles", "negatifs", "neutres", "positifs", "ton_moyen", "mis_a_jour"];
export const ENTETE_TONALITE_ARTICLES = ["personnalite", "sens", "ton", "titre", "media", "lien"];
// Seuils : GDELT note le ton d'environ -10 à +10 ; la presse est en moyenne un peu négative.
export const SEUIL_NEGATIF = -2, SEUIL_POSITIF = 2, EXEMPLES = 4;

const API = "https://api.gdeltproject.org/api/v2/doc/doc";
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

export const urlTonalite = (nom, jours = 30) =>
  `${API}?query=${encodeURIComponent(`"${nom}" sourcelang:french`)}&mode=tonechart&format=json&timespan=${jours}d`;

/** Nom du média d'après l'adresse de l'article (www.lemonde.fr → lemonde.fr). */
export const mediaDepuisUrl = (u) => { try { return new URL(u).hostname.replace(/^(www|m|amp)\./, ""); } catch (e) { return ""; } };

/** Les titres de GDELT gardent des espaces avant la ponctuation (et perdent les apostrophes, qu'on ne peut pas rétablir). */
export function nettoyerTitre(t) {
  return String(t || "").replace(/\s+([,.)])/g, "$1").replace(/\s+([:;!?»])/g, "\u00a0$1").replace(/«\s+/g, "«\u00a0").replace(/\s{2,}/g, " ").trim();
}

/** Résumé d'une réponse tonechart : compte des articles par sens et exemples les plus marqués. */
export function resumerTonalite(json) {
  const bins = (json && json.tonechart) || [];
  let n = 0, neg = 0, pos = 0, somme = 0;
  const exemples = [];
  for (const b of bins) {
    const c = +b.count || 0, t = +b.bin;
    n += c; somme += t * c;
    if (t <= SEUIL_NEGATIF) neg += c; else if (t >= SEUIL_POSITIF) pos += c;
    for (const a of b.toparts || []) exemples.push({ ton: t, titre: nettoyerTitre(a.title), lien: a.url, media: mediaDepuisUrl(a.url) });
  }
  const vus = new Set(), uniques = exemples.filter((e) => { const k = e.titre.toLowerCase(); if (!e.titre || vus.has(k)) return false; vus.add(k); return true; });
  const negatifs = uniques.filter((e) => e.ton <= SEUIL_NEGATIF).sort((a, b) => a.ton - b.ton).slice(0, EXEMPLES);
  const positifs = uniques.filter((e) => e.ton >= SEUIL_POSITIF).sort((a, b) => b.ton - a.ton).slice(0, EXEMPLES);
  return { articles: n, negatifs: neg, positifs: pos, neutres: n - neg - pos, ton: n ? Math.round(somme / n * 10) / 10 : null, exNeg: negatifs, exPos: positifs };
}

async function interroger(nom) {
  for (let essai = 0; essai < 4; essai++) {
    const r = await fetch(urlTonalite(nom), { headers: { "User-Agent": "presidentielles-sondages (mise a jour quotidienne)" } });
    const texte = await r.text();
    // 429 : trop de requêtes ; 5xx : GDELT surchargé. On réessaie en attendant de plus en plus longtemps.
    if (r.status === 429 || r.status >= 500 || /^Please limit/.test(texte)) { await attendre(10000 * 2 ** essai); continue; }
    if (!r.ok) throw new Error(`GDELT ${r.status} pour ${nom}`);
    try { return JSON.parse(texte); } catch (e) { return {}; }
  }
  throw new Error(`GDELT : trop de requêtes, ${nom} non mis à jour`);
}

export function personnalites(snapshot) {
  const t = snapshot.onglets.citations || [];
  return [...new Set(t.slice(1).map((r) => String(r[0] || "").trim()).filter(Boolean))];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const snap = JSON.parse(fs.readFileSync(process.argv[2] || "data/snapshot.json", "utf8"));
  const sortie = process.argv[3] || "data/tonalite.json";
  const ancien = fs.existsSync(sortie) ? JSON.parse(fs.readFileSync(sortie, "utf8")) : null;
  const fin = new Date(), debut = new Date(fin - 30 * 864e5), jour = (d) => d.toISOString().slice(0, 10);
  const tonalite = [ENTETE_TONALITE], articles = [ENTETE_TONALITE_ARTICLES];
  let erreurs = 0;
  // budget de temps : au-delà, on garde les chiffres de la veille pour les personnalités restantes
  const debutTravail = Date.now(), budget = (+process.env.TONALITE_BUDGET_MIN || 20) * 60000;
  for (const nom of personnalites(snap)) {
    try {
      if (Date.now() - debutTravail > budget) throw new Error(`budget de temps dépassé, ${nom} non mis à jour`);
      const r = resumerTonalite(await interroger(nom));
      tonalite.push([nom, jour(debut), jour(fin), r.articles, r.negatifs, r.neutres, r.positifs, r.ton, jour(fin)]);
      for (const e of r.exNeg) articles.push([nom, "négatif", e.ton, e.titre, e.media, e.lien]);
      for (const e of r.exPos) articles.push([nom, "positif", e.ton, e.titre, e.media, e.lien]);
      console.log(`${nom} : ${r.articles} articles, ${r.negatifs} négatifs, ${r.positifs} positifs`);
    } catch (e) {
      // on garde les chiffres de la veille pour cette personnalité
      erreurs++;
      console.warn(String(e.message || e));
      const o = ancien && ancien.onglets;
      if (o) { tonalite.push(...o.tonalite.slice(1).filter((r) => r[0] === nom)); articles.push(...o.tonalite_articles.slice(1).filter((r) => r[0] === nom)); }
    }
    if (Date.now() - debutTravail <= budget) await attendre(+process.env.TONALITE_PAUSE || 6000); // GDELT demande au plus une requête toutes les 5 secondes
  }
  if (tonalite.length === 1) { console.error("Aucune donnée GDELT"); process.exit(1); }
  fs.writeFileSync(sortie, JSON.stringify({
    version: 1, genere_le: new Date().toISOString(), source: "GDELT Project, API DOC 2.0 (tonechart), articles en français des 30 derniers jours",
    onglets: { tonalite, tonalite_articles: articles },
  }));
  console.log(`${tonalite.length - 1} personnalités → ${sortie}${erreurs ? ` (${erreurs} en erreur)` : ""}`);
}
