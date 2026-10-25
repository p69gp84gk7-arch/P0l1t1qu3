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
