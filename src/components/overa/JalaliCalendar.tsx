"use client";

import { useMemo, useState } from "react";
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  JALALI_YEAR_LOCK,
  jalaaliMonthLength,
  jalaliMonthLabel,
  jalaliToIso,
  jalaliWeekdayOfIso,
  diffDaysIso,
  todayIsoTehran,
  todayJalaliTehran,
  isDayBooked,
  rangeHitsBooked,
  type DateRange,
} from "@/lib/jalali";
import { toPersianDigits } from "@/lib/format";

export type JalaliRange = { startIso: string | null; endIso: string | null };

type Props = {
  startIso: string | null;
  endIso: string | null;
  onRangeChange: (startIso: string | null, endIso: string | null) => void;
  /** Reservation ranges already taken for this item (ISO dates, inclusive). */
  bookedRanges?: DateRange[];
  /** Days the owner blocked from the create-listing wizard (ISO dates, inclusive). */
  ownerBlockedRanges?: DateRange[];
  /**
   * "rental" (default): renter picks delivery/return days with min/max rules.
   * "host": host blocks days they do not want to rent out; single-day
   * blocking is allowed and already-blocked days render as locked highlights.
   */
  variant?: "rental" | "host";
  /** Show inline booking-window validation hints (min/max rental days). */
  minDays?: number;
  maxDays?: number;
  className?: string;
};

const CELL =
  "flex h-9 w-full items-center justify-center rounded-lg text-[13px] transition-colors select-none";

/**
 * Persian (Jalali/Shamsi) rental calendar, locked to solar year ۱۴۰۵.
 *
 * - First click selects the delivery day, second click the return day.
 * - Past days and days already under reservation are disabled.
 * - Selecting a range that crosses a booked day (or exceeds the listing's
 *   max rental days) is rejected with an inline message.
 * - Dates are exchanged as ISO strings, matching the reservation API.
 * - variant="host" (create-listing wizard): the same calendar lets the host
 *   block days they do not want to rent out — single-day blocks allowed,
 *   already-blocked days show as violet locks and cannot be re-selected.
 */
export default function JalaliCalendar({
  startIso,
  endIso,
  onRangeChange,
  bookedRanges = [],
  ownerBlockedRanges = [],
  variant = "rental",
  minDays,
  maxDays,
  className = "",
}: Props) {
  const today = todayIsoTehran();
  const todayJ = todayJalaliTehran();
  const isHost = variant === "host";

  // The calendar opens on the current month of ۱۴۰۵; navigation stays inside the year.
  const [viewMonth, setViewMonth] = useState(todayJ.jm);
  const [hint, setHint] = useState<string | null>(null);

  const grid = useMemo(() => {
    const length = jalaaliMonthLength(JALALI_YEAR_LOCK, viewMonth);
    const firstIso = jalaliToIso(JALALI_YEAR_LOCK, viewMonth, 1);
    const leading = jalaliWeekdayOfIso(firstIso); // 0 = شنبه
    const days: { jd: number; iso: string }[] = [];
    for (let d = 1; d <= length; d++) {
      days.push({ jd: d, iso: jalaliToIso(JALALI_YEAR_LOCK, viewMonth, d) });
    }
    return { leading, days };
  }, [viewMonth]);

  function pick(iso: string) {
    setHint(null);

    // Start a new selection (no start yet, or previous range complete).
    if (!startIso || (startIso && endIso)) {
      onRangeChange(iso, null);
      return;
    }

    // Host blocking: clicking the start day again blocks that single day.
    if (isHost && iso === startIso) {
      onRangeChange(startIso, startIso);
      return;
    }

    // Clicking before/at the current start restarts the selection.
    if (iso <= startIso) {
      onRangeChange(iso, null);
      return;
    }

    // Candidate range [start, iso].
    if (rangeHitsBooked(startIso, iso, bookedRanges)) {
      setHint("این بازه با اجارهٔ دیگری هم‌پوشانی دارد؛ روز پایان دیگری انتخاب کنید.");
      return;
    }
    if (rangeHitsBooked(startIso, iso, ownerBlockedRanges)) {
      setHint(isHost
        ? "این بازه با روزهای مسدودشدهٔ قبلی هم‌پوشانی دارد."
        : "برخی روزهای این بازه توسط میزبان مسدود شده است.");
      return;
    }
    const days = diffDaysIso(startIso, iso); // same semantics as the API's daysBetween
    if (typeof maxDays === "number" && days > maxDays) {
      setHint(`حداکثر مدت اجاره ${toPersianDigits(maxDays)} روز است.`);
      return;
    }
    if (typeof minDays === "number" && days < minDays) {
      setHint(`حداقل مدت اجاره ${toPersianDigits(minDays)} روز است.`);
      return;
    }
    onRangeChange(startIso, iso);
  }

  const hasSelection = Boolean(startIso || endIso);

  return (
    <div className={className} dir="rtl">
      {/* Header: month navigation (locked inside ۱۴۰۵) */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => Math.max(1, m - 1))}
          disabled={viewMonth <= 1}
          aria-label="ماه قبل"
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-slate-800" aria-live="polite">
            {jalaliMonthLabel(JALALI_YEAR_LOCK, viewMonth)}
          </span>
          <span className="block text-[10px] font-medium text-slate-400">
            سال {toPersianDigits(JALALI_YEAR_LOCK)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => Math.min(12, m + 1))}
          disabled={viewMonth >= 12}
          aria-label="ماه بعد"
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </div>

      {/* Weekday names: شنبه … جمعه (RTL grid renders right-to-left) */}
      <div className="grid grid-cols-7 gap-1 mb-1" role="row">
        {JALALI_WEEKDAY_NAMES.map((w) => (
          <span
            key={w}
            className="text-center text-[10px] font-bold text-slate-400 py-1"
            aria-hidden="true"
          >
            {w.slice(0, 3)}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`تقویم ${jalaliMonthLabel(JALALI_YEAR_LOCK, viewMonth)}`}>
        {Array.from({ length: grid.leading }).map((_, i) => (
          <span key={`pad-${i}`} aria-hidden="true"></span>
        ))}
        {grid.days.map(({ jd, iso }) => {
          const past = iso < today;
          const booked = isDayBooked(iso, bookedRanges);
          const ownerBlocked = isDayBooked(iso, ownerBlockedRanges);
          const disabled = past || booked || ownerBlocked;
          const isStart = iso === startIso;
          const isEnd = iso === endIso;
          const selected = isStart || isEnd;
          const inRange =
            startIso && endIso && iso > startIso && iso < endIso;
          const isToday = iso === today;

          const stateClass = selected
            ? "bg-[#7c3aed] text-white font-bold shadow-sm shadow-[#8b5cf6]/30"
            : inRange
              ? "bg-[#ede9fe] text-[#6d28d9] font-semibold"
              : ownerBlocked && isHost
                ? "bg-[#ede9fe] text-[#6d28d9] font-bold cursor-not-allowed"
                : ownerBlocked
                  ? "bg-amber-50 text-amber-400 line-through cursor-not-allowed"
                  : booked
                    ? "bg-slate-100 text-slate-400 line-through cursor-not-allowed"
                    : past
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-700 hover:bg-[#f3efff] cursor-pointer";

          const title = ownerBlocked
            ? isHost
              ? "مسدودشده توسط شما"
              : "مسدود توسط میزبان"
            : booked
              ? "در حال اجاره"
              : past
                ? "گذشته"
                : `${JALALI_WEEKDAY_NAMES[jalaliWeekdayOfIso(iso)]} ${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[viewMonth - 1]}`;

          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              disabled={disabled}
              aria-label={title}
              aria-selected={selected}
              title={title}
              onClick={() => pick(iso)}
              className={`${CELL} ${stateClass} relative ${
                isToday && !selected ? "ring-1 ring-[#a78bfa]" : ""
              }`}
            >
              {toPersianDigits(jd)}
              {isToday && !selected ? (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#7c3aed]" aria-hidden="true"></span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Inline hint / selection summary */}
      {hint ? (
        <p className="mt-2 text-[11px] font-semibold text-rose-500 text-center" role="alert">
          {hint}
        </p>
      ) : startIso && endIso ? (
        <p className="mt-2 text-[11px] font-semibold text-emerald-600 text-center">
          {isHost
            ? `بازه مسدود شد: ${toPersianDigits(diffDaysIso(startIso, endIso) + 1)} روز غیرقابل اجاره`
            : `بازه انتخاب‌شده: ${diffDaysIso(startIso, endIso)} روز اجاره`}
        </p>
      ) : startIso ? (
        <p className="mt-2 text-[11px] font-semibold text-[#7c3aed] text-center">
          {isHost
            ? "روز پایانی مسدودی را انتخاب کنید (یا همان روز را دوباره بزنید)"
            : "روز بازگشت را انتخاب کنید"}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-slate-400 text-center">
          {isHost
            ? "برای مسدودسازی، روز شروع را انتخاب کنید"
            : "برای شروع، روز تحویل را انتخاب کنید"}
        </p>
      )}

      {hasSelection ? (
        <button
          type="button"
          onClick={() => {
            setHint(null);
            onRangeChange(null, null);
          }}
          className="mt-1.5 w-full text-[11px] font-semibold text-slate-500 hover:text-rose-500 transition-colors"
        >
          پاک کردن انتخاب
        </button>
      ) : null}
    </div>
  );
}
