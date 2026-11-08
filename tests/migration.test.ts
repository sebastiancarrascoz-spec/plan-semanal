import { test } from "node:test";
import assert from "node:assert/strict";
import { initial, migrateState } from "../lib/state.ts";
test("actualización preserva registros de la versión anterior y añade composición y carrito vacíos", () => {
  const state = initial();
  const legacy: any = { ...state, checks: { "2026-10-01-meal-0": true } };
  delete legacy.bodyScans;
  delete legacy.carts;
  legacy.plan.foods = legacy.plan.foods.map(
    ({ contains, mayContain, reviewedFor, ...food }: any) => food,
  );
  const result = migrateState(legacy);
  assert.equal(result.checks["2026-10-01-meal-0"], true);
  assert.deepEqual(result.bodyScans, []);
  assert.deepEqual(result.carts, {});
  assert.ok(
    result.plan.foods.find((x) => x.id === "pan")?.contains?.includes("gluten"),
  );
});
test("migración no asigna ingredientes del ejemplo a un alimento que el usuario renombró", () => {
  const state = initial();
  state.plan.foods[0] = {
    ...state.plan.foods[0],
    name: "Receta personalizada",
    contains: undefined,
  };
  const result = migrateState(state);
  assert.equal(result.plan.foods[0].contains, undefined);
});
