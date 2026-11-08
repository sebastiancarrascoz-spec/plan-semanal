"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { foodForMeal, type Meal, type Plan } from "../lib/engine";
export function FoodOptions({
  meal,
  plan,
  onSelect,
}: {
  meal: Meal;
  plan: Plan;
  onSelect: (oldId: string, newId: string) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <>
      <p>
        Elige una opción del mismo grupo. La cantidad se calcula con las
        porciones de esta comida.
      </p>
      <label>
        Buscar alimento
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Por ejemplo, quínoa"
        />
      </label>
      {meal.foods.map((x) => (
        <section className="food-option-group" key={x.food.id}>
          <h3>
            {x.food.group} · {x.portions} porciones
          </h3>
          {plan.foods
            .filter(
              (f) =>
                f.group === x.food.group &&
                f.name
                  .toLocaleLowerCase("es")
                  .includes(query.toLocaleLowerCase("es")),
            )
            .map((f) => {
              const result = foodForMeal(f, plan, meal.slot);
              return (
                <div
                  className={
                    "food-choice " + (!result.compatible ? "unavailable" : "")
                  }
                  key={f.id}
                >
                  <div>
                    <strong>{f.name}</strong>
                    <p>
                      {f.quantity * x.portions} {f.unit}
                    </p>
                    <small>{result.reason}</small>
                  </div>
                  <button
                    className="button outline"
                    disabled={!result.compatible || f.id === x.food.id}
                    onClick={() => onSelect(x.food.id, f.id)}
                  >
                    {f.id === x.food.id ? (
                      <>
                        <Check size={15} />
                        Actual
                      </>
                    ) : (
                      "Elegir"
                    )}
                  </button>
                </div>
              );
            })}
        </section>
      ))}
    </>
  );
}
