"use client";
import { useState } from "react";
import { todayKey } from "../lib/purchases";
import {
  PROTOCOL_VERSION,
  validateReview,
  currentReview,
  reviewSnapshot,
  type ReviewRecord,
} from "../lib/protocol";
export function ReviewPanel({
  records,
  plan,
  training,
  onSave,
}: {
  records: ReviewRecord[];
  plan: unknown;
  training: unknown;
  onSave: (r: ReviewRecord) => void;
}) {
  const [scope, setScope] = useState<ReviewRecord["scope"]>("entrenamiento"),
    [error, setError] = useState("");
  const snapshot = reviewSnapshot(scope, plan, training),
    current = currentReview(records, snapshot);
  return (
    <section className="card training-profile review-panel">
      <span className="eyebrow">REVISIÓN PROFESIONAL DECLARADA</span>
      <h2>Quién revisó este plan</h2>
      <p>
        Esta sección registra una revisión que realmente ocurrió. No contacta al
        profesional; se guarda con tus datos y ajustes de sincronización. No valida credenciales ni genera una firma clínica. El acceso
        remoto del nutricionista sigue dependiendo de la conexión de cuenta.
      </p>
      <label>
        Ámbito
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as ReviewRecord["scope"])}
        >
          <option value="entrenamiento">Entrenamiento</option>
          <option value="alimentacion">Alimentación</option>
        </select>
      </label>
      <p>
        <strong>
          {current
            ? current.outcome === "revisado"
              ? `Revisión registrada: ${current.name}, ${current.date}`
              : `Ajustes pendientes: ${current.name}, ${current.date}`
            : "Sin revisión registrada de la versión actual"}
        </strong>
      </p>
      <p>
        Si cambia este plan, el perfil de entrenamiento o el protocolo, la
        revisión anterior se conserva como historial y no avala automáticamente
        la nueva versión.
      </p>
      <details className="review-form">
        <summary>Registrar una revisión realizada</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const d = new FormData(e.currentTarget);
              if (d.get("confirm") !== "on")
                throw Error("Confirma que la revisión realmente se realizó.");
              onSave(
                validateReview(
                  {
                    id: crypto.randomUUID(),
                    date: String(d.get("date")),
                    name: String(d.get("name")),
                    role: d.get("role") as ReviewRecord["role"],
                    scope,
                    outcome: d.get("outcome") as ReviewRecord["outcome"],
                    notes: String(d.get("notes") || ""),
                    recordedBy: d.get("by") as ReviewRecord["recordedBy"],
                    snapshot,
                    protocol: PROTOCOL_VERSION,
                  },
                  todayKey(),
                ),
              );
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Revisa los datos");
            }
          }}
        >
          <div className="form-grid">
            <label>
              Nombre del profesional
              <input name="name" maxLength={100} required />
            </label>
            <label>
              Fecha
              <input
                name="date"
                type="date"
                max={todayKey()}
                defaultValue={todayKey()}
                required
              />
            </label>
            <label>
              Rol
              <select
                name="role"
                key={scope}
                defaultValue={
                  scope === "alimentacion" ? "nutricionista" : "kinesiologo"
                }
              >
                {scope === "alimentacion" ? (
                  <option value="nutricionista">Nutricionista</option>
                ) : (
                  <>
                    <option value="kinesiologo">Kinesiólogo/a</option>
                    <option value="entrenador">
                      Profesional de entrenamiento
                    </option>
                    <option value="medico">Médico/a</option>
                  </>
                )}
              </select>
            </label>
            <label>
              Resultado
              <select name="outcome">
                <option value="ajustes">Hay ajustes por resolver</option>
                <option value="revisado">
                  Revisión realizada de esta versión
                </option>
              </select>
            </label>
          </div>
          <label>
            Quién registra
            <select name="by">
              <option value="usuario">
                La persona usuaria transcribe la revisión
              </option>
              <option value="profesional">
                El profesional la registra en este dispositivo
              </option>
            </select>
          </label>
          <label>
            Observaciones o ajustes
            <input name="notes" maxLength={1000} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="confirm" required />
            Confirmo que esta revisión realmente ocurrió y que este registro no
            equivale a firma ni verificación de credenciales.
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="button outline">Guardar revisión declarada</button>
        </form>
      </details>
      <details>
        <summary>Historial · {records.length} registros</summary>
        {[...records].reverse().map((r) => (
          <div className="exercise" key={r.id}>
            <strong>
              {r.name} · {r.role} · {r.date}
            </strong>
            <p>
              {r.scope} ·{" "}
              {r.outcome === "revisado"
                ? "revisión realizada"
                : "ajustes pendientes"}{" "}
              · {r.protocol} · transcrito por {r.recordedBy}
            </p>
            <p>{r.notes || "Sin observaciones"}</p>
            <small>
              {r.snapshot === reviewSnapshot(r.scope, plan, training) &&
              r.protocol === PROTOCOL_VERSION
                ? "Corresponde a la versión actual"
                : "Histórico: el contenido o protocolo cambió"}
            </small>
          </div>
        ))}
      </details>
    </section>
  );
}
