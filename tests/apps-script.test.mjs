import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { FICHIERS } from "../scripts/assembler-apps-script.mjs";

const lire = (f) => fs.readFileSync(new URL(`../apps-script/${f}`, import.meta.url), "utf8");

test("le fichier à coller est à jour", () => {
  const complet = lire("A-COLLER-dans-Apps-Script.gs");
  for (const f of FICHIERS) assert.ok(complet.includes(lire(f)), `${f} manque : relancer node scripts/assembler-apps-script.mjs`);
});

test("le manifeste autorise la mise à jour du script", () => {
  const m = JSON.parse(lire("appsscript.json"));
  for (const s of ["script.projects", "script.deployments", "script.external_request", "spreadsheets"]) {
    assert.ok(m.oauthScopes.some((x) => x.endsWith("/auth/" + s)), s);
  }
});

test("mise à jour du script : fusion des fichiers", () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(lire("MiseAJourScript.gs"), ctx);
  const actuels = [
    { name: "appsscript", type: "JSON", source: "{}" },
    { name: "Code", type: "SERVER_JS", source: "ancien code complet", functionSet: {} },
    { name: "Perso", type: "SERVER_JS", source: "function maFonction() {}" },
  ];
  const distants = [
    { name: "appsscript", type: "JSON", source: "{}" },
    { name: "Code", type: "SERVER_JS", source: "nouveau" },
    { name: "Wikipedia", type: "SERVER_JS", source: "wiki" },
  ];
  const r = JSON.parse(JSON.stringify(ctx.scriptFusionnerFichiers(actuels, distants)));
  assert.deepEqual(r.map((f) => f.name), ["appsscript", "Code", "Wikipedia", "Perso"]);
  assert.equal(r[1].source, "nouveau");
  assert.equal(r[1].functionSet, undefined);
  // deuxième passage : plus rien à changer
  assert.equal(ctx.scriptFusionnerFichiers(r, distants), null);
});

test("mise à jour du script : refuse des fichiers incomplets", () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(lire("MiseAJourScript.gs"), ctx);
  const ok = [
    { name: "appsscript", source: '{"timeZone":"Europe/Paris"}' },
    { name: "Code", source: lire("Code.gs") },
  ];
  assert.equal(ctx.scriptFichiersValides(ok), true);
  assert.equal(ctx.scriptFichiersValides([ok[0], { name: "Code", source: "404: Not Found ......................" }]), false);
  assert.equal(ctx.scriptFichiersValides([{ name: "appsscript", source: "<html>" }, ok[1]]), false);
});

test("la mise à jour du script récupère tous les fichiers du projet", () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(lire("MiseAJourScript.gs") + ";globalThis.L = FICHIERS_SCRIPT;", ctx);
  const noms = ctx.L.map((f) => f.chemin.replace("apps-script/", ""));
  for (const f of [...FICHIERS, "appsscript.json"]) assert.ok(noms.includes(f), f);
});

const patrimoine = () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(lire("Wikipedia.gs") + "\n" + lire("Patrimoine.gs"), ctx);
  return ctx;
};

test("patrimoine : montants calculés depuis une déclaration XML de la HATVP", () => {
  const ctx = patrimoine();
  const r = ctx.patrimoineDepuisXml(fs.readFileSync(new URL("fixtures/hatvp-dsp.xml", import.meta.url), "utf8"));
  // 50 % de 400 000 + 200 000 (le terrain vendu est exclu) + 10 000 + 25 000 + 1 500 - 500 + 8 000
  assert.equal(r.patrimoine, 444000);
  assert.equal(r.dettes, 122501);
  assert.deepEqual({ ...ctx.patrimoineDepuisXml("<declaration/>") }, { patrimoine: 0, dettes: 0 });
});

test("patrimoine : repère les déclarations des candidats dans la liste de la HATVP", () => {
  const ctx = patrimoine();
  const csv = [
    "civilite;prenom;nom;classement;type_mandat;qualite;type_document;departement;date_publication;date_depot;nom_fichier;url_dossier;open_data;statut_publication;id_origine;url_photo",
    "M.;Emmanuel;MACRON;x;president;Président de la République;dsp;;2022-05-16;2022-03-01;macron.pdf;/pages_nominatives/macron-emmanuel;;Livrée;;",
    "Mme;Marine;LE PEN;x;candidat;Candidate à l'élection présidentielle;dsp;;2027-03-10;2027-03-01;le-pen.pdf;/pages_nominatives/le-pen-marine;le-pen.xml;Livrée;;",
    "M.;Jean;DUPONT-AIGNAN;x;autre;Candidat à l'élection présidentielle;dsp;;2027-03-10;;nda.pdf;/p;;Livrée;;",
    "M.;Fabrice;ROUSSEL;x;depute;Député de la Loire-Atlantique;dsp;44;2027-02-01;;roussel.pdf;/p;roussel.xml;Livrée;;",
    "M.;Paul;MARTIN;x;candidat;Candidat à l'élection présidentielle;di;;2027-03-10;;di.pdf;/p;;Livrée;;",
  ].join("\n");
  const d = ctx.hatvpDeclarationsCandidats(ctx.hatvpCsv(csv), "2027-01-01");
  assert.deepEqual([...d.map((r) => r.nom)], ["LE PEN", "DUPONT-AIGNAN"]);
  assert.equal(d[0].open_data, "le-pen.xml");
  assert.equal(ctx.patrimoineNomPropre("DUPONT-AIGNAN"), "Dupont-Aignan");
  assert.equal(ctx.patrimoineNomPropre("LE PEN"), "Le Pen");
  const candidats = [
    { election: "2027", cle: "rn", nom: "Le Pen / Bardella", nom_court: "Le Pen", alias_wikipedia: "Le Pen;Bardella" },
    { election: "2027", cle: "melenchon", nom: "Mélenchon", nom_court: "", alias_wikipedia: "Mélenchon" },
  ];
  assert.equal(ctx.patrimoineCle(candidats, "2027", "LE PEN"), "rn");
  assert.equal(ctx.patrimoineCle(candidats, "2027", "MELENCHON"), "melenchon");
  assert.equal(ctx.patrimoineCle(candidats, "2027", "VILLEPIN"), "villepin");
});
