"use client";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { State } from "../lib/state";
import { todayKey } from "../lib/purchases";
import { followUp } from "../lib/follow-up";
import {
  PROTOCOL_VERSION,
  currentReview,
  reviewSnapshot,
} from "../lib/protocol";
type Data = ReturnType<typeof followUp>;
function reportReview(s: State, scope: "alimentacion" | "entrenamiento") {
  const r = currentReview(
    s.reviews || [],
    reviewSnapshot(scope, s.plan, {
      profile: s.trainingProfile,
      assessments: s.trainingAssessments || [],
    }),
  );
  return r
    ? `${r.name}, ${r.date}: ${r.outcome === "revisado" ? "revisión registrada" : "ajustes pendientes"} (declarada; credenciales no verificadas)`
    : "Sin revisión declarada de la versión actual";
}
function ReportDetails({ s, data }: { s: State; data: Data }) {
  const m = data.measurements;
  return (
    <>
      <h2>{s.profile.name || "Mi Semana"} · resumen de 12 semanas</h2>
      <p>
        Periodo: {data.period.start} a {data.period.end}. Protocolo{" "}
        {PROTOCOL_VERSION}.
      </p>
      <p>
        Comparaciones entre registros disponibles dentro del periodo, con sus
        fechas. Descripción de datos, no diagnóstico ni atribución de causalidad
        a la app.
      </p>
      <h3>Actividad y cobertura</h3>
      <p>
        {data.activity.minutes} min aeróbicos registrados;{" "}
        {data.activity.equivalent} equivalentes moderados. {data.strengthDays}{" "}
        días con series registradas. {data.breaks} pausas declaradas en{" "}
        {data.breakDays} días. Sueño medio: {data.sleep ?? "sin registros"}{" "}
        {data.sleep === undefined ? "" : "h"} en {data.sleepDays} días.
      </p>
      <p>
        Comidas/caminatas: {data.marked} ítems marcados de {data.possible}{" "}
        posibles en días con minuta guardada o registros. Hubo algún registro de
        casillas en {data.recordedDays} de 84 días. Ausencia de registro no
        demuestra incumplimiento; marcar una casilla no mide la dosis de
        ejercicio.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bloque de 7 días</th>
              <th>Casillas marcadas / posibles</th>
              <th>Días registrados</th>
              <th>Min. equivalentes</th>
              <th>Días de fuerza</th>
            </tr>
          </thead>
          <tbody>
            {data.weeks.map((w) => (
              <tr key={w.start}>
                <td>{w.start}</td>
                <td>
                  {w.marked}/{w.possible}
                  {w.percent === undefined ? "" : " · " + w.percent + " %"}
                </td>
                <td>{w.recordedDays}/7</td>
                <td>{w.activity.equivalent}</td>
                <td>{w.strengthDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Cintura y peso registrados</h3>
      {m.first ? (
        <p>
          Primero: {m.first.date}, {m.first.waist} cm y {m.first.weight} kg.{" "}
          {m.last
            ? `Último: ${m.last.date}, ${m.last.waist} cm y ${m.last.weight} kg. Diferencia: ${(m.last.waist - m.first.waist).toFixed(1)} cm y ${(m.last.weight - m.first.weight).toFixed(1)} kg.`
            : "Falta otra medición para comparar."}
        </p>
      ) : (
        <p>
          Sin mediciones en este periodo. Agrega cintura y peso en Progreso.
        </p>
      )}
      <h3>Composición corporal por equipo</h3>
      {data.bodies.length ? (
        data.bodies.map((b) => (
          <section key={b.device}>
            <h4>{b.device}</h4>
            <p>
              {b.first?.date}: músculo{" "}
              {b.first?.metrics.skeletalMuscleKg ?? "—"} kg, grasa{" "}
              {b.first?.metrics.bodyFatPercent ?? "—"} %.{" "}
              {b.last
                ? `${b.last.date}: músculo ${b.last.metrics.skeletalMuscleKg ?? "—"} kg, grasa ${b.last.metrics.bodyFatPercent ?? "—"} %.`
                : ""}
            </p>
            <p>{b.quality}</p>
          </section>
        ))
      ) : (
        <p>Sin exámenes de composición corporal en el periodo.</p>
      )}
      <h3>Exámenes de laboratorio · unidades conservadas</h3>
      {data.labs.length ? (
        data.labs.map((l) => (
          <p key={l.type + l.unit}>
            <strong>
              {l.type} · {l.unit}:
            </strong>{" "}
            {l.first?.date}: {l.first?.value}.{" "}
            {l.last
              ? `${l.last.date}: ${l.last.value}.`
              : "Falta otro resultado con la misma unidad."}
          </p>
        ))
      ) : (
        <p>Sin exámenes registrados en el periodo.</p>
      )}
      <h3>Rendimiento registrado</h3><p>Se muestran las últimas series de cada día, separadas por ejercicio, equipo y unidad. Kg significa carga externa. Días con evaluaciones iniciales: {data.assessmentDays}; se distinguen de los días con series de entrenamiento.</p>
      {data.performances.length ? (
        data.performances.map((p) => (
          <p key={JSON.stringify([p.routine,p.exercise,p.equipment,p.unit])}>
            <strong>
              {p.routine} · {p.exercise} ·{" "}
              {p.equipment || "equipo sin identificar"}:
            </strong>{" "}
            {p.first?.date}, {p.first?.kg} kg × {p.first?.reps} {p.unit==="segundos"?"s":p.unit==="reps_lado"?"reps por lado":"reps"}.{" "}
            {p.last
              ? `${p.last.date}, ${p.last.kg} kg × ${p.last.reps} ${p.unit==="segundos"?"s":p.unit==="reps_lado"?"reps por lado":"reps"}.`
              : "Solo un día registrado."}{" "}
            {!p.equipment
              ? "No se comparan cargas entre máquinas no identificadas."
              : "Son registros, no pruebas de fuerza máxima ni de causalidad."}
          </p>
        ))
      ) : (
        <p>Sin series registradas en el periodo.</p>
      )}
      <h3>Revisiones de la versión actual</h3>
      <p>Alimentación: {reportReview(s, "alimentacion")}</p>
      <p>Entrenamiento: {reportReview(s, "entrenamiento")}</p>
      <p>
        Notas para la consulta:
        __________________________________________________________
      </p>
    </>
  );
}
export function FollowUpReport({ state }: { state: State }) {
  const [end, setEnd] = useState(todayKey()),
    [printing, setPrinting] = useState(false);
  useEffect(() => {
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);
  let data: Data;
  try {
    data = followUp(state, end);
  } catch {
    return (
      <section className="card">
        <label>
          Fecha de cierre válida
          <input
            type="date"
            max={todayKey()}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </section>
    );
  }
  return (
    <section
      className="card progress-report"
      data-print={printing ? "true" : "false"}
    >
      <div className="report-screen">
        <span className="eyebrow">PARA TU CONSULTA</span>
        <h2>Evolución, registros y límites</h2>
        <label>
          Fecha de cierre
          <input
            type="date"
            value={end}
            max={todayKey()}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <p>
          Reúne las 12 semanas que terminan en esta fecha. Los periodos sin
          datos se identifican; no se rellenan con estimaciones.
        </p>
        <button
          className="button outline"
          onClick={() => {
            flushSync(() => setPrinting(true));
            window.print();
          }}
        >
          Imprimir resumen de 12 semanas
        </button>
        <details>
          <summary>Revisar resumen antes de imprimir</summary>
          <ReportDetails s={state} data={data} />
        </details>
      </div>
      <div className="report-print">
        <ReportDetails s={state} data={data} />
      </div>
    </section>
  );
}
