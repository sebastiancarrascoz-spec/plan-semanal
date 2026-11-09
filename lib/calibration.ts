import type { TrainingExercise } from "./training.ts";
export type TrainingAssessment = {
  id: string;
  date: string;
  routine: "A" | "B";
  exercise: string;
  equipment: string;
  kg: number;
  reps: number;
  reserve: number;
  pain: boolean;
  techniqueReviewed: boolean;
  techniqueSource?: "autoregistro" | "profesional";
};
export function validateAssessment(a: TrainingAssessment, today: string) {
  const time = Date.parse(a.date + "T12:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(a.date) ||
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== a.date ||
    a.date > today
  )
    throw Error("Usa una fecha real de hoy o anterior.");
  if (
    !["A", "B"].includes(a.routine) ||
    !a.exercise?.trim() ||
    !a.equipment?.trim()
  )
    throw Error("Identifica el ejercicio y la máquina o implemento.");
  if (
    !Number.isFinite(a.kg) ||
    a.kg < 0 ||
    a.kg > 500 ||
    !Number.isInteger(a.reps) ||
    a.reps < 1 ||
    a.reps > 30 ||
    !Number.isInteger(a.reserve) ||
    a.reserve < 0 ||
    a.reserve > 5 ||
    typeof a.pain !== "boolean" ||
    typeof a.techniqueReviewed !== "boolean" ||
    (a.techniqueSource !== undefined &&
      !["autoregistro", "profesional"].includes(a.techniqueSource))
  )
    throw Error("Revisa kg, repeticiones, esfuerzo y técnica.");
  return {
    ...a,
    exercise: a.exercise.trim().slice(0, 100),
    equipment: a.equipment.trim().slice(0, 100),
  };
}
export function latestAssessment(
  records: TrainingAssessment[],
  routine: string,
  exercise: string,
  asOf: string,
) {
  return records
    .filter(
      (a) => a.routine === routine && a.exercise === exercise && a.date <= asOf,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}
export function assessedPrescription(
  ex: TrainingExercise,
  a?: TrainingAssessment,
) {
  if (!ex.externalLoad)
    return {
      status: "sin_carga",
      kg: 0,
      reps: ex.min,
      label: "Peso corporal · 0 kg externos",
    };
  if (!a)
    return {
      status: "pendiente",
      kg: undefined,
      reps: ex.min,
      label: "Falta calibrar: todavía no hay una carga personal comprobada",
    };
  if (a.exercise !== ex.name)
    return {
      status: "pendiente",
      kg: undefined,
      reps: ex.min,
      label: "La prueba no corresponde a este ejercicio",
    };
  try {
    validateAssessment(a, "9999-12-31");
  } catch {
    return {
      status: "revisar",
      kg: undefined,
      reps: ex.min,
      label: "Revisa los datos de la evaluación",
    };
  }
  if (a.pain)
    return {
      status: "dolor",
      kg: undefined,
      reps: ex.min,
      label: `Hubo dolor en ${a.equipment}: detén ese ejercicio y revisa la adaptación con tu profesional`,
    };
  if (!a.techniqueReviewed)
    return {
      status: "tecnica",
      kg: undefined,
      reps: ex.min,
      label:
        "Falta comprobar el control del movimiento. Revisa las indicaciones; si no puedes confirmar la técnica, pide ayuda antes de fijar una carga",
    };
  if (a.reps < ex.min || a.reserve < 2)
    return {
      status: "reducir",
      kg: undefined,
      reps: ex.min,
      label: `${a.kg} kg resultaron exigentes en ${a.equipment}; reduce la carga y registra otra prueba sin dolor y con movimiento controlado`,
    };
  if (a.reps > ex.max)
    return {
      status: "ajustar",
      kg: undefined,
      reps: ex.min,
      label: `Prueba ${a.kg} kg × ${ex.min} en ${a.equipment} para comparar; si sigue muy fácil, evalúa el menor incremento real sin llegar al fallo`,
    };
  return {
    status: "comprobada",
    kg: a.kg,
    reps: a.reps,
    label: `Referencia registrada: ${a.kg} kg × ${a.reps} reps · SOLO ${a.equipment} · evaluación ${a.date}. ${a.techniqueSource === "autoregistro" ? "Autorregistro; la app no observó la técnica." : a.techniqueSource === "profesional" ? "Revisión profesional declarada, no verificada por la app." : "Origen de la revisión técnica no registrado."} Reserva estimada: ${a.reserve === 5 ? "5 o más" : a.reserve}. ${a.reserve > 3 ? "Inicio suave; revisa la dificultad en la próxima sesión." : "Revisa el esfuerzo en cada sesión."}`,
  };
}
