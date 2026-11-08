import {
  foodCompatibility,
  foodForMeal,
  generateMenu,
  generateShopping,
  monday,
  dateForDay,
  slots,
  type Food,
  type Meal,
  type Plan,
  type Shopping,
} from "./engine.ts";
import { addDays, getPurchaseFormat } from "./purchases.ts";
export type PantryLot = {
  id: string;
  foodId: string;
  foodName: string;
  planUnit: string;
  quantity: number;
  unit: string;
  planUnitsPerUnit: number;
  location: "despensa" | "refrigerador" | "congelador";
  addedOn: string;
  expiresOn?: string;
  note?: string;
};
export type PreparedBatch = {
  id: string;
  name: string;
  meal: Meal;
  servings: number;
  preparedOn: string;
  expiresOn: string;
  location: "refrigerador" | "congelador";
};
export type KitchenEvent = {
  moves: { lotId: string; amount: number; foodId: string }[];
  batchId?: string;
  missing: Shopping[];
};
export type RecipeOption = {
  id: string;
  title: string;
  meal: Meal;
  steps: string[];
  timeLabel: string;
  covered: number;
  total: number;
  missing: Shopping[];
  soon: boolean;
  batchId?: string;
  score: number;
};
const round = (n: number) => Math.round(n * 1e6) / 1e6;
export function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(value + "T12:00:00Z").getTime()) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function validateLot(lot: PantryLot) {
  if (
    !lot.id ||
    !lot.foodId ||
    !lot.foodName ||
    !lot.unit ||
    !lot.planUnit ||
    !Number.isFinite(lot.quantity) ||
    lot.quantity < 0 ||
    !Number.isFinite(lot.planUnitsPerUnit) ||
    lot.planUnitsPerUnit <= 0 ||
    !isValidDate(lot.addedOn) ||
    (lot.expiresOn && !isValidDate(lot.expiresOn)) ||
    !["despensa", "refrigerador", "congelador"].includes(lot.location)
  )
    throw Error("Revisa el alimento, la cantidad y las fechas de la despensa.");
  return lot;
}
export function usableLot(lot: PantryLot, food: Food, date: string) {
  return (
    lot.quantity > 0 &&
    lot.foodId === food.id &&
    lot.foodName === food.name &&
    lot.planUnit === food.unit &&
    lot.addedOn <= date &&
    (!lot.expiresOn || lot.expiresOn >= date)
  );
}
export function pantryAvailable(lots: PantryLot[], food: Food, date: string) {
  return lots
    .filter((l) => usableLot(l, food, date))
    .reduce((n, l) => n + l.quantity * l.planUnitsPerUnit, 0);
}
export function consumeIngredients(
  meal: Meal,
  lots: PantryLot[],
  date: string,
  servings = 1,
): { pantry: PantryLot[]; event: KitchenEvent } {
  if (!Number.isFinite(servings) || servings <= 0)
    throw Error("Indica una cantidad de porciones válida.");
  const pantry = lots.map((x) => ({ ...x })),
    moves: KitchenEvent["moves"] = [],
    missing: Shopping[] = [];
  for (const x of meal.foods) {
    let need = x.food.quantity * x.portions * servings;
    const available = pantry
      .filter((l) => usableLot(l, x.food, date))
      .sort(
        (a, b) =>
          (a.expiresOn || "9999-12-31").localeCompare(
            b.expiresOn || "9999-12-31",
          ) || a.addedOn.localeCompare(b.addedOn),
      );
    for (const lot of available) {
      if (need <= 1e-6) break;
      const amount = Math.min(lot.quantity, need / lot.planUnitsPerUnit);
      lot.quantity = round(Math.max(0, lot.quantity - amount));
      need = Math.max(0, need - amount * lot.planUnitsPerUnit);
      moves.push({ lotId: lot.id, amount, foodId: lot.foodId });
    }
    if (need > 1e-5)
      missing.push({
        id: x.food.id + "|" + x.food.unit,
        name: x.food.name,
        quantity: round(need),
        unit: x.food.unit,
        section: x.food.section,
      });
  }
  return { pantry, event: { moves, missing } };
}
export function undoKitchenEvent(
  lots: PantryLot[],
  batches: PreparedBatch[],
  event: KitchenEvent,
) {
  return {
    pantry: lots.map((l) => ({
      ...l,
      quantity: round(
        l.quantity +
          event.moves
            .filter((m) => m.lotId === l.id && m.foodId === l.foodId)
            .reduce((n, m) => n + m.amount, 0),
      ),
    })),
    batches: batches.map((b) => ({
      ...b,
      servings: b.servings + (b.id === event.batchId ? 1 : 0),
    })),
  };
}
export function batchFits(
  batch: PreparedBatch,
  plan: Plan,
  slot: number,
  date: string,
) {
  if (
    batch.servings < 1 ||
    batch.preparedOn > date ||
    batch.expiresOn < date ||
    !batch.meal.foods.length
  )
    return false;
  if (
    batch.meal.foods.some(
      (x) =>
        !foodForMeal(x.food, plan, slot).compatible ||
        !plan.foods.some(
          (f) =>
            f.id === x.food.id &&
            f.name === x.food.name &&
            f.unit === x.food.unit &&
            f.quantity === x.food.quantity &&
            foodForMeal(f, plan, slot).compatible,
        ),
    )
  )
    return false;
  return plan.groups.every(
    (g) =>
      Math.abs(
        batch.meal.foods
          .filter((x) => x.food.group === g.name)
          .reduce((n, x) => n + x.portions, 0) - g.distribution[slot],
      ) < 1e-6,
  );
}
export function consumeMeal(
  meal: Meal,
  lots: PantryLot[],
  batches: PreparedBatch[],
  plan: Plan,
  date: string,
) {
  if (meal.preparedBatchId) {
    const batch = batches.find((b) => b.id === meal.preparedBatchId);
    if (
      !batch ||
      !batchFits(batch, plan, meal.slot, date) ||
      signature(batch.meal) !== signature(meal)
    )
      throw Error(
        "La porción preparada ya no está disponible para esta comida. Elige otra opción.",
      );
    return {
      pantry: lots,
      batches: batches.map((b) =>
        b.id === batch.id ? { ...b, servings: b.servings - 1 } : b,
      ),
      event: { moves: [], missing: [], batchId: batch.id } as KitchenEvent,
    };
  }
  const result = consumeIngredients(meal, lots, date);
  return { ...result, batches };
}
export function prepareBatch(
  meal: Meal,
  lots: PantryLot[],
  input: Omit<PreparedBatch, "meal" | "id">,
) {
  if (
    !Number.isInteger(input.servings) ||
    input.servings < 1 ||
    input.servings > 12 ||
    !isValidDate(input.preparedOn) ||
    !isValidDate(input.expiresOn) ||
    input.expiresOn < input.preparedOn ||
    !input.name.trim() ||
    !meal.foods.length
  )
    throw Error(
      "Revisa las porciones, el nombre y las fechas de la preparación.",
    );
  const { pantry, event } = consumeIngredients(
    meal,
    lots,
    input.preparedOn,
    input.servings,
  );
  const clean = { ...meal, preparedBatchId: undefined };
  return {
    pantry,
    event,
    batch: { ...input, id: crypto.randomUUID(), meal: clean } as PreparedBatch,
  };
}
export function mealSteps(meal: Meal, kind = "bowl") {
  const ids = meal.foods.map((x) => x.food.id),
    steps: string[] = [];
  if (ids.some((id) => ["arroz", "quinoa", "lentejas", "porotos"].includes(id)))
    steps.push(
      "Usa los cereales y las legumbres ya cocidos. Si están secos, cocínalos primero siguiendo el envase.",
    );
  if (ids.includes("pollo"))
    steps.push(
      "Cocina el pollo hasta alcanzar 74 °C en el centro, comprobados con termómetro.",
    );
  if (ids.includes("pescado"))
    steps.push(
      "Cocina el pescado hasta alcanzar 63 °C en el centro, comprobados con termómetro.",
    );
  if (ids.includes("tofu") && kind !== "salteado")
    steps.push(
      "Prepara el tofu según su envase; puedes dorarlo usando solo el aceite asignado en esta comida.",
    );
  if (ids.includes("avena"))
    steps.push(
      "Hidrata o cocina la avena siguiendo el envase; sirve la bebida o el yogur en la cantidad indicada.",
    );
  if (ids.includes("pan"))
    steps.push(
      "Tuesta o sirve el pan y distribuye los acompañamientos indicados.",
    );
  if (meal.foods.some((x) => x.food.group === "Verduras"))
    steps.push(
      "Lava las verduras. Cocina las que lo requieran y sirve las cantidades indicadas.",
    );
  if (kind === "guiso")
    steps.push(
      "Corta las verduras asignadas y cocínalas con una parte del aceite indicado, o con un poco de agua si esta comida no tiene aceite. Añade las legumbres ya cocidas y agua hasta lograr la consistencia de un guiso. Sirve el cereal como acompañamiento.",
    );
  if (kind === "salteado")
    steps.push(
      "Corta el tofu y las verduras en trozos. Dóralos en una sartén con el aceite asignado; si no hay aceite en este turno, usa una sartén antiadherente y un poco de agua. Incorpora el cereal ya cocido al final o sírvelo al lado.",
    );
  if (kind === "horno")
    steps.push(
      "Sirve la proteína cocinada al horno con las verduras y el cereal indicado. Puedes repartir el aceite asignado entre la bandeja y las verduras; no añadas ingredientes fuera de la lista.",
    );
  if (kind === "ensalada_tibia")
    steps.push(
      "Mezcla el cereal y la proteína ya preparados con las verduras lavadas. Incorpora el aceite y la grasa asignados como aderezo o acompañamiento. Sirve los ingredientes tibios con las hojas frescas al final.",
    );
  if (kind === "sandwich")
    steps.push(
      "Distribuye la proteína preparada y las verduras indicadas sobre el pan. Sirve al lado la verdura que no quepa dentro. Usa el aceite y la grasa asignados en la preparación o el acompañamiento.",
    );
  steps.push(
    kind === "snack"
      ? "Porciona los alimentos indicados; puedes servir la fruta y el acompañamiento por separado."
      : "Monta el plato con las cantidades de cada grupo. Usa únicamente la grasa y el aceite asignados; sirve la fruta o bebida aparte si corresponde.",
  );
  return steps;
}
export const recipeFamilyLabels = {
  guiso: "Guiso de legumbres",
  salteado: "Salteado",
  horno: "Plato al horno",
  ensalada_tibia: "Ensalada tibia",
  sandwich: "Sándwich",
  bowl: "Plato combinado",
  tostadas: "Tostadas",
  avena: "Avena",
  snack: "Colación",
} as const;
export type RecipeKind = keyof typeof recipeFamilyLabels;
type Kind = RecipeKind;
const templates: {
  kind: Kind;
  slots: number[];
  carbs?: string[];
  protein?: string[];
  fat?: string[];
  vegetables?: string[];
  priority?: number;
}[] = [
  {
    kind: "guiso",
    slots: [2, 4],
    carbs: ["arroz", "quinoa"],
    protein: ["lentejas", "porotos"],
    vegetables: ["tomate", "brocoli"],
    priority: 90,
  },
  {
    kind: "salteado",
    slots: [2, 4],
    carbs: ["arroz", "quinoa"],
    protein: ["tofu"],
    vegetables: ["brocoli", "tomate"],
    priority: 90,
  },
  {
    kind: "horno",
    slots: [2, 4],
    carbs: ["arroz", "quinoa"],
    protein: ["pollo", "pescado", "tofu"],
    vegetables: ["brocoli", "tomate"],
    priority: 90,
  },
  {
    kind: "ensalada_tibia",
    slots: [2, 4],
    carbs: ["arroz", "quinoa"],
    protein: ["lentejas", "porotos", "tofu", "pollo", "pescado"],
    vegetables: ["ensalada", "tomate"],
    priority: 80,
  },
  {
    kind: "sandwich",
    slots: [2, 4],
    carbs: ["pan"],
    protein: ["tofu", "pollo", "pescado"],
    vegetables: ["ensalada", "tomate"],
    priority: 60,
  },
  {
    kind: "avena",
    slots: [0],
    carbs: ["avena"],
    protein: ["soya", "yogur"],
    fat: ["nueces", "palta"],
  },
  {
    kind: "tostadas",
    slots: [0, 2, 4],
    carbs: ["pan"],
    protein: ["tofu", "pollo", "pescado", "soya", "yogur"],
    fat: ["palta", "nueces"],
  },
  {
    kind: "bowl",
    slots: [0, 2, 4],
    carbs: ["arroz", "quinoa"],
    protein: ["lentejas", "porotos", "tofu", "pollo", "pescado"],
  },
  { kind: "snack", slots: [1, 3] },
];
function titleFor(meal: Meal, kind: Kind) {
  const protein = meal.foods
      .find((x) => x.food.group === "Proteínas")
      ?.food.name.toLowerCase()
      .replace(/\s+cocid[oa]s?$/, ""),
    carb = meal.foods
      .find((x) => x.food.group === "Carbohidratos")
      ?.food.name.toLowerCase()
      .replace(/\s+cocid[oa]s?$/, ""),
    fruit = meal.foods
      .find((x) => x.food.group === "Frutas")
      ?.food.name.toLowerCase();
  if (kind === "tostadas")
    return "Pan integral con " + (protein || "acompañamientos de tu plan");
  if (kind === "avena")
    return "Avena con " + (protein || "acompañamientos de tu plan");
  if (kind === "snack")
    return (
      [fruit, protein].filter(Boolean).join(" + ") || "Colación según tu plan"
    );
  const side = carb ? " con " + carb : "";
  if (kind === "guiso") return "Guiso de " + (protein || "legumbres") + side;
  if (kind === "salteado")
    return (
      (protein ? "Salteado de " + protein : "Salteado") + " y verduras" + side
    );
  if (kind === "horno")
    return (
      (protein ? protein[0].toUpperCase() + protein.slice(1) : "Proteína") +
      " al horno" +
      side
    );
  if (kind === "ensalada_tibia")
    return "Ensalada tibia de " + (protein || "verduras") + side;
  if (kind === "sandwich")
    return "Sándwich de " + (protein || "tu plan") + " con verduras";
  return protein
    ? "Bowl de " + protein + (carb ? " con " + carb : "")
    : "Plato con las porciones de tu plan";
}
const signature = (meal: Meal) =>
  meal.foods
    .map((x) => x.food.id + ":" + x.portions)
    .sort()
    .join("|");
export function recipeOptions(
  plan: Plan,
  slot: number,
  lots: PantryLot[],
  batches: PreparedBatch[],
  date: string,
  family?: RecipeKind,
): RecipeOption[] {
  const candidates: RecipeOption[] = [];
  for (const template of templates.filter(
    (t) => t.slots.includes(slot) && (!family || t.kind === family),
  )) {
    if (
      ["avena", "tostadas", "sandwich"].includes(template.kind) &&
      !plan.groups.find((g) => g.name === "Carbohidratos")?.distribution[slot]
    )
      continue;
    for (let variant = 0; variant < 5; variant++) {
      const foods: Meal["foods"] = [];
      let valid = true;
      for (const g of plan.groups) {
        const portions = g.distribution[slot];
        if (!portions) continue;
        let pool = plan.foods.filter(
          (f) => f.group === g.name && foodForMeal(f, plan, slot).compatible,
        );
        const ids =
          g.name === "Carbohidratos"
            ? template.carbs
            : g.name === "Proteínas"
              ? template.protein
              : g.name === "Grasas"
                ? template.fat
                : g.name === "Verduras"
                  ? template.vegetables
                  : undefined;
        if (ids) {
          pool = pool.filter((f) => ids.includes(f.id));
        }
        if (!pool.length) {
          valid = false;
          break;
        }
        pool.sort((a, b) => {
          const score = (f: Food) =>
            Math.min(
              1,
              pantryAvailable(lots, f, date) / (f.quantity * portions),
            ) *
              100 +
            (plan.preferredFoodIds?.includes(f.id) ? 10 : 0) +
            (f.priority ? 3 : 0);
          return score(b) - score(a) || a.name.localeCompare(b.name);
        });
        const f =
          pool[variant === 0 ? 0 : (variant + foods.length) % pool.length];
        foods.push({ food: f, portions });
      }
      if (!valid || !foods.length) continue;
      const meal: Meal = {
        id: `recipe-${template.kind}-${variant}`,
        day: 0,
        slot,
        foods,
        recipeKind: template.kind,
      };
      const consumed = consumeIngredients(meal, lots, date),
        total = foods.length,
        covered = total - consumed.event.missing.length,
        soon = lots.some(
          (l) =>
            l.expiresOn &&
            l.expiresOn >= date &&
            l.expiresOn <= addDays(date, 3) &&
            foods.some((x) => usableLot(l, x.food, date)),
        );
      candidates.push({
        id: meal.id,
        title: titleFor(meal, template.kind),
        meal,
        steps: mealSteps(meal, template.kind),
        timeLabel:
          (
            {
              guiso: "Guiso: legumbres y cereal cocidos previamente",
              salteado: "Salteado: cereal cocido previamente",
              horno: "Horno: tiempo según tamaño y cocción; guarnición aparte",
              ensalada_tibia: "Montaje: cereal y proteína preparados",
              sandwich: "Montaje: proteína preparada",
            } as Partial<Record<Kind, string>>
          )[template.kind] ||
          (template.kind === "snack"
            ? "Sin cocción, si el producto está listo para consumir"
            : "10–20 min de montaje; cocción previa aparte"),
        covered,
        total,
        missing: consumed.event.missing,
        soon,
        score:
          (template.priority || 0) +
          (covered === total ? 1000 : 0) +
          (foods.reduce(
            (n, x) =>
              n +
              Math.min(
                1,
                pantryAvailable(lots, x.food, date) /
                  (x.food.quantity * x.portions),
              ),
            0,
          ) /
            total) *
            100 +
          (soon ? 35 : 0),
      });
    }
  }
  for (const batch of batches.filter(
    (b) =>
      batchFits(b, plan, slot, date) &&
      (!family || b.meal.recipeKind === family),
  )) {
    const meal = {
      ...batch.meal,
      slot,
      preparedBatchId: batch.id,
      recipeTitle: batch.name,
    };
    candidates.push({
      id: "batch-" + batch.id,
      title: batch.name,
      meal,
      steps: [
        "Usa una porción de esta preparación. Si está congelada, descongélala en condiciones seguras antes de servir.",
        "Recalienta las sobras hasta 74 °C cuando corresponda y respeta la fecha registrada.",
      ],
      timeLabel:
        batch.location === "congelador"
          ? "Porción congelada: requiere descongelación"
          : "Porción preparada",
      covered: meal.foods.length,
      total: meal.foods.length,
      missing: [],
      soon: batch.expiresOn <= addDays(date, 3),
      batchId: batch.id,
      score:
        2000 +
        Math.max(
          0,
          100 -
            (new Date(batch.expiresOn + "T12:00:00").getTime() -
              new Date(date + "T12:00:00").getTime()) /
              86400000,
        ),
    });
  }
  const sorted = candidates.sort((a, b) => b.score - a.score);
  const core = (c: RecipeOption) =>
    c.meal.foods
      .filter(
        (x) => x.food.group === "Proteínas" || x.food.group === "Carbohidratos",
      )
      .map((x) => x.food.id)
      .sort()
      .join("|");
  const protein = (c: RecipeOption) =>
    c.meal.foods
      .filter((x) => x.food.group === "Proteínas")
      .map((x) => x.food.id)
      .sort()
      .join("|");
  if (![2, 4].includes(slot)) {
    const seen = new Set<string>();
    return sorted
      .filter((c) => {
        const key = signature(c.meal);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
  }
  const chosen: RecipeOption[] = [],
    cores = new Set<string>(),
    proteins = new Set<string>(),
    families = new Set<string>();
  for (const c of sorted) {
    if (chosen.length === 3) break;
    if (
      cores.has(core(c)) ||
      proteins.has(protein(c)) ||
      (!family && families.has(c.meal.recipeKind || "preparado"))
    )
      continue;
    chosen.push(c);
    cores.add(core(c));
    proteins.add(protein(c));
    families.add(c.meal.recipeKind || "preparado");
  }
  if (!family)
    for (const c of sorted) {
      if (chosen.length === 3) break;
      if (cores.has(core(c)) || families.has(c.meal.recipeKind || "preparado"))
        continue;
      chosen.push(c);
      cores.add(core(c));
      families.add(c.meal.recipeKind || "preparado");
    }
  for (const c of sorted) {
    if (chosen.length === 3) break;
    if (cores.has(core(c))) continue;
    chosen.push(c);
    cores.add(core(c));
  }
  return chosen;
}
export function composeWeeklyMenu(
  plan: Plan,
  variation = 0,
  week = monday(),
): Meal[] {
  if (!isValidDate(week)) throw Error("Revisa la fecha inicial de la minuta.");
  const calendarOffset = Math.floor(
    new Date(week + "T00:00:00Z").getTime() / 86400000,
  );
  const base = generateMenu(plan, variation),
    options = new Map<number, RecipeOption[]>();
  for (const slot of [2, 4])
    options.set(slot, recipeOptions(plan, slot, [], [], "2000-01-01"));
  const previous = new Map<number, string>();
  const lunch = new Map<number, string>();
  const core = (meal: Meal) =>
    meal.foods
      .filter((x) => ["Proteínas", "Carbohidratos"].includes(x.food.group))
      .map((x) => x.food.id)
      .sort()
      .join("|");
  return base.map((meal) => {
    const candidates = options.get(meal.slot);
    if (!candidates?.length) return meal;
    const rotated = candidates.map(
      (_, i) =>
        candidates[
          (meal.day +
            i +
            Math.trunc(Math.abs(variation)) +
            calendarOffset +
            (meal.slot === 4 ? 1 : 0)) %
            candidates.length
        ],
    );
    const option =
      rotated.find(
        (o) =>
          core(o.meal) !== previous.get(meal.slot) &&
          core(o.meal) !== lunch.get(meal.day),
      ) ||
      rotated.find((o) => core(o.meal) !== previous.get(meal.slot)) ||
      rotated[0];
    previous.set(meal.slot, core(option.meal));
    if (meal.slot === 2) lunch.set(meal.day, core(option.meal));
    return {
      ...option.meal,
      id: meal.id,
      day: meal.day,
      slot: meal.slot,
      recipeTitle: option.title,
    };
  });
}
export function kitchenPurchaseForecast(
  plan: Plan,
  menus: Record<string, Meal[]>,
  start: string,
  days: number,
  lots: PantryLot[],
  batches: PreparedBatch[],
  checks: Record<string, boolean> = {},
) {
  let pantry = lots.map((l) => ({ ...l })),
    ready = batches.map((b) => ({ ...b }));
  const missingByDate: Record<string, Shopping[]> = {};
  const projectedMenus = new Map<string, Meal[]>();
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i),
      week = monday(new Date(date + "T12:00:00")),
      day = (new Date(date + "T12:00:00").getDay() + 6) % 7;
    const stored = menus[week]?.filter((m) => m.day === day);
    if (!projectedMenus.has(week))
      projectedMenus.set(week, composeWeeklyMenu(plan, 0, week));
    const meals =
      stored?.length === 5 &&
      stored.every((m) =>
        m.foods.every((x) => foodForMeal(x.food, plan, m.slot).compatible),
      )
        ? stored
        : projectedMenus.get(week)!.filter((m) => m.day === day);
    const missing: Shopping[] = [];
    for (const meal of meals) {
      if (checks[`${date}-meal-${meal.slot}`]) continue;
      let result;
      try {
        result = consumeMeal(meal, pantry, ready, plan, date);
      } catch {
        result = { ...consumeIngredients(meal, pantry, date), batches: ready };
      }
      pantry = result.pantry;
      ready = result.batches;
      missing.push(...result.event.missing);
    }
    missingByDate[date] = missing;
  }
  return {
    missingByDate,
    items: sumShopping(Object.values(missingByDate).flat()),
  };
}
export function sumShopping(items: Shopping[]) {
  const map = new Map<string, Shopping>();
  for (const x of items) {
    const old = map.get(x.id);
    map.set(x.id, { ...x, quantity: round((old?.quantity || 0) + x.quantity) });
  }
  return [...map.values()];
}
