import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../apps-script/Wikipedia.gs", import.meta.url), "utf8"), ctx);
const wiki = fs.readFileSync(new URL("./fixtures/wikipedia-extrait.wiki", import.meta.url), "utf8");
const candidats = [
  { cle: "rn", nom: "Le Pen / Bardella", alias: "Le Pen;Bardella" }, { cle: "melenchon", nom: "Mélenchon" },
  { cle: "philippe", nom: "Philippe" }, { cle: "glucksmann", nom: "Glucksmann" }, { cle: "retailleau", nom: "Retailleau" },
  { cle: "attal", nom: "Attal" }, { cle: "lisnard", nom: "Lisnard" }, { cle: "zemmour", nom: "Zemmour" },
  { cle: "tondelier", nom: "Tondelier" }, { cle: "roussel", nom: "Roussel" }, { cle: "dupont-aignan", nom: "Dupont-Aignan" },
  { cle: "arthaud", nom: "Arthaud" },
];

test("dates de fin de terrain", () => {
  assert.equal(ctx.wikiDateFin("21-22 octobre", 2026), "2026-10-22");
  assert.equal(ctx.wikiDateFin("30 septembre-2 octobre", 2026), "2026-10-02");
  assert.equal(ctx.wikiDateFin("1er-3 octobre", 2026), "2026-10-03");
  assert.equal(ctx.wikiDateFin("28 décembre 2025-3 janvier 2026"), "2026-01-03");
  assert.equal(ctx.wikiDateFin("17-19 octobre 2026"), "2026-10-19");
  assert.equal(ctx.wikiDateFin("12-14 novembre", null, new Date("2026-10-25")), "2025-11-14");
});

test("nombres et noms d'instituts", () => {
  assert.equal(ctx.wikiNombre("0,5"), 0.5);
  assert.equal(ctx.wikiNombre("'''{{blanc|33,5}}'''"), 33.5);
  assert.equal(ctx.wikiNombre("<1"), 0.5);
  assert.equal(ctx.wikiNombre("—"), null);
  assert.equal(ctx.wikiInstitut("Harris-Interactive"), "Harris");
  assert.equal(ctx.wikiInstitut("Opinionway"), "OpinionWay");
});

test("premier tour : une ligne par sondage, hypothèse la plus complète", () => {
  const p = ctx.wikiSondagesPremierTour(wiki, { candidats, depuis: "2026-01-01" });
  assert.deepEqual([...p.map((x) => `${x.inst} ${x.d}`)], ["Ipsos 2026-10-22", "OpinionWay 2026-10-22"]);
  const ipsos = p[0];
  assert.equal(ipsos.n, 1500);
  assert.match(ipsos.url, /^https:\/\/www\.ipsos\.com\//);
  assert.equal(ipsos.s.rn, 33.5);
  assert.equal(ipsos.s.melenchon, 17);
  assert.equal(ipsos.s.attal, 4);
  const ow = p[1];
  assert.equal(ow.s.bouamrane, 0.5);
  assert.deepEqual([...ow.inconnus], ["Bouamrane"]);
});

test("second tour : duels des candidats déclarés", () => {
  const d = ctx.wikiSondagesSecondTour(wiki, new Date("2026-10-25"));
  assert.ok(d.length >= 2);
  const ifop = d.find((x) => x.inst === "Ifop");
  assert.deepEqual({ a: ifop.a, b: ifop.b, va: ifop.va, vb: ifop.vb, d: ifop.d }, { a: "Attal", b: "Le Pen", va: 42, vb: 58, d: "2026-10-19" });
});

test("doublons : même institut à 3 jours près", () => {
  assert.equal(ctx.wikiMemeSondage({ inst: "Harris-Interactive", d: "2026-10-21" }, { inst: "Harris", d: "2026-10-19" }), true);
  assert.equal(ctx.wikiMemeSondage({ inst: "Ifop", d: "2026-10-21" }, { inst: "Ifop", d: "2026-10-14" }), false);
});
