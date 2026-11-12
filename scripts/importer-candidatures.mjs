// Liste des candidatures à la présidentielle de 2027 (déclarées, pressenties, retirées), d'après l'article de
// Wikipédia « Candidatures à l'élection présidentielle française de 2027 » (CC BY-SA 4.0).
// Écrit data/declarations.json au format des onglets du Google Sheet (onglet « declarations ») ;
// lancé chaque jour par .github/workflows/donnees-quotidiennes.yml, recopié dans le classeur par DonneesGitHub.gs.
//
// Usage : node scripts/importer-candidatures.mjs [fichier.wiki] [data/declarations.json]
import fs from "node:fs";

export const PAGE = "Candidatures à l'élection présidentielle française de 2027";
export const ENTETE_DECLARATIONS = ["statut", "nom", "parti", "date", "detail", "lien"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const sansRefs = (t) => t.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
const lienWiki = (nom) => "https://fr.wikipedia.org/wiki/" + encodeURIComponent(nom.replace(/ /g, "_"));
const deux = (n) => String(n).padStart(2, "0");

/** Texte lisible : liens, modèles de date et balises retirés. */
export function texteSimple(s) {
  return String(s || "")
    .replace(/\{\{\s*[Dd]ate\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})\s*\|\s*(\d{4})\s*\}\}/g, (m, j, mo, a) => `${+j} ${MOIS[+mo - 1]} ${a}`)
    .replace(/\{\{\s*[Dd]ate\s*\|([^}]*)\}\}/g, (m, d) => d.split("|").join(" "))
    .replace(/\{\{\s*Circonscription fr\s*\|\s*(\d+)\s*\|([^}]*)\}\}/g, (m, n, d) => `${n}${n === "1" ? "re" : "e"} circonscription (${d.trim()})`)
    .replace(/\{\{\s*(?:1er|1re|\d+e)\s*\}\}/g, (m) => m.replace(/[{}\s]/g, ""))
    .replace(/\{\{[^{}]*\}\}/g, "").replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/'{2,}/g, "").replace(/----/g, " ").replace(/\s+/g, " ").trim();
}

/** Première date de déclaration trouvée dans le texte, au format AAAA-MM-JJ (ou AAAA-MM). */
export function dateDeclaration(s) {
  const t = String(s || "");
  const k = t.search(/annonce|déclar|présente sa|désign|confirme|officialise|retire/i);
  if (k < 0) return "";
  // la date suit le verbe (« annonce sa candidature le 3 mai ») ou, à défaut, le précède (« Le 8 décembre 2025, elle annonce »)
  return dateDans(t.slice(k, k + 260)) || dateDans(t.slice(Math.max(0, k - 60), k));
}

function dateDans(zone) {
  let m = zone.match(/\{\{\s*[Dd]ate\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})\s*\|\s*(\d{4})/);
  if (m) return `${m[3]}-${deux(m[2])}-${deux(m[1])}`;
  m = zone.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${deux(m[2])}-${deux(m[1])}`;
  m = zone.match(/(\d{1,2})(?:er)?\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i);
  if (m) return `${m[3]}-${deux(MOIS.indexOf(m[2].toLowerCase()) + 1)}-${deux(m[1])}`;
  m = zone.match(/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i);
  if (m) return `${m[2]}-${deux(MOIS.indexOf(m[1].toLowerCase()) + 1)}`;
  m = zone.match(/début (\d{4})/);
  return m ? m[1] : "";
}

function section(wikicode, titre) {
  const i = wikicode.indexOf(`== ${titre} ==`);
  if (i < 0) return "";
  const suite = wikicode.slice(i + titre.length + 6), j = suite.search(/\n== [^=]/);
  return j < 0 ? suite : suite.slice(0, j);
}

/** Lignes d'un tableau de candidats : en-tête « ! {{TriNom|Prénom|Nom}}<br>(âge)<br>[[Parti]] ». */
function lignesTableau(texte, statut) {
  const out = [];
  for (const bloc of texte.split(/\n\|-/)) {
    const h = bloc.match(/\n?!\s*(?:\{\{TriNom\|([^|}]+)\|([^|}]+)[^}]*\}\}|\[\[([^\]|]+)(?:\|[^\]]*)?\]\]|([A-ZÀ-Ý][^<{\n]+?)(?=\{\{|<br>))([^\n]*)/);
    if (!h) continue;
    const nom = (h[3] || h[4] || `${h[1]} ${h[2]}`).trim();
    const reste = h[5] || "";
    const partis = [...reste.matchAll(/<br>\s*(\[\[[^\]]+\]\]|[^<{[]+)/g)].map((m) => texteSimple(m[1])).filter((x) => x && !/^\(?\s*(\d+ ans)?\s*\)?$/.test(x));
    const corps = bloc.slice(h.index + h[0].length);
    const detail = texteSimple((corps.match(/(?:Il|Elle|Le NPA[^ ]*)\s[^\n]*(?:annonce|déclare|présente|désign)[^\n]*/) || [""])[0]).slice(0, 300);
    out.push([statut, nom, partis.join(" / "), dateDeclaration(corps), detail, h[1] && /nolink/.test(h[0]) ? "" : lienWiki(nom)]);
  }
  return out;
}

export function lireCandidatures(wikicode) {
  const t = sansRefs(wikicode), lignes = [ENTETE_DECLARATIONS];
  lignes.push(...lignesTableau(section(t, "Candidats déclarés"), "déclaré"));
  lignes.push(...lignesTableau(section(t, "Candidats pressentis"), "pressenti"));
  for (const l of section(t, "Candidatures retirées").split("\n").filter((x) => x.startsWith("*"))) {
    const m = l.match(/^\*\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]\s*(?:\(([^)]*\]\][^)]*|[^)]*)\))?/);
    if (!m) continue;
    lignes.push(["retiré", m[1].trim(), texteSimple(m[2] || ""), dateDeclaration(l.slice(l.search(/retire/))), texteSimple(l.replace(/^\*\s*/, "")).slice(0, 300), lienWiki(m[1].trim())]);
  }
  return lignes;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wikicode = process.argv[2] && fs.existsSync(process.argv[2]) ? fs.readFileSync(process.argv[2], "utf8")
    : await (await fetch(`https://fr.wikipedia.org/w/index.php?action=raw&title=${encodeURIComponent(PAGE)}`, {
      headers: { "User-Agent": "presidentielles-sondages (mise a jour quotidienne)" },
    })).text();
  const sortie = process.argv[3] || "data/declarations.json";
  const declarations = lireCandidatures(wikicode);
  if (declarations.length < 10) { console.error("Liste des candidatures introuvable sur Wikipédia"); process.exit(1); }
  fs.writeFileSync(sortie, JSON.stringify({ version: 1, genere_le: new Date().toISOString(),
    source: `Wikipédia, « ${PAGE} » (CC BY-SA 4.0)`, onglets: { declarations } }));
  console.log(`${declarations.length - 1} candidatures → ${sortie}`);
}
