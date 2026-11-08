import { test } from "node:test";
import assert from "node:assert/strict";
import { seedPlan, generateMenu, type Shopping } from "../lib/engine.ts";
import {
  periodShopping,
  commercialRows,
  purchaseText,
  addDays,
} from "../lib/purchases.ts";
const item = (id: string, quantity: number): Shopping => {
  const f = seedPlan.foods.find((f) => f.id === id)!;
  return {
    id: f.id + "|" + f.unit,
    name: f.name,
    quantity,
    unit: f.unit,
    section: f.section,
  };
};
test("360 g de avena se compran como una bolsa de 500 g", () => {
  const [r] = commercialRows([item("avena", 360)], [], { items: {} });
  assert.equal(r.purchaseText, "1 bolsa de 500 g");
  assert.equal(r.packs, 1);
  assert.equal(r.leftover, 140);
});
test("28 cucharaditas de aceite se compran como una botella, no como cucharaditas", () => {
  const [r] = commercialRows([item("aceite", 28)], [], { items: {} });
  assert.equal(r.consumption, 140);
  assert.equal(r.purchaseText, "1 botella de 500 ml");
  assert.ok(!purchaseText([r], "30 días", "7 días").includes("cucharadita"));
});
test("27 tazas cocidas de lentejas dan bolsas de producto seco con rendimiento explícito", () => {
  const [r] = commercialRows([item("lentejas", 27)], [], { items: {} });
  assert.equal(r.purchaseText, "2 bolsas de 1 kg");
  assert.equal(r.format.estimated, true);
  assert.ok(r.format.source);
});
test("compra mensual cuenta 30 días exactos, incluidos los extremos de las semanas", () => {
  const p = periodShopping(
    seedPlan,
    { "2026-11-02": generateMenu(seedPlan) },
    "2026-11-07",
    30,
  );
  assert.equal(p.plannedDays, 2);
  assert.equal(p.projectedDays, 28);
  assert.equal(
    p.items.find((x) => x.id === "aceite|cucharadita")?.quantity,
    120,
  );
  assert.equal(addDays("2026-11-07", 29), "2026-12-06");
  const seven = periodShopping(seedPlan, {}, "2026-11-07", 7);
  assert.equal(
    seven.items.find((x) => x.id === "aceite|cucharadita")?.quantity,
    28,
  );
});
test("frescos usan solo la reposición seleccionada y sus existencias son independientes", () => {
  const f = item("manzana", 20),
    fresh = item("manzana", 4);
  const basket = { items: { [`${f.id}@2026-11-07`]: { havePacks: 3 } } };
  const [first] = commercialRows([f], [fresh], basket, "2026-11-07");
  const [second] = commercialRows([f], [fresh], basket, "2026-11-14");
  assert.equal(first.packs, 1);
  assert.equal(second.packs, 4);
});
test("stock y envases se descuentan antes de redondear y no se recompran artículos marcados", () => {
  const f = item("avena", 1000);
  const [r] = commercialRows([f], [], {
    items: { [f.id]: { havePacks: 1.5 } },
  });
  assert.equal(r.packs, 1);
  assert.equal(r.leftover, 250);
  const [covered] = commercialRows([f], [], {
    items: { [f.id]: { havePacks: 2 } },
  });
  assert.equal(covered.packs, 0);
  assert.throws(
    () => purchaseText([{ ...r, checked: true }], "mes", "semana"),
    /No hay artículos/,
  );
});
test("un alimento personalizado sin unidad de compra necesita definición explícita", () => {
  const f: Shopping = {
    id: "receta",
    name: "Receta propia",
    quantity: 3,
    unit: "taza",
    section: "Otros",
  };
  const [r] = commercialRows([f], [], { items: {} });
  assert.equal(r.configured, false);
  assert.throws(() => purchaseText([r], "mes", "semana"), /presentación/);
  const [known] = commercialRows([f], [], {
    items: { receta: { format: { unit: "g", factor: 150, size: 500 } } },
  });
  assert.equal(known.configured, true);
  assert.equal(known.packs, 1);
});
