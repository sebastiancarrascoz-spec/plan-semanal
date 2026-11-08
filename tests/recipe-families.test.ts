import { test } from "node:test";
import assert from "node:assert/strict";
import { seedPlan, foodForMeal } from "../lib/engine.ts";
import { recipeOptions, composeWeeklyMenu } from "../lib/kitchen.ts";
import { periodShopping } from "../lib/purchases.ts";
const date = "2026-11-09";
test("opciones veganas y omnívoras ofrecen familias culinarias distintas", () => {
  for (const diet of ["vegano", "omnívoro"] as const) {
    const p = { ...seedPlan, diet };
    const opts = recipeOptions(p, 2, [], [], date);
    assert.equal(opts.length, 3);
    assert.equal(new Set(opts.map((x) => x.meal.recipeKind)).size, 3);
    assert.ok(
      opts.every((o) =>
        o.meal.foods.every((x) => foodForMeal(x.food, p, 2).compatible),
      ),
    );
  }
});
test("el filtro muestra guisos y conserva las porciones del plan", () => {
  const options = recipeOptions(seedPlan, 2, [], [], date, "guiso");
  assert.ok(options.length > 0);
  for (const o of options) {
    assert.equal(o.meal.recipeKind, "guiso");
    assert.ok(o.title.startsWith("Guiso de "));
    for (const g of seedPlan.groups)
      assert.equal(
        o.meal.foods
          .filter((x) => x.food.group === g.name)
          .reduce((n, x) => n + x.portions, 0),
        g.distribution[2],
      );
  }
});
test("la minuta asigna platos con título y evita repetir el plato principal en días consecutivos", () => {
  const meals = composeWeeklyMenu(seedPlan);
  assert.equal(meals.length, 35);
  for (const slot of [2, 4]) {
    const mains = meals.filter((m) => m.slot === slot);
    assert.ok(mains.every((m) => m.recipeTitle && m.recipeKind));
    for (let i = 1; i < mains.length; i++)
      assert.notEqual(mains[i].recipeTitle, mains[i - 1].recipeTitle);
  }
  for (let day = 0; day < 7; day++)
    for (const g of seedPlan.groups)
      assert.equal(
        meals
          .filter((m) => m.day === day)
          .flatMap((m) => m.foods)
          .filter((x) => x.food.group === g.name)
          .reduce((n, x) => n + x.portions, 0),
        g.daily,
      );
});
test("los pasos de guiso y salteado describen métodos distintos usando los alimentos asignados", () => {
  const stew = recipeOptions(seedPlan, 2, [], [], date, "guiso")[0];
  const stir = recipeOptions(seedPlan, 2, [], [], date, "salteado")[0];
  assert.ok(stew.steps.some((s) => s.includes("consistencia de un guiso")));
  assert.ok(stir.steps.some((s) => s.includes("sartén")));
  assert.notDeepEqual(stew.steps, stir.steps);
});
test("las compras proyectadas pueden usar la misma minuta culinaria de la app", () => {
  const menu = composeWeeklyMenu(seedPlan);
  const a = periodShopping(seedPlan, { [date]: menu }, date, 7);
  const b = periodShopping(seedPlan, {}, date, 7, () => menu);
  assert.deepEqual(a.items, b.items);
});
test("otra minuta rota preparaciones sin alterar las porciones", () => {
  const first = composeWeeklyMenu(seedPlan, 0),
    next = composeWeeklyMenu(seedPlan, 1);
  assert.notDeepEqual(first, next);
  for (const slot of [2, 4])
    assert.equal(
      next
        .find((m) => m.slot === slot)!
        .foods.filter((x) => x.food.group === "Proteínas")
        .reduce((n, x) => n + x.portions, 0),
      seedPlan.groups.find((g) => g.name === "Proteínas")!.distribution[slot],
    );
});
