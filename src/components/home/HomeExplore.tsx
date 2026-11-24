"use client";

import { useMemo, useState } from "react";
import ListingCard, { type ListingCardData } from "@/components/overa/ListingCard";
import { toPersianDigits } from "@/lib/format";

export type HomeListing = ListingCardData & {
  deliveryCourier: boolean;
  pickupInPerson: boolean;
  categorySlug: string;
  createdAt: string;
};

export type HomeCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

type Filters = {
  categorySlug: string;
  minPrice: string;
  maxPrice: string;
  city: string;
  instant: boolean;
  courier: boolean;
  pickup: boolean;
  sort: "newest" | "price_asc" | "price_desc" | "rating";
};

const EMPTY_FILTERS: Filters = {
  categorySlug: "",
  minPrice: "",
  maxPrice: "",
  city: "",
  instant: false,
  courier: false,
  pickup: false,
  sort: "newest",
};

const SORT_LABELS: Record<Filters["sort"], string> = {
  newest: "جدیدترین",
  price_asc: "ارزان‌ترین",
  price_desc: "گران‌ترین",
  rating: "محبوب‌ترین",
};

const BASE_CITIES = ["تهران", "اصفهان", "شیراز", "مشهد", "کرج", "تبریز"];

/** Normalize Persian digits to Latin so typed ۵۰۰۰۰ works too. */
function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

function toNumberOrNull(value: string): number | null {
  const cleaned = normalizeDigits(value).replace(/[,\s]/g, "");
  if (cleaned === "") return null; // empty = no bound (never treat as 0)
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Functional replacement for the previously decorative homepage filter:
 * live category/price/city/feature filtering with instant results and a
 * live result counter, over all ACTIVE listings.
 */
export default function HomeExplore({
  listings,
  categories,
}: {
  listings: HomeListing[];
  categories: HomeCategory[];
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const cities = useMemo(() => {
    const set = new Set(BASE_CITIES);
    listings.forEach((l) => l.city && set.add(l.city));
    return ["همه شهرها", ...Array.from(set)];
  }, [listings]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    listings.forEach(
      (l) => counts.set(l.categorySlug, (counts.get(l.categorySlug) ?? 0) + 1)
    );
    return counts;
  }, [listings]);

  const filtered = useMemo(() => {
    const min = toNumberOrNull(filters.minPrice);
    const max = toNumberOrNull(filters.maxPrice);
    const result = listings.filter((l) => {
      if (filters.categorySlug && l.categorySlug !== filters.categorySlug) return false;
      if (min !== null && l.dailyPrice < min) return false;
      if (max !== null && l.dailyPrice > max) return false;
      if (filters.city && l.city !== filters.city) return false;
      if (filters.instant && !l.instantBook) return false;
      if (filters.courier && !l.deliveryCourier) return false;
      if (filters.pickup && !l.pickupInPerson) return false;
      return true;
    });
    switch (filters.sort) {
      case "price_asc":
        return [...result].sort((a, b) => a.dailyPrice - b.dailyPrice);
      case "price_desc":
        return [...result].sort((a, b) => b.dailyPrice - a.dailyPrice);
      case "rating":
        return [...result].sort(
          (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount
        );
      default:
        return [...result].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
  }, [listings, filters]);

  const isFiltered =
    filters.categorySlug !== "" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.city !== "" ||
    filters.instant ||
    filters.courier ||
    filters.pickup;

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));

  const scrollToResults = () => {
    document
      .getElementById("home-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Filter sidebar — now fully functional (live filtering) */}
      <aside
        className="col-span-12 lg:col-span-4 xl:col-span-3 bg-white p-5 rounded-3xl border border-purple-100 shadow-card flex flex-col gap-6"
        aria-label="فیلترها"
      >
        <div className="flex items-center justify-between pb-4 border-b border-purple-100/70">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <h3 className="text-base font-bold text-neutral-text">فیلترها</h3>
          </div>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={!isFiltered}
            className="text-xs text-neutral-muted hover:text-red-500 transition-colors font-medium disabled:opacity-40 disabled:hover:text-neutral-muted"
          >
            حذف همه فیلترها
          </button>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-neutral-text flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            دسته‌بندی
          </span>
          <div
            className="flex flex-col gap-1 text-xs font-medium max-h-52 overflow-y-auto pl-1"
            role="radiogroup"
            aria-label="انتخاب دسته‌بندی"
          >
            <button
              type="button"
              role="radio"
              aria-checked={filters.categorySlug === ""}
              onClick={() => patch({ categorySlug: "" })}
              className={`flex items-center justify-between p-2 rounded-xl text-right cursor-pointer transition-colors ${
                filters.categorySlug === ""
                  ? "bg-primary-soft/70 text-primary font-bold"
                  : "hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 ${filters.categorySlug === "" ? "border-primary" : "border-gray-300"}`}>
                  {filters.categorySlug === "" ? <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> : null}
                </span>
                <span>همه دسته‌ها</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${filters.categorySlug === "" ? "bg-white text-primary" : "text-neutral-muted"}`}>
                {toPersianDigits(listings.length)}
              </span>
            </button>
            {categories.map((c) => {
              const active = filters.categorySlug === c.slug;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => patch({ categorySlug: c.slug })}
                  className={`flex items-center justify-between p-2 rounded-xl text-right cursor-pointer transition-colors ${
                    active
                      ? "bg-primary-soft/70 text-primary font-bold"
                      : "hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 ${active ? "border-primary" : "border-gray-300"}`}>
                      {active ? <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> : null}
                    </span>
                    <span>{c.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md ${active ? "bg-white text-primary" : "text-neutral-muted"}`}>
                    {toPersianDigits(categoryCounts.get(c.slug) ?? 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-purple-100/70"></div>

        {/* Price range — real inputs, live filtering */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-neutral-text">قیمت روزانه (تومان)</span>
          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="bg-neutral-bg border border-purple-100 rounded-xl px-2.5 py-1.5 text-center flex-1 focus-within:border-primary transition-colors">
              <span className="text-[10px] text-neutral-muted block">از</span>
              <input
                type="text"
                inputMode="numeric"
                data-numeric="money"
                value={filters.minPrice}
                onChange={(e) => patch({ minPrice: e.target.value })}
                placeholder="۵۰,۰۰۰"
                aria-label="حداقل قیمت روزانه به تومان"
                className="w-full bg-transparent outline-none text-center font-bold text-neutral-text placeholder:text-neutral-muted/60"
              />
            </label>
            <span className="text-neutral-muted font-bold">تا</span>
            <label className="bg-neutral-bg border border-purple-100 rounded-xl px-2.5 py-1.5 text-center flex-1 focus-within:border-primary transition-colors">
              <span className="text-[10px] text-neutral-muted block">تا</span>
              <input
                type="text"
                inputMode="numeric"
                data-numeric="money"
                value={filters.maxPrice}
                onChange={(e) => patch({ maxPrice: e.target.value })}
                placeholder="۵,۰۰۰,۰۰۰"
                aria-label="حداکثر قیمت روزانه به تومان"
                className="w-full bg-transparent outline-none text-center font-bold text-neutral-text placeholder:text-neutral-muted/60"
              />
            </label>
          </div>
        </div>

        <div className="h-px bg-purple-100/70"></div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-neutral-text" htmlFor="home-city">
            موقعیت مکانی
          </label>
          <div className="relative">
            <select
              id="home-city"
              value={filters.city}
              onChange={(e) => patch({ city: e.target.value })}
              className="w-full bg-neutral-bg border border-purple-100 text-xs rounded-xl py-2.5 pr-3 pl-8 text-neutral-text focus:border-primary focus:ring-0 appearance-none font-medium cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c} value={c === "همه شهرها" ? "" : c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="h-px bg-purple-100/70"></div>

        {/* Features — wired to real listing flags */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-neutral-text">امکانات ویژه</span>
          <div className="flex flex-col gap-2.5 text-xs">
            {(
              [
                { key: "instant", label: "رزرو فوری", checked: filters.instant },
                { key: "courier", label: "تحویل در محل با پیک", checked: filters.courier },
                { key: "pickup", label: "تحویل حضوری", checked: filters.pickup },
              ] as const
            ).map((f) => (
              <label key={f.key} className="flex items-center justify-between cursor-pointer">
                <span className={f.checked ? "text-neutral-text font-medium" : "text-neutral-muted hover:text-neutral-text"}>
                  {f.label}
                </span>
                <input
                  type="checkbox"
                  checked={f.checked}
                  onChange={(e) =>
                    patch({ [f.key]: e.target.checked } as Partial<Filters>)
                  }
                  className="sr-only peer"
                  aria-label={f.label}
                />
                <div className="w-9 h-5 bg-purple-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative"></div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToResults}
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm shadow-md shadow-primary/20 transition-all transform active:scale-98 mt-2 text-center"
        >
          اعمال فیلترها ({toPersianDigits(filtered.length)} نتیجه)
        </button>
      </aside>

      {/* Results */}
      <main
        id="home-results"
        className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6"
        aria-label="لیست وسایل"
      >
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.157 2.128-1.572 3.652C7.755 9.877 7.002 12.025 7 14c.002.327.025.65.07.967a5.503 5.503 0 00-2.07-2.39 1 1 0 00-1.58.972C3.684 15.655 5.21 18 8.5 18c3.59 0 6.5-2.91 6.5-6.5 0-2.454-1.282-4.595-2.605-6.947zM10 16a3.5 3.5 0 01-3.486-3.218 5.48 5.48 0 001.37-2.083c.27-.674.52-1.393.754-2.138.33.68.73 1.34 1.18 1.968.742 1.037 1.682 2.35 1.682 3.471A3.5 3.5 0 0110 16z" fillRule="evenodd"></path>
              </svg>
            </span>
            <h2 className="text-base font-bold text-neutral-text">محبوب‌ترین وسایل</h2>
            <span
              className="text-[11px] font-semibold text-primary bg-primary-soft/70 rounded-lg px-2 py-1"
              aria-live="polite"
            >
              {toPersianDigits(filtered.length)} وسیله
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-muted">مرتب‌سازی:</span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => patch({ sort: e.target.value as Filters["sort"] })}
                aria-label="مرتب‌سازی نتایج"
                className="bg-neutral-bg border border-purple-100 rounded-xl py-1.5 pr-3 pl-8 text-xs text-neutral-text font-semibold appearance-none cursor-pointer focus:border-primary"
              >
                {(Object.keys(SORT_LABELS) as Filters["sort"][]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-muted">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-purple-100 p-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-neutral-muted">
              هیچ وسیله‌ای مطابق فیلترهای انتخابی پیدا نشد.
            </p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs font-bold text-primary hover:text-primary-dark bg-primary-soft/70 rounded-xl px-4 py-2"
            >
              حذف فیلترها و نمایش همه
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
