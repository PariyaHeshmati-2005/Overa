/**
 * Positive-integer input sanitization helpers.
 *
 * Product rule: every numeric field in the app accepts ONLY positive digits —
 * no letters, no signs, no separators, no negative values, not even a leading
 * zero soup. Persian (۰-۹) and Arabic (٠-٩) digits are folded to Latin so a
 * Persian keyboard works everywhere.
 *
 * Used directly by form onChange handlers and enforced globally (see
 * NumericInputGuard) for every input that declares numeric intent
 * (inputMode="numeric" / type="number" / data-numeric).
 */

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/** Fold Persian/Arabic digits (and strip stray separators) to Latin digits. */
export function foldDigits(value: string): string {
  let out = "";
  for (const ch of String(value ?? "")) {
    const p = PERSIAN.indexOf(ch);
    if (p >= 0) {
      out += String(p);
      continue;
    }
    const a = ARABIC.indexOf(ch);
    if (a >= 0) {
      out += String(a);
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * Keep only the Latin digits of `value` (Persian digits folded first).
 * Everything else — letters, signs (-/+), dots, commas, spaces, "e" — is
 * dropped, so typing or pasting "-۵۰۰", "abc", "1e5" or "12,000" yields
 * "500", "", "15" and "12000" respectively.
 */
export function digitsOnly(value: string): string {
  const folded = foldDigits(String(value ?? ""));
  // Drop a leading zero run (but keep a single "0" while typing).
  const raw = folded.replace(/[^0-9]/g, "");
  if (raw.length <= 1) return raw;
  return raw.replace(/^0+/, "") || "0";
}

/** digitsOnly → number (0 when empty). Always a positive integer or 0. */
export function digitsToNumber(value: string): number {
  const s = digitsOnly(value);
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * digits-only sanitizer that PRESERVES leading zeros — for identifiers where
 * a zero at the start carries meaning: mobile numbers (۰۹۱۲…), OTP codes,
 * national IDs (۰۰۱۲…) — as opposed to money amounts where «۰۰۰۵۰۰» means ۵۰۰.
 */
export function digitsKeepZeros(value: string): string {
  return foldDigits(String(value ?? "")).replace(/[^0-9]/g, "");
}

/**
 * Should this numeric field keep its leading zeros?
 *   - explicitly marked: data-numeric="keep-zeros" (phone, OTP boxes, national ID)
 *   - implicitly: type="tel" (semantic phone input)
 */
export function keepsLeadingZeros(el: Element | null): boolean {
  if (!el) return false;
  const candidate = el as unknown as {
    dataset?: Record<string, string | undefined>;
    getAttribute?: (name: string) => string | null;
  };
  if (candidate.dataset?.numeric === "keep-zeros") return true;
  if (typeof candidate.getAttribute !== "function") return false;
  if (candidate.dataset?.numericKeepZeros === "true") return true;
  return candidate.getAttribute("type")?.toLowerCase() === "tel";
}

/**
 * Is this DOM input a numeric field the global guard should sanitize?
 * Numeric intent is declared via inputMode="numeric"/"decimal", type="number",
 * or data-numeric. Search/text inputs are left untouched.
 */
export function isNumericIntent(el: Element | null): boolean {
  if (!el) return false;
  // Duck-typed input check (keeps the guard testable without a DOM global):
  // real <input> elements expose `value` and `getAttribute`.
  const candidate = el as unknown as {
    value?: unknown;
    getAttribute?: (name: string) => string | null;
    dataset?: Record<string, string | undefined>;
  };
  if (typeof candidate.value !== "string") return false;
  if (candidate.dataset?.numeric === "true") return true;
  const get = (n: string) =>
    typeof candidate.getAttribute === "function"
      ? candidate.getAttribute(n)?.toLowerCase() ?? null
      : null;
  if (get("type") === "number") return true;
  const im = get("inputmode");
  return im === "numeric" || im === "decimal";
}

/** Characters that must never reach a numeric field via the keyboard. */
const BLOCKED_KEYS = new Set([
  "-",
  "+",
  "e",
  "E",
  ".",
  "٫",
  ",",
  "،",
  "_",
  " ",
  "،",
]);

/**
 * Global sanitizer for numeric inputs (mounted once in the root layout).
 * - keydown: blocks "-", "+", "e", "." … (typing negatives / exponents)
 * - paste / input: strips everything except digits (Persian digits folded)
 * The guard never re-renders or restyles anything — it only rewrites the
 * value of numeric fields, so the appearance of every page stays identical.
 */
export function attachNumericInputGuard(doc: Document): () => void {
  function onKeydown(e: KeyboardEvent) {
    const target = e.target as Element | null;
    if (!isNumericIntent(target)) return;
    const input = target as HTMLInputElement;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Allow navigation / editing keys untouched.
    const navKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Home",
      "End",
      "Enter",
    ];
    if (navKeys.includes(e.key)) {
      // type="number" spinners can produce negatives with ArrowDown — clamp.
      if (
        input.getAttribute("type")?.toLowerCase() === "number" &&
        (e.key === "ArrowDown" || e.key === "ArrowUp")
      ) {
        // Let the browser spin, then clamp afterwards via the input handler.
        setTimeout(() => clampPositive(input), 0);
      }
      return;
    }
    if (BLOCKED_KEYS.has(e.key)) {
      e.preventDefault();
      return;
    }
    if (PERSIAN.includes(e.key) || ARABIC.includes(e.key)) return; // folded later
    if (/^[0-9]$/.test(e.key)) return;
    // Any other printable character (letters, symbols) is not a digit.
    if (e.key.length === 1) e.preventDefault();
  }

  function sanitizeValue(input: HTMLInputElement) {
    const cleaned = keepsLeadingZeros(input)
      ? digitsKeepZeros(input.value)
      : digitsOnly(input.value);
    if (cleaned !== input.value) {
      const pos = input.selectionStart;
      input.value = cleaned;
      try {
        input.setSelectionRange?.(Math.min(pos ?? cleaned.length, cleaned.length), Math.min(pos ?? cleaned.length, cleaned.length));
      } catch {
        /* some input types do not support selection — ignore */
      }
    }
    if (
      !keepsLeadingZeros(input) &&
      typeof input.min === "string" &&
      input.min !== "" &&
      Number(input.value) < Number(input.min)
    ) {
      input.value = input.min;
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clampPositive(input: HTMLInputElement) {
    const cleaned = digitsOnly(input.value);
    if (cleaned !== input.value) {
      const pos = input.selectionStart;
      input.value = cleaned;
      try {
        input.setSelectionRange?.(Math.min(pos ?? cleaned.length, cleaned.length), Math.min(pos ?? cleaned.length, cleaned.length));
      } catch {
        /* some input types do not support selection — ignore */
      }
    }
    if (
      typeof input.min === "string" &&
      input.min !== "" &&
      Number(input.value) < Number(input.min)
    ) {
      input.value = input.min;
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function onInput(e: Event) {
    const target = e.target as Element | null;
    if (!isNumericIntent(target)) return;
    const input = target as HTMLInputElement;
    if (input.getAttribute("type")?.toLowerCase() === "number") {
      // Chrome keeps type=number values as "" when invalid; clamp via digits.
      const cleaned = digitsOnly(input.value);
      if (cleaned !== input.value) input.value = cleaned;
      return;
    }
    // Phones / OTP codes / national IDs keep their leading zeros — a typed
    // «۰۹۱۲…» must stay «0912…» instead of collapsing to «912…».
    sanitizeValue(input);
  }

  function onPaste(e: ClipboardEvent) {
    const target = e.target as Element | null;
    if (!isNumericIntent(target)) return;
    const input = target as HTMLInputElement;
    // Single-character OTP boxes manage their own paste (the browser's
    // maxLength=1 truncation feeds their distribute logic) — hands off.
    if (keepsLeadingZeros(input) && input.maxLength === 1) return;
    const text = e.clipboardData?.getData("text") ?? "";
    const cleaned = keepsLeadingZeros(input) ? digitsKeepZeros(text) : digitsOnly(text);
    if (!cleaned && text) {
      e.preventDefault();
      return;
    }
    if (cleaned !== text) {
      e.preventDefault();
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const next = input.value.slice(0, start) + cleaned + input.value.slice(end);
      input.value = keepsLeadingZeros(input) ? digitsKeepZeros(next) : digitsOnly(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  doc.addEventListener("keydown", onKeydown, true);
  doc.addEventListener("input", onInput, true);
  doc.addEventListener("paste", onPaste, true);
  return () => {
    doc.removeEventListener("keydown", onKeydown, true);
    doc.removeEventListener("input", onInput, true);
    doc.removeEventListener("paste", onPaste, true);
  };
}
