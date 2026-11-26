"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ListingCard from "@/components/overa/ListingCard";
import { toPersianDigits } from "@/lib/format";

export type FavoriteRow = {
  id: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    area: string | null;
    dailyPrice: number;
    rating: number;
    reviewsCount: number;
    instantBook: boolean;
    status: string;
    imageUrl: string;
    imageAlt: string | null;
  };
};

/**
 * Favorites page body — the saved listings grid uses the homepage product
 * card (ListingCard) untouched; a remove heart sits on the card's image
 * corner. Removing talks to DELETE /api/favorites and never navigates.
 */
export default function FavoritesClient({
  initialFavorites,
}: {
  initialFavorites: FavoriteRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<FavoriteRow[]>(initialFavorites);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const available = items.filter((f) => f.listing.status === "ACTIVE");
  const hiddenCount = items.length - available.length;

  async function removeFavorite(row: FavoriteRow) {
    if (removingId) return;
    setRemovingId(row.listing.id);
    // optimistic remove
    setItems((prev) => prev.filter((f) => f.listing.id !== row.listing.id));
    try {
      const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: row.listing.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("از علاقه‌مندی‌ها حذف شد.");
      router.refresh();
    } catch {
      toast.error("حذف از علاقه‌مندی‌ها انجام نشد؛ دوباره تلاش کنید.");
      void refreshList();
    } finally {
      setRemovingId(null);
    }
  }

  /** Restore a consistent list straight from the database. */
  async function refreshList() {
    try {
      const res = await fetch("/api/favorites", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.favorites)) setItems(data.favorites);
    } catch {
      /* keep current view */
    }
  }

  return (
    <main className="flex-1 w-full">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 pb-10 flex flex-col gap-5">
        {/* Page title card — same rounded-3xl purple-border language */}
        <section className="bg-white rounded-3xl border border-purple-100 shadow-card p-5 md:p-7">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg md:text-xl font-black text-neutral-text">
                علاقه‌مندی‌ها
              </h1>
              <p className="text-xs text-neutral-muted font-medium">
                {toPersianDigits(items.length)} وسیله ذخیره شده — با لمس نشان
                قلب می‌توانید آن را حذف کنید
              </p>
            </div>
          </div>
        </section>

        {/* Grid */}
        {available.length === 0 ? (
          <section className="bg-white rounded-3xl border border-purple-100 shadow-card p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-neutral-text">
                هنوز چیزی به علاقه‌مندی‌ها اضافه نکرده‌اید
              </h2>
              <p className="text-xs text-neutral-muted leading-relaxed max-w-sm">
                در صفحه هر وسیله، دکمه «افزودن به علاقه‌مندی‌ها» را بزنید تا
                اینجا ذخیره شود و بعداً سریع پیدایش کنید.
              </p>
            </div>
            <Link
              href="/categories"
              className="px-5 py-2.5 rounded-full bg-primary-soft text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
            >
              مرور دسته‌بندی‌ها
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {available.map((f) => (
              <div key={f.id} className="relative">
                <ListingCard
                  listing={{
                    id: f.listing.id,
                    title: f.listing.title,
                    city: f.listing.city,
                    area: f.listing.area,
                    dailyPrice: f.listing.dailyPrice,
                    rating: f.listing.rating,
                    reviewsCount: f.listing.reviewsCount,
                    instantBook: f.listing.instantBook,
                    imageUrl: f.listing.imageUrl,
                  }}
                />
                {/* Remove heart — sits on the image corner; the discount and
                    instant-book badges keep their own corners untouched. */}
                <button
                  type="button"
                  aria-label={`حذف ${f.listing.title} از علاقه‌مندی‌ها`}
                  title="حذف از علاقه‌مندی‌ها"
                  disabled={removingId === f.listing.id}
                  onClick={() => removeFavorite(f)}
                  className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-rose-100 text-rose-500 shadow-sm hover:bg-rose-50 hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {hiddenCount > 0 ? (
          <p className="text-[11px] text-neutral-muted bg-primary-surface border border-purple-100 rounded-2xl px-4 py-3 text-center">
            {toPersianDigits(hiddenCount)} وسیله از علاقه‌مندی‌های شما فعلاً در
            دسترس نیست و نمایش داده نمی‌شود.
          </p>
        ) : null}
      </div>
    </main>
  );
}
