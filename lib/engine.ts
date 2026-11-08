export type Diet = "omnívoro" | "pescetariano" | "vegetariano" | "vegano";
export const restrictionLabels = {
  gluten: "Sin gluten",
  lactosa: "Sin lactosa",
  leche: "Sin leche",
  soya: "Sin soya",
  frutos_secos: "Sin frutos secos",
  pescado: "Sin pescado",
  huevo: "Sin huevo",
  mariscos: "Sin mariscos",
  mani: "Sin maní",
  sesamo: "Sin sésamo",
} as const;
export type Restriction = keyof typeof restrictionLabels;
export type Group =
  "Carbohidratos" | "Proteínas" | "Grasas" | "Aceite" | "Frutas" | "Verduras";
export const slots = [
  "Desayuno",
  "Colación AM",
  "Almuerzo",
  "Colación PM",
  "Cena",
];
export type Food = {
  id: string;
  name: string;
  group: Group;
  quantity: number;
  unit: string;
  section: string;
  diets: Diet[];
  priority?: boolean;
  contains?: Restriction[];
  mayContain?: Restriction[];
  reviewedFor?: Restriction[];
  evidence?: string;
  proteinRole?: "plato" | "bebida" | "colación";
};
export type PlanGroup = { name: Group; daily: number; distribution: number[] };
export type Plan = {
  version: number;
  diet: Diet;
  objective: string;
  groups: PlanGroup[];
  foods: Food[];
  restrictions?: Restriction[];
  restrictionMode?: "ingredientes" | "estricta";
  excludedFoodIds?: string[];
  preferredFoodIds?: string[];
};
export type Meal = {
  id: string;
  day: number;
  slot: number;
  foods: { food: Food; portions: number }[];
  recipeKind?: string;
  recipeTitle?: string;
  preparedBatchId?: string;
};
export const all: Diet[] = [
  "omnívoro",
  "pescetariano",
  "vegetariano",
  "vegano",
];
const f = (
  id: string,
  name: string,
  group: Group,
  quantity: number,
  unit: string,
  section: string,
  diets: Diet[] = all,
  priority = false,
): Food => ({
  id,
  name,
  group,
  quantity,
  unit,
  section,
  diets,
  priority,
  contains:
    (
      {
        avena: ["gluten"],
        pan: ["gluten"],
        tofu: ["soya"],
        soya: ["soya"],
        yogur: ["leche", "lactosa"],
        nueces: ["frutos_secos"],
        pescado: ["pescado"],
      } as Partial<Record<string, Restriction[]>>
    )[id] || [],
  mayContain: [],
  reviewedFor: [],
  proteinRole:
    group === "Proteínas"
      ? id === "soya"
        ? "bebida"
        : id === "yogur"
          ? "colación"
          : "plato"
      : undefined,
});
export const foods: Food[] = [
  f("avena", "Avena integral", "Carbohidratos", 30, "g", "Despensa", all, true),
  f("pan", "Pan integral", "Carbohidratos", 30, "g", "Panadería", all, true),
  f(
    "arroz",
    "Arroz integral cocido",
    "Carbohidratos",
    100,
    "g cocidos",
    "Despensa",
    all,
    true,
  ),
  f(
    "quinoa",
    "Quínoa cocida",
    "Carbohidratos",
    100,
    "g cocidos",
    "Despensa",
    all,
    true,
  ),
  f(
    "lentejas",
    "Lentejas cocidas",
    "Proteínas",
    0.75,
    "taza cocida",
    "Despensa",
    all,
    true,
  ),
  f(
    "porotos",
    "Porotos cocidos",
    "Proteínas",
    0.75,
    "taza cocida",
    "Despensa",
    all,
    true,
  ),
  f("tofu", "Tofu", "Proteínas", 80, "g", "Refrigerados"),
  f(
    "soya",
    "Bebida de soya sin azúcar",
    "Proteínas",
    200,
    "ml",
    "Refrigerados",
  ),
  f("pollo", "Pollo", "Proteínas", 50, "g", "Carnes y pescados", ["omnívoro"]),
  f("pescado", "Pescado", "Proteínas", 50, "g", "Carnes y pescados", [
    "omnívoro",
    "pescetariano",
  ]),
  f(
    "yogur",
    "Yogur natural sin azúcar",
    "Proteínas",
    170,
    "g",
    "Refrigerados",
    ["omnívoro", "vegetariano"],
  ),
  f("palta", "Palta", "Grasas", 50, "g", "Frutas y verduras"),
  f("nueces", "Nueces", "Grasas", 15, "g", "Despensa"),
  f("aceite", "Aceite de oliva", "Aceite", 1, "cucharadita", "Despensa"),
  f("manzana", "Manzana", "Frutas", 1, "unidad", "Frutas y verduras"),
  f("pera", "Pera", "Frutas", 1, "unidad", "Frutas y verduras"),
  f("naranja", "Naranja", "Frutas", 1, "unidad", "Frutas y verduras"),
  f("tomate", "Tomate", "Verduras", 1, "taza", "Frutas y verduras"),
  f("brocoli", "Brócoli", "Verduras", 1, "taza", "Frutas y verduras"),
  f(
    "ensalada",
    "Ensalada de hojas",
    "Verduras",
    1,
    "taza",
    "Frutas y verduras",
  ),
];
export const seedPlan: Plan = {
  version: 1,
  diet: "omnívoro",
  objective: "Mejorar triglicéridos",
  foods,
  groups: [
    { name: "Carbohidratos", daily: 6, distribution: [2, 0, 2, 0, 2] },
    { name: "Proteínas", daily: 10, distribution: [3, 0, 3, 1, 3] },
    { name: "Grasas", daily: 2, distribution: [1, 0, 0, 0, 1] },
    { name: "Aceite", daily: 4, distribution: [0, 0, 2, 0, 2] },
    { name: "Frutas", daily: 2, distribution: [0, 1, 0, 1, 0] },
    { name: "Verduras", daily: 6, distribution: [0, 0, 3, 0, 3] },
  ],
};
export function validatePlan(plan: Plan) {
  if (
    !["omnívoro", "pescetariano", "vegetariano", "vegano"].includes(plan.diet)
  )
    throw Error("Selecciona un tipo de alimentación válido.");
  if ((plan.restrictions || []).some((r) => !(r in restrictionLabels)))
    throw Error("Hay una restricción no reconocida.");
  for (const g of plan.groups) {
    if (
      g.distribution.length !== 5 ||
      !Number.isFinite(g.daily) ||
      g.daily < 0 ||
      g.distribution.some((n) => !Number.isFinite(n) || n < 0) ||
      Math.abs(g.distribution.reduce((a, b) => a + b, 0) - g.daily) > 0.001
    )
      throw Error(
        `Revisa la distribución de ${g.name}: debe sumar ${g.daily}.`,
      );
    if (
      g.daily > 0 &&
      !plan.foods.some(
        (f) => f.group === g.name && foodCompatibility(f, plan).compatible,
      )
    )
      throw Error(
        `Faltan equivalentes compatibles de ${g.name}. Revisa el catálogo y las restricciones; no se sustituirán automáticamente.`,
      );
    if (g.name === "Proteínas")
      for (const slot of [2, 4]) {
        if (
          g.distribution[slot] > 0 &&
          !plan.foods.some(
            (f) => f.group === g.name && foodForMeal(f, plan, slot).compatible,
          )
        )
          throw Error(
            `Falta una proteína de plato compatible para ${slots[slot].toLowerCase()}. Añade una opción sólida revisada por tu nutricionista.`,
          );
      }
  }
}
export function generateMenu(plan: Plan, variation = 0): Meal[] {
  validatePlan(plan);
  const result: Meal[] = [];
  for (let day = 0; day < 7; day++)
    for (let slot = 0; slot < 5; slot++) {
      const selected: Meal["foods"] = [];
      for (const g of plan.groups) {
        const portions = g.distribution[slot];
        if (!portions) continue;
        let pool = plan.foods.filter(
          (f) => f.group === g.name && foodForMeal(f, plan, slot).compatible,
        );
        if (
          /triglicéridos|insulina/i.test(plan.objective) &&
          (day + slot) % 3 !== 2
        ) {
          const preferred = pool.filter((f) => f.priority);
          if (preferred.length >= 2) pool = preferred;
        }
        const previous = result
          .find((m) => m.day === day - 1 && m.slot === slot)
          ?.foods.find((x) => x.food.group === g.name)?.food.id;
        const alternatives = pool.filter((f) => f.id !== previous);
        if (alternatives.length) pool = alternatives;
        const preferred = pool.filter((f) =>
          plan.preferredFoodIds?.includes(f.id),
        );
        if (preferred.length && (day + slot) % 2 === 0) pool = preferred;
        selected.push({
          food: pool[(day + slot + variation) % pool.length],
          portions,
        });
      }
      result.push({ id: `${day}-${slot}`, day, slot, foods: selected });
    }
  return result;
}
export type Shopping = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  section: string;
};
export function generateShopping(menu: Meal[]): Shopping[] {
  const items = new Map<string, Shopping>();
  for (const m of menu)
    for (const x of m.foods) {
      const key = x.food.id + "|" + x.food.unit;
      const old = items.get(key);
      items.set(key, {
        id: key,
        name: x.food.name,
        quantity:
          Math.round(
            ((old?.quantity || 0) + x.food.quantity * x.portions) * 100,
          ) / 100,
        unit: x.food.unit,
        section: x.food.section,
      });
    }
  return [...items.values()].sort((a, b) => a.section.localeCompare(b.section));
}
export function swapFood(meal: Meal, foodId: string, plan: Plan): Meal {
  const old = meal.foods.find((x) => x.food.id === foodId);
  if (!old) return meal;
  const pool = plan.foods.filter(
    (f) =>
      f.group === old.food.group && foodForMeal(f, plan, meal.slot).compatible,
  );
  if (!pool.length)
    throw Error("No hay otra opción compatible para este grupo.");
  const next = pool[(pool.findIndex((f) => f.id === foodId) + 1) % pool.length];
  return {
    ...meal,
    foods: meal.foods.map((x) => (x === old ? { ...x, food: next } : x)),
  };
}
export function foodCompatibility(
  food: Food,
  plan: Plan,
): { compatible: boolean; reason: string } {
  const dietMatches =
    food.diets.includes(plan.diet) ||
    (plan.diet === "pescetariano" &&
      (food.diets.includes("vegetariano") || food.diets.includes("vegano")));
  if (!dietMatches)
    return {
      compatible: false,
      reason: `No corresponde al plan ${plan.diet}.`,
    };
  if (plan.excludedFoodIds?.includes(food.id))
    return { compatible: false, reason: "Lo excluiste de tus preferencias." };
  for (const r of plan.restrictions || []) {
    if (!food.contains)
      return { compatible: false, reason: "Falta declarar sus ingredientes." };
    if (food.contains.includes(r))
      return {
        compatible: false,
        reason: `Contiene un ingrediente excluido: ${restrictionLabels[r].toLowerCase()}.`,
      };
    if (plan.restrictionMode === "estricta") {
      if (food.mayContain?.includes(r))
        return {
          compatible: false,
          reason:
            "La etiqueta declara posibles trazas de un ingrediente excluido.",
        };
      if (
        !food.reviewedFor?.includes(r) ||
        !food.evidence?.trim() ||
        !food.mayContain
      )
        return {
          compatible: false,
          reason:
            "Falta revisión de la etiqueta del producto para esta restricción.",
        };
    }
  }
  return {
    compatible: true,
    reason:
      (plan.restrictions?.length
        ? "Cumple los filtros declarados. "
        : `Compatible con alimentación ${plan.diet}. `) +
      (plan.restrictionMode === "estricta"
        ? "Etiqueta registrada para esta restricción."
        : "Confirma la etiqueta del producto que compres."),
  };
}
export function foodForMeal(
  food: Food,
  plan: Plan,
  slot: number,
): { compatible: boolean; reason: string } {
  const compatible = foodCompatibility(food, plan);
  if (!compatible.compatible) return compatible;
  if ([2, 4].includes(slot) && food.group === "Proteínas") {
    const drink =
      food.proteinRole === "bebida" ||
      /^(ml|l|litros?|mililitros?)(\s|$)/i.test(food.unit.trim()) ||
      /\b(bebida|leche|batido|jugo)\b/i.test(food.name);
    const snack =
      food.proteinRole === "colación" ||
      food.id === "yogur" ||
      /yog[hu]?[ou]r/i.test(food.name);
    if (drink || snack)
      return {
        compatible: false,
        reason:
          "Reservado para desayuno o colación. El almuerzo y la cena usan una proteína de plato.",
      };
  }
  return compatible;
}
export function replaceFood(
  meal: Meal,
  oldId: string,
  newId: string,
  plan: Plan,
): Meal {
  const old = meal.foods.find((x) => x.food.id === oldId),
    next = plan.foods.find((x) => x.id === newId);
  if (
    !old ||
    !next ||
    old.food.group !== next.group ||
    !foodForMeal(next, plan, meal.slot).compatible
  )
    throw Error(
      "El intercambio debe conservar el grupo y cumplir los filtros.",
    );
  return {
    ...meal,
    recipeTitle: undefined,
    recipeKind: undefined,
    preparedBatchId: undefined,
    foods: meal.foods.map((x) =>
      x.food.id === oldId ? { food: next, portions: x.portions } : x,
    ),
  };
}
export function monday(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateForDay(week: string, day: number) {
  const d = new Date(week + "T12:00:00");
  d.setDate(d.getDate() + day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
