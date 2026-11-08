"use client";
import { restrictionLabels, type Food, type Restriction } from "../lib/engine";
export function FoodSafetyEditor({
  food,
  onChange,
}: {
  food: Food;
  onChange: (f: Food) => void;
}) {
  const toggle = (
    key: "contains" | "mayContain" | "reviewedFor",
    r: Restriction,
  ) =>
    onChange({
      ...food,
      [key]: (food[key] || []).includes(r)
        ? food[key]?.filter((x) => x !== r)
        : [...(food[key] || []), r],
    });
  return (
    <details className="food-safety">
      <summary>Ingredientes y revisión de etiqueta · {food.name}</summary>
      <p>
        Usa un producto específico con marca y presentación para una exclusión
        estricta. Registrar una revisión no equivale a una certificación de la
        app.
      </p>
      {(["contains", "mayContain", "reviewedFor"] as const).map((key) => (
        <div key={key}>
          <strong>
            {
              {
                contains: "Contiene",
                mayContain: "Puede contener / trazas",
                reviewedFor: "Etiqueta revisada para excluir",
              }[key]
            }
          </strong>
          <div className="filter-chips">
            {(Object.keys(restrictionLabels) as Restriction[]).map((r) => (
              <button
                type="button"
                key={r}
                aria-pressed={food[key]?.includes(r) || false}
                className={food[key]?.includes(r) ? "selected" : ""}
                onClick={() => toggle(key, r)}
              >
                {restrictionLabels[r].replace("Sin ", "")}
              </button>
            ))}
          </div>
        </div>
      ))}
      <label>
        Referencia de la revisión
        <input
          placeholder="Marca, presentación, fecha y referencia de etiqueta"
          maxLength={240}
          value={food.evidence || ""}
          onChange={(e) => onChange({ ...food, evidence: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="text-button"
        onClick={() =>
          onChange({
            ...food,
            contains: food.contains || [],
            mayContain: food.mayContain || [],
          })
        }
      >
        Confirmar ingredientes y trazas declarados
      </button>
    </details>
  );
}
