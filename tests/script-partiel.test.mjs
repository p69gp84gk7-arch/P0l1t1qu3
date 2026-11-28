// Script collé en partie (Code.gs seul) : les autres fichiers sont lus sur GitHub au lieu de manquer.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const lire = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

function environnement() {
  const journal = [], appels = [];
  const ctx = {
    console, Date, JSON,
    UrlFetchApp: { fetch(url) {
      appels.push(url);
      const chemin = url.replace(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/main\//, "").replace(/\?.*$/, "");
      const ok = fs.existsSync(new URL(`../${chemin}`, import.meta.url));
      return { getResponseCode: () => (ok ? 200 : 404), getContentText: () => (ok ? lire(chemin) : "") };
    } },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
  };
  vm.createContext(ctx);
  vm.runInContext(lire("apps-script/Code.gs"), ctx);
  // fonctions du classeur remplacées par des versions de test
  ctx.parametre = () => null;
  ctx.journal = (a, d) => journal.push([a, d]);
  return { ctx, journal, appels };
}

test("Code.gs seul : le lecteur Wikipédia vient de GitHub", () => {
  const { ctx, appels } = environnement();
  assert.equal(typeof ctx.wikiSondagesPremierTour, "undefined");
  const W = ctx.lecteurWikipedia();
  assert.equal(W.source, "GitHub");
  assert.ok(appels.some((u) => u.includes("/apps-script/Wikipedia.gs")));
  const wiki = lire("tests/fixtures/wikipedia-extrait.wiki");
  const P = W.premier(wiki, { candidats: [{ cle: "rn", nom: "Le Pen", alias: "Le Pen;Bardella" }, { cle: "melenchon", nom: "Mélenchon" }], depuis: "2026-01-01" });
  assert.ok(P.length > 0 && P.every((p) => p.s.rn != null));
});

test("Code.gs seul : la recopie des données quotidiennes vient aussi de GitHub", () => {
  const { ctx, journal } = environnement();
  const f = ctx.fonctionGitHub(["apps-script/DonneesGitHub.gs"], "donneesGitHubMiseAJour");
  assert.equal(typeof f, "function");
  ctx.signalerScriptIncomplet();
  assert.ok(journal.some(([a, d]) => a === "script incomplet" && /A-COLLER-dans-Apps-Script\.gs EN ENTIER/.test(d)));
});

test("sans GitHub et sans lecteur installé : message clair", () => {
  const { ctx } = environnement();
  ctx.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 503, getContentText: () => "" }) };
  assert.throws(() => ctx.lecteurWikipedia(), /recoller apps-script\/A-COLLER-dans-Apps-Script\.gs en entier/);
});
