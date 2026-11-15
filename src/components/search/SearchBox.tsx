"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPersianDigits, faToman } from "@/lib/format";
import type { SearchHit } from "@/lib/search";

type SearchResponse = {
  query: string;
  total: number;
  results: SearchHit[];
};

/**
 * Live database-backed search box (shared by the desktop header and the
 * mobile slide-out menu). Preserves the established Overa visual language:
 * rounded-full purple-bordered input, purple-soft accents, Persian digits.
 *
 * - Debounced queries to /api/search (real DB, Persian-normalized).
 * - Keyboard navigation (↑/↓/Enter/Esc) + click-outside dismissal.
 * - Enter → full results page /search?q=… ; selecting a hit opens
 *   /item-details/[id] and (optionally) closes the wrapping menu.
 */
export default function SearchBox({
  variant = "header",
  onNavigate,
  autoFocus = false,
  initialValue = "",
}: {
  variant?: "header" | "menu";
  /** Called after the user picks a result or submits (mobile menu closes itself). */
  onNavigate?: () => void;
  autoFocus?: boolean;
  initialValue?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const runSearch = useCallback(async (q: string) => {
    const seq = ++seqRef.current;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits(null);
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&limit=8`
      );
      const data = (await res.json()) as SearchResponse;
      if (seq !== seqRef.current) return; // stale response
      setHits(data.results ?? []);
      setTotal(data.total ?? 0);
    } catch {
      if (seq !== seqRef.current) return;
      setHits([]);
      setTotal(0);
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  const onChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const goToListing = (id: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(`/item-details/${id}`);
  };

  const goToResults = () => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, (hits?.length ?? 1) - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && hits && activeIndex >= 0 && hits[activeIndex]) {
        goToListing(hits[activeIndex].id);
      } else {
        goToResults();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && (loading || hits !== null);
  const isMenu = variant === "menu";

  return (
    <div
      ref={boxRef}
      className={`relative w-full ${isMenu ? "" : "flex-1"}`}
      role="search"
      aria-label="جستجوی وسایل"
    >
      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          className={`w-full bg-neutral-bg border border-purple-100/90 rounded-full focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-neutral-text placeholder-neutral-muted/70 outline-none ${
            isMenu
              ? "h-11 pr-5 pl-12 text-sm rounded-2xl"
              : "h-12 pr-5 pl-14 text-sm"
          }`}
          placeholder="جستجو در بین هزاران وسیله..."
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (hits && hits.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          aria-label="جستجوی وسایل"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button
          aria-label="جستجو"
          type="button"
          onClick={goToResults}
          className={`absolute left-1.5 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-sm transition-colors duration-150 ${
            isMenu ? "left-1 w-9 h-9" : "left-1.5 w-9 h-9"
          }`}
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" d="M12 2a10 10 0 019.54 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            </svg>
          )}
        </button>
      </div>

      {showPanel && (
        <div
          className={`absolute top-full mt-2 w-full bg-white border border-purple-100 rounded-2xl shadow-card-hover overflow-hidden z-50 ${
            isMenu ? "" : "max-w-xl"
          }`}
          role="listbox"
          aria-label="نتایج جستجو"
        >
          {loading && (!hits || hits.length === 0) ? (
            <div className="p-4 text-center text-xs text-neutral-muted">
              در حال جستجو…
            </div>
          ) : hits && hits.length > 0 ? (
            <>
              <ul className="max-h-80 overflow-y-auto">
                {hits.map((h, i) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => goToListing(h.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-right transition-colors ${
                        i === activeIndex ? "bg-primary-soft/70" : "hover:bg-neutral-bg"
                      }`}
                    >
                      <span className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-bg shrink-0 border border-purple-100/60">
                        <img
                          src={h.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </span>
                      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-neutral-text truncate">
                          {h.title}
                        </span>
                        <span className="text-[11px] text-neutral-muted truncate">
                          {h.categoryName} • {h.city}
                        </span>
                      </span>
                      <span className="text-[11px] font-black text-primary whitespace-nowrap">
                        {faToman(h.dailyPrice)}
                        <span className="text-[9px] text-neutral-muted font-medium"> تومان</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToResults}
                className="w-full py-2.5 text-xs font-bold text-primary bg-primary-soft/50 hover:bg-primary-soft transition-colors border-t border-purple-100"
              >
                مشاهده همه نتایج ({toPersianDigits(total)})
              </button>
            </>
          ) : (
            <div className="p-5 text-center flex flex-col gap-2">
              <p className="text-xs font-bold text-neutral-text">
                چیزی مطابق «{query.trim()}» پیدا نشد.
              </p>
              <p className="text-[11px] text-neutral-muted">
                املای عبارت را بررسی کنید یا از نام عمومی‌تر وسیله استفاده کنید.
              </p>
              <button
                type="button"
                onClick={goToResults}
                className="mx-auto mt-1 px-4 py-1.5 rounded-xl bg-primary-soft/70 text-primary text-xs font-bold hover:bg-primary-soft"
              >
                مشاهده صفحه نتایج
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
