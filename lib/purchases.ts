import {
  generateMenu,
  generateShopping,
  foodCompatibility,
  foodForMeal,
  monday,
  dateForDay,
  seedPlan,
  type Plan,
  type Meal,
  type Shopping,
} from "./engine.ts";
export type PurchaseFormat = {
  name: string;
  unit: "g" | "ml" | "unidad";
  size: number;
  singular: string;
  plural: string;
  factor: number;
  cadence: "principal" | "fresco";
  note: string;
  source?: string;
  estimated?: boolean;
};
export type PurchaseEdit = {
  format?: Partial<PurchaseFormat>;
  havePacks?: number;
  price?: number;
  included?: boolean;
  checked?: boolean;
};
export type PurchaseBasket = { items: Record<string, PurchaseEdit> };
const format = (
  name: string,
  unit: PurchaseFormat["unit"],
  size: number,
  singular: string,
  plural: string,
  factor = 1,
  cadence: PurchaseFormat["cadence"] = "principal",
  note = "Misma unidad del plan; formato comercial sugerido y editable.",
  estimated = false,
  source?: string,
): PurchaseFormat => ({
  name,
  unit,
  size,
  singular,
  plural,
  factor,
  cadence,
  note,
  estimated,
  source,
});
// Son formatos de planificación editables, no productos ni stock de una tienda.
export const purchaseFormats: Record<string, PurchaseFormat> = {
  avena: format("Avena integral", "g", 500, "bolsa", "bolsas"),
  pan: format("Pan integral", "g", 500, "bolsa", "bolsas", 1, "fresco"),
  arroz: format(
    "Arroz integral seco",
    "g",
    1000,
    "bolsa",
    "bolsas",
    1 / 3,
    "principal",
    "Estimación inicial: 1 g seco rinde 3 g cocidos. Ajusta según tu preparación.",
    true,
  ),
  quinoa: format(
    "Quínoa seca",
    "g",
    500,
    "bolsa",
    "bolsas",
    1 / 3,
    "principal",
    "Estimación inicial: 1 g seco rinde 3 g cocidos. Ajusta según tu preparación.",
    true,
  ),
  lentejas: format(
    "Lentejas secas",
    "g",
    1000,
    "bolsa",
    "bolsas",
    453.59237 / 7,
    "principal",
    "Referencia aproximada: 1 libra seca rinde 7 tazas cocidas. El rendimiento de tu olla puede variar.",
    true,
    "https://fns-prod.azureedge.us/sites/default/files/resource-files/LentilsDry.pdf",
  ),
  porotos: format(
    "Porotos secos",
    "g",
    1000,
    "bolsa",
    "bolsas",
    453.59237 / 6,
    "principal",
    "Referencia aproximada: 1 libra seca rinde unas 6 tazas cocidas. Ajusta por variedad y preparación.",
    true,
    "https://food.unl.edu/article/how-cook-dry-beans-scratch/",
  ),
  aceite: format(
    "Aceite de oliva",
    "ml",
    500,
    "botella",
    "botellas",
    5,
    "principal",
    "Equivalencia de planificación: 1 cucharadita métrica = 5 ml.",
    false,
    "https://www.royalfree.nhs.uk/patients-and-visitors/patient-information-leaflets/kidney-patients-how-manage-your-fluid",
  ),
  nueces: format("Nueces", "g", 200, "bolsa", "bolsas"),
  soya: format("Bebida de soya sin azúcar", "ml", 1000, "caja", "cajas"),
  tofu: format("Tofu", "g", 400, "envase", "envases", 1, "fresco"),
  pollo: format("Pollo", "g", 500, "bandeja", "bandejas", 1, "fresco"),
  pescado: format("Pescado", "g", 500, "bandeja", "bandejas", 1, "fresco"),
  yogur: format(
    "Yogur natural sin azúcar",
    "g",
    170,
    "pote",
    "potes",
    1,
    "fresco",
  ),
  palta: format(
    "Palta",
    "unidad",
    1,
    "unidad",
    "unidades",
    0.01,
    "fresco",
    "Estimación inicial: una palta rinde 100 g de pulpa. Varía según tamaño; ajusta este rendimiento.",
    true,
  ),
  manzana: format("Manzana", "unidad", 1, "unidad", "unidades", 1, "fresco"),
  pera: format("Pera", "unidad", 1, "unidad", "unidades", 1, "fresco"),
  naranja: format("Naranja", "unidad", 1, "unidad", "unidades", 1, "fresco"),
  tomate: format(
    "Tomate",
    "g",
    1000,
    "kilo",
    "kilos",
    180,
    "fresco",
    "Estimación de planificación: una taza picada pesa 180 g. Ajusta al corte y al alimento de tu plan.",
    true,
  ),
  brocoli: format(
    "Brócoli",
    "g",
    500,
    "bolsa",
    "bolsas",
    90,
    "fresco",
    "Estimación de planificación: una taza de brócoli picado pesa 90 g. Ajusta si tu porción se mide cocida.",
    true,
  ),
  ensalada: format(
    "Ensalada de hojas",
    "g",
    150,
    "bolsa",
    "bolsas",
    30,
    "fresco",
    "Estimación de planificación: una taza de hojas pesa 30 g. Ajusta según la mezcla y cuánto la llenes.",
    true,
  ),
};
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(date: string, days: number) {
  return dateForDay(date, days);
}
export function periodShopping(
  plan: Plan,
  menus: Record<string, Meal[]>,
  start: string,
  days: number,
  fallback?: (week: string) => Meal[],
): { items: Shopping[]; plannedDays: number; projectedDays: number } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(new Date(start + "T12:00:00").getTime()) ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 62
  )
    throw Error("Revisa el período de compra.");
  const cache = new Map<string, Meal[]>();
  const result: Meal[] = [];
  let plannedDays = 0,
    projectedDays = 0;
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i),
      week = monday(new Date(date + "T12:00:00")),
      day = (new Date(date + "T12:00:00").getDay() + 6) % 7;
    const stored = menus[week]?.filter((m) => m.day === day);
    const compatible =
      stored?.length === 5 &&
      stored.every((m) =>
        m.foods.every((x) => foodForMeal(x.food, plan, m.slot).compatible),
      );
    if (compatible) {
      result.push(...stored!);
      plannedDays++;
    } else {
      if (!cache.has(week))
        cache.set(week, fallback ? fallback(week) : generateMenu(plan));
      result.push(...cache.get(week)!.filter((m) => m.day === day));
      projectedDays++;
    }
  }
  return { items: generateShopping(result), plannedDays, projectedDays };
}
export function getPurchaseFormat(
  item: Shopping,
  edit?: Partial<PurchaseFormat>,
): { format: PurchaseFormat; configured: boolean } {
  const id = item.id.split("|")[0];
  const original = seedPlan.foods.find(
    (f) => f.id === id && f.name === item.name && f.unit === item.unit,
  );
  const known = original ? purchaseFormats[id] : undefined;
  const simple = ["g", "ml", "unidad"].includes(item.unit);
  const base =
    known ||
    format(
      item.name,
      simple ? (item.unit as PurchaseFormat["unit"]) : "unidad",
      simple && item.unit !== "unidad" ? 500 : 1,
      "envase",
      "envases",
    );
  const f = { ...base, ...edit };
  for (const v of [f.size, f.factor])
    if (!Number.isFinite(v) || v <= 0)
      throw Error("El formato y el rendimiento deben ser mayores que cero.");
  return {
    format: f,
    configured:
      !!known || simple || !!(edit?.factor && edit?.unit && edit?.size),
  };
}
export function formatAmount(n: number, unit: string) {
  const options = { maximumFractionDigits: 2 };
  if (unit === "g" && n >= 1000)
    return `${new Intl.NumberFormat("es-CL", options).format(n / 1000)} kg`;
  if (unit === "ml" && n >= 1000)
    return `${new Intl.NumberFormat("es-CL", options).format(n / 1000)} L`;
  return `${new Intl.NumberFormat("es-CL", options).format(n)} ${unit}`;
}
export function commercialRows(
  main: Shopping[],
  fresh: Shopping[],
  basket: PurchaseBasket,
  freshKey = "",
  inventory?: { main: Shopping[]; fresh: Shopping[] },
) {
  return main.map((item) => {
    const rootEdit = basket.items[item.id] || {},
      resolved = getPurchaseFormat(item, rootEdit.format),
      f = resolved.format;
    const editKey = f.cadence === "fresco" ? `${item.id}@${freshKey}` : item.id;
    const edit =
      f.cadence === "fresco" ? basket.items[editKey] || {} : rootEdit;
    const basis =
      f.cadence === "fresco" ? fresh.find((x) => x.id === item.id) : item;
    const consumption = (basis?.quantity || 0) * f.factor;
    const shortage =
      (f.cadence === "fresco" ? inventory?.fresh : inventory?.main)?.find(
        (x) => x.id === item.id,
      )?.quantity || 0;
    const pantryCredit = inventory
      ? Math.max(0, consumption - shortage * f.factor)
      : 0;
    const havePacks = edit.havePacks || 0;
    if (
      !Number.isFinite(havePacks) ||
      havePacks < 0 ||
      (edit.price !== undefined &&
        (!Number.isFinite(edit.price) || edit.price < 0))
    )
      throw Error("Revisa las existencias y los precios.");
    const required = Math.max(
        0,
        consumption - pantryCredit - havePacks * f.size,
      ),
      packs = Math.max(0, Math.ceil((required - 1e-8) / f.size));
    const purchaseText =
      f.unit === "unidad" && f.size === 1
        ? `${packs} ${packs === 1 ? f.singular : f.plural}`
        : `${packs} ${packs === 1 ? f.singular : f.plural} de ${formatAmount(f.size, f.unit)}`;
    return {
      id: item.id,
      editKey,
      original: item,
      format: f,
      configured: resolved.configured,
      consumption,
      pantryCredit,
      havePacks,
      packs,
      purchaseText,
      totalPurchased: packs * f.size,
      leftover: Math.max(
        0,
        packs * f.size + havePacks * f.size - (consumption - pantryCredit),
      ),
      included: edit.included !== false,
      checked: !!edit.checked,
      price: edit.price,
      total: edit.price === undefined ? undefined : packs * edit.price,
    };
  });
}
export type CommercialRow = ReturnType<typeof commercialRows>[number];
export function purchaseText(
  rows: CommercialRow[],
  period: string,
  freshPeriod: string,
) {
  const included = rows.filter((x) => x.included && x.packs > 0 && !x.checked);
  if (!included.length) throw Error("No hay artículos pendientes de compra.");
  if (included.some((x) => !x.configured))
    throw Error(
      "Define la presentación de los artículos pendientes antes de copiar la lista.",
    );
  return (
    `Compra principal · ${period}\n` +
    included
      .filter((x) => x.format.cadence === "principal")
      .map((x) => `• ${x.format.name}: ${x.purchaseText}`)
      .join("\n") +
    `\n\nReposición de frescos · ${freshPeriod}\n` +
    included
      .filter((x) => x.format.cadence === "fresco")
      .map((x) => `• ${x.format.name}: ${x.purchaseText}`)
      .join("\n")
  );
}
