import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seedPlan,
  generateMenu,
  foodCompatibility,
  type Food,
  type Plan,
  type Meal,
  replaceFood,
} from "../lib/engine.ts";
import {
  recipeOptions,
  consumeIngredients,
  consumeMeal,
  undoKitchenEvent,
  batchFits,
  prepareBatch,
  kitchenPurchaseForecast,
  validateLot,
  type PantryLot,
} from "../lib/kitchen.ts";
import { initial, migrateState, toggleMealLog } from "../lib/state.ts";
const date = "2026-11-09";
const food = (id: string) => seedPlan.foods.find((f) => f.id === id)!;
const lot = (
  f: Food,
  quantity: number,
  expiresOn = "2026-12-31",
  id = f.id,
): PantryLot =>
  validateLot({
    id,
    foodId: f.id,
    foodName: f.name,
    planUnit: f.unit,
    quantity,
    unit: f.unit,
    planUnitsPerUnit: 1,
    location: "despensa",
    addedOn: "2026-11-01",
    expiresOn,
  });
test("tres opciones distintas conservan grupos, porciones y restricciones de cada comida", () => {
  const p: Plan = {
    ...seedPlan,
    diet: "vegano",
    restrictions: ["gluten", "soya", "frutos_secos"],
  };
  const opts = recipeOptions(p, 2, [], [], date);
  assert.equal(opts.length, 3);
  assert.equal(new Set(opts.map((o) => JSON.stringify(o.meal.foods))).size, 3);
  for (const o of opts) {
    assert.ok(
      o.meal.foods.every((x) => foodCompatibility(x.food, p).compatible),
    );
    for (const g of p.groups)
      assert.equal(
        o.meal.foods
          .filter((x) => x.food.group === g.name)
          .reduce((n, x) => n + x.portions, 0),
        g.distribution[2],
      );
  }
});
test("prioriza una receta cuyos ingredientes figuran en cantidad suficiente", () => {
  const base = recipeOptions(seedPlan, 2, [], [], date)[0];
  const pantry = base.meal.foods.map((x) =>
    lot(x.food, x.food.quantity * x.portions),
  );
  const chosen = recipeOptions(seedPlan, 2, pantry, [], date)[0];
  assert.equal(chosen.covered, chosen.total);
  assert.equal(chosen.missing.length, 0);
});
test("consumo usa primero lo que vence antes y nunca usa lotes vencidos o futuros", () => {
  const f = food("avena"),
    meal: Meal = {
      id: "x",
      day: 0,
      slot: 0,
      foods: [{ food: f, portions: 2 }],
    };
  const lots = [
    lot(f, 50, "2026-11-30", "later"),
    lot(f, 30, "2026-11-10", "soon"),
    lot(f, 100, "2026-11-08", "expired"),
    { ...lot(f, 100, "2026-11-30", "future"), addedOn: "2026-11-10" },
  ];
  const r = consumeIngredients(meal, lots, date);
  assert.equal(r.pantry.find((x) => x.id === "soon")?.quantity, 0);
  assert.equal(r.pantry.find((x) => x.id === "later")?.quantity, 20);
  assert.equal(r.pantry.find((x) => x.id === "expired")?.quantity, 100);
  assert.equal(r.pantry.find((x) => x.id === "future")?.quantity, 100);
  assert.equal(r.event.missing.length, 0);
  assert.equal(lots[0].quantity, 50);
});
test("un registro incompleto descuenta lo disponible sin crear stock negativo", () => {
  const f = food("avena"),
    meal: Meal = {
      id: "x",
      day: 0,
      slot: 0,
      foods: [{ food: f, portions: 2 }],
    };
  const r = consumeIngredients(meal, [lot(f, 20)], date);
  assert.equal(r.pantry[0].quantity, 0);
  assert.equal(r.event.missing[0].quantity, 40);
});
test("marcar y desmarcar una comida conserva el registro y revierte el descuento", () => {
  const s = initial();
  s.menus = { "2026-11-09": generateMenu(s.plan) };
  const m = s.menus["2026-11-09"][0];
  s.pantry = m.foods.map((x) => lot(x.food, x.food.quantity * x.portions));
  const original = s.pantry.reduce((n, x) => n + x.quantity, 0);
  const marked = toggleMealLog(s, date + "-meal-0");
  assert.equal(marked.checks[date + "-meal-0"], true);
  assert.ok(marked.pantry.every((l) => l.quantity === 0));
  const undo = toggleMealLog(marked, date + "-meal-0");
  assert.equal(undo.checks[date + "-meal-0"], false);
  assert.equal(
    undo.pantry.reduce((n, x) => n + x.quantity, 0),
    original,
  );
  assert.equal(Object.keys(undo.kitchenEvents).length, 0);
});
test("preparar varias porciones descuenta una vez y consumir una preparada no vuelve a gastar ingredientes", () => {
  const m = generateMenu(seedPlan).find((m) => m.day === 0 && m.slot === 2)!;
  const pantry = m.foods.map((x) =>
    lot(x.food, x.food.quantity * x.portions * 3),
  );
  const r = prepareBatch(m, pantry, {
    name: "Plato de prueba",
    servings: 3,
    location: "congelador",
    preparedOn: date,
    expiresOn: "2026-11-20",
  });
  assert.ok(r.pantry.every((l) => l.quantity === 0));
  const meal = { ...m, preparedBatchId: r.batch.id };
  const used = consumeMeal(meal, r.pantry, [r.batch], seedPlan, date);
  assert.equal(used.batches[0].servings, 2);
  assert.equal(used.event.moves.length, 0);
  const undo = undoKitchenEvent(used.pantry, used.batches, used.event);
  assert.equal(undo.batches[0].servings, 3);
  assert.ok(undo.pantry.every((l) => l.quantity === 0));
});
test("una preparación no se ofrece si venció o no corresponde a las porciones de esa comida", () => {
  const m = generateMenu(seedPlan).find((m) => m.slot === 2)!;
  const r = prepareBatch(m, [], {
    name: "Prueba",
    servings: 1,
    location: "refrigerador",
    preparedOn: date,
    expiresOn: "2026-11-10",
  });
  assert.equal(batchFits(r.batch, seedPlan, 2, date), true);
  assert.equal(batchFits(r.batch, seedPlan, 4, date), false);
  assert.equal(batchFits(r.batch, seedPlan, 2, "2026-11-11"), false);
  assert.throws(() =>
    prepareBatch(m, [], {
      name: "Prueba",
      servings: 0,
      location: "refrigerador",
      preparedOn: date,
      expiresOn: "2026-11-10",
    }),
  );
});
const fruitPlan: Plan = {
  ...seedPlan,
  foods: [food("manzana")],
  groups: [{ name: "Frutas", daily: 1, distribution: [0, 1, 0, 0, 0] }],
};
test("intercambiar un alimento desvincula la preparación para no descontar un plato distinto", () => {
  const meal = generateMenu(seedPlan).find((m) => m.slot === 2)!;
  const carb = meal.foods.find((x) => x.food.group === "Carbohidratos")!;
  const next = seedPlan.foods.find(
    (f) => f.group === "Carbohidratos" && f.id !== carb.food.id,
  )!;
  const swapped = replaceFood(
    { ...meal, preparedBatchId: "batch", recipeTitle: "Preparación original" },
    carb.food.id,
    next.id,
    seedPlan,
  );
  assert.equal(swapped.preparedBatchId, undefined);
  assert.equal(swapped.recipeTitle, undefined);
});
test("proyección mensual gasta diez manzanas una sola vez entre semanas", () => {
  const f = food("manzana");
  const forecast = kitchenPurchaseForecast(
    fruitPlan,
    {},
    date,
    30,
    [lot(f, 10)],
    [],
  );
  assert.equal(forecast.items[0].quantity, 20);
  assert.equal(
    Object.values(forecast.missingByDate).slice(0, 7).flat().length,
    0,
  );
  assert.equal(
    Object.values(forecast.missingByDate)
      .slice(7, 14)
      .flat()
      .reduce((n, x) => n + x.quantity, 0),
    4,
  );
});
test("proyección respeta vencimiento y comidas ya registradas", () => {
  const f = food("manzana");
  const forecast = kitchenPurchaseForecast(
    fruitPlan,
    {},
    date,
    7,
    [lot(f, 10, "2026-11-10")],
    [],
    { [date + "-meal-1"]: true },
  );
  assert.equal(forecast.items[0].quantity, 5);
});
test("migración de versiones previas conserva datos y crea la cocina vacía", () => {
  const s: any = initial();
  delete s.pantry;
  delete s.preparedBatches;
  delete s.kitchenEvents;
  s.checks = { "2026-10-01-meal-0": true };
  const m = migrateState(s);
  assert.deepEqual(m.pantry, []);
  assert.deepEqual(m.preparedBatches, []);
  assert.deepEqual(m.kitchenEvents, {});
  assert.equal(m.checks["2026-10-01-meal-0"], true);
});
