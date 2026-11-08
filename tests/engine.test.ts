import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seedPlan,
  generateMenu,
  generateShopping,
  swapFood,
  monday,
} from "../lib/engine.ts";
test("cada día respeta exactamente cada grupo y su distribución", () => {
  const menu = generateMenu(seedPlan);
  assert.equal(menu.length, 35);
  for (let day = 0; day < 7; day++)
    for (const g of seedPlan.groups) {
      assert.equal(
        menu
          .filter((m) => m.day === day)
          .flatMap((m) => m.foods)
          .filter((x) => x.food.group === g.name)
          .reduce((n, x) => n + x.portions, 0),
        g.daily,
      );
    }
});
test("filtra vegano y no repite la combinación consecutiva", () => {
  const m = generateMenu({ ...seedPlan, diet: "vegano" });
  assert.ok(
    m.every((x) => x.foods.every((f) => f.food.diets.includes("vegano"))),
  );
  for (let d = 1; d < 7; d++)
    for (let s = 0; s < 5; s++)
      assert.notEqual(
        JSON.stringify(m[d * 5 + s].foods),
        JSON.stringify(m[(d - 1) * 5 + s].foods),
      );
});
test("rechaza distribución y catálogo insuficientes", () => {
  assert.throws(() => generateMenu({ ...seedPlan, foods: [] }));
  assert.throws(() =>
    generateMenu({
      ...seedPlan,
      groups: [{ ...seedPlan.groups[0], daily: 8 }],
    }),
  );
});
test("compras suman cantidades y conservan unidades", () => {
  const meal = generateMenu(seedPlan)[0];
  const items = generateShopping([meal, meal]);
  for (const x of meal.foods)
    assert.equal(
      items.find((i) => i.name === x.food.name)?.quantity,
      2 * x.portions * x.food.quantity,
    );
});
test("intercambio conserva grupo y porciones, cena admite cero carbohidratos", () => {
  const m = generateMenu(seedPlan)[0];
  const changed = swapFood(m, m.foods[0].food.id, seedPlan);
  assert.equal(changed.foods[0].portions, m.foods[0].portions);
  assert.equal(changed.foods[0].food.group, m.foods[0].food.group);
  const p = structuredClone(seedPlan);
  p.groups[0].distribution = [3, 0, 3, 0, 0];
  assert.ok(
    generateMenu(p)
      .filter((m) => m.slot === 4)
      .every((m) => !m.foods.some((f) => f.food.group === "Carbohidratos")),
  );
});
test("la semana comienza el lunes también en domingo", () =>
  assert.equal(monday(new Date("2026-11-08T12:00:00")), "2026-11-02"));
