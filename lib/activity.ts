import { addDays } from "./purchases.ts";
export type ActivityLog = {
  id: string;
  date: string;
  type: "caminata" | "bicicleta" | "otra";
  minutes: number;
  intensity: "suave" | "moderada" | "vigorosa";
  context: "almuerzo" | "cena" | "libre";
};
export type SedentaryLog = { breaks: number; longestSitting?: number };
export function validDay(date: string, today: string) {
  const t = Date.parse(date + "T12:00:00Z");
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(t) &&
    new Date(t).toISOString().slice(0, 10) === date &&
    date <= today
  );
}
export function validateActivity(a: ActivityLog, today: string) {
  if (
    !validDay(a.date, today) ||
    !Number.isInteger(a.minutes) ||
    a.minutes < 1 ||
    a.minutes > 300 ||
    !["caminata", "bicicleta", "otra"].includes(a.type) ||
    !["suave", "moderada", "vigorosa"].includes(a.intensity) ||
    !["almuerzo", "cena", "libre"].includes(a.context)
  )
    throw Error("Revisa fecha, minutos e intensidad.");
  return a;
}
export function activityTotals(
  logs: ActivityLog[],
  start: string,
  end: string,
) {
  const rows = logs.filter((x) => x.date >= start && x.date <= end);
  const moderate = rows
      .filter((x) => x.intensity === "moderada")
      .reduce((n, x) => n + x.minutes, 0),
    vigorous = rows
      .filter((x) => x.intensity === "vigorosa")
      .reduce((n, x) => n + x.minutes, 0);
  return {
    minutes: rows.reduce((n, x) => n + x.minutes, 0),
    moderate,
    vigorous,
    equivalent: moderate + 2 * vigorous,
    days: new Set(rows.map((x) => x.date)).size,
  };
}
export function reportPeriod(end: string) {
  return { start: addDays(end, -83), end };
}
