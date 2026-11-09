"use client";
import { useState } from "react";
import { todayKey } from "../lib/purchases";
import type { TrainingExercise } from "../lib/training";
import {
  validateAssessment,
  latestAssessment,
  assessedPrescription,
  type TrainingAssessment,
} from "../lib/calibration";
type Props = {
  routines: Record<"A" | "B", TrainingExercise[]>;
  date: string;
  records: TrainingAssessment[];
  onSave: (a: TrainingAssessment) => void;
};
export function TrainingCalibration({
  routines,
  date,
  records,
  onSave,
}: Props) {
  const [routine, setRoutine] = useState<"A" | "B">("A"),
    [error, setError] = useState("");
  const exercises = routines[routine].filter((e) => e.externalLoad),
    [chosen, setChosen] = useState("");
  const current = exercises.find((e) => e.name === chosen) || exercises[0];
  const today = todayKey(),
    last = current
      ? latestAssessment(records, routine, current.name, today)
      : undefined;
  const rows = (["A", "B"] as const).flatMap((r) =>
    routines[r]
      .filter((e) => e.externalLoad)
      .map((ex) => ({
        routine: r,
        ex,
        a: latestAssessment(records, r, ex.name, today),
      })),
  );
  if (!rows.length) return null;
  return (
    <section className="card training-profile" id="calibracion">
      <span className="eyebrow blue">PRIMERA SESIÓN · AUTOGUIADA O ACOMPAÑADA</span>
      <h2>Calibra tus cargas</h2>
      <p>
        Esta evaluación no busca tu máximo ni llegar al fallo. Haz A y B en días
        separados. Sigue las instrucciones del equipo y comienza con una carga
        ligera que puedas controlar. Usa 8 repeticiones controladas y termina
        con margen, orientativamente 2–3 posibles; una reserva mayor puede ser
        un inicio suave. Es una estimación que necesita familiarización, no una
        cifra exacta. Si duele o pierdes técnica, detén la prueba.
      </p>
      {current && <p><strong>{current.name}:</strong> {current.cue} Ajusta el asiento y los apoyos antes de empezar. Comprueba que puedes controlar la ida y la vuelta sin rebotes ni compensaciones. Si no sabes ajustar el equipo o ejecutar el movimiento, pide una demostración; no pruebes a ciegas.</p>}
      <p>No necesitas registrar una revisión profesional para usar la rutina. Puedes declarar tu propia comprobación siguiendo estas indicaciones; la app no ve ni valida tu ejecución. Una consulta sí puede ser necesaria ante síntomas, restricciones médicas o enfermedades que requieran adaptar el ejercicio.</p>
      <p>
        Descansa 90–120 segundos entre ensayos. Como regla de esta app, limita a
        dos pruebas por ejercicio; lo pendiente puede revisarse otro día. No
        necesitas probar todas las máquinas en una sesión.
      </p>
      <label>
        Rutina a evaluar
        <select
          value={routine}
          onChange={(e) => setRoutine(e.target.value as "A" | "B")}
        >
          <option>A</option>
          <option>B</option>
        </select>
      </label>
      <label>
        Ejercicio
        <select
          value={current?.name || ""}
          onChange={(e) => setChosen(e.target.value)}
        >
          {exercises.map((e) => (
            <option key={e.name}>{e.name}</option>
          ))}
        </select>
      </label>
      {current && (
        <form
          key={routine + current.name}
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const d = new FormData(e.currentTarget);
              const a = validateAssessment(
                {
                  id: crypto.randomUUID(),
                  date: String(d.get("date")),
                  routine,
                  exercise: current.name,
                  equipment: String(d.get("equipment")),
                  kg: Number(d.get("kg")),
                  reps: Number(d.get("reps")),
                  reserve: Number(d.get("reserve")),
                  pain: d.get("pain") === "si",
                  techniqueReviewed: ["autoregistro", "profesional"].includes(String(d.get("technique"))),
                  techniqueSource: d.get("technique") === "no" ? undefined : d.get("technique") as TrainingAssessment["techniqueSource"],
                },
                today,
              );
              onSave(a);
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Revisa los datos");
            }
          }}
        >
          <div className="form-grid">
            <label>
              Fecha de la prueba
              <input
                name="date"
                type="date"
                max={today}
                defaultValue={today}
                required
              />
            </label>
            <label>
              Equipo exacto
              <input
                name="equipment"
                placeholder="Ej.: remo máquina 3, asiento 4"
                maxLength={100}
                defaultValue={last?.equipment || ""}
                required
              />
            </label>
            <label>
              Kg que realmente probaste
              <input
                name="kg"
                type="number"
                min="0"
                max="500"
                step="0.1"
                required
              />
            </label>
            <label>
              Repeticiones realizadas
              <input
                name="reps"
                type="number"
                min="1"
                max="30"
                defaultValue={8}
                required
              />
            </label>
          </div>
          <label>
            ¿Cuántas repeticiones más habrías podido hacer con buena técnica?
            <select name="reserve" defaultValue="" required>
              <option value="" disabled>
                Selecciona tu esfuerzo
              </option>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Ninguna" : n === 5 ? "5 o más" : n}
                </option>
              ))}
            </select>
          </label>
          <label>
            ¿Hubo dolor?
            <select name="pain" defaultValue="" required>
              <option value="" disabled>
                Selecciona
              </option>
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>
          </label>
          <label>
            ¿Cómo comprobaste el control y la técnica en esta prueba?
            <select name="technique" defaultValue="" required>
              <option value="" disabled>
                Selecciona
              </option>
              <option value="autoregistro">Lo comprobé siguiendo las indicaciones</option>
              <option value="profesional">Con revisión de un profesional</option>
              <option value="no">No puedo confirmarlo / necesito ayuda</option>
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="button blue-button">
            Guardar prueba realizada
          </button>
        </form>
      )}
      <h3>Tu punto de partida por ejercicio</h3>
      {rows.map(({ routine: r, ex, a }) => (
        <div className="exercise" key={r + ex.name}>
          <strong>
            {r} · {ex.name}
          </strong>
          <p>{assessedPrescription(ex, a).label}</p>
          {a && (
            <small>
              Prueba: {a.kg} kg × {a.reps}; quedaban{" "}
              {a.reserve === 5 ? "5 o más" : a.reserve} reps. Equipo:{" "}
              {a.equipment}. {a.date}
            </small>
          )}
        </div>
      ))}
      <p className="fineprint">
        Son datos declarados de una prueba realizada, no una técnica observada por la app ni una garantía médica.
        Cambiar de máquina, ajustes o implemento requiere revisar la carga. Si
        una prueba posterior muestra dolor o mala tolerancia, deja de aparecer
        como referencia de carga.
      </p>
    </section>
  );
}
