const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert Latin digits in a string/number to Persian digits. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Format a number with thousand separators and Persian digits (۱۲۳,۴۵۶).
 *  Null/undefined/non-numeric inputs are treated as ۰ instead of crashing —
 *  a previous `null.toLocaleString()` TypeError took whole pages down. */
export function faNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return toPersianDigits(0);
  const n = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  if (Number.isNaN(n)) return toPersianDigits(value);
  return toPersianDigits(n.toLocaleString("en-US"));
}

/** Format a Toman amount: ۴۵۰,۰۰۰ (null-safe). */
export function faToman(value: number | string | null | undefined): string {
  return faNumber(value ?? 0);
}

/** Format a date in Persian calendar via Intl. */
export function faDate(date: Date | string | number): string {
  const d = new Date(date);
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return toPersianDigits(d.toISOString().slice(0, 10));
  }
}

/** Format a date + time in Persian calendar. */
export function faDateTime(date: Date | string | number): string {
  const d = new Date(date);
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return toPersianDigits(d.toISOString().slice(0, 16).replace("T", " "));
  }
}

/** Relative time in Persian (e.g. ۳ روز پیش). */
export function faTimeAgo(date: Date | string | number): string {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${toPersianDigits(months)} ماه پیش`;
  return `${toPersianDigits(Math.floor(months / 12))} سال پیش`;
}

/** Days between two dates. */
export function daysBetween(start: Date | string, end: Date | string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.ceil((e - s) / 86400000));
}

/** Parse an integer query param safely; missing/blank/invalid → fallback.
 *  (Number(null) and Number("") are 0 in JS, which once zeroed `take`.) */
export function parseIntSafe(v: string | null, fallback: number): number {
  if (v === null || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const FA_COUNT_WORDS = [
  "صفر", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه",
  "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده",
  "هفده", "هجده", "نوزده", "بیست",
];

/** Spell a counter as a Persian word (یک، دو، سه … بیست) and fall back to
 *  Persian digits beyond twenty — used by the automatic rental comments
 *  (e.g. «دو اجاره ناموفق …»). */
export function faCountWord(n: number): string {
  if (!Number.isFinite(n) || n < 0) return toPersianDigits(0);
  if (n < FA_COUNT_WORDS.length) return FA_COUNT_WORDS[n];
  return toPersianDigits(n);
}
