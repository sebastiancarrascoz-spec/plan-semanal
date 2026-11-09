import type { State } from "./state.ts";
import { activityTotals, reportPeriod, validDay } from "./activity.ts";
import { addDays, todayKey } from "./purchases.ts";
import { monday } from "./engine.ts";
import { bodyComparison } from "./body-quality.ts";
function pair<T extends { date: string }>(rows: T[]) {
  const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return {
    first: ordered[0],
    last: ordered.length > 1 ? ordered.at(-1) : undefined,
    count: ordered.length,
  };
}
export function followUp(s: State, end: string, today = todayKey()) {
  if (!validDay(end, today)) throw Error("Elige una fecha real hasta hoy.");
  const period = reportPeriod(end),
    inPeriod = (date: string) => date >= period.start && date <= end;
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(period.start, i * 7),
      finish = addDays(start, 6);
    let plannedDays = 0,
      marked = 0,
      recordedDays = 0;
    for (let n = 0; n < 7; n++) {
      const day = addDays(start, n),
        keys = [
          ...Array.from({ length: 5 }, (_, x) => `${day}-meal-${x}`),
          `${day}-walk-0`,
          `${day}-walk-1`,
        ],
        hasEntry = keys.some((k) => Object.hasOwn(s.checks, k)),
        hasMenu = !!s.menus[monday(new Date(day + "T12:00:00"))]?.length;
      if (hasEntry) recordedDays++;
      if (hasEntry || hasMenu) {
        plannedDays++;
        marked += keys.filter((k) => s.checks[k] === true).length;
      }
    }
    const possible = plannedDays * 7,
      activity = activityTotals(s.activityLogs || [], start, finish),
      strengthDays = new Set(
        s.sets
          .filter((x) => x.date >= start && x.date <= finish)
          .map((x) => x.date),
      ).size;
    return {
      start,
      end: finish,
      plannedDays,
      recordedDays,
      marked,
      possible,
      percent: possible ? Math.round((marked / possible) * 100) : undefined,
      activity,
      strengthDays,
    };
  });
  const measurements = pair(s.measurements.filter((x) => inPeriod(x.date)));
  const labs = Array.from(
    new Set(
      s.labs
        .filter((x) => inPeriod(x.date))
        .map((x) => JSON.stringify([x.type, x.unit])),
    ),
  ).map((k) => {
    const [type, unit] = JSON.parse(k);
    return {
      type,
      unit,
      ...pair(
        s.labs.filter(
          (x) => inPeriod(x.date) && x.type === type && x.unit === unit,
        ),
      ),
    };
  });
  const bodies = Array.from(
    new Set(s.bodyScans.filter((x) => inPeriod(x.date)).map((x) => x.device)),
  ).map((device) => {
    const p = pair(
      s.bodyScans.filter((x) => inPeriod(x.date) && x.device === device),
    );
    return {
      device,
      ...p,
      quality:
        p.first && p.last
          ? bodyComparison(p.first, p.last).text
          : "Falta un segundo examen del mismo equipo dentro del periodo.",
    };
  });
  const sets = s.sets.filter((x) => inPeriod(x.date));
  const setUnit=(x:typeof sets[number])=>x.unit||(/segundos/i.test(x.exercise)?"segundos":"reps");
  const performances = Array.from(
    new Set(
      sets.map((x) =>
        JSON.stringify([x.routine, x.exercise, x.equipment || "",setUnit(x)]),
      ),
    ),
  ).map((k) => {
    const [routine, exercise, equipment,unit] = JSON.parse(k);
    const byDate=new Map<string,typeof sets[number]>();
    for(const x of sets.filter(x=>x.routine===routine&&x.exercise===exercise&&(x.equipment||"")===equipment&&setUnit(x)===unit))byDate.set(x.date,x);
    return {
      routine,
      exercise,
      equipment,
      unit,
      ...pair([...byDate.values()]),
    };
  });
  const mean = (values: number[]) =>
    values.length
      ? Math.round((values.reduce((n, v) => n + v, 0) / values.length) * 10) /
        10
      : undefined;
  const breaks = Object.entries(s.sedentaryLogs || {}).filter(([d]) =>
    inPeriod(d),
  );
  return {
    period,
    weeks,
    measurements,
    labs,
    bodies,
    performances,
    activity: activityTotals(s.activityLogs || [], period.start, end),
    strengthDays: new Set(sets.map((x) => x.date)).size,
    assessmentDays:new Set((s.trainingAssessments||[]).filter(x=>inPeriod(x.date)).map(x=>x.date)).size,
    sleep: mean(
      Object.entries(s.sleep)
        .filter(([d]) => inPeriod(d))
        .map(([, v]) => v),
    ),
    sleepDays: Object.keys(s.sleep).filter(inPeriod).length,
    breaks: breaks.reduce((n, [, v]) => n + v.breaks, 0),
    breakDays: breaks.length,
    marked: weeks.reduce((n, w) => n + w.marked, 0),
    possible: weeks.reduce((n, w) => n + w.possible, 0),
    recordedDays: weeks.reduce((n, w) => n + w.recordedDays, 0),
  };
}
