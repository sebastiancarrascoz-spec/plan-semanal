import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateBodyScan,
  parseBodyImport,
  mergeBodyScans,
} from "../lib/body.ts";
import { calculateCart, cartText, type Cart } from "../lib/cart.ts";
import type { Shopping } from "../lib/engine.ts";
const sample = {
  date: "2026-10-01",
  time: "09:00",
  device: "Equipo de prueba",
  metrics: {
    weightKg: 75,
    skeletalMuscleKg: 30,
    bodyFatPercent: 22,
    waistHipRatio: 0.9,
    visceralFatLevel: 8,
  },
  id: "synthetic",
};
test("importación acepta métricas sin cintura y no convierte relación a centímetros", () => {
  const [s] = parseBodyImport({
    format: "mi-semana-body-scan",
    version: 1,
    scans: [sample],
  });
  assert.equal(s.metrics.waistHipRatio, 0.9);
  assert.equal("waist" in s.metrics, false);
  assert.equal(s.metrics.visceralFatLevel, 8);
});
test("no acepta fechas inválidas, unidades convertidas a texto ni números fuera de rango", () => {
  assert.throws(() => validateBodyScan({ ...sample, date: "2026-02-30" }));
  assert.throws(() =>
    validateBodyScan({ ...sample, metrics: { weightKg: "75 kg" } }),
  );
  assert.throws(() =>
    validateBodyScan({ ...sample, metrics: { bodyFatPercent: 120 } }),
  );
  assert.throws(() => parseBodyImport({ scans: [sample] }));
});
test("importar dos veces actualiza el mismo examen, distinto equipo conserva registro separado", () => {
  const a = validateBodyScan(sample);
  const list = mergeBodyScans(
    [a],
    [validateBodyScan({ ...sample, metrics: { weightKg: 74 } })],
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].metrics.weightKg, 74);
  assert.equal(
    mergeBodyScans(list, [
      validateBodyScan({ ...sample, device: "Otro equipo" }),
    ]).length,
    2,
  );
});
test("descarga de compra no incluye datos de salud y descuenta existencias sin cantidades negativas", () => {
  const items: Shopping[] = [
    {
      id: "rice",
      name: "Arroz",
      quantity: 1000,
      unit: "g",
      section: "Despensa",
    },
  ];
  const c: Cart = {
    store: "jumbo",
    lines: { rice: { have: 300, packSize: 500, packPrice: 1500 } },
  };
  const row = calculateCart(items, c)[0];
  assert.equal(row.need, 700);
  assert.equal(row.packs, 2);
  assert.equal(row.estimated, 3000);
  assert.equal(
    cartText(items, c),
    "Lista de compras\n• Arroz: 700 g (2 envases de 500 g)",
  );
  assert.equal(
    calculateCart(items, { store: "jumbo", lines: { rice: { have: 1500 } } })[0]
      .need,
    0,
  );
});
test("cantidades cocidas y cambio de unidad exigen revisión explícita", () => {
  const items: Shopping[] = [
    {
      id: "rice",
      name: "Arroz",
      quantity: 500,
      unit: "g cocidos",
      section: "Despensa",
    },
  ];
  assert.throws(
    () => cartText(items, { store: "jumbo", lines: {} }),
    /Revisa las cantidades/,
  );
  const c: Cart = {
    store: "jumbo",
    lines: { rice: { quantity: 200, unit: "g secos", reviewed: true } },
  };
  assert.ok(cartText(items, c).includes("200 g secos"));
  assert.throws(() =>
    calculateCart(items, { store: "jumbo", lines: { rice: { quantity: -1 } } }),
  );
});
