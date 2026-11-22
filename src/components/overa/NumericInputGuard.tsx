"use client";

import { useEffect } from "react";
import { attachNumericInputGuard } from "@/lib/input-guard";

/**
 * Mounted once in the root layout. Enforces the app-wide rule that numeric
 * inputs (inputMode="numeric", type="number", data-numeric) accept positive
 * digits only — no letters, no minus sign, no separators — without changing
 * the markup, classes or appearance of any page.
 */
export default function NumericInputGuard() {
  useEffect(() => attachNumericInputGuard(document), []);
  return null;
}
