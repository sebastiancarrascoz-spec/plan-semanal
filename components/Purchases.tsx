"use client";
import { useState, useMemo } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  ShoppingBasket,
  ExternalLink,
} from "lucide-react";
import {
  periodShopping,
  commercialRows,
  purchaseText,
  formatAmount,
  addDays,
  todayKey,
  type PurchaseBasket,
  type PurchaseEdit,
  type PurchaseFormat,
  type CommercialRow,
} from "../lib/purchases";
import type { Plan, Meal, Shopping } from "../lib/engine";
import {
  kitchenPurchaseForecast,
  composeWeeklyMenu,
  sumShopping,
  type PantryLot,
  type PreparedBatch,
} from "../lib/kitchen";
const humanDate = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });
export function Purchases({
  plan,
  menus,
  start,
  baskets,
  manual,
  onStart,
  onBasket,
  onManual,
  pantry = [],
  batches = [],
  checks = {},
}: {
  plan: Plan;
  menus: Record<string, Meal[]>;
  start: string;
  baskets: Record<string, PurchaseBasket>;
  manual: Shopping[];
  onStart: (s: string) => void;
  onBasket: (key: string, b: PurchaseBasket) => void;
  onManual: (s: Shopping) => void;
  pantry?: PantryLot[];
  batches?: PreparedBatch[];
  checks?: Record<string, boolean>;
}) {
  const [mode, setMode] = useState<"month" | "week">("month"),
    [freshWeek, setFreshWeek] = useState(0),
    [message, setMessage] = useState(""),
    [text, setText] = useState("");
  const fallback = useMemo(() => {
    const cache = new Map<string, Meal[]>();
    return (week: string) => {
      if (!cache.has(week)) cache.set(week, composeWeeklyMenu(plan, 0, week));
      return cache.get(week)!;
    };
  }, [plan]);
  const days = mode === "month" ? 30 : 7;
  const weekIndex = Math.min(freshWeek, Math.ceil(days / 7) - 1),
    freshStart = addDays(start, weekIndex * 7),
    freshDays = Math.min(7, days - weekIndex * 7),
    end = addDays(start, days - 1),
    freshEnd = addDays(freshStart, freshDays - 1);
  const key = `${mode}:${start}`,
    basket = baskets[key] || { items: {} };
  let main: ReturnType<typeof periodShopping> | undefined,
    fresh: ReturnType<typeof periodShopping> | undefined,
    rows: CommercialRow[] = [],
    error = "";
  try {
    main = periodShopping(plan, menus, start, days, fallback);
    fresh = periodShopping(plan, menus, freshStart, freshDays, fallback);
    const forecast = kitchenPurchaseForecast(
      plan,
      menus,
      start,
      days,
      pantry,
      batches,
      checks,
    );
    const freshMissing = sumShopping(
      Array.from(
        { length: freshDays },
        (_, i) => forecast.missingByDate[addDays(freshStart, i)] || [],
      ).flat(),
    );
    rows = commercialRows(
      [...main.items, ...manual],
      [...fresh.items, ...manual],
      basket,
      freshStart,
      {
        main: [...forecast.items, ...manual],
        fresh: [...freshMissing, ...manual],
      },
    );
  } catch (e: any) {
    error = e.message;
  }
  const patch = (row: CommercialRow, change: Partial<PurchaseEdit>) => {
    onBasket(key, {
      items: {
        ...basket.items,
        [row.editKey]: { ...basket.items[row.editKey], ...change },
      },
    });
    setText("");
  };
  const patchFormat = (row: CommercialRow, format: Partial<PurchaseFormat>) => {
    onBasket(key, {
      items: {
        ...basket.items,
        [row.id]: {
          ...basket.items[row.id],
          format: { ...basket.items[row.id]?.format, ...format },
        },
      },
    });
    setText("");
  };
  const included = rows.filter((x) => x.included && x.packs > 0 && !x.checked),
    priced = included.filter((x) => x.total !== undefined);
  const changeStart = (s: string) => {
    if (!s) return;
    onStart(s);
    setFreshWeek(0);
    setText("");
    setMessage("");
  };
  return (
    <section className="purchase-page">
      <div className="purchase-period card">
        <div className="section-title">
          <div>
            <span className="eyebrow">COMPRA EN FORMATOS REALES</span>
            <h2>
              {mode === "month"
                ? "Tu compra para 30 días"
                : "Tu compra para 7 días"}
            </h2>
            <p>Despensa para el período y frescos por semana.</p>
          </div>
          <ShoppingBasket size={25} />
        </div>
        <div
          className="purchase-tabs"
          role="group"
          aria-label="Período de compra"
        >
          <button
            aria-pressed={mode === "month"}
            onClick={() => {
              setMode("month");
              setFreshWeek(0);
              setText("");
            }}
          >
            Mensual · 30 días
          </button>
          <button
            aria-pressed={mode === "week"}
            onClick={() => {
              setMode("week");
              setFreshWeek(0);
              setText("");
            }}
          >
            Semanal · 7 días
          </button>
        </div>
        <div className="purchase-dates">
          <button
            className="icon-button"
            aria-label="Período anterior de compra"
            onClick={() => changeStart(addDays(start, -days))}
          >
            <ChevronLeft size={18} />
          </button>
          <strong>
            {humanDate(start)} — {humanDate(end)} de{" "}
            {new Date(end + "T12:00:00").getFullYear()}
          </strong>
          <button
            className="icon-button"
            aria-label="Siguiente período de compra"
            onClick={() => changeStart(addDays(start, days))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="purchase-start">
          <label>
            Comprar desde
            <input
              type="date"
              value={start}
              onChange={(e) => changeStart(e.target.value)}
            />
          </label>
          <button
            className="text-button"
            onClick={() => changeStart(todayKey())}
          >
            Empezar hoy
          </button>
        </div>
        <p className="scope-note">
          Las existencias registradas en Cocina → Despensa se descuentan
          automáticamente. En los ajustes de cada producto agrega solo envases
          adicionales que no estén registrados allí.
        </p>
        <p className="purchase-explanation">
          {mode === "month"
            ? "Compra la despensa para 30 días desde la fecha elegida y repón los frescos por semana."
            : "Son 7 días desde la fecha elegida."}{" "}
          Los envases se redondean hacia arriba y se descuenta lo que indiques
          que ya tienes.
        </p>
        {main && (
          <details className="projection-info">
            <summary>¿De dónde salen las cantidades?</summary>
            <p>
              {main.plannedDays} días usan una minuta guardada y{" "}
              {main.projectedDays} días se proyectan con tu plan actual. Puedes
              ajustar los formatos y rendimientos al tamaño de los productos que
              compras. Esto no cambia tus porciones de alimentación.
            </p>
            <p>
              Los tamaños de bolsa, caja y botella son sugerencias editables. No
              representan stock ni precios de un supermercado.
            </p>
          </details>
        )}
      </div>
      {error ? (
        <div role="alert" className="scope-note">
          {error} Revisa los equivalentes disponibles en tu plan.
        </div>
      ) : (
        <>
          <div className="purchase-grid">
            <section className="card purchase-group">
              <div className="section-title">
                <div>
                  <h2>
                    {mode === "month"
                      ? "Compra principal del mes"
                      : "Compra principal de la semana"}
                  </h2>
                  <p>
                    {humanDate(start)} — {humanDate(end)}
                  </p>
                </div>
                <span className="small-badge">{days} días</span>
              </div>
              <p className="group-description">
                Despensa y productos que puedes guardar según su etiqueta.
              </p>
              <ProductRows
                rows={rows.filter((x) => x.format.cadence === "principal")}
                onPatch={patch}
                onFormat={patchFormat}
              />
            </section>
            <section className="card purchase-group">
              <div className="section-title">
                <div>
                  <h2>Reposición de frescos</h2>
                  <p>
                    {humanDate(freshStart)} — {humanDate(freshEnd)}
                  </p>
                </div>
                <span className="small-badge">{freshDays} días</span>
              </div>
              {mode === "month" && (
                <div
                  className="fresh-weeks"
                  role="group"
                  aria-label="Semana de reposición de frescos"
                >
                  {Array.from({ length: Math.ceil(days / 7) }, (_, i) => (
                    <button
                      key={i}
                      aria-pressed={weekIndex === i}
                      onClick={() => {
                        setFreshWeek(i);
                        setText("");
                      }}
                    >
                      {i === 0 ? "Primera" : `${i + 1}.ª`} compra
                      {Math.min(7, days - i * 7) < 7
                        ? ` · ${Math.min(7, days - i * 7)} días`
                        : ""}
                    </button>
                  ))}
                </div>
              )}
              <p className="group-description">
                Frutas, verduras, pan y refrigerados. Revisa la conservación
                indicada en cada envase.
              </p>
              <ProductRows
                rows={rows.filter(
                  (x) => x.format.cadence === "fresco" && x.consumption > 0,
                )}
                onPatch={patch}
                onFormat={patchFormat}
              />
            </section>
          </div>
          <section className="card purchase-summary">
            <h2>Lista para llevar al supermercado</h2>
            <p>
              {included.length} artículos por comprar entre la compra principal
              y esta reposición de frescos.
            </p>
            {priced.length > 0 && (
              <p className="manual-price">
                Estimación con tus precios:{" "}
                <strong>
                  {new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                    maximumFractionDigits: 0,
                  }).format(priced.reduce((n, x) => n + (x.total || 0), 0))}
                </strong>{" "}
                · {priced.length} de {included.length} artículos, sin despacho.
              </p>
            )}
            <button
              className="button"
              onClick={() => {
                try {
                  setText(
                    purchaseText(
                      rows,
                      `${humanDate(start)} — ${humanDate(end)}`,
                      `${humanDate(freshStart)} — ${humanDate(freshEnd)}`,
                    ),
                  );
                  setMessage("Revisa la lista antes de copiarla.");
                } catch (e: any) {
                  setMessage(e.message);
                }
              }}
            >
              Preparar lista de compra
            </button>
            {text && (
              <>
                <label>
                  Tu lista en envases y unidades
                  <textarea rows={10} value={text} readOnly />
                </label>
                <button
                  className="button outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(text);
                      setMessage(
                        "Lista copiada. Incluye solo artículos y cantidades de compra.",
                      );
                    } catch {
                      setMessage("Selecciona y copia el texto de la lista.");
                    }
                  }}
                >
                  <Copy size={16} />
                  Copiar lista
                </button>
              </>
            )}
            <p role="status">{message}</p>
            <div className="retailer-links">
              <a
                href="https://www.jumbo.cl/oferta/compra-whatsapp"
                target="_blank"
                rel="noreferrer"
              >
                Continuar por el canal oficial de Jumbo{" "}
                <ExternalLink size={14} />
              </a>
              <a href="https://www.lider.cl/" target="_blank" rel="noreferrer">
                Abrir Lider
              </a>
              <a href="https://www.tottus.cl/" target="_blank" rel="noreferrer">
                Abrir Tottus
              </a>
            </div>
            <small>
              Mi Semana prepara la lista. La selección de productos, el carrito
              de la tienda y el pago se revisan en el supermercado.
            </small>
            <h3>Agregar algo más</h3>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const d = new FormData(form);
                onManual({
                  id: crypto.randomUUID(),
                  name: String(d.get("name")).trim(),
                  quantity: Number(d.get("qty")),
                  unit: "unidad",
                  section: "Otros",
                });
                form.reset();
              }}
            >
              <input
                name="name"
                aria-label="Artículo adicional"
                placeholder="Por ejemplo, detergente"
                required
                maxLength={80}
              />
              <input
                name="qty"
                aria-label="Cantidad de envases adicionales"
                type="number"
                min="1"
                max="100"
                defaultValue="1"
                required
              />
              <button className="button" aria-label="Agregar artículo">
                <Plus size={17} />
              </button>
            </form>
          </section>
        </>
      )}
    </section>
  );
}
function ProductRows({
  rows,
  onPatch,
  onFormat,
}: {
  rows: CommercialRow[];
  onPatch: (r: CommercialRow, p: Partial<PurchaseEdit>) => void;
  onFormat: (r: CommercialRow, f: Partial<PurchaseFormat>) => void;
}) {
  if (!rows.length)
    return (
      <p className="scope-note">
        No hay productos de este tipo para el período elegido.
      </p>
    );
  return (
    <div>
      {rows.map((row) => (
        <article
          className={
            "commercial-product " +
            (row.checked ? "purchased" : "") +
            (!row.included ? " excluded" : "")
          }
          key={row.editKey}
        >
          <div className="commercial-title">
            <button
              className="meal-check"
              aria-label={`${row.checked ? "Desmarcar" : "Marcar como comprado"} ${row.format.name}`}
              aria-pressed={row.checked}
              onClick={() => onPatch(row, { checked: !row.checked })}
            >
              {row.checked ? <Check size={20} /> : <span />}
            </button>
            <div>
              <h3>{row.format.name}</h3>
              {row.pantryCredit > 0 && (
                <small className="pantry-credit">
                  Cubierto por despensa y registros:{" "}
                  {formatAmount(row.pantryCredit, row.format.unit)}
                </small>
              )}
              <strong className="package-quantity">
                {!row.included
                  ? "Fuera de esta compra"
                  : !row.configured
                    ? "Define su presentación"
                    : row.packs === 0
                      ? "Cubierto con lo que tienes"
                      : row.purchaseText}
              </strong>
            </div>
          </div>
          <details className="purchase-adjust">
            <summary>Ajustar formato y lo que ya tengo</summary>
            <div className="form-grid">
              <label>
                Envases adicionales ({row.format.plural})
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="0.5"
                  value={row.havePacks}
                  onChange={(e) =>
                    onPatch(row, {
                      havePacks: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <label>
                Precio por {row.format.singular} (opcional)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.price ?? ""}
                  onChange={(e) =>
                    onPatch(row, {
                      price: e.target.value
                        ? Math.max(0, Number(e.target.value) || 0)
                        : undefined,
                    })
                  }
                />
              </label>
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={row.included}
                onChange={(e) => onPatch(row, { included: e.target.checked })}
              />
              Incluir en esta compra
            </label>
            <FormatForm row={row} onSave={(f) => onFormat(row, f)} />
            <details className="calculation-detail">
              <summary>Ver cálculo desde el menú</summary>
              <p>
                El plan usa {row.original.quantity} {row.original.unit} en el
                período completo. La compra de esta sección estima{" "}
                {formatAmount(row.consumption, row.format.unit)} antes de
                descontar existencias.
              </p>
              <p>{row.format.note}</p>
              {row.format.source && (
                <a href={row.format.source} target="_blank" rel="noreferrer">
                  Consultar referencia del rendimiento
                </a>
              )}
              <p>
                Con la compra sugerida y las existencias, sobrarían
                aproximadamente {formatAmount(row.leftover, row.format.unit)}{" "}
                después de consumir lo proyectado. Revísalo como despensa para
                tu próxima compra.
              </p>
            </details>
          </details>
        </article>
      ))}
    </div>
  );
}
function FormatForm({
  row,
  onSave,
}: {
  row: CommercialRow;
  onSave: (f: Partial<PurchaseFormat>) => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      className="format-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget),
          size = Number(d.get("size")),
          factor = Number(d.get("factor"));
        if (
          size <= 0 ||
          factor <= 0 ||
          !Number.isFinite(size) ||
          !Number.isFinite(factor)
        ) {
          setError("El formato y el rendimiento deben ser mayores que cero.");
          return;
        }
        const singular = String(d.get("singular")).trim(),
          plural = String(d.get("plural")).trim();
        onSave({
          name: String(d.get("name")).trim(),
          size,
          factor,
          unit: String(d.get("unit")) as PurchaseFormat["unit"],
          cadence: String(d.get("cadence")) as PurchaseFormat["cadence"],
          singular,
          plural,
          note: String(d.get("note")).trim(),
          estimated: true,
        });
        setError("Formato actualizado.");
      }}
    >
      <h4>El formato que compras</h4>
      <label>
        Nombre en el supermercado
        <input
          name="name"
          defaultValue={row.format.name}
          maxLength={100}
          required
        />
      </label>
      <div className="form-grid">
        <label>
          Presentación
          <input
            name="singular"
            defaultValue={row.format.singular}
            placeholder="bolsa, botella…"
            maxLength={30}
            required
          />
        </label>
        <label>
          Presentación en plural
          <input
            name="plural"
            defaultValue={row.format.plural}
            maxLength={30}
            required
          />
        </label>
        <label>
          Contenido por envase
          <input
            name="size"
            type="number"
            min="0.01"
            step="any"
            defaultValue={row.format.size}
            required
          />
        </label>
        <label>
          Unidad del contenido
          <select name="unit" defaultValue={row.format.unit}>
            <option value="g">Gramos</option>
            <option value="ml">Mililitros</option>
            <option value="unidad">Unidades</option>
          </select>
        </label>
      </div>
      <label>
        Cuándo comprar
        <select name="cadence" defaultValue={row.format.cadence}>
          <option value="principal">Compra principal del período</option>
          <option value="fresco">Reposición de frescos por semana</option>
        </select>
      </label>
      <details>
        <summary>Ajustar rendimiento del alimento</summary>
        <p>
          La conversión permite pasar de la unidad de tu plan al producto que
          compras. Ajustarla cambia la estimación de compra, sin cambiar tus
          porciones.
        </p>
        <label>
          Unidades de compra por 1 {row.original.unit} del plan
          <input
            name="factor"
            type="number"
            min="0.000001"
            step="any"
            defaultValue={row.format.factor}
            required
          />
        </label>
        <label>
          Cómo estimaste el rendimiento
          <input name="note" defaultValue={row.format.note} maxLength={300} />
        </label>
      </details>
      <p role="status">{error}</p>
      <button className="button outline" type="submit">
        Guardar formato
      </button>
    </form>
  );
}
