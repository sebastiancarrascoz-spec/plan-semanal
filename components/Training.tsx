"use client";
import { useState, type ReactNode } from "react";
import { Dumbbell, Printer } from "lucide-react";
import { TrainingCalibration } from "./TrainingCalibration";
import { latestAssessment, type TrainingAssessment } from "../lib/calibration";
import { todayKey } from "../lib/purchases";
import type { BodyScan } from "../lib/body";
import { ProtocolPanel } from "./ProtocolPanel";
import { PROTOCOL_VERSION } from "../lib/protocol";
import { progressionAdvice } from "../lib/progression";
import type {
  TrainingProfile,
  WorkoutSet,
  TrainingExercise,
} from "../lib/training";
import {
  buildTrainingPlan,
  trainingDefaults,
  validateTrainingProfile,
  lastTrainingSet,
  canProgress,
  startingPrescription,
  equipmentLabels,
  trainingSources,
} from "../lib/training";

type Props = {
  profile?: TrainingProfile;
  name: string;
  height: number;
  recentWeight?: number;
  date: string;
  sets: WorkoutSet[];
  assessments: TrainingAssessment[];
  bodyScan?: BodyScan;
  onAssessment: (a: TrainingAssessment) => void;
  reviewLabel: string;
  activity: ReactNode;
  onProfile: (p: TrainingProfile) => void;
  onSet: (s: WorkoutSet) => void;
};
function target(ex: TrainingExercise) {
  return `${ex.min}–${ex.max}${ex.eachSide ? " por lado" : ""}`;
}
function loadText(x: WorkoutSet | undefined, ex: TrainingExercise) {
  return x
    ? `${ex.externalLoad ? `${x.kg} kg · ` : "Sin carga externa · "}${x.reps} reps · ${x.date}`
    : "Primera sesión";
}
export function Training(props: Props) {
  const [routine, setRoutine] = useState<"A" | "B">("A"),
    [error, setError] = useState("");
  const saved = props.profile || {
    ...trainingDefaults,
    heightCm: props.height,
    weightKg: props.recentWeight,
  };
  let plan: ReturnType<typeof buildTrainingPlan>;
  try {
    plan = buildTrainingPlan(saved);
  } catch {
    plan = buildTrainingPlan(trainingDefaults);
  }
  const p = plan.profile;
  const prescriptionFor = (ex: TrainingExercise, r: string) => {
    const feedback = progressionAdvice(
      props.sets,
      r,
      ex,
      plan.sets,
      todayKey(),
    );
    if (["dolor", "tecnica", "recuperar", "revisar"].includes(feedback.status))
      return { kg: undefined, reps: ex.min, label: feedback.text };
    return startingPrescription(
      ex,
      p,
      lastTrainingSet(props.sets, r, ex.name, props.date),
      latestAssessment(props.assessments, r, ex.name, todayKey()),
    );
  };
  return (
    <div className="training-module">
      <div className="training-screen two-columns">
        <section>
          <section className="card training-profile">
            <nav
              className="training-jumps"
              aria-label="Secciones de entrenamiento"
            >
              <a href="#calibracion">Calibrar</a>
              <a href="#rutinas-entrenamiento">Rutinas</a>
              <a href="#actividad-real">Minutos y pausas</a>
            </nav>
            <span className="eyebrow blue">TU PLAN DE FUERZA</span>
            <h2>Ajusta tu punto de partida</h2>
            <p>
              La edad y el peso dan contexto. Las cargas se eligen por técnica y
              esfuerzo, según tu experiencia y equipamiento.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const d = new FormData(e.currentTarget),
                    optional = (key: string) =>
                      String(d.get(key) || "").trim()
                        ? Number(d.get(key))
                        : undefined;
                  const next = validateTrainingProfile({
                    age: optional("age"),
                    weightKg: optional("weight"),
                    heightCm: optional("height"),
                    experience: d.get(
                      "experience",
                    ) as TrainingProfile["experience"],
                    equipment: d.get(
                      "equipment",
                    ) as TrainingProfile["equipment"],
                    limitations: d.get(
                      "limitations",
                    ) as TrainingProfile["limitations"],
                    notes: String(d.get("notes") || ""),
                    week: Number(d.get("week")),
                  });
                  props.onProfile(next);
                  setError("");
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Revisa los datos.",
                  );
                }
              }}
            >
              <div className="form-grid">
                <label>
                  Edad (años)
                  <input
                    name="age"
                    type="number"
                    min="18"
                    max="100"
                    step="1"
                    defaultValue={p.age ?? ""}
                  />
                </label>
                <label>
                  Peso de referencia (kg)
                  <input
                    name="weight"
                    type="number"
                    min="30"
                    max="350"
                    step="0.1"
                    defaultValue={p.weightKg ?? ""}
                  />
                </label>
                <label>
                  Altura (cm)
                  <input
                    name="height"
                    type="number"
                    min="100"
                    max="230"
                    step="1"
                    defaultValue={p.heightCm ?? ""}
                  />
                </label>
                <label>
                  Semana del ciclo
                  <input
                    name="week"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue={p.week}
                    required
                  />
                </label>
                <label>
                  Experiencia
                  <select name="experience" defaultValue={p.experience}>
                    <option value="inicio">Estoy comenzando o retomando</option>
                    <option value="regular">
                      Entreno regularmente hace más de 6 meses
                    </option>
                  </select>
                </label>
                <label>
                  Equipamiento
                  <select name="equipment" defaultValue={p.equipment}>
                    {Object.entries(equipmentLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Dolor, lesiones o restricciones de ejercicio
                <select
                  name="limitations"
                  defaultValue={p.limitations}
                  required
                >
                  <option value="sin_confirmar">Selecciona una opción</option>
                  <option value="ninguna">
                    No tengo molestias ni restricciones conocidas
                  </option>
                  <option value="revisar">
                    Sí, necesito revisar adaptaciones con mi profesional
                  </option>
                </select>
              </label>
              <label>
                Notas para tu entrenador (opcional)
                <textarea name="notes" maxLength={500} defaultValue={p.notes} />
              </label>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button className="button blue-button">
                Guardar y adaptar A y B
              </button>
            </form>
            <p className="fineprint">
              Estos datos se guardan en este dispositivo. La fecha de tus
              registros no cambia al editar este perfil.
            </p>
          </section>
          {!plan.needsReview && (
            <TrainingCalibration
              routines={plan.routines}
              date={props.date}
              records={props.assessments}
              onSave={props.onAssessment}
            />
          )}
          <section className="card" id="rutinas-entrenamiento">
            <div className="section-title">
              <div>
                <span className="eyebrow blue">
                  SEMANA {p.week} · {plan.phase.toUpperCase()}
                </span>
                <h2>Rutinas A y B</h2>
                <p>2 días por semana · {plan.duration} por sesión</p>
              </div>
              <Dumbbell className="blue" />
            </div>
            {plan.needsReview ? (
              <div className="empty-state">
                <h3>
                  {p.limitations === "revisar"
                    ? "Revisa las adaptaciones antes de comenzar."
                    : "Confirma tu situación para mostrar las rutinas."}
                </h3>
                <p>
                  {p.limitations === "revisar"
                    ? "Lleva tus notas a tu kinesiólogo, médico o entrenador. La app no adapta automáticamente una lesión."
                    : "Completa la opción de molestias y guarda tu perfil arriba."}
                </p>
              </div>
            ) : (
              <>
                {!plan.personalized && (
                  <p className="scope-note">
                    Guía general: agrega edad y peso para identificar tu plan al
                    imprimir.
                  </p>
                )}
                <div className="routine-switch">
                  {(["A", "B"] as const).map((r) => (
                    <button
                      key={r}
                      aria-pressed={routine === r}
                      className={
                        routine === r ? "button blue-button" : "button outline"
                      }
                      onClick={() => setRoutine(r)}
                    >
                      Rutina {r}
                    </button>
                  ))}
                </div>
                <p>
                  {plan.sets} {plan.sets === 1 ? "serie" : "series"} por
                  ejercicio · descanso: {plan.rest}.
                </p>
                <p>{plan.effort}</p>
                {plan.routines[routine].map((ex) => {
                  const previous = lastTrainingSet(
                    props.sets,
                    routine,
                    ex.name,
                    props.date,
                  );
                  const logged = props.sets.filter(
                    (x) =>
                      x.routine === routine &&
                      x.exercise === ex.name &&
                      x.date === props.date,
                  );
                  const advice = progressionAdvice(
                    props.sets,
                    routine,
                    ex,
                    plan.sets,
                    todayKey(),
                  );
                  return (
                    <div className="exercise" key={`${routine}-${ex.name}`}>
                      <h3>{ex.name}</h3>
                      <p>
                        {target(ex)} repeticiones · {loadText(previous, ex)}
                      </p>
                      <p>{ex.cue}</p>
                      <p className="scope-note">
                        <strong>
                          Punto de partida: {plan.sets} ×{" "}
                          {prescriptionFor(ex, routine).reps}
                          {ex.eachSide ? " por lado" : " repeticiones"}.
                        </strong>{" "}
                        {prescriptionFor(ex, routine).label}.
                      </p>
                      <div className="scope-note">
                        <strong>Tu siguiente paso:</strong> {advice.text}
                        {advice.nextKg === undefined ? null : (
                          <p>
                            Escalón propuesto: {advice.nextKg} kg, solo si el
                            incremento declarado coincide con el equipo y puedes
                            mantener el control y el margen de repeticiones.
                          </p>
                        )}
                        <small>
                          Regla {advice.rule} · decisión conservadora de la
                          plantilla, protocolo {PROTOCOL_VERSION}.
                        </small>
                      </div>
                      <form
                        className="set-form"
                        key={`${routine}-${ex.name}-${props.date}-${latestAssessment(props.assessments, routine, ex.name, todayKey())?.id || "pendiente"}`}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const d = new FormData(e.currentTarget);
                          const kg = ex.externalLoad ? Number(d.get("kg")) : 0,
                            reps = Number(d.get("reps"));
                          if (
                            !Number.isFinite(kg) ||
                            kg < 0 ||
                            kg > 500 ||
                            !Number.isInteger(reps) ||
                            reps < 1 ||
                            reps > 120
                          )
                            return;
                          props.onSet({
                            date: props.date,
                            routine,
                            exercise: ex.name,
                            kg,
                            reps,
                            unit:ex.eachSide?"reps_lado":"reps",
                            equipment:
                              String(d.get("equipment") || "").trim() ||
                              undefined,
                            reserve:
                              d.get("reserve") === ""
                                ? undefined
                                : Number(d.get("reserve")),
                            pain:
                              d.get("pain") === ""
                                ? undefined
                                : d.get("pain") === "si",
                            techniqueReviewed:
                              d.get("technique") === ""
                                ? undefined
                                : ["autoregistro", "profesional"].includes(String(d.get("technique"))),
                            techniqueSource: ["autoregistro", "profesional"].includes(String(d.get("technique"))) ? d.get("technique") as WorkoutSet["techniqueSource"] : undefined,
                            recovery: (String(d.get("recovery") || "") ||
                              undefined) as WorkoutSet["recovery"],
                            incrementKg: String(d.get("increment") || "").trim()
                              ? Number(d.get("increment"))
                              : undefined,
                          });
                        }}
                      >
                        {ex.externalLoad ? (
                          <label>
                            Kg de la máquina o implemento
                            <input
                              name="kg"
                              type="number"
                              min="0"
                              max="500"
                              step="0.1"
                              defaultValue={
                                prescriptionFor(ex, routine).kg ?? ""
                              }
                              required
                            />
                          </label>
                        ) : (
                          <p className="fineprint">
                            Sin carga externa · 0 kg en el registro
                          </p>
                        )}
                        <label>
                          {ex.eachSide ? "Reps por lado" : "Repeticiones"}
                          <input
                            name="reps"
                            type="number"
                            min="1"
                            max="120"
                            step="1"
                            defaultValue={prescriptionFor(ex, routine).reps}
                            required
                          />
                        </label>
                        <details className="session-context">
                          <summary>
                            Esfuerzo, equipo y recuperación · necesarios para
                            progresar
                          </summary>
                          <div className="form-grid">
                            <label>
                              Equipo y ajuste
                              <input
                                name="equipment"
                                maxLength={100}
                                defaultValue={
                                  latestAssessment(
                                    props.assessments,
                                    routine,
                                    ex.name,
                                    todayKey(),
                                  )?.equipment ||
                                  previous?.equipment ||
                                  ""
                                }
                              />
                            </label>
                            <label>
                              Repeticiones que quedaban (estimación)
                              <select name="reserve" defaultValue="">
                                <option value="">No sé / no registrado</option>
                                {[0, 1, 2, 3, 4, 5].map((n) => (
                                  <option value={n} key={n}>
                                    {n === 5 ? "5 o más" : n}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Dolor durante esta serie
                              <select name="pain" defaultValue="">
                                <option value="">No registrado</option>
                                <option value="no">No</option>
                                <option value="si">Sí</option>
                              </select>
                            </label>
                            <label>
                              Control y técnica de esta serie
                              <select name="technique" defaultValue="">
                                <option value="">No registrado</option>
                                <option value="autoregistro">Comprobados por mí siguiendo las indicaciones</option>
                                <option value="profesional">Revisión profesional declarada</option>
                                <option value="no">Necesita revisión</option>
                              </select>
                            </label>
                            <label>
                              Recuperación para esta sesión
                              <select name="recovery" defaultValue="">
                                <option value="">No registrado</option>
                                <option value="bien">Buena</option>
                                <option value="regular">Regular</option>
                                <option value="mala">Mala</option>
                              </select>
                            </label>
                            <label>
                              Menor incremento real del equipo (kg, opcional)
                              <input
                                name="increment"
                                type="number"
                                min="0.1"
                                max="50"
                                step="0.1"
                                defaultValue={previous?.incrementKg ?? ""}
                              />
                            </label>
                          </div>
                          <p className="fineprint">
                            No se inventa este contexto desde sesiones antiguas.
                            Las repeticiones en reserva son una percepción con
                            error, no una medición exacta.
                          </p>
                        </details>
                        <button className="button outline">
                          Registrar serie
                        </button>
                      </form>
                      <div className="portion-tags">
                        {logged.map((x, i) => (
                          <span key={i}>
                            Serie {i + 1}:{" "}
                            {ex.externalLoad ? `${x.kg} kg × ` : ""}
                            {x.reps}
                            {ex.eachSide ? " por lado" : " reps"}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        </section>
        <aside>
          {props.activity}
          <ProtocolPanel />
          <section className="card">
            <h3>Revisión de tu versión</h3>
            <p>{props.reviewLabel}</p>
            <p>
              Registra la revisión realizada en Progreso. No equivale a firma
              clínica ni aprobación automática de cada aumento.
            </p>
          </section>
          <section className="card">
            <h2>Tu composición corporal</h2>
            {props.bodyScan ? (
              <>
                <p>
                  {props.bodyScan.device} · {props.bodyScan.date}
                </p>
                <p>
                  Peso: {props.bodyScan.metrics.weightKg ?? "—"} kg · Músculo
                  esquelético: {props.bodyScan.metrics.skeletalMuscleKg ?? "—"}{" "}
                  kg · Grasa: {props.bodyScan.metrics.bodyFatPercent ?? "—"} %
                </p>
                <p>
                  Seguiremos estos valores junto con cintura y rendimiento. El
                  objetivo es revisar la conservación muscular y el cambio de
                  grasa con tu profesional; estos kg de músculo no se convierten
                  en carga de una máquina.
                </p>
              </>
            ) : (
              <p>
                Importa o registra tu InBody en Progreso para ver aquí su fecha,
                equipo y composición corporal. Los informes del chat no se
                cargan automáticamente en el navegador.
              </p>
            )}
          </section>
          <section className="card">
            <h2>Lleva tu plan al gimnasio</h2>
            <p>
              Imprime A y B, una rutina por hoja A4, con espacios para cargas,
              repeticiones y observaciones. También puedes elegir «Guardar como
              PDF» en el diálogo de impresión.
            </p>
            <button
              className="button blue-button"
              disabled={plan.needsReview}
              onClick={() => window.print()}
            >
              <Printer size={18} />
              Imprimir A y B
            </button>
            <p className="fineprint">
              Se imprime el perfil guardado. Guarda tus cambios antes de
              imprimir.
            </p>
          </section>
          <section className="card">
            <h2>Tu semana</h2>
            <p>
              Lunes: A · jueves: B, o elige dos días con al menos 48 horas entre
              sesiones.
            </p>
            <p>
              Semanas 1–2: una serie por ejercicio si estás comenzando. Semanas
              3–12: dos series, siempre según tolerancia. En experiencia
              regular: dos series al inicio y hasta tres después de la semana 4.
            </p>
            <h3>Antes de cada sesión</h3>
            <p>
              Camina suave 5–8 minutos. Practica una serie muy liviana de los
              primeros ejercicios; no cuenta como serie de trabajo. Sigue los
              ajustes del equipo y las indicaciones de cada ejercicio. Si no los
              entiendes o no controlas el movimiento, pide una demostración.
            </p>
            <h3>Elige la carga</h3>
            <p>
              La app espera una evaluación por ejercicio y equipo antes de
              mostrar una carga personal. En Calibra tus cargas registra una
              prueba real; el último peso anotado sin esfuerzo y revisión
              técnica se conserva como historial, no como recomendación.
            </p>
            <p>
              Prueba 8 repeticiones. Si cuesta llegar a 8, pierdes técnica o no
              te quedan 2–3 posibles, baja la carga. Si podrías hacer más de 5
              adicionales con facilidad, descansa 90–120 segundos y prueba un
              solo incremento pequeño. Haz como máximo dos pruebas; registra la
              carga que sí realizaste. La primera carga debe ser ligera y
              controlable en ese equipo; la app no la calcula desde tu InBody.
            </p>
            <p>
              Empieza con una carga ligera. Si no llegas al mínimo de
              repeticiones o pierdes la técnica, bájala. El peso corporal no
              determina cuántos kg debes levantar.
            </p>
            <p>
              Exhala al empujar o tirar; evita contener la respiración. Ante
              dolor, detén ese ejercicio. Si aparecen dolor de pecho, desmayo o
              falta de aire intensa, detén la sesión y busca atención.
            </p>
            {p.age !== undefined && p.age >= 65 && (
              <p>
                Incluye trabajo de equilibrio con apoyo y revisa tus necesidades
                con tu profesional.
              </p>
            )}
            {p.equipment === "sin_equipo" && (
              <p>
                Esta versión necesita una banda o acceso a pesas para añadir un
                tirón de espalda con resistencia; la movilidad en pared no lo
                reemplaza.
              </p>
            )}
          </section>
          <section className="card">
            <h3>Fuentes y alcance</h3>
            <p>
              Plantilla orientativa para adultos. Los ejercicios, descansos y
              fases son decisiones de esta plantilla; no una prescripción
              individual validada por las fuentes. Puedes usar el registro
              autoguiado. Ante síntomas, restricciones médicas o una enfermedad
              que requiera adaptar el ejercicio, consulta antes de aumentar la intensidad.
            </p>
            {trainingSources.map((x) => (
              <p key={x.url}>
                <a href={x.url} target="_blank" rel="noreferrer">
                  {x.name}
                </a>
              </p>
            ))}
          </section>
        </aside>
      </div>
      {!plan.needsReview && (
        <div className="training-print">
          {(["A", "B"] as const).map((r) => (
            <section className="training-print-page" key={r}>
              <header>
                <span>MI SEMANA · PLAN DE FUERZA</span>
                <h1>
                  Rutina {r} · {plan.phase}
                </h1>
                <p>
                  {props.name || "Nombre: __________________"} ·{" "}
                  {p.age === undefined ? "Edad: ____" : `${p.age} años`} ·{" "}
                  {p.weightKg === undefined ? "Peso: ____" : `${p.weightKg} kg`}{" "}
                  ·{" "}
                  {p.heightCm === undefined
                    ? "Altura: ____"
                    : `${p.heightCm} cm`}
                </p>
                {props.bodyScan && (
                  <p>
                    InBody de referencia: {props.bodyScan.date} ·{" "}
                    {props.bodyScan.device} · músculo esquelético{" "}
                    {props.bodyScan.metrics.skeletalMuscleKg ?? "—"} kg · grasa{" "}
                    {props.bodyScan.metrics.bodyFatPercent ?? "—"} %
                  </p>
                )}
                <p>
                  Semana {p.week}/12 ·{" "}
                  {p.experience === "inicio"
                    ? "Inicio o retorno"
                    : "Experiencia regular"}{" "}
                  · {equipmentLabels[p.equipment]}
                </p>
              </header>
              <p>
                <strong>Fecha:</strong> __________________ ·{" "}
                <strong>Duración:</strong> {plan.duration}
                <br />
                <strong>Frecuencia:</strong> A y B en días distintos; al menos
                48 h entre sesiones.
                <br />
                <strong>Preparación:</strong> 5–8 min de caminata suave y
                práctica liviana de los primeros ejercicios.
              </p>
              <p>
                Protocolo {PROTOCOL_VERSION} · {props.reviewLabel}
              </p>
              <p>
                <strong>
                  {plan.sets} {plan.sets === 1 ? "serie" : "series"} de trabajo
                  por ejercicio.
                </strong>{" "}
                Descansa {plan.rest}.<br />
                {plan.effort}
              </p>
              <table>
                <colgroup>
                  <col style={{ width: "33%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "18%" }} />
                  {[1, 2, 3].map((n) => (
                    <col key={n} style={{ width: "12%" }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th>Ejercicio y técnica</th>
                    <th>Reps</th>
                    <th>Carga evaluada y equipo</th>
                    {[1, 2, 3].map((n) => (
                      <th key={n}>
                        Serie {n}
                        <br />
                        kg / reps
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.routines[r].map((ex) => (
                    <tr key={ex.name}>
                      <td>
                        <strong>{ex.name}</strong>
                        <small>{ex.cue}</small>
                      </td>
                      <td>
                        {plan.sets} × {prescriptionFor(ex, r).reps}
                        {ex.eachSide ? " por lado" : " reps"}
                        <small>Después: {target(ex)}</small>
                      </td>
                      <td>{prescriptionFor(ex, r).label}</td>
                      {[1, 2, 3].map((n) => (
                        <td key={n}>
                          {n > plan.sets
                            ? "—"
                            : ex.externalLoad
                              ? "____ kg\n____ reps"
                              : "Sin carga\n____ reps"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <strong>
                  La carga personal procede de una evaluación registrada, no del
                  InBody.
                </strong>{" "}
                Repite solo en el equipo y ajuste evaluados. Si falta la
                evaluación, calibra con las indicaciones de la app o pide ayuda. Prueba
                8 reps, conservando 2–3 posibles, sin dolor y con técnica
                revisada; si eso cambia, vuelve a evaluar. No busques una
                repetición máxima.
              </p>
              <p>
                <strong>Cómo progresar:</strong> primero completa el rango con
                buena técnica. Tras dos fechas distintas con todas las series al
                tope, mismo equipo y carga, sin dolor, buena recuperación y al menos
                dos repeticiones posibles, considera el menor incremento real.
                Vuelve a comprobar tu tolerancia. No aumentes por el cambio de
                semana.
              </p>
              <p>
                <strong>Tus observaciones y ajustes:</strong>
                <br />
                ________________________________________________________________________________
                <br />
                ________________________________________________________________________________
              </p>
              {p.notes && (
                <p>
                  <strong>Tus notas:</strong>{" "}
                  {p.notes.length > 200
                    ? `${p.notes.slice(0, 200)}… (nota completa en la app)`
                    : p.notes}
                </p>
              )}
              <p className="training-print-note">
                Guía orientativa; no reemplaza evaluación profesional. Exhala
                durante el esfuerzo. Detén el ejercicio si duele; ante dolor de
                pecho, desmayo o falta de aire intensa, detén la sesión y busca
                atención. Edad y peso identifican el perfil, no calculan la
                carga.
              </p>
              <footer>
                Referencia general: CDC, What Counts as Physical Activity for
                Adults; NIDDK, Staying Active at Any Size. Selección de
                ejercicios y fases: plantilla Mi Semana. ·{" "}
                {r === "A" ? "1" : "2"}/2
              </footer>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
