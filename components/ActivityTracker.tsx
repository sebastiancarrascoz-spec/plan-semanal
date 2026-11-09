"use client";
import { useState } from "react";
import { todayKey, addDays } from "../lib/purchases";
import { monday } from "../lib/engine";
import {
  activityTotals,
  validateActivity,
  type ActivityLog,
  type SedentaryLog,
} from "../lib/activity";
type Props = {
  date: string;
  logs: ActivityLog[];
  sedentary: Record<string, SedentaryLog>;
  goal: number;
  onAdd: (a: ActivityLog) => void;
  onRemove: (id: string) => void;
  onSedentary: (date: string, s: SedentaryLog | undefined) => void;
  onGoal: (minutes: number) => void;
};
export function ActivityTracker(p: Props) {
  const [error, setError] = useState("");
  const today = todayKey(),
    date = p.date > today ? today : p.date,
    week = monday(new Date(date + "T12:00:00")),
    end = addDays(week, 6) > today ? today : addDays(week, 6),
    totals = activityTotals(p.logs, week, end);
  return (
    <section className="card training-profile" id="actividad-real">
      <span className="eyebrow">MINUTOS REALES</span>
      <h2>Movimiento y pausas</h2>
      <p>
        Semana desde {week}: <strong>{totals.minutes} min registrados</strong>{" "}
        en {totals.days} días. Equivalentes moderados: {totals.equivalent} min
        (moderados + 2 × vigorosos). La actividad suave se muestra, pero no se
        convierte automáticamente en moderada.
      </p>
      <label>
        Tu meta semanal de minutos equivalentes
        <input
          type="number"
          min="0"
          max="1000"
          step="5"
          value={p.goal}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isInteger(v) && v >= 0 && v <= 1000) p.onGoal(v);
          }}
        />
      </label>
      <p>
        Meta elegida: {p.goal} min. La referencia poblacional de 150 min es una
        orientación, no una exigencia inicial. Puedes comenzar con una meta
        menor con tu profesional.{" "}
        <a
          href="https://www.who.int/initiatives/behealthy/physical-activity"
          target="_blank"
          rel="noreferrer"
        >
          OMS · regla P05
        </a>
      </p>
      <form key={date}
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const d = new FormData(e.currentTarget);
            p.onAdd(
              validateActivity(
                {
                  id: crypto.randomUUID(),
                  date: String(d.get("date")),
                  type: d.get("type") as ActivityLog["type"],
                  minutes: Number(d.get("minutes")),
                  intensity: d.get("intensity") as ActivityLog["intensity"],
                  context: d.get("context") as ActivityLog["context"],
                },
                today,
              ),
            );
            setError("");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Revisa el registro");
          }
        }}
      >
        <div className="form-grid">
          <label>
            Fecha
            <input
              name="date"
              type="date"
              defaultValue={date}
              max={today}
              required
            />
          </label>
          <label>
            Actividad
            <select name="type">
              <option value="caminata">Caminata</option>
              <option value="bicicleta">Bicicleta</option>
              <option value="otra">Otra actividad aeróbica</option>
            </select>
          </label>
          <label>
            Minutos realmente realizados
            <input
              name="minutes"
              type="number"
              min="1"
              max="300"
              step="1"
              required
            />
          </label>
          <label>
            Intensidad percibida
            <select name="intensity" defaultValue="suave">
              <option value="suave">Suave</option>
              <option value="moderada">
                Moderada: puedo hablar, no cantar
              </option>
              <option value="vigorosa">
                Vigorosa: solo digo pocas palabras
              </option>
            </select>
          </label>
        </div>
        <label>
          Momento
          <select name="context">
            <option value="libre">Libre</option>
            <option value="almuerzo">Después del almuerzo</option>
            <option value="cena">Después de la cena</option>
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="button outline">Agregar minutos realizados</button>
      </form>
      <p className="fineprint">
        Marcar una caminata en Semana no inventa su duración. Si la marcaste,
        registra sus minutos aquí una sola vez; no vuelvas a añadir el mismo
        paseo.
      </p>
      {p.logs
        .filter((a) => a.date >= week && a.date <= end)
        .map((a) => (
          <div className="lab-row" key={a.id}>
            <span>
              {a.date} · {a.type} · {a.minutes} min · {a.intensity}
            </span>
            <button
              className="text-button"
              onClick={() => p.onRemove(a.id)}
              aria-label={`Quitar registro de ${a.minutes} minutos del ${a.date}`}
            >
              Quitar
            </button>
          </div>
        ))}
      <h3>Pausas de estar sentado · {date}</h3>
      <label>
        Veces que te levantaste para moverte
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={p.sedentary[date]?.breaks ?? ""}
          onChange={(e) => {
            if (e.target.value === "") {
              p.onSedentary(date, undefined);
              return;
            }
            const v = Number(e.target.value);
            if (Number.isInteger(v) && v >= 0 && v <= 100)
              p.onSedentary(date, { ...p.sedentary[date], breaks: v });
          }}
        />
      </label>
      <p className="fineprint">
        Recuento declarado, independiente de minutos aeróbicos y de las casillas
        de cumplimiento. Un campo sin completar no significa cero pausas.
      </p>
    </section>
  );
}
