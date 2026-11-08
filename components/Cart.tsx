"use client";
import { useState } from "react";
import { ShoppingCart, Copy, ExternalLink } from "lucide-react";
import type { Shopping } from "../lib/engine";
import { calculateCart, cartText, type Cart, type CartLine } from "../lib/cart";
export function ShoppingCartPanel({
  items,
  cart,
  onChange,
}: {
  items: Shopping[];
  cart: Cart;
  onChange: (c: Cart) => void;
}) {
  const [message, setMessage] = useState(""),
    [preview, setPreview] = useState("");
  const rows = calculateCart(items, cart);
  const included = rows.filter((x) => x.included && x.need > 0),
    priced = included.filter((x) => x.estimated !== undefined);
  const patch = (id: string, change: Partial<CartLine>) => {
    onChange({
      ...cart,
      lines: { ...cart.lines, [id]: { ...cart.lines[id], ...change } },
    });
    setPreview("");
  };
  return (
    <section className="card cart-panel">
      <div className="section-title">
        <div>
          <h2>Mi carrito de la semana</h2>
          <p>Descuenta lo que ya tienes y ajusta lo que comprarás.</p>
        </div>
        <ShoppingCart size={24} />
      </div>
      <div className="scope-note">
        Las cantidades del plan pueden estar cocidas o en medidas caseras.
        Revisa y define la cantidad de compra; la app no inventa conversiones a
        peso seco.
      </div>
      {rows.map((x) => (
        <div className="cart-line" key={x.id}>
          <label className="cart-include">
            <input
              type="checkbox"
              checked={x.included}
              onChange={(e) => patch(x.id, { included: e.target.checked })}
            />
            <strong>{x.name}</strong>
            <small>
              Plan: {items.find((i) => i.id === x.id)?.quantity}{" "}
              {items.find((i) => i.id === x.id)?.unit}
            </small>
          </label>
          {x.included && (
            <>
              <div className="cart-inputs">
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    value={x.quantity}
                    onChange={(e) =>
                      patch(x.id, {
                        quantity: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>
                <label>
                  Unidad de compra
                  <input
                    value={x.unit}
                    maxLength={30}
                    onChange={(e) =>
                      patch(x.id, {
                        unit: e.target.value,
                        reviewed: false,
                        have: 0,
                        packSize: undefined,
                        packPrice: undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Ya tengo
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    value={x.have}
                    onChange={(e) =>
                      patch(x.id, {
                        have: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>
              </div>
              <details>
                <summary>Envase y precio (opcional)</summary>
                <div className="form-grid">
                  <label>
                    Contenido por envase ({x.unit})
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={cart.lines[x.id]?.packSize ?? ""}
                      onChange={(e) =>
                        patch(x.id, {
                          packSize: e.target.value
                            ? Math.max(0, Number(e.target.value) || 0)
                            : undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    Precio por envase (CLP)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={x.packPrice ?? ""}
                      onChange={(e) =>
                        patch(x.id, {
                          packPrice: e.target.value
                            ? Math.max(0, Number(e.target.value) || 0)
                            : undefined,
                        })
                      }
                    />
                  </label>
                </div>
              </details>
              {(/cocid|taza|cucharadita/i.test(
                items.find((i) => i.id === x.id)?.unit || "",
              ) ||
                x.unit !== items.find((i) => i.id === x.id)?.unit) && (
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={!!cart.lines[x.id]?.reviewed}
                    onChange={(e) =>
                      patch(x.id, { reviewed: e.target.checked })
                    }
                  />
                  Revisé la cantidad y la unidad que compraré.
                </label>
              )}
              <p className="cart-need">
                Por comprar:{" "}
                <strong>
                  {x.need} {x.unit}
                </strong>
                {x.packSize > 1 ? ` · ${x.packs} envases` : ""}
              </p>
            </>
          )}
        </div>
      ))}
      <div className="cart-total">
        <strong>{included.length} artículos por comprar</strong>
        <span>
          {new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
          }).format(priced.reduce((n, x) => n + (x.estimated || 0), 0))}
        </span>
        <p>
          {priced.length} de {included.length} artículos con precio ingresado
          por ti. Estimación{" "}
          {priced.length === included.length ? "completa" : "parcial"}, sin
          despacho y sin precios en vivo.
        </p>
      </div>
      <div className="cart-actions">
        <button
          className="button"
          onClick={() => {
            try {
              setPreview(cartText(items, cart));
              setMessage("Lista preparada. Revisa el texto antes de copiarlo.");
            } catch (e: any) {
              setMessage(e.message);
            }
          }}
        >
          Preparar lista de compra
        </button>
      </div>
      {preview && (
        <>
          <label>
            Texto que puedes compartir
            <textarea rows={8} readOnly value={preview} />
          </label>
          <button
            className="button outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(preview);
                setMessage(
                  "Lista copiada. Solo contiene artículos y cantidades.",
                );
              } catch {
                setMessage("Selecciona y copia el texto de la lista.");
              }
            }}
          >
            <Copy size={16} />
            Copiar lista
          </button>
          <p className="scope-note">
            Al compartir este texto con un supermercado, se comparten los
            artículos y cantidades mostrados. Los exámenes y el perfil no se
            incluyen.
          </p>
        </>
      )}
      <p role="status">{message}</p>
      <h3>Continuar en el supermercado</h3>
      <p>
        Jumbo acepta listas por su WhatsApp oficial y permite revisar el carrito
        antes de pagar. Copia tu lista y sigue sus instrucciones.
      </p>
      <a
        className="button outline"
        href="https://www.jumbo.cl/oferta/compra-whatsapp"
        target="_blank"
        rel="noreferrer"
      >
        Jumbo · canal oficial <ExternalLink size={15} />
      </a>
      <div className="retailer-links">
        <a href="https://www.lider.cl/" target="_blank" rel="noreferrer">
          Abrir Lider
        </a>
        <a href="https://www.tottus.cl/" target="_blank" rel="noreferrer">
          Abrir Tottus
        </a>
      </div>
      <small>
        Los enlaces abren los canales oficiales. Mi Semana no ha creado un
        carrito dentro de esas tiendas. Confirma etiquetas, productos, stock y
        precios en el comercio.
      </small>
    </section>
  );
}
