// Votes de l'Assemblée, ton de la presse, fiches des candidats et organigramme du pouvoir.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { categorieScrutin, titreCourt, premierSignataire, auteurScrutin, lignesScrutin, cleTitre } from "../scripts/importer-scrutins.mjs";
import { resumerTonalite, mediaDepuisUrl, nettoyerTitre, urlTonalite } from "../scripts/importer-tonalite.mjs";
import { lireCandidatures, dateDeclaration, texteSimple } from "../scripts/importer-candidatures.mjs";

const racine = new URL("../", import.meta.url);
const lire = (f) => fs.readFileSync(new URL(f, racine), "utf8");
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(lire("assets/donnees.js") + "\n;globalThis.construireModele=construireModele;", ctx);
const snap = JSON.parse(lire("data/snapshot.json"));
const plain = (x) => JSON.parse(JSON.stringify(x));

const scrutin = (libelle, extra = {}) => ({ numero: "12", dateScrutin: "2026-10-29", typeVote: { codeTypeVote: "SPO" }, objet: { libelle }, sort: { code: "adopté" },
  syntheseVote: { nombreVotants: "300", decompte: { pour: "200", contre: "90", abstentions: "10" } },
  ventilationVotes: { organe: { groupes: { groupe: [
    { organeRef: "PO1", nombreMembresGroupe: "121", vote: { positionMajoritaire: "contre", decompteVoix: { pour: "0", contre: "90", abstentions: "0", nonVotants: "1" } } },
    { organeRef: "PO2", nombreMembresGroupe: "70", vote: { positionMajoritaire: "pour", decompteVoix: { pour: "60", contre: "0", abstentions: "2", nonVotants: "0" } } },
  ] } } }, ...extra });

test("scrutins : seuls les votes importants sont gardés", () => {
  assert.equal(categorieScrutin(scrutin("l'amendement n° 18 de Mme X à l'article 2")), null);
  assert.equal(categorieScrutin(scrutin("l'amenedement n° 187 de M. Renault")), null);
  assert.equal(categorieScrutin(scrutin("l'article unique de la proposition de résolution")), null);
  assert.equal(categorieScrutin(scrutin("l'ensemble de la proposition de loi relative au droit à l'aide à mourir (lecture définitive).")), "texte");
  assert.equal(categorieScrutin(scrutin("la motion de censure déposée par Mme Marine Le Pen", { typeVote: { codeTypeVote: "MOC" } })), "censure");
  assert.equal(categorieScrutin(scrutin("la motion de rejet préalable, déposée par Mme Mathilde Panot, du projet de loi")), "motion");
  assert.equal(categorieScrutin(scrutin("l'ensemble de la proposition de résolution tendant à la création d'une commission d'enquête")), "resolution");
});

test("scrutins : titre, signataire et auteur", () => {
  assert.equal(titreCourt("l'ensemble de la proposition de loi relative au droit à l'aide à mourir (lecture définitive)."), "La proposition de loi relative au droit à l'aide à mourir");
  assert.equal(premierSignataire("la motion de censure, déposée en application de l'article 49, alinéa 2, de la Constitution, par Mme Mathilde Panot et 57 députés."), "Mathilde Panot");
  assert.equal(premierSignataire("la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par Mmes Cyrielle Chatelain, Mathilde Panot"), "Cyrielle Chatelain");
  assert.equal(cleTitre("l'ensemble de la proposition de loi visant à moderniser la gestion du patrimoine immobilier de l'État (texte de la commission mixte paritaire)."),
    cleTitre("Moderniser la gestion du patrimoine immobilier de l'État"));
  const deputes = { parId: { PA1: { nom: "Gabrielle Cathala", groupe: "LFI" } }, parNom: { "mathilde panot": { nom: "Mathilde Panot", groupe: "LFI" } } };
  const dossierPpl = { titreDossier: { titre: "Parcours de soins" }, procedureParlementaire: { libelle: "Proposition de loi ordinaire" }, initiateur: { acteurs: { acteur: { acteurRef: "PA1" } } } };
  const dossierPjl = { titreDossier: { titre: "Projet de loi de finances pour 2027" }, procedureParlementaire: { libelle: "Projet de loi de finances de l'année" } };
  assert.deepEqual(auteurScrutin(scrutin("l'ensemble de la proposition de loi"), dossierPpl, deputes, "texte"), ["Gabrielle Cathala", "LFI"]);
  assert.deepEqual(auteurScrutin(scrutin("la première partie du projet de loi de finances pour 2027"), dossierPjl, deputes, "texte"), ["Gouvernement", ""]);
  // la motion appartient à qui la dépose, pas à l'auteur du texte
  assert.deepEqual(auteurScrutin(scrutin("la motion de rejet préalable, déposée par Mme Mathilde Panot, du projet de loi de finances"), dossierPjl, deputes, "motion"), ["Mathilde Panot", "LFI"]);
});

test("scrutins : lignes des onglets", () => {
  const ctxS = { sigleDe: (r) => ({ PO1: "RN", PO2: "LFI" })[r] || "", deputes: { parId: {}, parNom: {} }, dossiers: {}, parTitre: {} };
  const r = lignesScrutin(scrutin("l'ensemble du projet de loi de finances pour 2027 (première lecture)."), ctxS);
  assert.deepEqual(r.ligne.slice(0, 13), [12, "2026-10-29", "scrutin ordinaire", "texte", "Le projet de loi de finances pour 2027",
    "l'ensemble du projet de loi de finances pour 2027 (première lecture).", "Gouvernement", "", "adopté", 200, 90, 10, 300]);
  assert.deepEqual(r.groupes, [[12, "RN", "contre", 0, 90, 0, 1, 121], [12, "LFI", "pour", 60, 0, 2, 0, 70]]);
});

test("scrutins : fichier quotidien lu par l'application", () => {
  const j = JSON.parse(lire("data/scrutins.json"));
  const M = ctx.construireModele({ onglets: { ...snap.onglets, ...j.onglets } });
  assert.ok(M.SCRUTINS.length > 300);
  const censure = M.SCRUTINS.filter((v) => v.cat === "censure");
  assert.ok(censure.some((v) => v.d === "2024-12-04" && v.sort === "adopté" && v.pour === 331), "censure du gouvernement Barnier");
  for (const v of M.SCRUTINS.slice(0, 20)) assert.ok(v.g.length >= 10, `${v.n} : positions des groupes`);
});

test("tonalité : résumé d'une réponse GDELT", () => {
  const r = resumerTonalite({ tonechart: [
    { bin: -5, count: 3, toparts: [{ url: "https://www.lemonde.fr/a", title: "Titre  très négatif , vraiment" }] },
    { bin: -1, count: 4, toparts: [] }, { bin: 0, count: 2, toparts: [] },
    { bin: 3, count: 1, toparts: [{ url: "https://m.lefigaro.fr/b", title: "Bonne nouvelle" }] },
  ] });
  assert.equal(r.articles, 10); assert.equal(r.negatifs, 3); assert.equal(r.positifs, 1); assert.equal(r.neutres, 6);
  assert.equal(r.ton, -1.6); // (-15 - 4 + 0 + 3) / 10
  assert.equal(r.exNeg[0].titre, "Titre très négatif, vraiment"); assert.equal(r.exNeg[0].media, "lemonde.fr");
  assert.equal(r.exPos[0].media, "lefigaro.fr");
  assert.equal(mediaDepuisUrl("https://amp.bfmtv.com/x"), "bfmtv.com");
  assert.equal(nettoyerTitre("Macron  : la fin"), "Macron : la fin");
  assert.match(urlTonalite("Marine Le Pen"), /query=%22Marine%20Le%20Pen%22%20sourcelang%3Afrench&mode=tonechart/);
  const M = ctx.construireModele({ onglets: { ...snap.onglets,
    tonalite: [["personnalite", "periode_debut", "periode_fin", "articles", "negatifs", "neutres", "positifs", "ton_moyen", "mis_a_jour"], ["X Y", "2026-10-08", "2026-11-07", "10", "3", "6", "1", "-1.4", "2026-11-07"]],
    tonalite_articles: [["personnalite", "sens", "ton", "titre", "media", "lien"], ["X Y", "négatif", "-5", "T", "lemonde.fr", "https://www.lemonde.fr/a"]] } });
  assert.deepEqual(plain(M.TONALITE), [{ nom: "X Y", debut: "2026-10-08", fin: "2026-11-07", n: 10, neg: 3, neu: 6, pos: 1, ton: -1.4,
    ex: [{ sens: "négatif", ton: -5, titre: "T", media: "lemonde.fr", lien: "https://www.lemonde.fr/a" }] }]);
});

test("fiches des candidats : une fiche pour chaque candidat de 2017 et 2022", () => {
  const M = ctx.construireModele(snap);
  for (const y of ["2017", "2022"]) {
    const res = Object.keys(M.ERAS[y].results.r1);
    for (const k of res) assert.ok(M.FICHES.some((f) => f.cand.some(([a, c]) => a === y && c === k)), `${y} ${k}`);
  }
  const lp = M.FICHES.find((f) => f.p === "lepen");
  assert.equal(lp.naissance, "1968-08-05");
  assert.ok(lp.photo.startsWith("https://") && lp.photoLic);
  assert.ok(lp.carriere.length >= 5);
  assert.deepEqual(plain(lp.elections.filter((e) => e.a === "2022").map((e) => e.score)), [23.15, 41.45]);
  // les scores de premier tour des fiches sont ceux de l'onglet résultats
  for (const f of M.FICHES) for (const e of f.elections.filter((e) => e.e === "Présidentielle" && e.tour === "1er tour" && ["2017", "2022"].includes(e.a))) {
    const k = f.cand.find(([a]) => a === e.a)[1];
    assert.equal(M.ERAS[e.a].results.r1[k], e.score, `${f.nom} ${e.a}`);
  }
});

test("organigramme : toutes les relations relient des cases existantes", () => {
  const M = ctx.construireModele(snap), cles = new Set(M.INSTIT.items.map((x) => x.cle));
  assert.ok(cles.has("president") && cles.has("assemblee") && cles.has("conseil_constitutionnel"));
  for (const l of M.INSTIT.liens) assert.ok(cles.has(l.de) && cles.has(l.vers), `${l.de} → ${l.vers}`);
});

test("candidatures : dates et lignes lues sur Wikipédia", () => {
  assert.equal(dateDeclaration("Il annonce sa candidature le {{date|9|11|2026}}, se positionnant"), "2026-11-09");
  assert.equal(dateDeclaration("Le {{date|8 décembre 2025}}, elle annonce sa candidature"), "2025-12-08");
  assert.equal(dateDeclaration("Il annonce sa candidature le 23/08/2026"), "2026-08-23");
  // une date de carrière avant l'annonce ne doit pas être prise
  assert.equal(dateDeclaration("Maire <small>(2008-2017)</small> {{date|24 septembre 2017}} ---- Il se déclare candidat le {{Date|24 septembre 2026}}"), "2026-09-24");
  assert.equal(dateDeclaration("Président de Renaissance (depuis décembre 2024)"), "");
  assert.equal(texteSimple("le {{date|2|10|2026}} à [[Paris|la capitale]]"), "le 2 octobre 2026 à la capitale");
  const wiki = `== Candidats déclarés ==
{| class="wikitable"
|-
! {{TriNom|Teddy|Riner}}<br>{{Âge|7|4|1989|18|04|2027}}<br>[[Indépendant (politique)|Sans étiquette]]
| ''Aucune''
| Il annonce sa candidature le {{date|9|11|2026}}, se positionnant « ni à droite, ni à gauche »<ref>x</ref>
|}
== Candidats pressentis ==
{| class="wikitable"
|-
! [[Christine Lagarde]]<br>{{Âge|1|1|1956|18|4|2027}}<br>[[Divers droite]]
| * Présidente de la BCE (depuis 2019)
|}
== Candidatures retirées ==
* [[Clémentine Autain]] ([[L'Après]]), députée. Elle la retire le 11 juillet 2026.
== Notes ==`;
  assert.deepEqual(lireCandidatures(wiki).slice(1).map((r) => r.slice(0, 4)), [
    ["déclaré", "Teddy Riner", "Sans étiquette", "2026-11-09"],
    ["pressenti", "Christine Lagarde", "Divers droite", ""],
    ["retiré", "Clémentine Autain", "L'Après", "2026-07-11"],
  ]);
  const j = JSON.parse(lire("data/declarations.json"));
  const M = ctx.construireModele({ onglets: { ...snap.onglets, ...j.onglets } });
  assert.ok(M.DECLARATIONS.filter((d) => d.statut === "déclaré").length >= 20);
  assert.ok(M.DECLARATIONS.some((d) => d.nom === "Teddy Riner" && d.date === "2026-11-09"));
});
