import { bodyConditionFields, type BodyScan } from "./body.ts";
export function bodyComparison(a: BodyScan, b: BodyScan) {
  if (a.device.trim().toLowerCase() !== b.device.trim().toLowerCase())
    return {
      status: "equipo",
      text: "Equipos distintos: no interpretes sus diferencias como evolución directa.",
    };
  if (
    [a, b].some(
      (x) =>
        x.conditions?.recentExercise === "si" ||
        x.conditions?.usualHydration === "no",
    )
  )
    return {
      status: "variables",
      text: "Se declararon ejercicio reciente o hidratación distinta de la habitual. Pueden afectar la comparación.",
    };
  const keys = Object.keys(
    bodyConditionFields,
  ) as (keyof typeof bodyConditionFields)[];
  if (
    keys.some(
      (k) =>
        !a.conditions?.[k] ||
        a.conditions[k] === "no_registrado" ||
        !b.conditions?.[k] ||
        b.conditions[k] === "no_registrado",
    )
  )
    return {
      status: "incompleto",
      text: "Faltan condiciones de medición. La diferencia numérica no confirma un cambio real de tejido.",
    };
  if (keys.some((k) => a.conditions![k] !== b.conditions![k]))
    return {
      status: "diferencias",
      text: "Las condiciones declaradas son diferentes; revisa la comparación con tu profesional.",
    };
  return {
    status: "similares",
    text: "Mismo equipo y condiciones declaradas similares. Sigue existiendo variabilidad; interpreta la tendencia con tu profesional, sin un umbral universal de cambio.",
  };
}
