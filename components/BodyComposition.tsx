"use client";
import { useState } from "react";
import { Activity, Plus, Upload, Download } from "lucide-react";
import {
  bodyMetrics,
  segmentLabels,
  validateBodyScan,
  parseBodyImport,
  type BodyMetric,
  type BodyScan,
} from "../lib/body";
export function BodyComposition({
  scans,
  onSave,
  readOnly = false,
  canImport = true,
}: {
  scans: BodyScan[];
  onSave?: (scans: BodyScan[]) => void;
  readOnly?: boolean;
  canImport?: boolean;
}) {
  const [metric, setMetric] = useState<BodyMetric>("skeletalMuscleKg"),
    [device, setDevice] = useState(""),
    [editing, setEditing] = useState(false),
    [pending, setPending] = useState<BodyScan[]>([]),
    [error, setError] = useState("");
  const devices = [...new Set(scans.map((x) => x.device))];
  const selectedDevice = devices.includes(device)
    ? device
    : devices.at(-1) || "";
  const ordered = scans
    .filter((x) => x.device === selectedDevice)
    .sort((a, b) =>
      (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
    );
  const latest = ordered.at(-1);
  const points = ordered
    .filter((x) => x.metrics[metric] !== undefined)
    .map((x) => ({ label: x.date, value: x.metrics[metric]! }));
  return (
    <section className="card body-composition">
      <div className="section-title">
        <div>
          <span className="eyebrow">COMPOSICIÓN CORPORAL</span>
          <h2>Más que el número de la balanza</h2>
          <p>Peso, músculo y grasa, con el equipo y la fecha de cada examen.</p>
        </div>
        <Activity size={25} />
      </div>
      {!readOnly && (
        <div className="body-actions">
          <button
            className="button outline"
            onClick={() => setEditing(!editing)}
          >
            <Plus size={16} />
            {editing ? "Cerrar registro" : "Registrar examen"}
          </button>
          <label className="file-button button outline">
            <Upload size={16} />
            Importar registro
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                try {
                  if (!canImport)
                    throw Error(
                      "Activa el guardado con consentimiento antes de importar tus exámenes personales. Puedes salir de la demo y usar Comenzar mi semana.",
                    );
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_000_000)
                    throw Error("El archivo debe pesar menos de 1 MB.");
                  setPending(parseBodyImport(JSON.parse(await file.text())));
                  setError("");
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
      )}
      {editing && !readOnly && (
        <form
          className="body-form"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const d = new FormData(e.currentTarget),
                metrics: any = {};
              for (const key of Object.keys(bodyMetrics)) {
                const raw = d.get(key);
                if (raw !== null && String(raw).trim() !== "")
                  metrics[key] = Number(raw);
              }
              const scan = validateBodyScan({
                date: d.get("date"),
                time: d.get("time"),
                device: d.get("device"),
                source: "manual",
                metrics,
                notes: d.get("notes"),
              });
              onSave?.([scan]);
              setEditing(false);
              setError("");
            } catch (err: any) {
              setError(err.message);
            }
          }}
        >
          <div className="form-grid">
            <label>
              Fecha del examen
              <input
                name="date"
                type="date"
                required
                defaultValue={new Date().toLocaleDateString("en-CA")}
              />
            </label>
            <label>
              Hora (opcional)
              <input name="time" type="time" />
            </label>
          </div>
          <label>
            Equipo o método
            <input
              name="device"
              maxLength={80}
              placeholder="Por ejemplo, InBody270S"
              defaultValue={latest?.device || "InBody"}
              required
            />
          </label>
          <div className="form-grid">
            {(
              [
                "weightKg",
                "skeletalMuscleKg",
                "bodyFatKg",
                "bodyFatPercent",
                "visceralFatLevel",
                "waistHipRatio",
              ] as BodyMetric[]
            ).map((key) => (
              <label key={key}>
                {bodyMetrics[key].label} ({bodyMetrics[key].unit})
                <input
                  name={key}
                  type="number"
                  min="0"
                  max={bodyMetrics[key].max}
                  step="0.01"
                />
              </label>
            ))}
          </div>
          <details>
            <summary>Otros resultados del informe</summary>
            <div className="form-grid">
              {(Object.keys(bodyMetrics) as BodyMetric[])
                .filter(
                  (k) =>
                    ![
                      "weightKg",
                      "skeletalMuscleKg",
                      "bodyFatKg",
                      "bodyFatPercent",
                      "visceralFatLevel",
                      "waistHipRatio",
                    ].includes(k),
                )
                .map((key) => (
                  <label key={key}>
                    {bodyMetrics[key].label} ({bodyMetrics[key].unit})
                    <input
                      name={key}
                      type="number"
                      min="0"
                      max={bodyMetrics[key].max}
                      step="0.01"
                    />
                  </label>
                ))}
            </div>
          </details>
          <label>
            Condiciones de la medición (opcional)
            <input
              name="notes"
              maxLength={500}
              placeholder="Hora habitual, mismo equipo, observaciones de tu profesional…"
            />
          </label>
          <p>
            Completa solo los resultados presentes en tu informe. No se exige
            cintura: la relación cintura-cadera es un índice distinto.
          </p>
          <button className="button full">Guardar examen</button>
        </form>
      )}
      {pending.length > 0 && (
        <div className="import-preview">
          <h3>Revisa antes de guardar</h3>
          {pending.map((scan) => (
            <ScanDetails key={scan.id} scan={scan} open />
          ))}
          <p>
            Se guardarán en tu espacio. Un examen con la misma fecha, hora y
            equipo reemplazará ese registro.
          </p>
          <button
            className="button"
            onClick={() => {
              onSave?.(pending);
              setPending([]);
              setError("");
            }}
          >
            Guardar {pending.length}{" "}
            {pending.length === 1 ? "examen" : "exámenes"}
          </button>
          <button className="text-button" onClick={() => setPending([])}>
            Cancelar importación
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {scans.length > 0 ? (
        <>
          <label>
            Comparar exámenes del mismo equipo
            <select
              value={selectedDevice}
              onChange={(e) => setDevice(e.target.value)}
            >
              {devices.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <div className="body-metrics">
            {(
              [
                "weightKg",
                "skeletalMuscleKg",
                "bodyFatPercent",
                "visceralFatLevel",
              ] as BodyMetric[]
            ).map((key) => (
              <div key={key}>
                <span>{bodyMetrics[key].label}</span>
                <strong>{latest?.metrics[key] ?? "—"}</strong>
                <small>{bodyMetrics[key].unit}</small>
              </div>
            ))}
          </div>
          <label>
            Indicador
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as BodyMetric)}
            >
              {(Object.keys(bodyMetrics) as BodyMetric[]).map((k) => (
                <option value={k} key={k}>
                  {bodyMetrics[k].label} ({bodyMetrics[k].unit})
                </option>
              ))}
            </select>
          </label>
          {points.length > 1 ? (
            <>
              <BodyTrend
                points={points}
                label={
                  bodyMetrics[metric].label + " · " + bodyMetrics[metric].unit
                }
              />
              <p className="neutral-change">
                Cambio entre primer y último registro:{" "}
                <strong>
                  {points.at(-1)!.value - points[0].value > 0 ? "+" : ""}
                  {(points.at(-1)!.value - points[0].value).toFixed(2)}{" "}
                  {bodyMetrics[metric].unit}
                </strong>
              </p>
            </>
          ) : (
            <p className="scope-note">
              {points.length
                ? "Este es tu punto de partida. Con otro examen del mismo equipo verás la tendencia."
                : "Este indicador no está presente en los exámenes registrados."}
            </p>
          )}
          <div className="scan-history">
            {[...ordered].reverse().map((scan) => (
              <ScanDetails key={scan.id} scan={scan} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Activity size={34} />
          <h3>Tu próximo examen también puede contar una historia.</h3>
          <p>
            Registra los resultados de tu clínica o importa el archivo de
            composición corporal preparado para Mi Semana.
          </p>
        </div>
      )}
      <div className="scope-note">
        <strong>Compara en condiciones similares.</strong>
        <p>
          La bioimpedancia estima la composición corporal y puede variar con la
          hidratación. Conserva el mismo equipo y sigue la preparación indicada
          por tu clínica. Un nivel de grasa visceral no se convierte a
          porcentaje ni a cm².
        </p>
        <a
          href="https://inbodyusa.zendesk.com/hc/en-us/articles/32676821703956-Since-results-depend-on-hydration-does-dehydration-overhydration-give-inaccurate-InBody-results"
          target="_blank"
          rel="noreferrer"
        >
          Fuente: InBody · condiciones de medición
        </a>
      </div>
    </section>
  );
}
function ScanDetails({
  scan,
  open = false,
}: {
  scan: BodyScan;
  open?: boolean;
}) {
  return (
    <details className="scan-details" open={open}>
      <summary>
        {scan.date}
        {scan.time ? " · " + scan.time : ""} — {scan.device}
      </summary>
      <dl>
        {(Object.keys(bodyMetrics) as BodyMetric[])
          .filter((k) => scan.metrics[k] !== undefined)
          .map((k) => (
            <div key={k}>
              <dt>{bodyMetrics[k].label}</dt>
              <dd>
                {scan.metrics[k]} {bodyMetrics[k].unit}
              </dd>
            </div>
          ))}
      </dl>
      {scan.segments && (
        <>
          <h4>Análisis segmental</h4>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Zona</th>
                  <th>Masa magra</th>
                  <th>Referencia</th>
                  <th>Grasa</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(segmentLabels) as (keyof typeof segmentLabels)[])
                  .filter((k) => scan.segments?.[k])
                  .map((k) => {
                    const v = scan.segments![k]!;
                    return (
                      <tr key={k}>
                        <td>{segmentLabels[k]}</td>
                        <td>{v.leanKg ?? "—"} kg</td>
                        <td>{v.leanPercent ?? "—"} %</td>
                        <td>{v.fatKg ?? "—"} kg</td>
                        <td>{v.fatPercent ?? "—"} %</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p>
            Los porcentajes segmentales son referencias del equipo; no equivalen
            al porcentaje de grasa corporal.
          </p>
        </>
      )}
      {scan.reportTargets && (
        <details>
          <summary>Valores automáticos del equipo</summary>
          <p>
            Se conservan como transcripción. No se adoptan como metas ni
            prescripción.
          </p>
          <dl>
            {Object.entries(scan.reportTargets).map(([k, v]) => (
              <div key={k}>
                <dt>
                  {
                    {
                      targetWeightKg: "Peso objetivo del informe (kg)",
                      weightControlKg: "Control de peso del informe (kg)",
                      fatControlKg: "Control de grasa del informe (kg)",
                      muscleControlKg: "Control de músculo del informe (kg)",
                      suggestedEnergyKcal:
                        "Ingesta sugerida por el equipo (kcal)",
                    }[k]
                  }
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {scan.notes && <p>{scan.notes}</p>}
    </details>
  );
}
function BodyTrend({
  points,
  label,
}: {
  points: { label: string; value: number }[];
  label: string;
}) {
  const low = Math.min(...points.map((x) => x.value)),
    high = Math.max(...points.map((x) => x.value));
  const pad = Math.max((high - low) * 0.15, 0.5),
    min = low - pad,
    max = high + pad;
  return (
    <div className="chart">
      <svg
        viewBox="0 0 560 190"
        role="img"
        aria-label={
          label + ": " + points.map((x) => x.label + " " + x.value).join(", ")
        }
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="45"
              x2="540"
              y1={20 + i * 42}
              y2={20 + i * 42}
              stroke="var(--border)"
            />
            <text x="0" y={24 + i * 42} fill="var(--muted)" fontSize="11">
              {(max - ((max - min) * i) / 3).toFixed(1)}
            </text>
          </g>
        ))}
        <polyline
          points={points
            .map(
              (x, i) =>
                `${45 + (i * 480) / Math.max(1, points.length - 1)},${20 + ((max - x.value) / (max - min)) * 126}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
        />
        {points.map((x, i) => (
          <circle
            key={i}
            cx={45 + (i * 480) / Math.max(1, points.length - 1)}
            cy={20 + ((max - x.value) / (max - min)) * 126}
            r="4"
            fill="var(--accent)"
          />
        ))}
        <text x="45" y="178" fontSize="11" fill="var(--muted)">
          {points[0]?.label}
        </text>
        <text
          x="525"
          y="178"
          fontSize="11"
          textAnchor="end"
          fill="var(--muted)"
        >
          {points.at(-1)?.label}
        </text>
      </svg>
      <details>
        <summary>Ver datos del gráfico</summary>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>{label}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((x, i) => (
              <tr key={i}>
                <td>{x.label}</td>
                <td>{x.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
