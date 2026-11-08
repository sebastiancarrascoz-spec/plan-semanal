export const bodyMetrics = {
  weightKg: { label: "Peso", unit: "kg", max: 500 },
  skeletalMuscleKg: {
    label: "Masa muscular esquelética",
    unit: "kg",
    max: 200,
  },
  bodyFatKg: { label: "Masa de grasa corporal", unit: "kg", max: 300 },
  bodyFatPercent: { label: "Grasa corporal", unit: "%", max: 80 },
  visceralFatLevel: {
    label: "Grasa visceral",
    unit: "nivel del equipo",
    max: 100,
  },
  waistHipRatio: { label: "Relación cintura-cadera", unit: "índice", max: 3 },
  totalBodyWaterL: { label: "Agua corporal total", unit: "L", max: 200 },
  fatFreeMassKg: { label: "Masa libre de grasa", unit: "kg", max: 400 },
  bmi: { label: "IMC del informe", unit: "kg/m²", max: 100 },
  basalMetabolicRateKcal: {
    label: "Metabolismo basal estimado",
    unit: "kcal/día",
    max: 6000,
  },
  skeletalMuscleIndex: {
    label: "Índice de músculo esquelético",
    unit: "kg/m²",
    max: 40,
  },
  phaseAngle: { label: "Ángulo de fase a 50 kHz", unit: "°", max: 20 },
  proteinKg: { label: "Proteínas corporales", unit: "kg", max: 100 },
  mineralKg: { label: "Minerales corporales", unit: "kg", max: 50 },
  score: { label: "Puntuación del equipo", unit: "puntos", max: 150 },
  heightCm: { label: "Altura del informe", unit: "cm", max: 250 },
} as const;
export type BodyMetric = keyof typeof bodyMetrics;
export const segmentLabels = {
  rightArm: "Brazo derecho",
  leftArm: "Brazo izquierdo",
  trunk: "Tronco",
  rightLeg: "Pierna derecha",
  leftLeg: "Pierna izquierda",
} as const;
export type BodyScan = {
  id: string;
  date: string;
  time?: string;
  device: string;
  source: "manual" | "importado";
  metrics: Partial<Record<BodyMetric, number>>;
  notes?: string;
  segments?: Partial<
    Record<
      keyof typeof segmentLabels,
      {
        leanKg?: number;
        leanPercent?: number;
        fatKg?: number;
        fatPercent?: number;
      }
    >
  >;
  reportTargets?: {
    targetWeightKg?: number;
    weightControlKg?: number;
    fatControlKg?: number;
    muscleControlKg?: number;
    suggestedEnergyKcal?: number;
  };
};
export function validateBodyScan(input: unknown): BodyScan {
  const x = input as any;
  if (
    !x ||
    typeof x !== "object" ||
    typeof x.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.date) ||
    new Date(x.date + "T12:00:00Z").toISOString().slice(0, 10) !== x.date
  )
    throw Error("Revisa la fecha del examen.");
  if (typeof x.device !== "string" || !x.device.trim() || x.device.length > 80)
    throw Error("Indica el equipo o método de medición.");
  if (x.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time))
    throw Error("Revisa la hora del examen.");
  const metrics: BodyScan["metrics"] = {};
  for (const key of Object.keys(bodyMetrics) as BodyMetric[]) {
    const v = x.metrics?.[key];
    if (v === undefined || v === null || v === "") continue;
    if (
      typeof v !== "number" ||
      !Number.isFinite(v) ||
      v < 0 ||
      v > bodyMetrics[key].max
    )
      throw Error(
        `Revisa ${bodyMetrics[key].label.toLowerCase()} y su unidad.`,
      );
    metrics[key] = v;
  }
  if (!Object.keys(metrics).length)
    throw Error("Ingresa al menos un resultado.");
  const result: BodyScan = {
    id: typeof x.id === "string" ? x.id.slice(0, 80) : crypto.randomUUID(),
    date: x.date,
    time: x.time || undefined,
    device: x.device.trim(),
    source: x.source === "manual" ? "manual" : "importado",
    metrics,
    notes: typeof x.notes === "string" ? x.notes.slice(0, 500) : undefined,
  };
  if (x.segments && typeof x.segments === "object") {
    result.segments = {};
    for (const segment of Object.keys(
      segmentLabels,
    ) as (keyof typeof segmentLabels)[]) {
      const raw = x.segments[segment];
      if (!raw) continue;
      const values: any = {};
      for (const k of ["leanKg", "leanPercent", "fatKg", "fatPercent"]) {
        const v = raw[k];
        if (v === undefined) continue;
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1000)
          throw Error("Revisa las unidades del análisis segmental.");
        values[k] = v;
      }
      result.segments[segment] = values;
    }
  }
  if (x.reportTargets && typeof x.reportTargets === "object") {
    result.reportTargets = {};
    for (const key of [
      "targetWeightKg",
      "weightControlKg",
      "fatControlKg",
      "muscleControlKg",
      "suggestedEnergyKcal",
    ] as const) {
      const v = x.reportTargets[key];
      if (v === undefined) continue;
      if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 10000)
        throw Error("Revisa los valores automáticos del informe.");
      result.reportTargets[key] = v;
    }
  }
  return result;
}
export function parseBodyImport(input: unknown): BodyScan[] {
  const x = input as any;
  if (
    x?.format !== "mi-semana-body-scan" ||
    x.version !== 1 ||
    !Array.isArray(x.scans) ||
    x.scans.length < 1 ||
    x.scans.length > 100
  )
    throw Error("Usa un archivo de composición corporal Mi Semana, versión 1.");
  return x.scans.map(validateBodyScan);
}
export function mergeBodyScans(
  existing: BodyScan[],
  incoming: BodyScan[],
): BodyScan[] {
  const map = new Map(
    existing.map((x) => [
      `${x.date}|${x.time || ""}|${x.device.toLowerCase()}`,
      x,
    ]),
  );
  for (const scan of incoming) {
    const x = validateBodyScan(scan),
      key = `${x.date}|${x.time || ""}|${x.device.toLowerCase()}`;
    map.set(key, { ...x, id: map.get(key)?.id || x.id });
  }
  return [...map.values()].sort((a, b) =>
    (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
  );
}
