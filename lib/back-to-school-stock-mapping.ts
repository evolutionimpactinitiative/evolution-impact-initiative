// Best-effort mapping from free-text supply-pledge lines to stock SKUs.
// Pledge items are user-typed strings ("White shirts", "Grey trousers", etc.)
// so we can only guess sleeve / fit / colour when the text mentions them.
// When we can't be confident about a required field, we skip the line — the
// admin can still add the item manually via the Stock page.

import { UNIFORM_SIZES, type UniformSize } from "@/lib/back-to-school";
import type {
  StockCategory,
  StockColour,
  StockFit,
} from "@/lib/back-to-school-stock";

interface Mapped {
  category: StockCategory;
  colour: StockColour;
  sleeve: "short" | "long" | null;
  fit: StockFit;
  size: UniformSize;
  qty: number;
}

export function mapPledgeLine(
  item: string,
  size: string | null,
  qty: number,
): Mapped | null {
  if (!item || qty <= 0) return null;
  const t = item.toLowerCase();

  let category: StockCategory | null = null;
  if (t.includes("polo")) category = "polo";
  else if (t.includes("shirt")) category = "shirt";
  else if (t.includes("trouser")) category = "trousers";
  else if (t.includes("skirt")) category = "skirt";
  else if (t.includes("dress")) category = "dress";
  else if (t.includes("short") && !t.includes("sleeve")) category = "shorts";
  if (!category) return null;

  let colour: StockColour | null = null;
  if (t.includes("white")) colour = "white";
  else if (t.includes("grey") || t.includes("gray")) colour = "grey";
  else if (t.includes("black")) colour = "black";
  else if (t.includes("blue") || t.includes("navy")) colour = "blue";
  if (!colour) return null;

  const needsSleeve = category === "polo" || category === "shirt";
  let sleeve: "short" | "long" | null = null;
  if (needsSleeve) {
    if (t.includes("long")) sleeve = "long";
    else sleeve = "short"; // default
  }

  let fit: StockFit = "unisex";
  if (t.includes("boy")) fit = "boys";
  else if (t.includes("girl")) fit = "girls";

  if (!size) return null;
  const validSize = (UNIFORM_SIZES as readonly string[]).includes(size)
    ? (size as UniformSize)
    : null;
  if (!validSize) return null;

  return { category, colour, sleeve, fit, size: validSize, qty };
}
