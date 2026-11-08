"use client";
import { useState } from "react";
import { Check, Leaf } from "lucide-react";
import {
  foodCompatibility,
  restrictionLabels,
  validatePlan,
  type Plan,
  type Diet,
  type Restriction,
} from "../lib/engine";
export function FoodProfile({
  plan,
  onSave,
  onPersonal,
}: {
  plan: Plan;
  onSave: (p: Plan) => void;
  onPersonal: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(plan)),
    [error, setError] = useState("");
  const toggle = (
    key: "restrictions" | "excludedFoodIds" | "preferredFoodIds",
    value: string,
  ) =>
    setDraft((p) => ({
      ...p,
      [key]: (p[key] || []).includes(value as never)
        ? p[key]?.filter((x) => x !== value)
        : [...(p[key] || []), value],
    }));
  return (
    <div className="food-profile">
      <p>
        Elige cómo te alimentas y qué ingredientes necesitas excluir. Las
        porciones siguen siendo las de tu plan profesional.
      </p>
      <h3>1. Tipo de alimentación</h3>
      <div className="diet-options">
        {(["omnívoro", "pescetariano", "vegetariano", "vegano"] as Diet[]).map(
          (d) => (
            <button
              key={d}
              type="button"
              aria-pressed={draft.diet === d}
              className={"diet-option " + (draft.diet === d ? "selected" : "")}
              onClick={() => setDraft((p) => ({ ...p, diet: d }))}
            >
              <Leaf size={19} />
              <strong>{d[0].toUpperCase() + d.slice(1)}</strong>
              <small>
                {
                  {
                    omnívoro: "Incluye alimentos animales y vegetales",
                    pescetariano: "Incluye pescado, huevos y lácteos",
                    vegetariano: "Incluye huevos y lácteos",
                    vegano: "Solo alimentos de origen vegetal",
                  }[d]
                }
              </small>
              {draft.diet === d && <Check size={16} />}
            </button>
          ),
        )}
      </div>
      <h3>2. Restricciones</h3>
      <div className="filter-chips">
        {(Object.keys(restrictionLabels) as Restriction[]).map((r) => (
          <button
            type="button"
            key={r}
            aria-pressed={draft.restrictions?.includes(r) || false}
            onClick={() => toggle("restrictions", r)}
            className={draft.restrictions?.includes(r) ? "selected" : ""}
          >
            {draft.restrictions?.includes(r) && <Check size={14} />}{" "}
            {restrictionLabels[r]}
          </button>
        ))}
      </div>
      <label>
        Cómo aplicar estos filtros
        <select
          value={draft.restrictionMode || "ingredientes"}
          onChange={(e) =>
            setDraft((p) => ({
              ...p,
              restrictionMode: e.target.value as Plan["restrictionMode"],
            }))
          }
        >
          <option value="ingredientes">Evitar ingredientes declarados</option>
          <option value="estricta">
            Exclusión estricta: exigir revisión de etiqueta
          </option>
        </select>
      </label>
      <p className="scope-note">
        Los alimentos genéricos no acreditan ausencia de trazas. Para alergias o
        enfermedad celíaca, usa exclusión estricta y un catálogo de productos
        revisado con tu profesional. Sin lactosa y sin leche son filtros
        distintos.
      </p>
      <h3>3. Preferencias</h3>
      <p>
        «Preferir» aumenta su presencia cuando hay alternativas; «Evitar» lo
        excluye del generador y los intercambios.
      </p>
      <div className="preferences-list">
        {draft.foods.map((f) => (
          <div key={f.id}>
            <span>{f.name}</span>
            <button
              type="button"
              aria-pressed={draft.preferredFoodIds?.includes(f.id) || false}
              onClick={() => toggle("preferredFoodIds", f.id)}
            >
              Preferir
            </button>
            <button
              type="button"
              aria-pressed={draft.excludedFoodIds?.includes(f.id) || false}
              onClick={() => toggle("excludedFoodIds", f.id)}
            >
              Evitar
            </button>
          </div>
        ))}
      </div>
      <div className="compatibility-summary">
        <strong>
          {
            draft.foods.filter((f) => foodCompatibility(f, draft).compatible)
              .length
          }{" "}
          de {draft.foods.length} equivalentes disponibles
        </strong>
        {draft.groups
          .filter((g) => g.daily > 0)
          .map((g) => (
            <p key={g.name}>
              {g.name}:{" "}
              {
                draft.foods.filter(
                  (f) =>
                    f.group === g.name &&
                    foodCompatibility(f, draft).compatible,
                ).length
              }{" "}
              opciones
            </p>
          ))}
      </div>
      <p role="alert" className="form-error">
        {error}
      </p>
      <button
        className="button full"
        onClick={() => {
          try {
            validatePlan(draft);
            onSave({ ...draft, version: plan.version + 1 });
          } catch (e: any) {
            setError(e.message + " Estos cambios aún no se han aplicado.");
          }
        }}
      >
        Aplicar filtros y generar minuta
      </button>
      <button className="text-button" onClick={onPersonal}>
        Editar nombre, altura y objetivo
      </button>
    </div>
  );
}
