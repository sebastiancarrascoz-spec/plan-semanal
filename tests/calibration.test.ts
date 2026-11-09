import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assessedPrescription,
  validateAssessment,
  latestAssessment,
  type TrainingAssessment,
} from "../lib/calibration.ts";
import {
  buildTrainingPlan,
  trainingDefaults,
  startingPrescription,
} from "../lib/training.ts";
import { initial, migrateState } from "../lib/state.ts";
const profile = {
  ...trainingDefaults,
  age: 40,
  weightKg: 84,
  limitations: "ninguna" as const,
};
const ex = buildTrainingPlan(profile).routines.A[1];
const record: TrainingAssessment = {
  id: "test",
  date: "2026-10-01",
  routine: "A",
  exercise: ex.name,
  equipment: "Máquina X, asiento 3",
  kg: 7.5,
  reps: 8,
  reserve: 3,
  pain: false,
  techniqueReviewed: true,
};
test("una evaluación válida proporciona carga y equipo comprobados", () => {
  assert.equal(validateAssessment(record, "2026-10-01").kg, 7.5);
  const p = assessedPrescription(ex, record);
  assert.equal(p.kg, 7.5);
  assert.equal(p.status, "comprobada");
  assert.match(p.label, /Máquina X/);
  assert.equal(startingPrescription(ex, profile, undefined, record).kg, 7.5);
});
test("dolor y técnica sin revisar impiden fijar una carga", () => {
  for (const patch of [{ pain: true }, { techniqueReviewed: false }])
    assert.equal(
      assessedPrescription(ex, { ...record, ...patch }).kg,
      undefined,
    );
});
test("esfuerzo excesivo o insuficiente pide nueva prueba sin inventar kg", () => {
  for (const patch of [
    { reserve: 0 },
    { reserve: 1 },
    { reps: 6 },
    { reserve: 5 },
    { reps: 20 },
  ])
    assert.equal(
      assessedPrescription(ex, { ...record, ...patch }).kg,
      undefined,
    );
});
test("validación rechaza fechas futuras y valores no válidos", () => {
  for (const patch of [
    { date: "2026-10-02" },
    { date: "2026-02-30" },
    { equipment: " " },
    { kg: NaN },
    { reps: 8.5 },
    { reserve: -1 },
    { reserve: 6 },
  ])
    assert.throws(() =>
      validateAssessment({ ...record, ...patch }, "2026-10-01"),
    );
});
test("la evaluación más reciente no mezcla rutinas ni ejercicios ni fechas futuras", () => {
  const rows = [
    record,
    { ...record, date: "2026-10-02", pain: true },
    { ...record, routine: "B" as const, kg: 25 },
    { ...record, date: "2026-10-03", kg: 30 },
  ];
  const a = latestAssessment(rows, "A", ex.name, "2026-10-02");
  assert.equal(a?.pain, true);
  assert.equal(assessedPrescription(ex, a).kg, undefined);
  assert.equal(latestAssessment(rows, "A", "Otro", "2026-10-02"), undefined);
});
test("sin evaluación o con otra variante no hay prescripción numérica", () => {
  assert.equal(assessedPrescription(ex).kg, undefined);
  assert.equal(
    assessedPrescription(ex, { ...record, exercise: "Otra máquina" }).kg,
    undefined,
  );
});
test("la migración conserva evaluaciones e historial anterior", () => {
  const old = { ...initial(), trainingAssessments: [record] };
  const result = migrateState(old);
  assert.deepEqual(result.trainingAssessments, [record]);
  assert.deepEqual(result.sets, old.sets);
});
