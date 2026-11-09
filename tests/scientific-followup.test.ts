import { test } from "node:test";
import assert from "node:assert/strict";
import {
  protocolRules,
  evidenceSources,
  PROTOCOL_VERSION,
  reviewSnapshot,
  currentReview,
  validateReview,
  type ReviewRecord,
} from "../lib/protocol.ts";
import { progressionAdvice } from "../lib/progression.ts";
import {
  activityTotals,
  validateActivity,
  reportPeriod,
  type ActivityLog,
} from "../lib/activity.ts";
import { bodyComparison } from "../lib/body-quality.ts";
import { validateBodyScan, type BodyScan } from "../lib/body.ts";
import { followUp } from "../lib/follow-up.ts";
import { initial, migrateState } from "../lib/state.ts";
import fs from "node:fs";
import {
  buildTrainingPlan,
  trainingDefaults,
  type WorkoutSet,
} from "../lib/training.ts";
const profile = {
  ...trainingDefaults,
  age: 42,
  weightKg: 82,
  limitations: "ninguna" as const,
};
const ex = buildTrainingPlan(profile).routines.A[1];
const set: WorkoutSet = {
  date: "2026-10-01",
  routine: "A",
  exercise: ex.name,
  kg: 10,
  reps: 12,
  equipment: "Equipo X",
  reserve: 3,
  pain: false,
  techniqueReviewed: true,
  recovery: "bien",
  incrementKg: 2.5,
};
const two = [set, { ...set, date: "2026-10-04" }];
test("el protocolo versionado acompaña la versión de aplicación",()=>{const pkg=JSON.parse(fs.readFileSync(new URL("../package.json",import.meta.url),"utf8"));assert.ok(PROTOCOL_VERSION.endsWith(pkg.version));});
test("varias series del mismo día no simulan evolución entre sesiones ni cambian unidades",()=>{const s=initial();s.menus={};s.sets=[set,{...set,reps:10},{...set,exercise:"Plancha (segundos)",kg:0,reps:25,equipment:undefined}];const r=followUp(s,"2026-10-12","2026-10-12");assert.equal(r.performances[0].count,1);assert.equal(r.performances[0].last,undefined);assert.equal(r.performances[0].first?.reps,10);assert.equal(r.performances[1].unit,"segundos");});
test("cada regla explica su tipo y referencia fuentes existentes", () => {
  assert.equal(
    new Set(protocolRules.map((r) => r.id)).size,
    protocolRules.length,
  );
  for (const rule of protocolRules) {
    assert.ok(rule.kind);
    for (const key of rule.sources)
      assert.ok(evidenceSources[key].url.startsWith("https://"));
  }
  assert.ok(evidenceSources.acsm.population.includes("sanos"));
});
test("progresión propone solo el incremento declarado tras dos días comparables", () => {
  const r = progressionAdvice(two, "A", ex, 1, "2026-10-04");
  assert.equal(r.status, "considerar");
  assert.equal(r.nextKg, 12.5);
  assert.equal(
    progressionAdvice([set, set], "A", ex, 1, "2026-10-04").nextKg,
    undefined,
  );
  assert.equal(
    progressionAdvice(two, "A", ex, 2, "2026-10-04").nextKg,
    undefined,
  );
});
test("sin contexto, con otra máquina o con cargas distintas no se propone subida", () => {
  for (const patch of [
    { equipment: undefined },
    { reserve: undefined },
    { reserve: NaN },
    { equipment: "Otro equipo" },
    { kg: 15 },
  ])
    assert.equal(
      progressionAdvice(
        [set, { ...two[1], ...patch }],
        "A",
        ex,
        1,
        "2026-10-04",
      ).nextKg,
      undefined,
    );
});
test("dolor, técnica y recuperación tienen prioridad sobre completar repeticiones", () => {
  for (const patch of [
    { pain: true },
    { techniqueReviewed: false },
    { recovery: "mala" as const },
    { reserve: 0 },
  ])
    assert.equal(
      progressionAdvice(
        [set, { ...two[1], ...patch }],
        "A",
        ex,
        1,
        "2026-10-04",
      ).nextKg,
      undefined,
    );
  assert.equal(
    progressionAdvice(
      [set, { ...two[1], pain: true }],
      "A",
      ex,
      1,
      "2026-10-04",
    ).status,
    "dolor",
  );
});
test("la progresión no usa registros futuros ni el peso corporal como carga", () => {
  assert.equal(
    progressionAdvice(
      [...two, { ...set, date: "2026-11-01", pain: true }],
      "A",
      ex,
      1,
      "2026-10-04",
    ).status,
    "considerar",
  );
  assert.equal(
    progressionAdvice(two, "B", ex, 1, "2026-10-04").nextKg,
    undefined,
  );
  assert.equal(
    progressionAdvice(two, "A", { ...ex, externalLoad: false }, 1, "2026-10-04")
      .nextKg,
    undefined,
  );
});
const activity: ActivityLog = {
  id: "a",
  date: "2026-10-01",
  type: "caminata",
  minutes: 15,
  intensity: "suave",
  context: "almuerzo",
};
test("minutos reales separan suave, moderada y equivalente vigorosa", () => {
  const r = activityTotals(
    [
      activity,
      { ...activity, id: "b", minutes: 20, intensity: "moderada" },
      { ...activity, id: "c", minutes: 10, intensity: "vigorosa" },
    ],
    "2026-10-01",
    "2026-10-01",
  );
  assert.equal(r.minutes, 45);
  assert.equal(r.equivalent, 40);
  assert.equal(r.days, 1);
});
test("actividad rechaza minutos imposibles y fechas futuras o inexistentes", () => {
  for (const patch of [
    { minutes: 0 },
    { minutes: 12.5 },
    { minutes: 301 },
    { date: "2026-02-30" },
    { date: "2026-10-02" },
  ])
    assert.throws(() =>
      validateActivity({ ...activity, ...patch }, "2026-10-01"),
    );
});
const scan: BodyScan = {
  id: "scan",
  date: "2026-10-01",
  device: "Equipo de prueba",
  source: "manual",
  metrics: { skeletalMuscleKg: 31 },
  conditions: {
    timeBand: "manana",
    recentExercise: "no",
    usualHydration: "si",
    mealTiming: "habitual",
  },
};
test("condiciones InBody sobreviven validación e importación sin interpretar notas", () => {
  assert.deepEqual(validateBodyScan(scan).conditions, scan.conditions);
  assert.equal(
    validateBodyScan({ ...scan, conditions: undefined, notes: "Mismo horario" })
      .conditions,
    undefined,
  );
  assert.throws(() =>
    validateBodyScan({ ...scan, conditions: { timeBand: "inventado" } }),
  );
});
test("comparación distingue falta de contexto, equipo y condiciones declaradas", () => {
  assert.equal(bodyComparison(scan, { ...scan, id: "s2" }).status, "similares");
  assert.equal(
    bodyComparison(scan, { ...scan, conditions: undefined }).status,
    "incompleto",
  );
  assert.equal(
    bodyComparison(scan, { ...scan, device: "Otro" }).status,
    "equipo",
  );
  assert.equal(
    bodyComparison(scan, {
      ...scan,
      conditions: { ...scan.conditions, recentExercise: "si" },
    }).status,
    "variables",
  );
  assert.equal(
    bodyComparison(scan, {
      ...scan,
      conditions: { ...scan.conditions, timeBand: "tarde" },
    }).status,
    "diferencias",
  );
});
const snapshot = reviewSnapshot("entrenamiento", {}, profile);
const review: ReviewRecord = {
  id: "r",
  date: "2026-10-01",
  name: "Profesional de prueba",
  role: "kinesiologo",
  scope: "entrenamiento",
  outcome: "revisado",
  recordedBy: "usuario",
  notes: "Ejemplo ficticio",
  snapshot,
  protocol: PROTOCOL_VERSION,
};
test("revisión no avala automáticamente cambios de perfil, cargas o protocolo", () => {
  assert.ok(currentReview([review], snapshot));
  assert.equal(
    currentReview(
      [review],
      reviewSnapshot("entrenamiento", {}, { ...profile, week: 2 }),
    ),
    undefined,
  );
  assert.equal(
    currentReview([{ ...review, protocol: "anterior" }], snapshot),
    undefined,
  );
  assert.equal(
    reviewSnapshot("alimentacion", { a: 1, b: 2 }, {}),
    reviewSnapshot("alimentacion", { b: 2, a: 1 }, {}),
  );
});
test("revisión declarada valida fecha y ámbito, sin simular credenciales", () => {
  assert.equal(validateReview(review, "2026-10-01").recordedBy, "usuario");
  for (const patch of [
    { date: "2026-02-30" },
    { date: "2026-10-02" },
    { role: "nutricionista" as const },
    { name: "" },
  ])
    assert.throws(() => validateReview({ ...review, ...patch }, "2026-10-01"));
  assert.throws(() =>
    validateReview({ ...review, scope: "alimentacion" }, "2026-10-01"),
  );
});
test("resumen vacío no inventa actividad ni sueño ni incumplimiento de 84 días", () => {
  const s = initial();
  s.menus = {};
  const r = followUp(s, "2026-10-12", "2026-10-12");
  assert.equal(r.weeks.length, 12);
  assert.equal(r.possible, 0);
  assert.equal(r.sleep, undefined);
  assert.equal(r.activity.minutes, 0);
  assert.equal(r.recordedDays, 0);
  assert.equal(reportPeriod("2026-10-12").start, r.period.start);
});
test("resumen no convierte casillas de caminata en minutos ni mezcla unidades o equipos", () => {
  const s = initial();
  s.menus = {};
  s.checks = { "2026-10-01-walk-0": true };
  s.activityLogs = [activity];
  s.bodyScans = [
    scan,
    { ...scan, id: "other", device: "Otro", date: "2026-10-02" },
  ];
  s.labs = [
    { date: "2026-10-01", type: "Glucosa", unit: "mg/dL", value: 90 },
    { date: "2026-10-02", type: "Glucosa", unit: "mmol/L", value: 5 },
  ];
  const r = followUp(s, "2026-10-12", "2026-10-12");
  assert.equal(r.activity.minutes, 15);
  assert.equal(r.activity.equivalent, 0);
  assert.equal(r.marked, 1);
  assert.equal(r.possible, 7);
  assert.equal(r.labs.length, 2);
  assert.equal(r.bodies.length, 2);
  assert.ok(r.labs.every((x) => x.last === undefined));
});
test("resumen excluye registros fuera del periodo y fechas futuras", () => {
  const s = initial();
  s.menus = {};
  s.activityLogs = [
    activity,
    { ...activity, date: "2027-01-01", minutes: 100 },
  ];
  s.measurements = [
    { date: "2026-10-01", weight: 80, waist: 90 },
    { date: "2027-01-01", weight: 70, waist: 80 },
  ];
  const r = followUp(s, "2026-10-12", "2026-10-12");
  assert.equal(r.measurements.count, 1);
  assert.equal(r.activity.minutes, 15);
  assert.throws(() => followUp(s, "2027-01-01", "2026-10-12"));
});
test("migración conserva todos los nuevos registros sin inventar respuestas de sesiones antiguas", () => {
  const s = {
    ...initial(),
    sets: [
      {
        date: set.date,
        routine: set.routine,
        exercise: set.exercise,
        kg: set.kg,
        reps: set.reps,
      },
    ],
    reviews: [review],
    activityLogs: [activity],
    sedentaryLogs: { "2026-10-01": { breaks: 0 } },
    bodyScans: [scan],
  };
  const r = migrateState(s);
  assert.deepEqual(r.reviews, s.reviews);
  assert.deepEqual(r.activityLogs, s.activityLogs);
  assert.equal(r.sets[0].reserve, undefined);
  assert.equal(r.sedentaryLogs?.["2026-10-01"].breaks, 0);
  assert.deepEqual(r.bodyScans[0].conditions, scan.conditions);
});
