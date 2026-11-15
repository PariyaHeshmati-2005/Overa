"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Small client-side refinement form for the search results empty state:
 * preserves the original query as the starting value and submits a fresh
 * /search?q=… request (works without JavaScript too — plain GET form).
 */
export default function SearchRefineForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="w-full max-w-md flex items-stretch gap-2"
      role="search"
      aria-label="اصلاح جستجو"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="عبارت جدیدی را جستجو کنید…"
        aria-label="عبارت جستجو"
        className="min-w-0 flex-1 h-11 px-4 rounded-xl bg-neutral-bg border border-purple-100 text-sm text-neutral-text placeholder-neutral-muted/60 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
      />
      <button
        type="submit"
        className="px-5 h-11 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-sm shadow-primary/20 transition-colors"
      >
        جستجو
      </button>
    </form>
  );
}
