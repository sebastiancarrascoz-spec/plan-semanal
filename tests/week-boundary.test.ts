import { test } from "node:test";
import assert from "node:assert/strict";
import { seedPlan } from "../lib/engine.ts";
import { composeWeeklyMenu } from "../lib/kitchen.ts";
test("el domingo y el lunes siguiente no repiten el mismo almuerzo o cena automáticos", () => {
  const compose = composeWeeklyMenu;
  for (const diet of ["omnívoro", "vegano"] as const) {
    const plan = { ...seedPlan, diet };
    const a = compose(plan, 0, "2026-11-02"),
      b = compose(plan, 0, "2026-11-09");
    for (const slot of [2, 4])
      assert.notEqual(
        a.find((m) => m.day === 6 && m.slot === slot)?.recipeTitle,
        b.find((m) => m.day === 0 && m.slot === slot)?.recipeTitle,
      );
  }
});
