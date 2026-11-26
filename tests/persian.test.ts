import { describe, expect, test } from "bun:test";
import {
  buildListingSearchKey,
  normalizePersian,
  queryTokens,
} from "../src/lib/persian";

/**
 * Persian normalization is the backbone of Overa search. These tests lock in
 * the forgiving-matching guarantees: Arabic↔Persian unification, ZWNJ
 * handling, digit folding, diacritic removal and stable word tokenization.
 */
describe("persian normalization", () => {
  test("Arabic Yeh matches Persian Yeh", () => {
    expect(normalizePersian("دوربين")).toBe(normalizePersian("دوربین"));
  });

  test("Arabic Kaf matches Persian Kaf", () => {
    expect(normalizePersian("كوله")).toBe(normalizePersian("کوله"));
  });

  test("ZWNJ is removed (joins the word) consistently on both sides", () => {
    // «صندلی‌های» → «صندلیهای» — identical folding happens for the stored
    // search key and the query, so substring matching stays consistent.
    expect(normalizePersian("صندلی‌های")).toBe("صندلیهای");
    expect(normalizePersian("می‌شود")).toBe("میشود");
    // Word-level queries typed WITH a space still match the joined key via
    // per-word `contains` (verified end-to-end by the /api/search flow).
    expect(queryTokens("صندلی های")).toEqual(["صندلی", "های"]);
  });

  test("Persian digits fold to Latin digits", () => {
    expect(normalizePersian("چادر ۴ نفره")).toBe(normalizePersian("چادر 4 نفره"));
  });

  test("Arabic-Indic digits fold too", () => {
    expect(normalizePersian("٤٥")).toBe(normalizePersian("45"));
  });

  test("diacritics and tatweel are stripped", () => {
    expect(normalizePersian("سَلبیـ")).toBe(normalizePersian("سلبی"));
  });

  test("extra whitespace collapses", () => {
    expect(normalizePersian("  دوربین   سونی  ")).toBe(normalizePersian("دوربین سونی"));
  });

  test("case folding for Latin text", () => {
    expect(normalizePersian("Sony")).toBe(normalizePersian("sony"));
  });

  test("alef variants unify", () => {
    expect(normalizePersian("آب")).toBe(normalizePersian("اب"));
  });

  test("queryTokens splits and caps word count", () => {
    expect(queryTokens("چادر  کلمبوس ضدآب")).toEqual(["چادر", "کلمبوس", "ضداب"]);
    expect(queryTokens("a b c d e f g h").length).toBe(6);
    expect(queryTokens("   ")).toEqual([]);
  });

  test("search key includes all fields in canonical form", () => {
    const key = buildListingSearchKey({
      title: "دوربین سونی",
      brand: "Sony Alpha",
      specs: "سنسور ۳۳ مگاپیکسل",
      description: "مناسب تولید محتوا",
      city: "تهران",
      categoryName: "لوازم دیجیتال",
    });
    expect(key).toContain(normalizePersian("دوربین سونی"));
    expect(key).toContain("sony alpha");
    expect(key).toContain(normalizePersian("سنسور ۳۳ مگاپیکسل"));
    expect(key).toContain(normalizePersian("لوازم دیجیتال"));
  });

  test("search key makes partial words matchable", () => {
    const key = buildListingSearchKey({
      title: "لپتاپ مکبوک پرو M1",
      brand: null,
      specs: null,
      description: null,
      city: "تهران",
      categoryName: "لوازم دیجیتال",
    });
    // A user typing part of the name must still hit the key.
    expect(key.includes(normalizePersian("مکبوک"))).toBe(true);
    expect(key.includes(normalizePersian("لپ"))).toBe(true);
  });
});
