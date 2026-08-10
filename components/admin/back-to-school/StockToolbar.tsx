"use client";

import * as React from "react";
import { StockFilters, type ShowMode } from "./StockFilters";
import {
  ShoppingListPanel,
  type ShoppingLine,
} from "./ShoppingListPanel";
import type { StockCategory } from "@/lib/back-to-school-stock";

interface Props {
  category: "all" | StockCategory;
  show: ShowMode;
  fit: string[];
  sizes: string[];
  sleeve: string[];
  colour: string[];
  waitlist: boolean;
  hideZero: boolean;
  sort: "group" | "gap";
  shoppingLines: ShoppingLine[];
}

export function StockToolbar(props: Props) {
  const [open, setOpen] = React.useState(false);

  const fitSet = React.useMemo(() => new Set(props.fit), [props.fit]);
  const sizesSet = React.useMemo(() => new Set(props.sizes), [props.sizes]);
  const sleeveSet = React.useMemo(() => new Set(props.sleeve), [props.sleeve]);
  const colourSet = React.useMemo(() => new Set(props.colour), [props.colour]);

  const title =
    props.shoppingLines.length > 0
      ? `Shopping list — ${props.shoppingLines.reduce((s, l) => s + l.needed, 0)} items short across ${props.shoppingLines.length} lines`
      : "Shopping list — nothing short";

  return (
    <>
      <StockFilters
        category={props.category}
        show={props.show}
        fit={fitSet}
        sizes={sizesSet}
        sleeve={sleeveSet}
        colour={colourSet}
        waitlist={props.waitlist}
        hideZero={props.hideZero}
        sort={props.sort}
        shortfallLineCount={props.shoppingLines.length}
        onOpenShoppingList={() => setOpen(true)}
      />
      <ShoppingListPanel
        open={open}
        onClose={() => setOpen(false)}
        lines={props.shoppingLines}
        title={title}
      />
    </>
  );
}
