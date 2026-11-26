/**
 * Positive-integer input sanitization helpers.
 *
 * Product rule: every numeric field in the app accepts ONLY positive digits —
 * no letters, no signs, no negative values, not even a leading zero soup.
 * Persian (۰-۹) and Arabic (٠-٩) digits are folded to Latin for PARSING and
 * every CALCULATION (digitsOnly / digitsToNumber / parseFaNumber), while the
 * DISPLAY of every numeric field is Persian digits — money fields
 * (data-numeric="money") additionally get a three-digit thousand grouping
 * (۱۲۳,۴۵۶) inserted by the guard itself, so the stored value must always be
 * parsed back through the helpers below before any arithmetic.
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

/** Convert Latin digits of a string to Persian digits (display form). */
export function toLatinDigitsToPersian(value: string): string {
  let out = "";
  for (const ch of String(value ?? "")) {
    out += /[0-9]/.test(ch) ? PERSIAN[Number(ch)] : ch;
  }
  return out;
}

/** Insert a three-digit thousand grouping (۱۲۳,۴۵۶) into a digit string. */
export function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Parse ANY user-entered numeric string (Persian/Arabic digits, comma/space
 * thousand separators) into the plain Latin digit string used for
 * calculations and storage. "۱,۲۳۴" → "1234".
 */
export function parseFaDigits(value: string): string {
  return foldDigits(String(value ?? "")).replace(/[^0-9]/g, "");
}

/** parseFaDigits → number (0 for empty/invalid). Use before every calculation. */
export function parseFaNumber(value: string): number {
  const n = Number(parseFaDigits(value));
  return Number.isFinite(n) ? n : 0;
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
  if (candidate.dataset?.numeric === "money") return true;
  const get = (n: string) =>
    typeof candidate.getAttribute === "function"
      ? candidate.getAttribute(n)?.toLowerCase() ?? null
      : null;
  if (get("type") === "number") return true;
  const im = get("inputmode");
  return im === "numeric" || im === "decimal";
}

/**
 * Should this numeric field display a three-digit thousand grouping?
 * Money/accounting fields opt in via data-numeric="money" (prices, deposits,
 * top-up amounts, charge amounts…). Count fields (days, OTP codes, phones)
 * stay un-grouped Persian digits.
 */
export function wantsGrouping(el: Element | null): boolean {
  if (!el) return false;
  const candidate = el as unknown as {
    dataset?: Record<string, string | undefined>;
    getAttribute?: (name: string) => string | null;
  };
  if (candidate.dataset?.numeric === "money") return true;
  return typeof candidate.getAttribute === "function"
    ? candidate.getAttribute("data-numeric")?.toLowerCase() === "money"
    : false;
}

/** DISPLAY form of a numeric field's Latin digit string. */
function displayForm(digits: string, grouped: boolean): string {
  return toLatinDigitsToPersian(grouped ? groupThousands(digits) : digits);
}

function isDigitChar(ch: string): boolean {
  return /[0-9۰-۹]/.test(ch);
}

/**
 * Write a new value into an input BYPASSING React's value-tracker wrapper.
 *
 * React (react-dom) shadows `value` with an own property per input and records
 * every JS write in `node._valueTracker`. If the guard wrote `input.value`
 * through that wrapper, React would believe the value is unchanged and NEVER
 * fire onChange — the field would DISPLAY the new digits while the app state
 * (and every calculation) stayed stale. Setting the value through the NATIVE
 * prototype setter keeps the tracker untouched, so React observes the change
 * and the controlled state receives exactly the Persian display string.
 */
const NATIVE_VALUE_SETTER = (() => {
  if (typeof HTMLInputElement === "undefined") return null;
  return Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set ?? null;
})();

function setNativeValue(input: HTMLInputElement, value: string) {
  if (NATIVE_VALUE_SETTER) {
    NATIVE_VALUE_SETTER.call(input, value);
  } else {
    input.value = value;
  }
  // Deliberately NOT touching input._valueTracker — React must observe this
  // change itself (updateValueIfChanged) and dispatch onChange.
}

/** Restore the caret after a reformat: keep it after the same digit it was. */
function restoreCaret(
  input: HTMLInputElement,
  oldDigitsBefore: number,
  oldDigitsTotal: number,
) {
  const value = input.value;
  let pos = value.length; // caret was at the end (typing) → keep at end
  if (oldDigitsBefore < oldDigitsTotal) {
    // Caret sat before some digit → place it before the same digit again.
    let seen = 0;
    for (let i = 0; i < value.length; i++) {
      if (isDigitChar(value[i])) {
        if (seen === oldDigitsBefore) {
          pos = i;
          break;
        }
        seen++;
      }
    }
  }
  try {
    input.setSelectionRange?.(pos, pos);
  } catch {
    /* some input types do not support selection — ignore */
  }
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

  /** Count the digits before the caret (used to restore it after reformat). */
  function digitsBeforeCaret(input: HTMLInputElement): {
    before: number;
    total: number;
  } {
    let before = 0;
    let total = 0;
    const caret = input.selectionStart ?? input.value.length;
    for (let i = 0; i < input.value.length; i++) {
      if (isDigitChar(input.value[i])) {
        total++;
        if (i < caret) before++;
      }
    }
    return { before, total };
  }

  function sanitizeValue(input: HTMLInputElement) {
    const cleaned = keepsLeadingZeros(input)
      ? digitsKeepZeros(input.value)
      : digitsOnly(input.value);
    // DISPLAY: Persian digits (+ thousand grouping on money fields). The
    // React state receives this same string via the controlled onChange, so
    // what the user sees and what is stored stay identical — calculations
    // must parse it back through parseFaDigits/parseFaNumber.
    const display = displayForm(cleaned, wantsGrouping(input));
    if (display !== input.value) {
      const { before, total } = digitsBeforeCaret(input);
      setNativeValue(input, display);
      restoreCaret(input, before, total);
    }
    if (
      !keepsLeadingZeros(input) &&
      typeof input.min === "string" &&
      input.min !== "" &&
      Number(input.min) > 0 &&
      parseFaDigits(input.value) !== "" &&
      parseFaNumber(input.value) < Number(input.min)
    ) {
      setNativeValue(input, displayForm(input.min, wantsGrouping(input)));
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /** type=number spinner clamp — spinner values are Latin-only by browser rule. */
  function clampPositive(input: HTMLInputElement) {
    const cleaned = digitsOnly(input.value);
    if (cleaned !== input.value) setNativeValue(input, cleaned);
    if (
      typeof input.min === "string" &&
      input.min !== "" &&
      Number(input.min) > 0 &&
      cleaned !== "" &&
      Number(cleaned) < Number(input.min)
    ) {
      setNativeValue(input, input.min);
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
      if (cleaned !== input.value) setNativeValue(input, cleaned);
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
      const merged = keepsLeadingZeros(input) ? digitsKeepZeros(next) : digitsOnly(next);
      // Pasted digits land in the same Persian display form (grouped for money).
      setNativeValue(input, displayForm(merged, wantsGrouping(input)));
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
