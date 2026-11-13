/**
 * Jalali (Shamsi) calendar utilities for Overa.
 *
 * Implements the well-known jalaali conversion algorithm (same one used by
 * jalaali-js) with no external dependency, plus Tehran-timezone-safe helpers
 * so "today" is always computed in Asia/Tehran regardless of server TZ.
 *
 * Dates are exchanged as ISO calendar-date strings ("YYYY-MM-DD"), which is
 * also the format the reservation API already uses.
 */
import { toPersianDigits } from "./format";

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Persian weekday names, index 0 = شنبه (Saturday). */
export const JALALI_WEEKDAY_NAMES = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

/** The calendar is locked to this solar year per product decision. */
export const JALALI_YEAR_LOCK = 1405;

export type JalaliParts = { jy: number; jm: number; jd: number };

/* ------------------------- jalaali core algorithm ------------------------- */

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliParts {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function toJalali(gy: number, gm: number, gd: number): JalaliParts {
  return d2j(g2d(gy, gm, gd));
}

export function toGregorian(
  jy: number,
  jm: number,
  jd: number
): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

export function isLeapJalaaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaaliYear(jy) ? 30 : 29;
}

/* --------------------------- ISO / Tehran helpers -------------------------- */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Split an ISO date string ("YYYY-MM-DD") into Gregorian parts. */
export function isoToGregorianParts(iso: string): {
  gy: number;
  gm: number;
  gd: number;
} {
  const [y, m, d] = iso.split("-").map(Number);
  return { gy: y, gm: m, gd: d };
}

function gregorianPartsToIso(gy: number, gm: number, gd: number): string {
  return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

/** Jalali parts of an ISO calendar date. */
export function isoToJalali(iso: string): JalaliParts {
  const { gy, gm, gd } = isoToGregorianParts(iso);
  return toJalali(gy, gm, gd);
}

/** ISO calendar date of a Jalali date. */
export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return gregorianPartsToIso(gy, gm, gd);
}

/** Today's calendar date in Asia/Tehran as ISO ("YYYY-MM-DD"). */
export function todayIsoTehran(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Jalali parts of "now" in Tehran. */
export function todayJalaliTehran(now: Date = new Date()): JalaliParts {
  return isoToJalali(todayIsoTehran(now));
}

/** Persian weekday index of an ISO date: 0 = شنبه … 6 = جمعه. */
export function jalaliWeekdayOfIso(iso: string): number {
  const { gy, gm, gd } = isoToGregorianParts(iso);
  const utcDay = new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay();
  return (utcDay + 1) % 7;
}

/** Add n days (may be negative) to an ISO date; DST-safe via UTC arithmetic. */
export function addDaysIso(iso: string, n: number): string {
  const { gy, gm, gd } = isoToGregorianParts(iso);
  const t = Date.UTC(gy, gm - 1, gd) + n * 86400000;
  const d = new Date(t);
  return gregorianPartsToIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Whole days from a → b (positive when b is after a). */
export function diffDaysIso(a: string, b: string): number {
  const pa = isoToGregorianParts(a);
  const pb = isoToGregorianParts(b);
  const ta = Date.UTC(pa.gy, pa.gm - 1, pa.gd);
  const tb = Date.UTC(pb.gy, pb.gm - 1, pb.gd);
  return Math.round((tb - ta) / 86400000);
}

/** Inclusive rental duration in days (at least 1, same as daysBetween). */
export function rentalDaysIso(startIso: string, endIso: string): number {
  return Math.max(1, diffDaysIso(startIso, endIso) + 1);
}

export function isPastIso(iso: string, now: Date = new Date()): boolean {
  return iso < todayIsoTehran(now);
}

export type DateRange = { start: string; end: string };

/** Whether `iso` falls inside any of the booked ranges (inclusive). */
export function isDayBooked(iso: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => r.start <= iso && iso <= r.end);
}

/** Whether [aStart, aEnd] overlaps any booked range. */
export function rangeHitsBooked(
  aStart: string,
  aEnd: string,
  ranges: DateRange[]
): boolean {
  return ranges.some((r) => aStart <= r.end && r.start <= aEnd);
}

/* --------------------------- owner-blocked ranges -------------------------- */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse the Listing.blockedRanges JSON column into DateRange[].
 * Tolerates malformed data (returns [] instead of throwing).
 */
export function parseBlockedRanges(json: string | null | undefined): DateRange[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const out: DateRange[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const start = (item as { start?: unknown }).start;
      const end = (item as { end?: unknown }).end;
      if (
        typeof start === "string" &&
        typeof end === "string" &&
        ISO_DATE_RE.test(start) &&
        ISO_DATE_RE.test(end) &&
        start <= end
      ) {
        out.push({ start, end });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Validate/normalize untrusted input (API body) into a clean DateRange[]:
 * keeps only well-formed ISO ranges with start <= end, sorted, deduplicated,
 * capped at 60 ranges. Overlapping entries are preserved as provided.
 */
export function normalizeBlockedRangesInput(input: unknown): DateRange[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: DateRange[] = [];
  for (const item of input) {
    if (typeof item !== "object" || item === null) continue;
    const start = (item as { start?: unknown }).start;
    const end = (item as { end?: unknown }).end;
    if (
      typeof start !== "string" ||
      typeof end !== "string" ||
      !ISO_DATE_RE.test(start) ||
      !ISO_DATE_RE.test(end) ||
      start > end
    ) {
      continue;
    }
    const key = `${start}..${end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ start, end });
    if (out.length >= 60) break;
  }
  return out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/* ------------------------------ formatting ------------------------------- */

/** "۲۲ آبان ۱۴۰۵" (or without the year when withYear=false). */
export function formatJalaliIso(iso: string, withYear = true): string {
  const { jm, jd } = isoToJalali(iso);
  const base = `${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]}`;
  if (!withYear) return base;
  const { jy } = isoToJalali(iso);
  return `${base} ${toPersianDigits(jy)}`;
}

/** Jalali month label like "آبان ۱۴۰۵". */
export function jalaliMonthLabel(jy: number, jm: number): string {
  return `${JALALI_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
}
