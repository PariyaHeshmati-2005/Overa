import {
  toJalali,
  toGregorian,
  isLeapJalaaliYear,
  jalaaliMonthLength,
  isoToJalali,
  jalaliToIso,
  todayIsoTehran,
  addDaysIso,
  diffDaysIso,
  rentalDaysIso,
  isDayBooked,
  rangeHitsBooked,
  jalaliWeekdayOfIso,
  formatJalaliIso,
  JALALI_YEAR_LOCK,
} from "../src/lib/jalali";

/* ------------------------- known date conversions ------------------------- */

// Nowruz 1405 falls on 21 March 2026.
test("1405/01/01 converts to 2026-03-21", () => {
  const g = toGregorian(1405, 1, 1);
  expect(g).toEqual({ gy: 2026, gm: 3, gd: 21 });
  const j = toJalali(2026, 3, 21);
  expect(j).toEqual({ jy: 1405, jm: 1, jd: 1 });
});

// Today at build time: 2026-11-13 is 22 Aban 1405.
test("2026-11-13 is 22 Aban 1405", () => {
  expect(isoToJalali("2026-11-13")).toEqual({ jy: 1405, jm: 8, jd: 22 });
});

// 1403 is a leap Jalali year: Esfand has 30 days, ending 2025-03-20.
test("1403 is leap and 1403/12/30 is 2025-03-20", () => {
  expect(isLeapJalaaliYear(1403)).toBe(true);
  expect(jalaaliMonthLength(1403, 12)).toBe(30);
  expect(jalaliToIso(1403, 12, 30)).toBe("2025-03-20");
});

// 1405 is not a leap year: Esfand has 29 days.
test("1405 month lengths (non-leap)", () => {
  expect(isLeapJalaaliYear(1405)).toBe(false);
  for (let m = 1; m <= 6; m++) expect(jalaaliMonthLength(1405, m)).toBe(31);
  for (let m = 7; m <= 11; m++) expect(jalaaliMonthLength(1405, m)).toBe(30);
  expect(jalaaliMonthLength(1405, 12)).toBe(29);
});

/* ----------------------------- roundtrips ----------------------------- */

test("jalali <-> gregorian roundtrip across 1400-1420", () => {
  for (let jy = 1400; jy <= 1420; jy++) {
    for (let jm = 1; jm <= 12; jm++) {
      const len = jalaaliMonthLength(jy, jm);
      const iso = jalaliToIso(jy, jm, len);
      const back = isoToJalali(iso);
      expect(back.jy).toBe(jy);
      expect(back.jm).toBe(jm);
      expect(back.jd).toBe(len);
    }
  }
});

/* ------------------------------ iso helpers ------------------------------ */

test("addDaysIso and diffDaysIso", () => {
  expect(addDaysIso("2026-11-13", 1)).toBe("2026-11-14");
  expect(addDaysIso("2026-11-30", 1)).toBe("2026-12-01");
  expect(addDaysIso("2027-01-01", -1)).toBe("2026-12-31");
  expect(diffDaysIso("2026-11-13", "2026-11-20")).toBe(7);
  expect(rentalDaysIso("2026-11-13", "2026-11-13")).toBe(1);
  expect(rentalDaysIso("2026-11-13", "2026-11-14")).toBe(2);
});

test("weekday index: 2026-11-13 (Friday) is 6 (جمعه), 2026-11-14 is 0 (شنبه)", () => {
  expect(jalaliWeekdayOfIso("2026-11-13")).toBe(6);
  expect(jalaliWeekdayOfIso("2026-11-14")).toBe(0);
});

test("formatJalaliIso renders Persian digits", () => {
  expect(formatJalaliIso("2026-11-13")).toBe("۲۲ آبان ۱۴۰۵");
  expect(formatJalaliIso("2026-11-13", false)).toBe("۲۲ آبان");
});

test("booked-range helpers", () => {
  const ranges = [
    { start: "2026-12-01", end: "2026-12-05" },
    { start: "2026-12-20", end: "2026-12-22" },
  ];
  expect(isDayBooked("2026-12-03", ranges)).toBe(true);
  expect(isDayBooked("2026-12-06", ranges)).toBe(false);
  expect(rangeHitsBooked("2026-12-04", "2026-12-10", ranges)).toBe(true);
  expect(rangeHitsBooked("2026-12-06", "2026-12-10", ranges)).toBe(false);
  expect(rangeHitsBooked("2026-11-25", "2026-12-01", ranges)).toBe(true);
});

test("today in Tehran is inside the locked year 1405 around build time", () => {
  const j = isoToJalali(todayIsoTehran(new Date("2026-11-13T10:00:00Z")));
  expect(j.jy).toBe(JALALI_YEAR_LOCK);
});
