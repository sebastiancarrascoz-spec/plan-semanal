"use client";
import { BodyComposition } from "./BodyComposition";
import { monday, dateForDay, slots } from "../lib/engine";
import type { BodyScan } from "../lib/body";
export function ProfessionalSummary({ summary }: { summary: any }) {
  const checks: Record<string, boolean> = summary.checks || {};
  const weeks = [
    ...new Set(
      Object.keys(checks)
        .filter((k) => /^\d{4}-\d{2}-\d{2}-(meal|walk)-[0-4]$/.test(k))
        .map((k) => monday(new Date(k.slice(0, 10) + "T12:00:00"))),
    ),
  ]
    .sort()
    .reverse();
  return (
    <section className="patient-summary">
      <h3>
        {summary.profile?.name || "Paciente"} · seguimiento de solo lectura
      </h3>
      <p>
        La persona conserva el control del vínculo. Esta vista no permite
        cambiar su plan ni sus registros.
      </p>
      <h4>Cumplimiento por semana</h4>
      {weeks.length ? (
        <table>
          <thead>
            <tr>
              <th>Desde</th>
              <th>Comidas y caminatas</th>
              <th>Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              let done = 0;
              for (let d = 0; d < 7; d++) {
                const date = dateForDay(week, d);
                for (let i = 0; i < 5; i++)
                  done += Number(!!checks[`${date}-meal-${i}`]);
                for (let i = 0; i < 2; i++)
                  done += Number(!!checks[`${date}-walk-${i}`]);
              }
              return (
                <tr key={week}>
                  <td>{week}</td>
                  <td>{done}/49</td>
                  <td>{Math.round((done / 49) * 100)} %</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Aún no hay registros de cumplimiento.</p>
      )}
      <h4>Mediciones</h4>
      {(summary.measurements || []).length ? (
        (summary.measurements || []).map((m: any, i: number) => (
          <p key={i}>
            {m.date}: cintura {m.waist} cm · peso {m.weight} kg
          </p>
        ))
      ) : (
        <p>Sin mediciones registradas.</p>
      )}
      <h4>Exámenes</h4>
      {(summary.labs || []).length ? (
        (summary.labs || []).map((l: any, i: number) => (
          <p key={i}>
            {l.date} · {l.type}: {l.value} {l.unit}
          </p>
        ))
      ) : (
        <p>Sin exámenes registrados.</p>
      )}
      {summary.bodyShared ? (
        <BodyComposition
          scans={(summary.bodyScans || []) as BodyScan[]}
          readOnly
        />
      ) : (
        <p className="scope-note">
          La composición corporal no está incluida en este vínculo. El paciente
          puede crear un vínculo nuevo autorizándola.
        </p>
      )}
    </section>
  );
}
