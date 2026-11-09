export type TrainingProfile = {
  age?: number;
  weightKg?: number;
  heightCm?: number;
  experience: "inicio" | "regular";
  equipment: "gimnasio" | "casa_pesas" | "sin_equipo";
  limitations: "sin_confirmar" | "ninguna" | "revisar";
  notes: string;
  week: number;
};
export type WorkoutSet = {
  date: string;
  routine: string;
  exercise: string;
  kg: number;
  reps: number;
  equipment?: string;
  reserve?: number;
  pain?: boolean;
  techniqueReviewed?: boolean;
  techniqueSource?: "autoregistro" | "profesional";
  recovery?: "bien" | "regular" | "mala";
  incrementKg?: number;
  unit?: "reps" | "reps_lado" | "segundos";
};
export type TrainingExercise = {
  name: string;
  cue: string;
  min: number;
  max: number;
  eachSide?: boolean;
  externalLoad: boolean;
};
export const trainingDefaults: TrainingProfile = {
  experience: "inicio",
  equipment: "gimnasio",
  limitations: "sin_confirmar",
  notes: "",
  week: 1,
};
export const equipmentLabels = {
  gimnasio: "Gimnasio con máquinas y pesas",
  casa_pesas: "Casa con mancuernas y banda",
  sin_equipo: "Casa sin equipamiento",
};
export const trainingSources = [
  {
    name: "CDC: actividad y fuerza en adultos",
    url: "https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html",
  },
  {
    name: "NIDDK: actividad según tus capacidades",
    url: "https://www.niddk.nih.gov/health-information/weight-management/staying-active-at-any-size",
  },
];
export function validateTrainingProfile(p: TrainingProfile): TrainingProfile {
  if (
    !p ||
    !["inicio", "regular"].includes(p.experience) ||
    !Object.keys(equipmentLabels).includes(p.equipment) ||
    !["sin_confirmar", "ninguna", "revisar"].includes(p.limitations)
  )
    throw Error("Revisa las opciones de tu perfil de entrenamiento.");
  for (const [key, min, max] of [
    ["age", 18, 100],
    ["weightKg", 30, 350],
    ["heightCm", 100, 230],
  ] as const) {
    const n = p[key];
    if (
      n !== undefined &&
      (!Number.isFinite(n) ||
        n < min ||
        n > max ||
        (key === "age" && !Number.isInteger(n)))
    )
      throw Error(
        `Revisa ${key === "age" ? "la edad (18–100 años)" : key === "weightKg" ? "el peso en kg" : "la altura en cm"}.`,
      );
  }
  if (!Number.isInteger(p.week) || p.week < 1 || p.week > 12)
    throw Error("La semana del ciclo debe estar entre 1 y 12.");
  return { ...p, notes: String(p.notes || "").slice(0, 500) };
}
function exercise(
  name: string,
  cue: string,
  externalLoad = true,
  eachSide = false,
): TrainingExercise {
  return {
    name,
    cue,
    externalLoad,
    min: eachSide ? 6 : 8,
    max: eachSide ? 10 : 12,
    eachSide,
  };
}
const bridge = exercise(
  "Puente de glúteos en colchoneta",
  "Pies apoyados; eleva la pelvis sin arquear la espalda.",
  false,
);
const sit = exercise(
  "Sentarse y levantarse de un banco",
  "Banco firme; apoya los pies y levántate sin impulso. Usa apoyo si lo necesitas.",
  false,
);
const dead = exercise(
  "Dead bug",
  "Boca arriba, mueve brazo y pierna contrarios sin despegar la zona lumbar.",
  false,
  true,
);
const bird = exercise(
  "Bird dog",
  "En cuatro apoyos, extiende brazo y pierna contrarios sin girar el tronco.",
  false,
  true,
);
const wall = exercise(
  "Flexiones en pared",
  "Manos a la altura del pecho; cuerpo alineado. Acércate a la pared para facilitarlo.",
  false,
);
export function buildTrainingPlan(profile: TrainingProfile) {
  const p = validateTrainingProfile(profile);
  const needsReview = p.limitations !== "ninguna";
  const sets =
    p.experience === "inicio" ? (p.week <= 2 ? 1 : 2) : p.week <= 4 ? 2 : 3;
  const phase =
    p.week <= 4
      ? "Familiarización"
      : p.week <= 8
        ? "Progresión"
        : "Consolidación";
  let a: TrainingExercise[], b: TrainingExercise[];
  if (p.equipment === "gimnasio") {
    a = [
      exercise(
        "Prensa de piernas",
        "Ajusta el asiento; baja hasta un rango cómodo y no bloquees las rodillas.",
      ),
      exercise(
        "Press de pecho en máquina",
        "Ajusta los agarres a la altura del pecho y mantén la espalda apoyada.",
      ),
      exercise(
        "Remo sentado en máquina",
        "Lleva los codos hacia atrás sin balancear el tronco.",
      ),
      bridge,
      dead,
    ];
    b = [
      sit,
      exercise(
        "Jalón al pecho",
        "Lleva la barra hacia la parte alta del pecho, sin tirones ni detrás del cuello.",
      ),
      exercise(
        "Press de hombros en máquina",
        "Espalda apoyada; empuja solo en un rango cómodo, sin arquear la espalda.",
      ),
      exercise(
        "Curl femoral en máquina",
        "Ajusta el rodillo; flexiona las rodillas con control, sin mover la pelvis.",
      ),
      bird,
    ];
  } else if (p.equipment === "casa_pesas") {
    a = [
      sit,
      wall,
      exercise(
        "Remo con mancuerna con apoyo",
        "Apoya una mano en una superficie firme y lleva el codo hacia atrás.",
        true,
        true,
      ),
      bridge,
      dead,
    ];
    b = [
      exercise(
        "Sentadilla a banco con mancuerna",
        "Sostén una mancuerna frente al pecho; toca un banco firme y vuelve a subir.",
      ),
      exercise(
        "Press de pecho con mancuernas en el suelo",
        "Boca arriba, rodillas flexionadas; baja los codos con control.",
      ),
      exercise(
        "Remo con banda bajo los pies",
        "Pisa el centro de una banda en buen estado; tira de sus extremos sin balancearte.",
      ),
      bridge,
      bird,
    ];
  } else {
    a = [
      sit,
      wall,
      exercise(
        "Deslizamientos de brazos en pared",
        "Desliza los brazos hacia arriba con suavidad; es movilidad, no reemplaza un remo con resistencia.",
        false,
      ),
      bridge,
      dead,
    ];
    b = [
      sit,
      wall,
      exercise(
        "Elevación de talones con apoyo",
        "Sujétate de un apoyo firme; sube y baja los talones lentamente.",
        false,
      ),
      bridge,
      bird,
    ];
  }
  return {
    profile: p,
    sets,
    phase,
    needsReview,
    personalized:
      p.age !== undefined && p.weightKg !== undefined && !needsReview,
    rest:
      p.age !== undefined && p.age >= 65
        ? "90–120 s, o más hasta recuperar una respiración cómoda"
        : "60–90 s; hasta 120 s si lo necesitas",
    duration:
      sets === 1
        ? "25–35 minutos"
        : sets === 2
          ? "35–45 minutos"
          : "45–55 minutos",
    effort:
      "Termina cada serie sintiendo que podrías hacer 2–3 repeticiones más, con buena técnica. No busques el fallo.",
    routines: needsReview
      ? { A: [] as TrainingExercise[], B: [] as TrainingExercise[] }
      : { A: a, B: b },
  };
}
export function lastTrainingSet(
  sets: WorkoutSet[],
  routine: string,
  exerciseName: string,
  asOf: string,
) {
  return sets
    .filter(
      (x) =>
        x.routine === routine && x.exercise === exerciseName && x.date <= asOf,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}
export function canProgress(
  sets: WorkoutSet[],
  ex: TrainingExercise,
  required: number,
) {
  if (!ex.externalLoad || sets.length < required) return false;
  const completed = sets.slice(-required);
  return completed.every(
    (x) =>
      Number.isFinite(x.kg) &&
      x.kg > 0 &&
      x.kg === completed[0].kg &&
      x.reps >= ex.max,
  );
}

import {
  assessedPrescription,
  type TrainingAssessment,
} from "./calibration.ts";
export function startingPrescription(
  ex: TrainingExercise,
  p: TrainingProfile,
  previous?: WorkoutSet,
  assessment?: TrainingAssessment,
) {
  if (assessment || !ex.externalLoad)
    return assessedPrescription(ex, assessment);
  return {
    reps: ex.min,
    kg: undefined,
    status: "pendiente",
    kind: "calibrar",
    label: previous
      ? `Registro previo: ${previous.kg} kg; falta evaluar esfuerzo, equipo y técnica antes de recomendarlo`
      : "Pendiente: registra tu primera prueba de carga, autoguiada o acompañada",
  };
}
