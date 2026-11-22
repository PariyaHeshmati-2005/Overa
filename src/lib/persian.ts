/**
 * Persian text utilities for Overa search (pure functions, no server-only
 * imports) so both the Next.js server and the seed/backfill scripts can use
 * them.
 *
 * The goal is " forgiving" Persian search: the user may type Arabic forms
 * (ي/ك), with or without ZWNJ (نیم‌فاصله), diacritics or Persian/Latin
 * digits — everything is folded into one canonical form before matching.
 */

/** Arabic → Persian unification map + digit folding. */
const CHAR_MAP: Record<string, string> = {
  // Arabic Yeh / Alef Maqsura → Persian Yeh
  "\u064A": "\u06CC",
  "\u0649": "\u06CC",
  // Arabic Kaf → Persian Kaf
  "\u0643": "\u06A9",
  // Hamza carriers folded for recall (applied on both sides, so no
  // false-positives are introduced — only more forgiving matching).
  "\u0623": "\u0627", // أ → ا
  "\u0625": "\u0627", // إ → ا
  "\u0622": "\u0627", // آ → ا
  "\u0629": "\u0647", // ة → ه
  "\u0624": "\u0648", // ؤ → و
  "\u0626": "\u06CC", // ئ → ی
  // Zero-width characters (ZWNJ/ZWJ/BOM) are stripped entirely.
  "\u200C": "",
  "\u200D": "",
  "\u200B": "",
  "\uFEFF": "",
};

/** Persian & Arabic digits → Latin digits (so «۴» matches «4»). */
function foldDigits(ch: string): string {
  const code = ch.codePointAt(0) ?? 0;
  // Persian digits ۰-۹ (U+06F0–U+06F9)
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  // Arabic-Indic digits ٠-٩ (U+0660–U+0669)
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  return ch;
}

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g; // tashkeel + tatweel

/**
 * Canonical search form of any Persian/English string:
 * Arabic unification, diacritic removal, ZWNJ stripping, digit folding and
 * whitespace collapsing — applied identically to documents and queries.
 */
export function normalizePersian(input: string): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    const mapped = Object.prototype.hasOwnProperty.call(CHAR_MAP, ch)
      ? CHAR_MAP[ch]
      : ch;
    for (const c of mapped) out += foldDigits(c);
  }
  return out
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, " ")
    .trim();
}

/**
 * Normalize an Iranian mobile number to the canonical «09xxxxxxxxx» form.
 * Accepts (digits may be Persian/Arabic, spaces/dashes ignored):
 *   ۰۹۱۲۳۴۵۶۷۸۹ · 09123456789 · 9123456789 · +989123456789 · 00989123456789
 * Returns the canonical «09…» string, or null when it is not a valid mobile.
 */
export function normalizeIranMobile(input: string): string | null {
  let s = normalizePersian(String(input ?? ""))
    .replace(/[^0-9+]/g, "");
  if (s.startsWith("+98")) s = s.slice(3);
  else if (s.startsWith("0098")) s = s.slice(4);
  else if (s.length >= 12 && s.startsWith("98")) s = s.slice(2);
  if (s.length === 10 && s.startsWith("9")) s = `0${s}`;
  return /^09\d{9}$/.test(s) ? s : null;
}

/**
 * Build the stored search key for a listing from its searchable text fields.
 * Stored on `Listing.searchKey` at create/update time and matched against
 * `normalizePersian(query)` — with ZWNJ removed on both sides, «می‌شود» and
 * «میشود» match, and partial words match (Prisma `contains`).
 */
export function buildListingSearchKey(fields: {
  title: string;
  brand?: string | null;
  specs?: string | null;
  description?: string | null;
  city?: string | null;
  categoryName?: string | null;
}): string {
  const parts = [
    fields.title,
    fields.brand ?? "",
    fields.specs ?? "",
    fields.description ?? "",
    fields.city ?? "",
    fields.categoryName ?? "",
  ];
  return normalizePersian(parts.join(" "));
}

/** Convert a query into normalized word tokens (max 6, deduped). */
export function queryTokens(query: string, max = 6): string[] {
  const norm = normalizePersian(query);
  if (!norm) return [];
  const words = Array.from(new Set(norm.split(" ").filter(Boolean)));
  return words.slice(0, max);
}
