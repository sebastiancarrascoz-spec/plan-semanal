import type { WorkoutSet, TrainingExercise } from "./training.ts";
export function progressionAdvice(
  records: WorkoutSet[],
  routine: string,
  ex: TrainingExercise,
  required: number,
  asOf: string,
) {
  const rows = records
    .filter(
      (x) => x.routine === routine && x.exercise === ex.name && x.date <= asOf,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = rows.at(-1);
  const result = (status: string, text: string, nextKg?: number) => ({
    status,
    text,
    nextKg,
    rule: "P03",
  });
  if (!last)
    return result(
      "sin_datos",
      "Registra tus sesiones y cómo te resultaron antes de evaluar progresión.",
    );
  const latest = rows.filter((x) => x.date === last.date);
  if (latest.some((x) => x.pain === true))
    return result(
      "dolor",
      "Hubo dolor en la última sesión: detén este ejercicio y revisa la adaptación con tu profesional.",
    );
  if (latest.some((x) => x.techniqueReviewed === false))
    return result(
      "tecnica",
      "Revisa la técnica antes de considerar un aumento.",
    );
  if (latest.some((x) => x.recovery === "mala"))
    return result(
      "recuperar",
      "La recuperación fue mala: mantén o adapta la sesión con tu profesional; no subas carga.",
    );
  if (!ex.externalLoad)
    return result(
      "mantener",
      "Conserva el rango y la técnica; revisa una variante más exigente con tu entrenador si resulta fácil.",
    );
  if (
    latest.some(
      (x) => x.reserve !== undefined && (x.reserve < 1 || x.reps < ex.min),
    )
  )
    return result(
      "revisar",
      "La última carga fue exigente o quedó bajo el rango. Revisa una reducción; no hay una cifra nueva automática.",
    );
  const dates = [...new Set(rows.map((x) => x.date))].slice(-2);
  if (dates.length < 2)
    return result(
      "mantener",
      "Falta una segunda sesión comparable; conserva la referencia y registra esfuerzo y recuperación.",
    );
  const selected = dates.map((d) =>
    rows.filter((x) => x.date === d).slice(-required),
  );
  if (selected.some((s) => s.length < required))
    return result(
      "mantener",
      "Faltan series del volumen actual en una de las dos sesiones; no se propone aumento.",
    );
  const sets = selected.flat();
  if (
    sets.some(
      (x) =>
        !x.equipment ||
        !Number.isInteger(x.reserve) ||
        x.reserve! < 0 ||
        x.reserve! > 5 ||
        typeof x.pain !== "boolean" ||
        typeof x.techniqueReviewed !== "boolean" ||
        !["bien", "regular", "mala"].includes(x.recovery || "") ||
        !Number.isFinite(x.kg) ||
        x.kg < 0,
    )
  )
    return result(
      "sin_contexto",
      "Falta equipo, esfuerzo, dolor, técnica o recuperación en las dos sesiones. No se infieren desde registros antiguos.",
    );
  if (sets.some((x) => x.equipment !== last.equipment || x.kg !== last.kg))
    return result(
      "no_comparable",
      "Las sesiones cambiaron de equipo o carga. Reúne dos sesiones comparables antes de proponer un incremento.",
    );
  if (
    sets.some(
      (x) =>
        x.reps < ex.max ||
        x.reserve! < 2 ||
        x.pain ||
        !x.techniqueReviewed ||
        x.recovery !== "bien",
    )
  )
    return result(
      "mantener",
      "Conserva la carga y completa el rango con técnica y recuperación; todavía no se cumplen las dos sesiones para considerar aumento.",
    );
  const step = last.incrementKg;
  return result(
    "considerar",
    "Dos sesiones completas y toleradas al tope del rango. Considera el menor incremento real del mismo equipo y vuelve a comprobar esfuerzo y control; la app no lo aplica automáticamente.",
    step !== undefined && Number.isFinite(step) && step > 0 && step <= 50
      ? Math.round((last.kg + step) * 100) / 100
      : undefined,
  );
}
