"use client";

import { useEffect } from "react";
import { familyMarkThreadRead } from "./actions";

// Fires the mark-read server action exactly once on page mount. Lets
// the server page stay a pure data-fetching component and keeps the
// client surface tiny.
export function MarkReadOnMount() {
  useEffect(() => {
    familyMarkThreadRead().catch(() => {});
  }, []);
  return null;
}
