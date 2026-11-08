import { test } from "node:test";
import assert from "node:assert/strict";
import { seedPlan, type Shopping } from "../lib/engine.ts";
import { initial, toggleMealLog } from "../lib/state.ts";
import {
  composeWeeklyMenu,
  recipeOptions,
  kitchenPurchaseForecast,
  prepareBatch,
  type PantryLot,
} from "../lib/kitchen.ts";
import { periodShopping } from "../lib/purchases.ts";
const date = "2026-11-09";
const normalized = (items: Shopping[]) =>
  items
    .map((x) => ({ id: x.id, quantity: Math.round(x.quantity * 1e6) / 1e6 }))
    .sort((a, b) => a.id.localeCompare(b.id));
test("elegir, registrar y deshacer una comida mantiene estable la necesidad futura de compra", () => {
  const s = initial();
  s.menus = { [date]: composeWeeklyMenu(s.plan, 0, date) };
  const option = recipeOptions(s.plan, 2, [], [], date)[0];
  s.menus[date] = s.menus[date].map((m) =>
    m.day === 0 && m.slot === 2
      ? { ...option.meal, id: m.id, day: 0, recipeTitle: option.title }
      : m,
  );
  s.pantry = option.meal.foods.map((x) => ({
    id: x.food.id,
    foodId: x.food.id,
    foodName: x.food.name,
    planUnit: x.food.unit,
    quantity: x.food.quantity * x.portions * 2,
    unit: x.food.unit,
    planUnitsPerUnit: 1,
    location: "despensa" as const,
    addedOn: date,
    expiresOn: "2026-12-01",
  }));
  const before = kitchenPurchaseForecast(
    s.plan,
    s.menus,
    date,
    7,
    s.pantry,
    s.preparedBatches,
    s.checks,
  );
  const logged = toggleMealLog(s, date + "-meal-2");
  const after = kitchenPurchaseForecast(
    logged.plan,
    logged.menus,
    date,
    7,
    logged.pantry,
    logged.preparedBatches,
    logged.checks,
  );
  assert.deepEqual(normalized(after.items), normalized(before.items));
  const undo = toggleMealLog(logged, date + "-meal-2");
  assert.deepEqual(undo.pantry, s.pantry);
  assert.deepEqual(
    normalized(
      kitchenPurchaseForecast(
        undo.plan,
        undo.menus,
        date,
        7,
        undo.pantry,
        undo.preparedBatches,
        undo.checks,
      ).items,
    ),
    normalized(before.items),
  );
});
test("preparar y consumir un plato reservado no duplica descuentos ni compras", () => {
  const s = initial();
  s.menus = { [date]: composeWeeklyMenu(s.plan, 0, date) };
  const meal = s.menus[date].find((m) => m.day === 0 && m.slot === 2)!;
  const lots: PantryLot[] = meal.foods.map((x) => ({
    id: x.food.id,
    foodId: x.food.id,
    foodName: x.food.name,
    planUnit: x.food.unit,
    quantity: x.food.quantity * x.portions * 3,
    unit: x.food.unit,
    planUnitsPerUnit: 1,
    location: "refrigerador",
    addedOn: date,
    expiresOn: "2026-11-20",
  }));
  const prepared = prepareBatch(meal, lots, {
    name: "Preparación de prueba",
    servings: 3,
    location: "congelador",
    preparedOn: date,
    expiresOn: "2026-11-20",
  });
  s.pantry = prepared.pantry;
  s.preparedBatches = [prepared.batch];
  s.menus[date] = s.menus[date].map((m) =>
    m.day === 0 && m.slot === 2
      ? { ...m, preparedBatchId: prepared.batch.id }
      : m,
  );
  const forecast = kitchenPurchaseForecast(
    s.plan,
    s.menus,
    date,
    7,
    s.pantry,
    s.preparedBatches,
    s.checks,
  );
  const logged = toggleMealLog(s, date + "-meal-2");
  assert.equal(logged.preparedBatches[0].servings, 2);
  assert.ok(logged.pantry.every((l) => l.quantity === 0));
  assert.deepEqual(
    normalized(
      kitchenPurchaseForecast(
        logged.plan,
        logged.menus,
        date,
        7,
        logged.pantry,
        logged.preparedBatches,
        logged.checks,
      ).items,
    ),
    normalized(forecast.items),
  );
});
test("compras y cocina proyectan los mismos ingredientes a través de varias semanas", () => {
  const start = "2026-11-07";
  const gross = periodShopping(seedPlan, {}, start, 30, (week) =>
    composeWeeklyMenu(seedPlan, 0, week),
  );
  const forecast = kitchenPurchaseForecast(seedPlan, {}, start, 30, [], []);
  assert.deepEqual(normalized(gross.items), normalized(forecast.items));
});
