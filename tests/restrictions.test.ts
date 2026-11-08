import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seedPlan,
  generateMenu,
  foodCompatibility,
  replaceFood,
  type Plan,
  type Food,
} from "../lib/engine.ts";
test("vegano sin gluten, soya ni frutos secos conserva el plan usando solo compatibles", () => {
  const p: Plan = {
    ...seedPlan,
    diet: "vegano",
    restrictions: ["gluten", "soya", "frutos_secos"],
    restrictionMode: "ingredientes",
  };
  const menu = generateMenu(p);
  assert.ok(
    menu
      .flatMap((m) => m.foods)
      .every((x) => foodCompatibility(x.food, p).compatible),
  );
  assert.ok(
    !menu
      .flatMap((m) => m.foods)
      .some((x) =>
        ["pan", "avena", "tofu", "soya", "nueces"].includes(x.food.id),
      ),
  );
  for (const group of p.groups)
    assert.equal(
      menu
        .filter((m) => m.day === 0)
        .flatMap((m) => m.foods)
        .filter((x) => x.food.group === group.name)
        .reduce((n, x) => n + x.portions, 0),
      group.daily,
    );
});
test("pescetariano admite pescado y vegetarianos pero excluye pollo", () => {
  const p: Plan = { ...seedPlan, diet: "pescetariano" };
  assert.equal(
    foodCompatibility(
      p.foods.find((x) => x.id === "pollo")!,
      p,
    ).compatible,
    false,
  );
  assert.equal(
    foodCompatibility(
      p.foods.find((x) => x.id === "pescado")!,
      p,
    ).compatible,
    true,
  );
  assert.equal(
    foodCompatibility(
      p.foods.find((x) => x.id === "yogur")!,
      p,
    ).compatible,
    true,
  );
});
test("exclusión estricta falla cerrada ante revisión o ingredientes desconocidos", () => {
  const p: Plan = {
    ...seedPlan,
    restrictions: ["gluten"],
    restrictionMode: "estricta",
  };
  assert.throws(() => generateMenu(p), /Faltan equivalentes/);
  const rice = seedPlan.foods.find((f) => f.id === "arroz")!;
  assert.equal(
    foodCompatibility({ ...rice, reviewedFor: ["gluten"] }, p).compatible,
    false,
  );
  assert.equal(
    foodCompatibility(
      {
        ...rice,
        reviewedFor: ["gluten"],
        evidence: "Producto y etiqueta revisados",
      },
      p,
    ).compatible,
    true,
  );
  assert.equal(
    foodCompatibility(
      {
        ...rice,
        reviewedFor: ["gluten"],
        evidence: "Etiqueta",
        mayContain: ["gluten"],
      },
      p,
    ).compatible,
    false,
  );
  assert.equal(
    foodCompatibility({ ...rice, contains: undefined }, p).compatible,
    false,
  );
});
test("preferencia evitar se respeta en generador e intercambio", () => {
  const p: Plan = { ...seedPlan, excludedFoodIds: ["pan", "nueces"] };
  assert.ok(
    generateMenu(p).every((m) =>
      m.foods.every((x) => !p.excludedFoodIds!.includes(x.food.id)),
    ),
  );
  const m = generateMenu(seedPlan)[0];
  const carb = m.foods.find((x) => x.food.group === "Carbohidratos")!;
  assert.throws(() => replaceFood(m, carb.food.id, "pan", p));
  assert.throws(() => replaceFood(m, carb.food.id, "pollo", p));
});
test("sin lactosa no se confunde con alergia a leche", () => {
  const yogurt = seedPlan.foods.find((x) => x.id === "yogur")!;
  const lactoseFree: Food = { ...yogurt, contains: ["leche"] };
  assert.equal(
    foodCompatibility(lactoseFree, { ...seedPlan, restrictions: ["lactosa"] })
      .compatible,
    true,
  );
  assert.equal(
    foodCompatibility(lactoseFree, { ...seedPlan, restrictions: ["leche"] })
      .compatible,
    false,
  );
});
