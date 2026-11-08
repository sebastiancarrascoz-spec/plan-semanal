import type { Shopping } from "./engine.ts";
export type CartLine = {
  included?: boolean;
  quantity?: number;
  unit?: string;
  have?: number;
  packSize?: number;
  packPrice?: number;
  reviewed?: boolean;
};
export type Cart = {
  lines: Record<string, CartLine>;
  store: "jumbo" | "lider" | "tottus";
};
export function calculateCart(items: Shopping[], cart: Cart) {
  return items.map((item) => {
    const edit = cart.lines[item.id] || {};
    const unit = edit.unit?.trim() || item.unit;
    const quantity = edit.quantity ?? item.quantity;
    const have = edit.have ?? 0;
    const pack = edit.packSize || 1;
    for (const v of [
      quantity,
      have,
      pack,
      ...(edit.packPrice === undefined ? [] : [edit.packPrice]),
    ])
      if (!Number.isFinite(v) || v < 0)
        throw Error("Revisa las cantidades del carrito.");
    const need = Math.max(0, quantity - have);
    const packs = need === 0 ? 0 : Math.ceil(need / pack);
    const requiresReview =
      (/cocid|taza|cucharadita/i.test(item.unit) || unit !== item.unit) &&
      !edit.reviewed;
    return {
      ...item,
      unit,
      quantity,
      have,
      need,
      packs,
      packSize: pack,
      packPrice: edit.packPrice,
      estimated:
        edit.packPrice === undefined ? undefined : packs * edit.packPrice,
      included: edit.included !== false,
      requiresReview,
    };
  });
}
export function cartText(items: Shopping[], cart: Cart) {
  const lines = calculateCart(items, cart).filter(
    (x) => x.included && x.need > 0,
  );
  if (!lines.length) throw Error("Agrega al menos un artículo al carrito.");
  if (lines.some((x) => x.requiresReview))
    throw Error(
      "Revisa las cantidades cocidas y las medidas caseras antes de copiar la compra.",
    );
  return (
    "Lista de compras\n" +
    lines
      .map(
        (x) =>
          `• ${x.name}: ${x.need} ${x.unit}${x.packSize > 1 ? ` (${x.packs} envases de ${x.packSize} ${x.unit})` : ""}`,
      )
      .join("\n")
  );
}
