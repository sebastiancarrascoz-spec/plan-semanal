export const PROTOCOL_VERSION = "2026.11.09-0.8.0";
export const evidenceSources = {
  acsm: {
    title: "ACSM 2026 · entrenamiento de resistencia",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/",
    population: "Adultos sanos; no sustituye ajustes clínicos individuales",
    type: "Síntesis de revisiones de ensayos",
  },
  who: {
    title: "OMS · actividad física",
    url: "https://www.who.int/initiatives/behealthy/physical-activity",
    population: "Recomendaciones poblacionales para adultos",
    type: "Guía de salud pública",
  },
  rir: {
    title: "Steele et al. · precisión de repeticiones en reserva",
    url: "https://pubmed.ncbi.nlm.nih.gov/29204323/",
    population:
      "Participantes de un estudio de entrenamiento; percepción con error",
    type: "Estudio de estimación del esfuerzo",
  },
  bia: {
    title: "Reproducibilidad y variabilidad de bioimpedancia",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11649400/",
    population:
      "Estudio con InBody 770; no transferir sus umbrales a otros modelos",
    type: "Estudio de medición",
  },
  inbody: {
    title: "InBody · condiciones de medición",
    url: "https://inbodyusa.com/general/inbody-test/",
    population: "Usuarios de equipos InBody",
    type: "Instrucciones del fabricante; no evidencia independiente",
  },
};
export const protocolRules = [
  {
    id: "P01",
    title: "Fuerza individualizada",
    kind: "Evidencia general",
    text: "El entrenamiento se adapta a objetivos y capacidad. Decisión explícita de la app: no extrapolar cargas externas desde el InBody sin evaluar el movimiento.",
    sources: ["acsm"],
  },
  {
    id: "P02",
    title: "Calibración submáxima",
    kind: "Decisión de la plantilla",
    text: "Probamos el rango de la rutina sin exigir 1RM. La reserva es aproximada: 2–3 orienta el esfuerzo, pero una reserva mayor no invalida un inicio suave. El entrenador revisa la técnica.",
    sources: ["acsm", "rir"],
  },
  {
    id: "P03",
    title: "Progresión conservadora",
    kind: "Decisión de la plantilla",
    text: "Solo sugerimos considerar un incremento tras dos días distintos, con las series previstas completas al tope del rango, mismo equipo y carga, sin dolor, técnica revisada y buena recuperación. Si se conoce el incremento real del equipo, mostramos el siguiente escalón como propuesta, sin aplicarlo.",
    sources: ["acsm", "rir"],
  },
  {
    id: "P04",
    title: "Volumen gradual",
    kind: "Decisión de la plantilla",
    text: "Las fases y series iniciales son una plantilla editable, no una dosis universal ni un aumento obligatorio por calendario. Se revisan según tolerancia.",
    sources: ["acsm"],
  },
  {
    id: "P05",
    title: "Aeróbico y sedentarismo",
    kind: "Evidencia general",
    text: "La referencia poblacional es al menos 150 minutos moderados o 75 vigorosos por semana, además de fuerza al menos dos días. Para empezar se puede fijar una meta menor. Las pausas de estar sentado se registran aparte.",
    sources: ["who"],
  },
  {
    id: "P06",
    title: "Condiciones comparables",
    kind: "Evidencia de medición",
    text: "Equipo, horario, hidratación y ejercicio reciente pueden afectar la comparación de bioimpedancia. Una diferencia no demuestra por sí sola un cambio real de músculo o grasa. No usamos un umbral universal de cambio mínimo.",
    sources: ["bia", "inbody"],
  },
  {
    id: "P07",
    title: "Revisión y resultados",
    kind: "Decisión de producto",
    text: "Una revisión declarada registra autor, ámbito, fecha y versión exacta del plan. No verificamos credenciales ni emitimos firma clínica. El resumen describe evolución y cobertura de registros, sin atribuir causalidad a la app.",
    sources: [],
  },
] as const;
export type ReviewRecord = {
  id: string;
  date: string;
  name: string;
  role: "nutricionista" | "kinesiologo" | "entrenador" | "medico";
  scope: "alimentacion" | "entrenamiento";
  outcome: "revisado" | "ajustes";
  notes: string;
  recordedBy: "usuario" | "profesional";
  snapshot: string;
  protocol: string;
};
function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => JSON.stringify(k) + ":" + canonical(x))
        .join(",") +
      "}"
    );
  return JSON.stringify(v) ?? "null";
}
export function reviewSnapshot(
  scope: ReviewRecord["scope"],
  plan: unknown,
  training: unknown,
) {
  return canonical({
    scope,
    protocol: PROTOCOL_VERSION,
    content: scope === "alimentacion" ? plan : training,
  });
}
export function validateReview(r: ReviewRecord, today: string) {
  if (
    !r.name.trim() ||
    r.name.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
    !Number.isFinite(Date.parse(r.date + "T12:00:00Z")) ||
    new Date(r.date + "T12:00:00Z").toISOString().slice(0, 10) !== r.date ||
    r.date > today
  )
    throw Error("Revisa nombre y fecha de la revisión.");
  if (
    !["alimentacion", "entrenamiento"].includes(r.scope) ||
    !["nutricionista", "kinesiologo", "entrenador", "medico"].includes(
      r.role,
    ) ||
    !["revisado", "ajustes"].includes(r.outcome) ||
    !["usuario", "profesional"].includes(r.recordedBy)
  )
    throw Error("Revisa ámbito y responsable.");
  if (r.scope === "alimentacion" && r.role !== "nutricionista")
    throw Error("La revisión alimentaria se registra con nutricionista.");
  if (r.scope === "entrenamiento" && r.role === "nutricionista")
    throw Error(
      "Registra la revisión de entrenamiento con el rol de entrenamiento, kinesiología o medicina correspondiente.",
    );
  return { ...r, name: r.name.trim(), notes: r.notes.slice(0, 1000) };
}
export function currentReview(records: ReviewRecord[], snapshot: string) {
  return records
    .filter((r) => r.snapshot === snapshot && r.protocol === PROTOCOL_VERSION)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}
