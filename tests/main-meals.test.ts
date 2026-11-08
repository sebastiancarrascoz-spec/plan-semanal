import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seedPlan,
  generateMenu,
  foodForMeal,
  replaceFood,
  type Plan,
  type Meal,
} from "../lib/engine.ts";
import { recipeOptions, batchFits, type PantryLot } from "../lib/kitchen.ts";
import { initial, repairUnloggedMenus } from "../lib/state.ts";
const date = "2026-11-09";
const soy = seedPlan.foods.find((f) => f.id === "soya")!;
test("almuerzo y cena no usan bebidas ni yogur como toda la proteína, aunque sobren en la despensa", () => {
  const pantry: PantryLot[] = [
    {
      id: "soy",
      foodId: soy.id,
      foodName: soy.name,
      planUnit: soy.unit,
      quantity: 10000,
      unit: "ml",
      planUnitsPerUnit: 1,
      location: "despensa",
      addedOn: date,
      expiresOn: "2026-12-01",
    },
  ];
  for (const diet of ["omnívoro", "vegetariano", "vegano"] as const)
    for (const slot of [2, 4]) {
      const p = { ...seedPlan, diet };
      const options = recipeOptions(p, slot, pantry, [], date);
      assert.ok(options.length > 0);
      for (const o of options)
        assert.ok(
          o.meal.foods
            .filter((x) => x.food.group === "Proteínas")
            .every(
              (x) =>
                !["soya", "yogur"].includes(x.food.id) && x.food.unit !== "ml",
            ),
        );
    }
});
test("las tres opciones principales cambian proteína o cereal, no solamente verduras", () => {
  for (const slot of [2, 4]) {
    const options = recipeOptions(seedPlan, slot, [], [], date);
    assert.equal(options.length, 3);
    const proteins = options.map(
      (o) => o.meal.foods.find((x) => x.food.group === "Proteínas")!.food.id,
    );
    assert.equal(new Set(proteins).size, 3);
    const cores = options.map((o) =>
      o.meal.foods
        .filter((x) => ["Proteínas", "Carbohidratos"].includes(x.food.group))
        .map((x) => x.food.id)
        .sort()
        .join("|"),
    );
    assert.equal(new Set(cores).size, 3);
  }
});
test("la minuta semanal y los intercambios aplican el mismo contexto de comida", () => {
  const menu = generateMenu(seedPlan);
  assert.ok(
    menu
      .filter((m) => [2, 4].includes(m.slot))
      .every((m) =>
        m.foods.every((x) => foodForMeal(x.food, seedPlan, m.slot).compatible),
      ),
  );
  const lunch = menu.find((m) => m.slot === 2)!;
  const protein = lunch.foods.find((x) => x.food.group === "Proteínas")!;
  assert.throws(() => replaceFood(lunch, protein.food.id, "soya", seedPlan));
  assert.equal(foodForMeal(soy, seedPlan, 0).compatible, true);
  assert.equal(foodForMeal(soy, seedPlan, 3).compatible, true);
});
test("una bebida personalizada en mililitros tampoco se transforma en proteína de almuerzo", () => {
  const custom = {
    ...soy,
    id: "custom-beverage",
    name: "Bebida vegetal personalizada",
    proteinRole: undefined,
  };
  assert.equal(
    foodForMeal(custom, { ...seedPlan, foods: [...seedPlan.foods, custom] }, 2)
      .compatible,
    false,
  );
});
test("si solo hay proteínas bebibles se informa la brecha, sin forzar una sustitución", () => {
  const p: Plan = {
    ...seedPlan,
    foods: seedPlan.foods.filter(
      (f) => f.group !== "Proteínas" || f.id === "soya",
    ),
  };
  assert.throws(() => generateMenu(p), /proteína de plato/);
  assert.deepEqual(recipeOptions(p, 2, [], [], date), []);
});
test("platos preparados antiguos con bebida de soya no reaparecen como almuerzo", () => {
  const lunch = generateMenu(seedPlan).find((m) => m.slot === 2)!;
  const bad: Meal = {
    ...lunch,
    foods: lunch.foods.map((x) =>
      x.food.group === "Proteínas" ? { ...x, food: soy } : x,
    ),
  };
  const batch = {
    id: "legacy",
    name: "Pan y bebida",
    meal: bad,
    servings: 1,
    preparedOn: date,
    expiresOn: "2026-11-12",
    location: "refrigerador" as const,
  };
  assert.equal(batchFits(batch, seedPlan, 2, date), false);
  assert.ok(
    recipeOptions(seedPlan, 2, [], [batch], date).every(
      (o) => o.batchId !== "legacy",
    ),
  );
});
test("se reparan solo sugerencias pendientes; las comidas registradas conservan su historial", () => {
  const state = initial();
  const menu = generateMenu(seedPlan);
  state.menus = {
    [date]: menu.map((m) =>
      [2, 4].includes(m.slot)
        ? {
            ...m,
            foods: m.foods.map((x) =>
              x.food.group === "Proteínas" ? { ...x, food: soy } : x,
            ),
          }
        : m,
    ),
  };
  state.checks = { [date + "-meal-2"]: true };
  const repaired = repairUnloggedMenus(state, date);
  assert.equal(
    repaired.menus[date]
      .find((m) => m.day === 0 && m.slot === 2)!
      .foods.find((x) => x.food.group === "Proteínas")!.food.id,
    "soya",
  );
  assert.notEqual(
    repaired.menus[date]
      .find((m) => m.day === 0 && m.slot === 4)!
      .foods.find((x) => x.food.group === "Proteínas")!.food.id,
    "soya",
  );
  assert.equal(repaired.checks[date + "-meal-2"], true);
});
