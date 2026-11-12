// Vérifie que les onglets (data/snapshot.json) redonnent exactement les données de la page d'origine.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { AJOUTS_MEDIAS, AJOUTS_INSTITUTS, RENOMMAGES_MEDIAS } from "../scripts/ajouts-medias-instituts.mjs";

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

// Candidats 2027 : ceux de la page d'origine, avec les changements faits depuis (Marine Le Pen redevenue éligible
// en juillet 2026 : « Le Pen / Bardella » devient « Le Pen »), plus les personnalités ajoutées depuis.
const C27_CHANGES = { rn: { n: "Le Pen", s: undefined } };
const c27Attendus = (C) => Object.fromEntries(Object.entries(plain(C)).map(([k, v]) => [k, plain({ ...v, ...(C27_CHANGES[k] || {}) })]));
const c27Origine = (C) => Object.fromEntries(Object.entries(plain(C)).filter(([k]) => k in ORIG.C27));

test("candidats, élections et résultats", () => {
  assert.deepEqual(c27Origine(M.C27), c27Attendus(ORIG.C27));
  for (const k of ["lagarde", "polony", "riner", "ruffin"]) assert.ok(M.C27[k], k);
  for (const y of ["2017", "2022", "2027"]) {
    const a = M.ERAS[y], b = ORIG.ERAS[y];
    for (const k of ["title", "start", "end", "live", "note", "take"]) assert.equal(a[k] ?? false, b[k] ?? false, `${y}.${k}`);
    assert.deepEqual([...a.visible].sort(), [...b.visible].sort());
    if (y === "2027") assert.deepEqual(c27Origine(a.C), c27Attendus(b.C));
    else assert.deepEqual(plain(a.C), plain(b.C));
    // la page d'origine, plus les médias et instituts ajoutés depuis (scripts/ajouts-medias-instituts.mjs)
    const instAjoutes = new Set(AJOUTS_INSTITUTS.filter((r) => r[0] === y).map((r) => r[2]));
    assert.deepEqual(plain(a.inst).filter((i) => !instAjoutes.has(i.k)), plain(b.inst).map((i) => ({ ...i, bill: !!i.bill })));
    for (const k of instAjoutes) assert.ok(a.inst.some((i) => i.k === k), k);
    const medAjoutes = new Set(AJOUTS_MEDIAS.filter((r) => r[0] === y).map((r) => r[2]));
    const renomme = Object.fromEntries(RENOMMAGES_MEDIAS.filter((r) => r[0] === y).map((r) => [r[2], r[1]]));
    const sansAjouts = (g) => ({ ...g, d: g.d || undefined, m: g.m.filter((x) => !medAjoutes.has(x[0])).map((x) => [renomme[x[0]] || x[0], ...x.slice(1)]) });
    const groupesOrig = new Set(plain(b.media).map((g) => g.o));
    assert.deepEqual(plain(a.media).filter((g) => groupesOrig.has(g.o)).map(sansAjouts), plain(b.media).map((g) => ({ ...g, d: g.d || undefined })));
    for (const n of medAjoutes) assert.ok(a.media.some((g) => g.m.some((x) => x[0] === n)), n);
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
    const orig = plain(ORIG.AGE[y]);
    // abstention 2022 corrigée d'après le rapport Ipsos-Sopra Steria (35-49 ans : 23 %, 70 ans et plus : 24 %)
    if (y === "2022") orig.abst = [42, 46, 23, 20, 12, 24];
    assert.deepEqual(age, orig);
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
  // même calcul, limité aux sondages connus de la page d'origine (les suivants font évoluer les moyennes)
  const fin = ORIG.RAW.p27.reduce((m, p) => (p.d > m ? p.d : m), "");
  const lignes = snap.onglets.second_tour, h = lignes[0], iE = h.indexOf("election"), iD = h.indexOf("date");
  const avant = lignes.slice(1).filter((r) => String(r[iE]) === "2027" && String(r[iD]).slice(0, 10) <= fin)
    .map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
  const r2 = ctx.duels2027(avant);
  const nom = (k) => ({ "le-pen": "le pen", melenchon: "melenchon", philippe: "philippe", attal: "attal", glucksmann: "glucksmann", hollande: "hollande", retailleau: "retailleau" })[k];
  const sa = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  for (const o of ORIG.RAW.r2_27) {
    const m = r2.find((d) => [sa(d.a), sa(d.b)].sort().join() === [nom(o.a), nom(o.b)].sort().join());
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
  assert.deepEqual(plain(M.AGE["2022"].votants.votants), [8.8, 10.8, 23.6, 17.9, 18.3, 20.7]);
  // contrôle : la participation recalculée reste proche de la participation officielle
  for (const y of ["2017", "2022"]) {
    const V = M.AGE[y].votants, off = V.nbVotants / V.nbInscrits * 100;
    assert.ok(Math.abs(V.calc - off) < 1, `${y} : ${V.calc} contre ${off}`);
  }
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

test("justice : affaires rattachées aux candidats de chaque élection", () => {
  const J = M.JUSTICE;
  const lepen22 = J["2022"].lepen;
  assert.ok(lepen22.some((a) => a.id === "lepen-assistants-ue" && a.statut === "non_definitive" && a.inelig === 45));
  assert.ok(lepen22.some((a) => a.type === "parti"));
  assert.equal(J["2027"].rn.length, lepen22.length + 2); // + groupe ID et Bardella
  assert.equal(J["2017"].lr[0].statut, "definitive");
  assert.ok(J["2022"].zemmour.filter((a) => a.statut === "definitive").length >= 8);
  const statuts = new Set(["definitive", "non_definitive", "civile", "en_cours", "relaxe", "non_lieu", "classee"]);
  for (const y of Object.keys(J)) for (const L of Object.values(J[y])) for (const a of L) {
    assert.ok(statuts.has(a.statut), `${a.id} : ${a.statut}`);
    assert.ok(a.src && a.lien && /^\d{4}-\d\d-\d\d$/.test(a.date), a.id);
  }
});

test("financement : comptes de campagne 2017 et 2022 cohérents", () => {
  for (const y of ["2017", "2022"]) {
    const F = M.FINANCE[y];
    assert.equal(F.length, y === "2017" ? 11 : 12);
    for (const f of F) {
      const somme = f.apport + f.versements + f.contributions + f.dons + f.autres + f.concours;
      assert.ok(Math.abs(somme - f.recettes) <= 1, `${y} ${f.nom} : ${somme} contre ${f.recettes}`);
      assert.ok(f.etat > 0 && f.etat <= f.depenses, `${y} ${f.nom}`);
      assert.ok(M.ERAS[y].results.r1[f.cle] != null, `${y} ${f.cle} absent des résultats`);
    }
  }
  assert.equal(M.FINANCE["2022"][0].cle, "macron"); // tri par dépenses
  assert.ok(M.FINANCE["2027"].every((f) => f.depenses === null && f.com));
  assert.ok(M.JUSTICE["2022"].lepen.some((a) => a.id === "lepen-campagne-2022"));
});
