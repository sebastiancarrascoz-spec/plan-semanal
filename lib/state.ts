import {
  seedPlan,
  generateMenu,
  monday,
  type Plan,
  type Meal,
  foodForMeal,
  dateForDay,
} from "./engine.ts";
import type { BodyScan } from "./body.ts";
import type { TrainingProfile, WorkoutSet } from "./training.ts";
import type { ReviewRecord } from "./protocol.ts";
import type { ActivityLog, SedentaryLog } from "./activity.ts";
import type { TrainingAssessment } from "./calibration.ts";
import type { Cart } from "./cart.ts";
import { todayKey, type PurchaseBasket } from "./purchases.ts";
import type { PantryLot, PreparedBatch, KitchenEvent } from "./kitchen.ts";
import { consumeMeal, undoKitchenEvent, composeWeeklyMenu } from "./kitchen.ts";
export type Measurement = {
  date: string;
  waist: number;
  weight: number;
  fat?: number;
  visceral?: number;
};
export type State = {
  consent: boolean;
  profile: { name: string; diet: string; objective: string; height: number };
  plan: Plan;
  menus: Record<string, Meal[]>;
  checks: Record<string, boolean>;
  water: Record<string, number>;
  sleep: Record<string, number>;
  bought: Record<string, boolean>;
  manual: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    section: string;
  }[];
  measurements: Measurement[];
  trainingProfile?: TrainingProfile;
  trainingAssessments?: TrainingAssessment[];
  reviews?: ReviewRecord[];
  activityLogs?: ActivityLog[];
  activityGoalMinutes?: number;
  sedentaryLogs?: Record<string, SedentaryLog>;
  bodyScans: BodyScan[];
  carts: Record<string, Cart>;
  shoppingStart: string;
  purchaseBaskets: Record<string, PurchaseBasket>;
  pantry: PantryLot[];
  preparedBatches: PreparedBatch[];
  kitchenEvents: Record<string, KitchenEvent>;
  labs: { date: string; type: string; value: number; unit: string }[];
  sets: WorkoutSet[];
  reminders: { enabled: boolean; time: string };
  dark: boolean;
  large: boolean;
  revision: number;
};
export const initial = (): State => ({
  consent: false,
  profile: {
    name: "",
    diet: "omnívoro",
    objective: "Mejorar triglicéridos",
    height: 170,
  },
  plan: structuredClone(seedPlan),
  menus: { [monday()]: composeWeeklyMenu(seedPlan) },
  checks: {},
  water: {},
  sleep: {},
  bought: {},
  manual: [],
  measurements: [],
  bodyScans: [],
  carts: {},
  shoppingStart: todayKey(),
  purchaseBaskets: {},
  pantry: [],
  preparedBatches: [],
  kitchenEvents: {},
  labs: [],
  sets: [],
  reminders: { enabled: false, time: "15:00" },
  dark: false,
  large: false,
  revision: 0,
});
export function migrateState(raw: Partial<State>): State {
  const base = initial();
  const state: State = {
    ...base,
    ...raw,
    bodyScans: raw.bodyScans || [],
    carts: raw.carts || {},
    shoppingStart: raw.shoppingStart || base.shoppingStart,
    purchaseBaskets: raw.purchaseBaskets || {},
    pantry: raw.pantry || [],
    preparedBatches: raw.preparedBatches || [],
    kitchenEvents: raw.kitchenEvents || {},
    plan: {
      ...base.plan,
      ...raw.plan,
      foods: (raw.plan?.foods || base.plan.foods).map((f) => {
        const original = seedPlan.foods.find(
          (x) => x.id === f.id && x.name === f.name,
        );
        return original ? { ...original, ...f } : f;
      }),
    },
  };
  return repairUnloggedMenus(state);
}
export function repairUnloggedMenus(state: State, from = todayKey()): State {
  const menus = { ...state.menus };
  let changed = false;
  for (const [week, meals] of Object.entries(menus)) {
    let generated: Meal[] | undefined;
    menus[week] = meals.map((meal) => {
      const date = dateForDay(week, meal.day);
      if (
        date < from ||
        state.checks[`${date}-meal-${meal.slot}`] ||
        (meal.foods.every(
          (x) => foodForMeal(x.food, state.plan, meal.slot).compatible,
        ) &&
          (![2, 4].includes(meal.slot) ||
            !!meal.recipeTitle ||
            !meal.foods.length))
      )
        return meal;
      try {
        generated ??= composeWeeklyMenu(state.plan, 0, week);
        const replacement = generated.find(
          (m) => m.day === meal.day && m.slot === meal.slot,
        );
        if (replacement) {
          changed = true;
          return replacement;
        }
      } catch {}
      return meal;
    });
  }
  return changed ? { ...state, menus } : state;
}
export function toggleMealLog(state: State, key: string): State {
  const match = key.match(/^(\d{4}-\d{2}-\d{2})-meal-([0-4])$/);
  if (!match)
    return { ...state, checks: { ...state.checks, [key]: !state.checks[key] } };
  if (state.checks[key]) {
    const event = state.kitchenEvents[key];
    const restored = event
      ? undoKitchenEvent(state.pantry, state.preparedBatches, event)
      : { pantry: state.pantry, batches: state.preparedBatches };
    const events = { ...state.kitchenEvents };
    delete events[key];
    return {
      ...state,
      checks: { ...state.checks, [key]: false },
      pantry: restored.pantry,
      preparedBatches: restored.batches,
      kitchenEvents: events,
    };
  }
  const date = match[1],
    slot = Number(match[2]),
    week = monday(new Date(date + "T12:00:00")),
    day = (new Date(date + "T12:00:00").getDay() + 6) % 7,
    meal = (state.menus[week] || composeWeeklyMenu(state.plan, 0, week)).find(
      (m) => m.day === day && m.slot === slot,
    );
  if (!meal) throw Error("No encontramos el menú de esta comida.");
  const result = consumeMeal(
    meal,
    state.pantry,
    state.preparedBatches,
    state.plan,
    date,
  );
  return {
    ...state,
    checks: { ...state.checks, [key]: true },
    pantry: result.pantry,
    preparedBatches: result.batches,
    kitchenEvents: { ...state.kitchenEvents, [key]: result.event },
  };
}
