"use client";
import { useState } from "react";
import {
  ChefHat,
  Package,
  Plus,
  Snowflake,
  Check,
  ArrowRight,
} from "lucide-react";
import {
  recipeOptions,
  recipeFamilyLabels,
  type RecipeKind,
  mealSteps,
  validateLot,
  prepareBatch,
  consumeIngredients,
  type PantryLot,
  type PreparedBatch,
  type RecipeOption,
} from "../lib/kitchen";
import { getPurchaseFormat, type PurchaseFormat } from "../lib/purchases";
import {
  foodCompatibility,
  slots,
  generateShopping,
  type Plan,
  type Meal,
  type Shopping,
} from "../lib/engine";
type Props = {
  plan: Plan;
  formatOverrides?: Record<string, Partial<PurchaseFormat>>;
  pantry: PantryLot[];
  batches: PreparedBatch[];
  date: string;
  meals: Meal[];
  onDate: (date: string) => void;
  onPantry: (lots: PantryLot[]) => void;
  onUse: (option: RecipeOption) => void;
  onPrepare: (meal: Meal, details: Omit<PreparedBatch, "meal" | "id">) => void;
  onBatches: (b: PreparedBatch[]) => void;
  onPurchases: () => void;
};
export function Kitchen(props: Props) {
  const [view, setView] = useState<"ahora" | "despensa" | "semana">("ahora"),
    [slot, setSlot] = useState(() => {
      const h = new Date().getHours();
      return h < 10 ? 0 : h < 12 ? 1 : h < 16 ? 2 : h < 19 ? 3 : 4;
    }),
    [preparing, setPreparing] = useState<RecipeOption | null>(null),
    [family, setFamily] = useState<RecipeKind | "">(""),
    [message, setMessage] = useState("");
  const options = recipeOptions(
    props.plan,
    slot,
    props.pantry,
    props.batches,
    props.date,
    family || undefined,
  );
  return (
    <div className="kitchen-page">
      <div
        className="purchase-tabs kitchen-tabs"
        role="group"
        aria-label="Opciones de cocina"
      >
        {(["ahora", "despensa", "semana"] as const).map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {
              {
                ahora: "Qué comer",
                despensa: "Despensa",
                semana: "Preparar semana",
              }[v]
            }
          </button>
        ))}
      </div>
      {view === "ahora" && (
        <>
          <section className="card kitchen-heading">
            <div className="section-title">
              <div>
                <span className="eyebrow">TRES OPCIONES, TU MISMO PLAN</span>
                <h2>¿Qué puedes comer ahora?</h2>
                <p>
                  Las cantidades respetan las porciones asignadas para esta
                  comida.
                </p>
              </div>
              <ChefHat size={28} />
            </div>
            <div className="form-grid">
              <label>
                Comida
                <select
                  value={slot}
                  onChange={(e) => {
                    setSlot(Number(e.target.value));
                    setFamily("");
                  }}
                >
                  {slots.map((s, i) => (
                    <option value={i} key={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={props.date}
                  onChange={(e) => {
                    if (e.target.value) props.onDate(e.target.value);
                  }}
                />
              </label>
            </div>
            {[2, 4].includes(slot) && (
              <label>
                Tipo de preparación
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value as RecipeKind | "")}
                >
                  <option value="">Variar los platos</option>
                  {(
                    [
                      "guiso",
                      "salteado",
                      "horno",
                      "ensalada_tibia",
                      "sandwich",
                    ] as RecipeKind[]
                  ).map((kind) => (
                    <option key={kind} value={kind}>
                      {recipeFamilyLabels[kind]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="scope-note">
              La disponibilidad se calcula con lo que registraste. Los productos
              con fecha vencida quedan fuera de las sugerencias. Revisa también
              su estado y conservación.
            </p>
          </section>
          <div className="recipe-grid">
            {options.map((option, i) => (
              <RecipeCard
                key={option.id}
                option={option}
                index={i}
                onUse={() => props.onUse(option)}
                onPrepare={() => setPreparing(option)}
                onPurchases={props.onPurchases}
              />
            ))}
          </div>
          {!options.length && (
            <div className="card empty-state">
              <h3>No hay una opción compatible para esta comida.</h3>
              <p>
                Puede que no tenga porciones asignadas o falten equivalentes
                compatibles. Revisa tu plan con tu profesional.
              </p>
            </div>
          )}
          {options.length > 0 && options.length < 3 && (
            <p className="scope-note">
              Encontramos {options.length} opciones distintas con tu catálogo y
              filtros actuales. No completamos la lista con alimentos excluidos.
            </p>
          )}
        </>
      )}
      {view === "despensa" && <PantryEditor {...props} />}
      {view === "semana" && (
        <>
          <section className="card kitchen-heading">
            <span className="eyebrow">ORGANIZA TU PRÓXIMA PREPARACIÓN</span>
            <h2>Adelanta trabajo para la semana</h2>
            <p>
              Las cantidades siguientes salen de los almuerzos y cenas de la
              minuta seleccionada. Cocina por tandas y registra solo lo que
              realmente preparaste.
            </p>
            <div className="prep-checklist">
              {generateShopping(
                props.meals.filter((m) => [2, 4].includes(m.slot)),
              ).map((x) => (
                <div key={x.id}>
                  <span>{x.name}</span>
                  <strong>
                    {x.quantity} {x.unit}
                  </strong>
                </div>
              ))}
            </div>
            <ol className="prep-steps">
              <li>
                Revisa la despensa y las fechas; separa los ingredientes que
                usarás primero.
              </li>
              <li>
                Prepara cereales y legumbres según su envase, y lava las
                verduras que utilizarás.
              </li>
              <li>
                Elige uno de los platos de abajo y registra el número de
                porciones que dejaste listas.
              </li>
              <li>
                Rotula con fecha y conservación. Congela lo que corresponda
                siguiendo las indicaciones de seguridad alimentaria.
              </li>
            </ol>
            <FoodSafety />
          </section>
          <div className="recipe-grid">
            {recipeOptions(
              props.plan,
              2,
              props.pantry,
              props.batches,
              props.date,
            )
              .filter((x) => !x.batchId)
              .map((option, i) => (
                <RecipeCard
                  key={option.id}
                  option={option}
                  index={i}
                  onUse={() => props.onUse(option)}
                  onPrepare={() => setPreparing(option)}
                  onPurchases={props.onPurchases}
                />
              ))}
          </div>
          <PreparedList
            batches={props.batches}
            date={props.date}
            onChange={props.onBatches}
          />
        </>
      )}
      {preparing && (
        <section
          className="card batch-form"
          role="region"
          aria-label="Registrar preparación"
        >
          <div className="section-title">
            <h2>Registrar porciones preparadas</h2>
            <button className="text-button" onClick={() => setPreparing(null)}>
              Cerrar
            </button>
          </div>
          <p>
            {preparing.title}. Cada porción conserva todas las cantidades
            indicadas para una comida.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const d = new FormData(e.currentTarget);
                const details = {
                  name: String(d.get("name")),
                  servings: Number(d.get("servings")),
                  preparedOn: String(d.get("preparedOn")),
                  expiresOn: String(d.get("expiresOn")),
                  location: String(
                    d.get("location"),
                  ) as PreparedBatch["location"],
                };
                prepareBatch(preparing.meal, props.pantry, details);
                props.onPrepare(preparing.meal, details);
                setPreparing(null);
                setMessage(
                  "Preparación registrada. Se descontaron los ingredientes que figuraban en la despensa.",
                );
              } catch (err: any) {
                setMessage(err.message);
              }
            }}
          >
            <label>
              Nombre
              <input
                name="name"
                defaultValue={preparing.title}
                required
                maxLength={100}
              />
            </label>
            <div className="form-grid">
              <label>
                Porciones completas
                <input
                  name="servings"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="3"
                  required
                />
              </label>
              <label>
                Guardar en
                <select name="location">
                  <option value="refrigerador">Refrigerador</option>
                  <option value="congelador">Congelador</option>
                </select>
              </label>
              <label>
                Fecha de preparación
                <input
                  name="preparedOn"
                  type="date"
                  defaultValue={props.date}
                  required
                />
              </label>
              <label>
                Consumir antes de
                <input name="expiresOn" type="date" min={props.date} required />
              </label>
            </div>
            <p>
              Define la fecha según los ingredientes, el manejo y la
              conservación. No se asigna una duración automática.
            </p>
            <button className="button full">Guardar preparación</button>
          </form>
          <FoodSafety />
        </section>
      )}
      <p role="status" className="kitchen-message">
        {message}
      </p>
    </div>
  );
}
function RecipeCard({
  option,
  index,
  onUse,
  onPrepare,
  onPurchases,
}: {
  option: RecipeOption;
  index: number;
  onUse: () => void;
  onPrepare: () => void;
  onPurchases: () => void;
}) {
  return (
    <article className="card recipe-card">
      <div className="recipe-number">
        OPCIÓN {index + 1}
        {option.batchId && <Snowflake size={15} />}
      </div>
      <h3>{option.title}</h3>
      <span className="recipe-family">
        {(option.meal.recipeKind &&
          recipeFamilyLabels[option.meal.recipeKind as RecipeKind]) ||
          "Preparación registrada"}
      </span>
      <p className="recipe-time">{option.timeLabel}</p>
      <div
        className={
          "recipe-availability " +
          (option.covered === option.total ? "complete" : "")
        }
      >
        <Package size={16} />
        {option.batchId
          ? "Tienes una porción preparada"
          : `${option.covered} de ${option.total} ingredientes registrados en cantidad suficiente`}
      </div>
      {option.soon && (
        <span className="expiry-label">
          Aprovecha primero lo que vence pronto
        </span>
      )}
      <ul className="recipe-ingredients">
        {option.meal.foods.map((x) => (
          <li key={x.food.id}>
            <span>{x.food.name}</span>
            <strong>
              {new Intl.NumberFormat("es-CL", {
                maximumFractionDigits: 2,
              }).format(x.food.quantity * x.portions)}{" "}
              {x.food.unit}
            </strong>
          </li>
        ))}
      </ul>
      <details>
        <summary>Cómo prepararlo</summary>
        <ol>
          {option.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <FoodSafety />
      </details>
      {option.missing.length > 0 && (
        <details>
          <summary>Qué falta en tu despensa registrada</summary>
          {option.missing.map((x) => (
            <p key={x.id}>
              {x.name}:{" "}
              {new Intl.NumberFormat("es-CL", {
                maximumFractionDigits: 2,
              }).format(x.quantity)}{" "}
              {x.unit}
            </p>
          ))}
          <button className="text-button" onClick={onPurchases}>
            Ver compras en formatos comerciales <ArrowRight size={14} />
          </button>
        </details>
      )}
      <button className="button full" onClick={onUse}>
        {option.batchId
          ? "Usar esta porción en mi minuta"
          : "Elegir para esta comida"}
      </button>
      {!option.batchId && (
        <button className="text-button" onClick={onPrepare}>
          Preparar varias porciones
        </button>
      )}
    </article>
  );
}
function PantryEditor(props: Props) {
  const [foodId, setFoodId] = useState(props.plan.foods[0]?.id || ""),
    [basis, setBasis] = useState<"envase" | "porcion">("envase"),
    [message, setMessage] = useState("");
  const food = props.plan.foods.find((f) => f.id === foodId);
  const shopping: Shopping | undefined = food
    ? {
        id: food.id + "|" + food.unit,
        name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        section: food.section,
      }
    : undefined;
  const format = shopping
    ? getPurchaseFormat(shopping, props.formatOverrides?.[shopping.id])
    : undefined;
  return (
    <>
      <section className="card pantry-entry">
        <div className="section-title">
          <div>
            <h2>Tu despensa y congelador</h2>
            <p>
              Registra cantidades reales. Puedes tener varios envases con fechas
              distintas.
            </p>
          </div>
          <Package size={26} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              if (!food || !format) throw Error("Selecciona un alimento.");
              if (basis === "envase" && !format.configured)
                throw Error(
                  "Define primero su formato de compra o regístralo como porciones listas.",
                );
              const d = new FormData(e.currentTarget),
                amount = Number(d.get("quantity")),
                size = Number(d.get("size"));
              if (
                !Number.isFinite(amount) ||
                amount <= 0 ||
                !Number.isFinite(size) ||
                size <= 0
              )
                throw Error("Ingresa una cantidad mayor que cero.");
              const lot = validateLot({
                id: crypto.randomUUID(),
                foodId: food.id,
                foodName: food.name,
                planUnit: food.unit,
                quantity: basis === "envase" ? amount * size : amount,
                unit: basis === "envase" ? format.format.unit : "porción",
                planUnitsPerUnit:
                  basis === "envase" ? 1 / format.format.factor : food.quantity,
                location: String(d.get("location")) as PantryLot["location"],
                addedOn: String(d.get("addedOn")),
                expiresOn: String(d.get("expiresOn")) || undefined,
                note: String(d.get("note")),
              });
              props.onPantry([...props.pantry, lot]);
              setMessage(
                "Alimento guardado. Se tendrá en cuenta en las opciones y las compras.",
              );
              e.currentTarget.reset();
            } catch (err: any) {
              setMessage(err.message);
            }
          }}
        >
          <label>
            Alimento
            <select value={foodId} onChange={(e) => setFoodId(e.target.value)}>
              {props.plan.foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cómo lo tienes
            <select
              value={basis}
              onChange={(e) => setBasis(e.target.value as typeof basis)}
            >
              <option value="envase">En envase comprado</option>
              <option value="porcion">
                Preparado, en porciones de mi plan
              </option>
            </select>
          </label>
          {food && format && (
            <div className="scope-note">
              {basis === "envase"
                ? `Producto de compra: ${format.format.name}. ${format.format.note}`
                : `Una porción de ${food.name.toLowerCase()} equivale a ${food.quantity} ${food.unit} según tu catálogo. Registra solo lo que realmente tienes listo.`}
            </div>
          )}
          <div className="form-grid">
            <label>
              {basis === "envase"
                ? "Cantidad de envases (admite fracciones)"
                : "Porciones disponibles"}
              <input
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue="1"
                required
              />
            </label>
            <label>
              {basis === "envase"
                ? `Contenido por envase (${format?.format.unit || "unidad"})`
                : "Tamaño de registro"}
              <input
                key={foodId + basis}
                name="size"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={basis === "envase" ? format?.format.size || 1 : 1}
                readOnly={basis === "porcion"}
                required
              />
            </label>
            <label>
              Guardar en
              <select name="location">
                <option value="despensa">Despensa</option>
                <option value="refrigerador">Refrigerador</option>
                <option value="congelador">Congelador</option>
              </select>
            </label>
            <label>
              Disponible desde
              <input
                name="addedOn"
                type="date"
                defaultValue={props.date}
                required
              />
            </label>
            <label>
              Consumir antes de (si lo sabes)
              <input name="expiresOn" type="date" />
            </label>
            <label>
              Nota (opcional)
              <input
                name="note"
                maxLength={160}
                placeholder="Marca, envase abierto, preparación…"
              />
            </label>
          </div>
          <button className="button full">
            <Plus size={16} />
            Agregar a mi despensa
          </button>
        </form>
        <p role="status">{message}</p>
        <p className="scope-note">
          Al marcar una comida se descuenta lo registrado, empezando por la
          fecha de vencimiento más próxima. Al desmarcarla se revierte ese
          movimiento. Puedes corregir las existencias si comiste fuera o usaste
          otros ingredientes.
        </p>
      </section>
      <section className="card pantry-list">
        <h2>Lo que tienes registrado</h2>
        {!props.pantry.length && (
          <div className="empty-state">
            <Package size={30} />
            <h3>Tu despensa empieza vacía.</h3>
            <p>
              Agrega los alimentos que ya tienes para recibir opciones más
              útiles y descontarlos de las compras.
            </p>
          </div>
        )}
        {props.pantry
          .slice()
          .sort((a, b) =>
            (a.expiresOn || "9999").localeCompare(b.expiresOn || "9999"),
          )
          .map((lot) => (
            <article className="pantry-lot" key={lot.id}>
              <div>
                <h3>{lot.foodName}</h3>
                <p>
                  {lot.location} ·{" "}
                  {lot.expiresOn
                    ? `consumir antes de ${lot.expiresOn}`
                    : "sin fecha registrada"}
                </p>
                {lot.expiresOn && lot.expiresOn < props.date && (
                  <strong className="form-error">
                    Fecha vencida: fuera de sugerencias y descuentos
                  </strong>
                )}
                {lot.note && <small>{lot.note}</small>}
              </div>
              <label>
                Cantidad ({lot.unit})
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lot.quantity}
                  onChange={(e) =>
                    props.onPantry(
                      props.pantry.map((l) =>
                        l.id === lot.id
                          ? {
                              ...l,
                              quantity: Math.max(
                                0,
                                Number(e.target.value) || 0,
                              ),
                            }
                          : l,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="text-button"
                onClick={() => {
                  if (confirm("¿Quitar este registro de la despensa?"))
                    props.onPantry(props.pantry.filter((l) => l.id !== lot.id));
                }}
              >
                Quitar
              </button>
            </article>
          ))}
      </section>
      <PreparedList
        batches={props.batches}
        date={props.date}
        onChange={props.onBatches}
      />
    </>
  );
}
function PreparedList({
  batches,
  date,
  onChange,
}: {
  batches: PreparedBatch[];
  date: string;
  onChange: (b: PreparedBatch[]) => void;
}) {
  return (
    <section className="card prepared-list">
      <h2>Platos preparados</h2>
      {!batches.length ? (
        <p>
          Aún no registras platos preparados. Puedes guardar varias porciones
          desde una receta.
        </p>
      ) : (
        batches.map((b) => (
          <article className="prepared-row" key={b.id}>
            <div>
              <h3>{b.name}</h3>
              <p>
                {b.servings} porciones · {b.location} · consumir antes de{" "}
                {b.expiresOn}
              </p>
              {b.expiresOn < date && (
                <strong className="form-error">
                  Fecha vencida: fuera de las opciones
                </strong>
              )}
            </div>
            <button
              className="text-button"
              onClick={() => {
                if (
                  confirm(
                    "¿Quitar la preparación? Los ingredientes ya utilizados no volverán a la despensa.",
                  )
                )
                  onChange(batches.filter((x) => x.id !== b.id));
              }}
            >
              Quitar
            </button>
          </article>
        ))
      )}
    </section>
  );
}
function FoodSafety() {
  return (
    <details className="food-safety-note">
      <summary>Conservación y recalentado</summary>
      <p>
        Enfría y refrigera o congela las sobras pronto, dentro de 2 horas. El
        arroz requiere enfriado rápido. Sigue las indicaciones de tu producto y
        usa un termómetro para el recalentado.
      </p>
      <a
        href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures"
        target="_blank"
        rel="noreferrer"
      >
        Temperaturas de cocción y recalentado · FoodSafety.gov
      </a>
      <a
        href="https://www.mpi.govt.nz/food-safety-home/preparing-and-storing-food-safely-at-home/safe-food-preparation-cooking-and-storage-at-home"
        target="_blank"
        rel="noreferrer"
      >
        Conservación de sobras y arroz · MPI
      </a>
    </details>
  );
}
