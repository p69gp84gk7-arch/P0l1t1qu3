import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lire = (f) => fs.readFileSync(new URL(`../apps-script/${f}`, import.meta.url), "utf8");

test("le fichier à coller est à jour", () => {
  const complet = lire("A-COLLER-dans-Apps-Script.gs");
  assert.ok(complet.includes(lire("Code.gs")) && complet.includes(lire("Wikipedia.gs")),
    "relancer : node scripts/assembler-apps-script.mjs");
});
