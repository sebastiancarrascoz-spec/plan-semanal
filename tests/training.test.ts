import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTrainingPlan,
  trainingDefaults,
  validateTrainingProfile,
  canProgress,
  lastTrainingSet,
  startingPrescription,
  type WorkoutSet,
} from "../lib/training.ts";
import { initial, migrateState } from "../lib/state.ts";
const profile = {
  ...trainingDefaults,
  age: 40,
  weightKg: 84,
  limitations: "ninguna" as const,
};
test("inicio en gimnasio: ambas rutinas y progresión gradual, sin cargas deducidas del peso", () => {
  const a = buildTrainingPlan(profile),
    b = buildTrainingPlan({ ...profile, weightKg: 120 });
  assert.equal(a.sets, 1);
  assert.equal(a.routines.A.length, 5);
  assert.equal(a.routines.B.length, 5);
  assert.deepEqual(a.routines, b.routines);
  assert.equal(buildTrainingPlan({ ...profile, week: 3 }).sets, 2);
  assert.equal(buildTrainingPlan({ ...profile, week: 12 }).sets, 2);
  assert.equal(
    buildTrainingPlan({ ...profile, experience: "regular", week: 5 }).sets,
    3,
  );
});

test("punto de partida distingue cargas de prueba, registro real y peso corporal", () => {
  const plan = buildTrainingPlan(profile),
    ex = plan.routines.A[1];
  assert.equal(startingPrescription(ex, profile).kg, 5);
  assert.equal(startingPrescription(ex, profile).reps, 8);
  assert.equal(startingPrescription(ex, profile).kind, "prueba");
  assert.deepEqual(
    startingPrescription(ex, profile),
    startingPrescription(ex, { ...profile, weightKg: 120 }),
  );
  assert.equal(
    startingPrescription(ex, profile, {
      date: "2026-10-01",
      routine: "A",
      exercise: ex.name,
      kg: 7.5,
      reps: 8,
    }).kg,
    7.5,
  );
  assert.equal(startingPrescription(plan.routines.A[3], profile).kg, 0);
  assert.equal(startingPrescription(ex, { ...profile, age: 70 }).kg, undefined);
  assert.match(
    startingPrescription(plan.routines.A[0], profile).label,
    /SOLO en prensa horizontal/,
  );
});
test("no se genera una rutina sin confirmar molestias o con necesidad de revisión", () => {
  for (const limitations of ["sin_confirmar", "revisar"] as const) {
    const plan = buildTrainingPlan({ ...profile, limitations });
    assert.equal(plan.needsReview, true);
    assert.equal(plan.routines.A.length, 0);
    assert.equal(plan.routines.B.length, 0);
  }
});
test("edad, magnitudes y semana se validan; no se aplican programas de adultos a menores", () => {
  for (const patch of [
    { age: 17 },
    { age: NaN },
    { age: 40.5 },
    { weightKg: -1 },
    { heightCm: 300 },
    { week: 0 },
    { week: 13 },
    { week: 1.5 },
  ])
    assert.throws(() => validateTrainingProfile({ ...profile, ...patch }));
  assert.match(buildTrainingPlan({ ...profile, age: 70 }).rest, /90–120/);
});
test("alternativas respetan equipamiento y no convierten ejercicios sin carga en kilos", () => {
  const plan = buildTrainingPlan({ ...profile, equipment: "sin_equipo" });
  assert.ok(
    [...plan.routines.A, ...plan.routines.B].every((x) => !x.externalLoad),
  );
  assert.ok(!plan.routines.A.some((x) => /máquina|mancuerna/.test(x.name)));
});
test("subir carga exige completar el número de series real, a igual carga y tope del rango", () => {
  const ex = buildTrainingPlan(profile).routines.A[0];
  const set: WorkoutSet = {
    date: "2026-10-01",
    routine: "A",
    exercise: ex.name,
    kg: 15,
    reps: 12,
  };
  assert.equal(canProgress([set], ex, 2), false);
  assert.equal(canProgress([set, { ...set, reps: 10 }], ex, 2), false);
  assert.equal(canProgress([set, { ...set, kg: 20 }], ex, 2), false);
  assert.equal(canProgress([set, set], ex, 2), true);
  assert.equal(
    canProgress([set, set], { ...ex, externalLoad: false }, 2),
    false,
  );
});
test("última carga usa fecha, rutina y ejercicio exactos y excluye registros futuros", () => {
  const sets = [
    { date: "2026-10-02", routine: "A", exercise: "Prensa", kg: 20, reps: 8 },
    { date: "2026-10-01", routine: "A", exercise: "Prensa", kg: 15, reps: 8 },
    { date: "2026-10-03", routine: "A", exercise: "Prensa", kg: 30, reps: 8 },
    { date: "2026-10-02", routine: "B", exercise: "Prensa", kg: 60, reps: 8 },
  ];
  assert.equal(lastTrainingSet(sets, "A", "Prensa", "2026-10-02")?.kg, 20);
  assert.equal(lastTrainingSet(sets, "A", "Otro", "2026-10-02"), undefined);
});
test("migrar conserva historial y perfil de entrenamiento sin agregar datos personales", () => {
  const old = initial();
  assert.equal(migrateState(old).trainingProfile, undefined);
  const state = {
    ...old,
    trainingProfile: profile,
    sets: [
      {
        date: "2026-10-01",
        routine: "A",
        exercise: "Plancha (segundos)",
        kg: 0,
        reps: 25,
      },
    ],
  };
  const next = migrateState(state);
  assert.deepEqual(next.sets, state.sets);
  assert.deepEqual(next.trainingProfile, profile);
});
