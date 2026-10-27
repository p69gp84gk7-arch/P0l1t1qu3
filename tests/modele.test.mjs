// Vérifie que les onglets (data/snapshot.json) redonnent exactement les données de la page d'origine.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const racine = new URL("../", import.meta.url);
const lire = (f) => fs.readFileSync(new URL(f, racine), "utf8");

// Données de la page d'origine
const L = lire("archive/page-originale.html").split("\n");
const bloc = (name) => {
  const i = L.findIndex((l) => l.startsWith(`const ${name}=`));
  let j = i;
  while (!/^\s*\};?\s*$|;\s*$/.test(L[j])) j++;
  return L.slice(i, j + 1).join("\n");
};
const ORIG = vm.runInNewContext([L.slice(382, 712).join("\n"), bloc("TVAGE"), bloc("AN"), bloc("MTYPE"), bloc("MOWN"),
  "({RAW,AGE,POPAGE,SV,PUB,C27,C22,C17,POPC,POPN,ERAS,TVAGE,AN,MTYPE,MOWN,INST27,MEDIA22,EDGES17,LEFT27,RIGHT22})"].join("\n"));

// Modèle reconstruit à partir des onglets
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(lire("assets/donnees.js") + "\n;globalThis.construireModele=construireModele;", ctx);
const snap = JSON.parse(lire("data/snapshot.json"));
const M = ctx.construireModele(snap);
const plain = (x) => JSON.parse(JSON.stringify(x));

const sansAjouts = (polls) => polls.filter((p) => !/wikip/i.test(p.source || ""));
const normPoll = (C) => (p) => ({
  inst: p.inst, d: p.d, n: p.n || null, url: p.url || "", s: Object.fromEntries(Object.entries(p.s).sort()),
  names: Object.fromEntries(Object.entries(p.names || {}).filter(([k]) => C[k] && C[k].s)),
});

test("sondages 2017 et 2022 identiques", () => {
  for (const [y, C] of [["17", ORIG.C17], ["22", ORIG.C22]]) {
    assert.deepEqual(plain(M.RAW["p" + y]).map(normPoll(C)), plain(ORIG.RAW["p" + y]).map(normPoll(C)));
    assert.deepEqual(plain(M.RAW["d" + y]), plain(ORIG.RAW["d" + y]));
  }
});

test("sondages 2027 : ceux de la page d'origine, plus les ajouts Wikipédia", () => {
  const ajoutes = snap.onglets.sondages_2027.slice(1).filter((r) => r[snap.onglets.sondages_2027[0].indexOf("source")] === "Wikipédia (auto)").length;
  assert.equal(M.RAW.p27.length, ORIG.RAW.p27.length + ajoutes);
  const orig = plain(ORIG.RAW.p27).map(normPoll(ORIG.C27));
  const model = plain(M.RAW.p27).map(normPoll(ORIG.C27));
  for (const p of orig) assert.ok(model.some((q) => JSON.stringify(q) === JSON.stringify(p)), `${p.inst} ${p.d}`);
});

test("candidats, élections et résultats", () => {
  assert.deepEqual(plain(M.C27), plain(ORIG.C27));
  for (const y of ["2017", "2022", "2027"]) {
    const a = M.ERAS[y], b = ORIG.ERAS[y];
    for (const k of ["title", "start", "end", "live", "note", "take"]) assert.equal(a[k] ?? false, b[k] ?? false, `${y}.${k}`);
    assert.deepEqual([...a.visible].sort(), [...b.visible].sort());
    assert.deepEqual(plain(a.C), plain(b.C));
    assert.deepEqual(plain(a.inst), plain(b.inst).map((i) => ({ ...i, bill: !!i.bill })));
    assert.deepEqual(plain(a.media).map((g) => ({ ...g, d: g.d || undefined })), plain(b.media).map((g) => ({ ...g, d: g.d || undefined })));
    assert.deepEqual(plain(a.left).map((x) => x.slice(0, 2)), plain(b.left).map((x) => x.slice(0, 2)));
    assert.deepEqual(plain(a.right), plain(b.right));
    assert.deepEqual(plain(a.edges), plain(b.edges));
    if (b.results) assert.deepEqual(plain(a.results), plain(b.results));
  }
});

test("popularité, âges, Assemblée, audiences", () => {
  for (const y of ["2017", "2022", "2027"]) {
    assert.deepEqual(plain(M.RAW.pop[y].pres), plain(ORIG.RAW.pop[y].pres));
    assert.deepEqual(plain(M.RAW.pop[y].pm), plain(ORIG.RAW.pop[y].pm));
    const { votants, ...age } = plain(M.AGE[y]);
    assert.deepEqual(age, plain(ORIG.AGE[y]));
  }
  const cand = Object.fromEntries(Object.entries(ORIG.RAW.pop["2027"].cand).map(([k, o]) => [k, Object.fromEntries(Object.entries(o).map(([m, v]) => ["2026-" + m, v]))]));
  assert.deepEqual(plain(M.RAW.pop["2027"].cand), cand);
  assert.deepEqual(plain(M.POPAGE), plain(ORIG.POPAGE));
  assert.deepEqual(plain(M.POPN), plain(ORIG.POPN));
  assert.deepEqual(plain(M.AN), plain(ORIG.AN));
  assert.deepEqual(plain(M.TVAGE), plain(ORIG.TVAGE));
  assert.deepEqual(plain(M.MTYPE), plain(ORIG.MTYPE));
  assert.deepEqual(plain(M.MOWN), plain(ORIG.MOWN));
  assert.deepEqual(plain(M.PUB), plain(ORIG.PUB));
});

test("citations", () => {
  assert.deepEqual(plain(M.SV.per), plain(ORIG.SV.per));
  const sansVides = (c) => ({ ...c, cir: Object.fromEntries(Object.entries(c.cir || {}).filter(([, v]) => Object.keys(v).length)) });
  assert.deepEqual(plain(M.SV.c).map(sansVides), plain(ORIG.SV.c).map(sansVides));
});

test("duels de second tour 2027 proches de la page d'origine", () => {
  const nom = (k) => ({ "le-pen": "le pen", melenchon: "melenchon", philippe: "philippe", attal: "attal", glucksmann: "glucksmann", hollande: "hollande", retailleau: "retailleau" })[k];
  const sa = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  for (const o of ORIG.RAW.r2_27) {
    const m = M.RAW.r2_27.find((d) => [sa(d.a), sa(d.b)].sort().join() === [nom(o.a), nom(o.b)].sort().join());
    assert.ok(m, `${o.a}-${o.b}`);
    const va = sa(m.a) === nom(o.a) ? m.avgA : m.avgB;
    assert.ok(Math.abs(va - o.avgA) <= 1, `${o.a}-${o.b} : ${va} contre ${o.avgA}`);
  }
});

test("part des votants par âge : inscrits × participation, ramenée à 100", () => {
  for (const y of ["2017", "2022"]) {
    const V = M.AGE[y].votants;
    assert.ok(V, y);
    assert.equal(V.inscrits.length, M.AGE[y].groups.length);
    assert.ok(Math.abs(V.votants.reduce((a, b) => a + b, 0) - 100) <= 0.2, y);
  }
  assert.deepEqual(plain(M.AGE["2022"].votants.votants), [8.7, 10.6, 23.6, 17.8, 18.4, 20.8]);
  assert.equal(M.AGE["2027"].votants, null);
});

test("patrimoine : classement par année sur patrimoine déclaré + fortune estimée", () => {
  const p22 = M.PATRI["2022"];
  assert.equal(p22.length, 12);
  assert.deepEqual([...p22.slice(0, 3).map((x) => x.cle)], ["lr", "zemmour", "nda"]);
  assert.equal(p22[0].total, 6187432 + 2200000);
  for (let i = 1; i < p22.length; i++) assert.ok(p22[i - 1].total >= p22[i].total);
  assert.equal(p22.find((x) => x.cle === "lepen").net, 2005980 - 10869681);
  const p17 = M.PATRI["2017"];
  assert.equal(p17.length, 11);
  assert.ok(p17.every((x) => x.total > 0 && x.com));
  assert.deepEqual([...p17.slice(0, 3).map((x) => x.cle)], ["nda", "asselineau", "melenchon"]);
  assert.equal(p17.find((x) => x.cle === "melenchon").net, null); // dettes non publiées
  assert.equal(p17.find((x) => x.cle === "lr").net, 974888 - 80000);
  assert.equal(M.PATRI["2027"], undefined);
});
