// Votes de l'Assemblée nationale (17e législature) : open data officiel de l'Assemblée.
// Garde les scrutins qui comptent pour comprendre les choix des groupes (vote sur l'ensemble d'un texte, motions
// de censure et de rejet, résolutions, déclarations), pas les milliers de votes sur des amendements ou des articles.
// Pour chaque scrutin : résultat, position de chaque groupe et auteur du texte (Gouvernement, député et son groupe,
// Sénat).
//
// Écrit data/scrutins.json au format des onglets du Google Sheet (onglets « scrutins » et « scrutins_groupes ») ;
// le script Apps Script (Scrutins.gs) recopie ce fichier dans le classeur toutes les 6 heures.
// Exécuté chaque jour par .github/workflows/scrutins.yml.
//
// Usage : node scripts/importer-scrutins.mjs <dossier des zips décompressés> [data/scrutins.json]
//   le dossier contient scrutins/json/*.json, amo/json/{acteur,organe}/*.json (députés, sénateurs et ministres de la
//   législature, fichier AMO20) et dossiers/json/dossierParlementaire/*.json
import fs from "node:fs";
import path from "node:path";

export const ENTETE_SCRUTINS = ["numero", "date", "type", "categorie", "titre", "objet", "auteur", "auteur_groupe", "sort",
  "pour", "contre", "abstentions", "votants", "lien", "lien_dossier"];
export const ENTETE_SCRUTINS_GROUPES = ["numero", "sigle", "position", "pour", "contre", "abstentions", "non_votants", "membres"];

// Identifiants de groupes absents de la liste des organes actifs.
const GROUPES_ANCIENS = { PO847173: "UDR" };
const SIGLES = { "LFI-NFP": "LFI", ECOS: "EcoS", DEM: "Dem" };
const LEGISLATURE = 17;

const sansEspaces = (s) => String(s || "").replace(/\s+/g, " ").trim();
const nombre = (v) => (v === null || v === undefined || v === "" ? 0 : +v);
const liste = (x) => (x === null || x === undefined ? [] : [].concat(x));

/** Catégorie d'un scrutin d'après son objet ; null pour les amendements et les articles (non retenus). */
export function categorieScrutin(s) {
  const o = sansEspaces(s.objet && s.objet.libelle).toLowerCase().replace(/’/g, "'").replace(/^sur /, "");
  if (s.typeVote && s.typeVote.codeTypeVote === "MOC" || /^la motion de censure/.test(o)) return "censure";
  // (l'open data contient des coquilles : « amenedement », « sous-amendmeent »)
  if (/^(l'amen|le sous-amen|l'article|les articles|l'annexe|l'état [a-d]\b)/.test(o)) return null;
  if (/^la motion (de rejet|d'ajournement|de renvoi|référendaire|tendant)/.test(o) || /^la motion/.test(o)) return "motion";
  if (/^(l'ensemble (de la|d'une) )?proposition de r[ée]solution/.test(o)) return "resolution";
  if (/^(l'ensemble|le projet|la proposition de loi|la (première|seconde|deuxième) partie)/.test(o)) return "texte";
  if (/r[ée]solution/.test(o)) return "resolution";
  if (/^la d[ée]claration/.test(o)) return "declaration";
  if (/^la demande/.test(o)) return "demande";
  return "autre";
}

/** Texte de l'objet sans « l'ensemble de » et sans la mention de lecture, avec une majuscule. */
export function titreCourt(objet) {
  let t = sansEspaces(objet).replace(/^sur /i, "").replace(/^l['’]ensemble (du|de la|de l['’]|des) ?/i, (m, a) => ({ du: "le ", "de la": "la ", des: "les " })[a.toLowerCase()] || "l’")
    .replace(/\s*\((première|deuxième|troisième|nouvelle|lecture définitive|texte de la commission mixte paritaire)[^)]*\)\.?$/i, "").replace(/\.$/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Premier signataire nommé dans l'objet (« déposée par M. X, Mme Y… », « de Mme Z »). */
export function premierSignataire(objet) {
  const m = sansEspaces(objet).match(/(?:\bpar|\bde) (MM\.|M\.|Mmes|Mme) ([A-ZÀ-Ý][^,()]*?)(?:,| et |\s+\(|\s+(?:tendant|visant|relative?|portant|en application|sur|à|au|aux|des|de la|du|de l['’])\s|\.|$)/);
  return m ? sansEspaces(m[2]) : "";
}

const normNom = (s) => sansEspaces(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Index des députés : identifiant → {nom, groupe}, et nom → groupe. */
export function indexDeputes(acteurs, sigleDe) {
  const parId = {}, parNom = {};
  for (const a of acteurs) {
    const id = a.uid && (a.uid["#text"] || a.uid), ident = a.etatCivil && a.etatCivil.ident;
    if (!id || !ident) continue;
    // groupe actuel, sinon le dernier groupe de la législature (député parti au Gouvernement, démission…)
    const mandats = liste(a.mandats && a.mandats.mandat);
    const gps = mandats.filter((m) => m.typeOrgane === "GP" && sigleDe(m.organes && m.organes.organeRef))
      .sort((x, y) => (!x.dateFin) - (!y.dateFin) || String(x.dateDebut).localeCompare(String(y.dateDebut)));
    const gp = gps.length ? sigleDe(gps[gps.length - 1].organes.organeRef) : mandats.some((m) => m.typeOrgane === "SENAT") ? "Sénat" : "";
    const nom = sansEspaces(`${ident.prenom} ${ident.nom}`);
    parId[id] = { nom, groupe: gp };
    parNom[normNom(nom)] = { nom, groupe: gp };
    const fam = normNom(ident.nom);
    parNom[fam] = parNom[fam] === undefined ? { nom, groupe: gp } : null; // nom de famille seul : seulement s'il est unique
  }
  return { parId, parNom };
}

/** Auteur : Gouvernement pour un projet, sinon le premier signataire et son groupe, ou le Sénat. */
export function auteurScrutin(s, dossier, deputes, categorie) {
  const objet = sansEspaces(s.objet && s.objet.libelle);
  const signataire = () => {
    const sig = premierSignataire(objet), d = sig && deputes.parNom[normNom(sig)];
    return sig ? [d ? d.nom : sig, d ? d.groupe : ""] : null;
  };
  // une motion ou une demande appartient à qui la dépose, pas à l'auteur du texte
  if (["motion", "censure", "demande"].includes(categorie)) { const r = signataire(); if (r || categorie === "censure") return r || ["", ""]; }
  if (categorie === "declaration") return ["Gouvernement", ""];
  if (dossier) {
    const proc = sansEspaces(dossier.procedureParlementaire && dossier.procedureParlementaire.libelle);
    const titre = sansEspaces(dossier.titreDossier && dossier.titreDossier.titre);
    if (/^projet/i.test(titre) || /^Projet (de loi|de ratification)|Engagement de la responsabilité/i.test(proc)) return ["Gouvernement", ""];
    for (const a of liste(dossier.initiateur && dossier.initiateur.acteurs && dossier.initiateur.acteurs.acteur)) {
      const d = deputes.parId[a.acteurRef];
      if (d) return [d.nom, d.groupe];
    }
    const organes = liste(dossier.initiateur && dossier.initiateur.organes && dossier.initiateur.organes.organe)
      .map((o) => (o.organeRef && (o.organeRef.uid || o.organeRef)));
    if (organes.includes("PO78718")) return ["Sénat", ""];
    const actes = liste(dossier.actesLegislatifs && dossier.actesLegislatifs.acteLegislatif);
    if (actes.length && /^SN/.test(actes[0].codeActe || "")) return ["Sénat", ""];
  }
  if (/\bprojet de loi\b/i.test(objet) && !/proposition de loi/i.test(objet)) return ["Gouvernement", ""];
  return signataire() || ["", ""];
}

/** Clé de rapprochement entre l'objet d'un scrutin et le titre d'un dossier législatif. */
export const cleTitre = (t) => normNom(titreCourt(t)).replace(/['’]/g, "'")
  .replace(/^(le|la|les|l')\s*/, "").replace(/^(projet|proposition) de loi (organique |constitutionnelle )?/, "")
  .replace(/^(visant a |tendant a |relative? (a la |a l'|au |aux |a )|portant |pour |d'|de )/, "").replace(/[^a-z0-9' ]/g, "").trim();

/** Lignes des deux onglets pour un scrutin retenu. */
export function lignesScrutin(s, ctx) {
  const cat = categorieScrutin(s);
  if (!cat) return null;
  // dossier législatif : référence fournie, sinon rapprochement par le titre du texte
  let dref = s.objet && s.objet.dossierLegislatif && s.objet.dossierLegislatif.dossierRef;
  if (!dref && cat === "texte" && ctx.parTitre) dref = ctx.parTitre[cleTitre(s.objet && s.objet.libelle)] || null;
  const dossier = dref ? ctx.dossiers[dref] : null;
  const [auteur, groupe] = auteurScrutin(s, dossier, ctx.deputes, cat);
  const dc = (s.syntheseVote && s.syntheseVote.decompte) || {};
  const type = { MOC: "motion de censure", SPS: "scrutin solennel" }[s.typeVote && s.typeVote.codeTypeVote] || "scrutin ordinaire";
  const sort = /adopt/i.test(s.sort && s.sort.code) ? "adopté" : "rejeté";
  // Une motion de censure ne compte que les voix « pour » (majorité absolue des députés).
  const ligne = [+s.numero, s.dateScrutin, type, cat, titreCourt(s.objet && s.objet.libelle), sansEspaces(s.objet && s.objet.libelle),
    auteur, groupe, sort, nombre(dc.pour), nombre(dc.contre), nombre(dc.abstentions), nombre(s.syntheseVote && s.syntheseVote.nombreVotants),
    `https://www.assemblee-nationale.fr/dyn/${LEGISLATURE}/scrutins/${s.numero}`, dref ? `https://www.assemblee-nationale.fr/dyn/${LEGISLATURE}/dossiers/${dref}` : ""];
  const groupes = liste(s.ventilationVotes && s.ventilationVotes.organe && s.ventilationVotes.organe.groupes && s.ventilationVotes.organe.groupes.groupe)
    .map((g) => {
      const sigle = ctx.sigleDe(g.organeRef);
      if (!sigle) return null;
      const v = g.vote || {}, d = v.decompteVoix || {};
      return [+s.numero, sigle, v.positionMajoritaire || "", nombre(d.pour), nombre(d.contre), nombre(d.abstentions),
        nombre(d.nonVotants) + nombre(d.nonVotantsVolontaires), nombre(g.nombreMembresGroupe)];
    }).filter(Boolean);
  return { ligne, groupes };
}

export function construireSigles(organes) {
  const sigles = { ...GROUPES_ANCIENS };
  for (const o of organes) {
    if (o.codeType !== "GP") continue;
    const id = o.uid && (o.uid["#text"] || o.uid);
    sigles[id] = SIGLES[o.libelleAbrev] || o.libelleAbrev;
  }
  return (ref) => sigles[ref] || "";
}

const lireDossier = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(d, f), "utf8"))) : []);

export function importer(racine) {
  const organes = lireDossier(path.join(racine, "amo/json/organe")).map((x) => x.organe);
  const sigleDe = construireSigles(organes);
  const deputes = indexDeputes(lireDossier(path.join(racine, "amo/json/acteur")).map((x) => x.acteur), sigleDe);
  const dossiers = {};
  for (const x of lireDossier(path.join(racine, "dossiers/json/dossierParlementaire"))) dossiers[x.dossierParlementaire.uid] = x.dossierParlementaire;
  const parTitre = {};
  for (const [uid, d] of Object.entries(dossiers)) parTitre[cleTitre(d.titreDossier && d.titreDossier.titre)] = uid;
  const ctx = { sigleDe, deputes, dossiers, parTitre }, scrutins = [ENTETE_SCRUTINS], groupes = [ENTETE_SCRUTINS_GROUPES];
  const tous = lireDossier(path.join(racine, "scrutins/json")).map((x) => x.scrutin).sort((a, b) => b.numero - a.numero);
  // les votes sur les amendements et les articles citent le texte et donnent souvent la référence du dossier
  for (const s of tous) {
    const dref = s.objet && s.objet.dossierLegislatif && s.objet.dossierLegislatif.dossierRef;
    const m = dref && sansEspaces(s.objet.libelle).match(/\b(?:du|de la|de l['’]) ((?:projet|proposition) de loi.*)$/i);
    if (m && !parTitre[cleTitre(m[1])]) parTitre[cleTitre(m[1])] = dref;
  }
  for (const s of tous) {
    const r = lignesScrutin(s, ctx);
    if (!r) continue;
    scrutins.push(r.ligne);
    groupes.push(...r.groupes);
  }
  return { version: 1, genere_le: new Date().toISOString(), source: "Assemblée nationale, open data (scrutins, députés, dossiers législatifs)", onglets: { scrutins, scrutins_groupes: groupes } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const racine = process.argv[2], sortie = process.argv[3] || "data/scrutins.json";
  if (!racine) { console.error("Usage : node scripts/importer-scrutins.mjs <dossier> [sortie]"); process.exit(1); }
  const r = importer(racine);
  fs.writeFileSync(sortie, JSON.stringify(r));
  console.log(`${r.onglets.scrutins.length - 1} scrutins, ${r.onglets.scrutins_groupes.length - 1} positions de groupes → ${sortie}`);
}
