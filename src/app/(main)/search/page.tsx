import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ListingCard from "@/components/overa/ListingCard";
import SearchRefineForm from "@/app/(main)/search/SearchRefineForm";
import { db } from "@/lib/db";
import { searchListings } from "@/lib/search";
import { toPersianDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نتایج جستجو",
  description: "جستجوی وسایل قابل اجاره در اٌوِرا",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const { results, total } = query
    ? await searchListings(query, 60)
    : { results: [], total: 0 };

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex-1 w-full bg-[#fafafa]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-xs text-neutral-muted"
            aria-label="مسیر صفحه"
          >
            <Link href="/" className="hover:text-primary font-medium">
              خانه
            </Link>
            <span className="text-purple-100">/</span>
            <span className="font-bold text-neutral-text">نتایج جستجو</span>
          </nav>

          <div className="flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-black text-neutral-text">
              {query ? (
                <>
                  نتایج جستجو برای{" "}
                  <span className="text-primary">«{query}»</span>
                </>
              ) : (
                "جستجوی وسایل"
              )}
            </h1>
            {query && (
              <p className="text-xs text-neutral-muted" aria-live="polite">
                {toPersianDigits(total)} وسیله مطابق عبارت شما پیدا شد.
              </p>
            )}
          </div>

          {query && results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={{
                    id: l.id,
                    title: l.title,
                    city: l.city,
                    area: l.area,
                    dailyPrice: l.dailyPrice,
                    rating: l.rating,
                    reviewsCount: l.reviewsCount,
                    instantBook: l.instantBook,
                    imageUrl: l.imageUrl,
                  }}
                />
              ))}
            </div>
          ) : (
            <SearchEmptyState query={query} categories={categories} />
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}

function SearchEmptyState({
  query,
  categories,
}: {
  query: string;
  categories: { slug: string; name: string }[];
}) {
  return (
    <section
      className="bg-white rounded-3xl border border-purple-100 shadow-card p-8 md:p-10 flex flex-col items-center gap-5 text-center"
      aria-label="نتیجه‌ای پیدا نشد"
    >
      <div className="w-20 h-20 rounded-3xl bg-primary-soft flex items-center justify-center">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <line
            x1="16.5"
            x2="21"
            y1="16.5"
            y2="21"
            strokeLinecap="round"
          ></line>
          <line
            x1="8.5"
            x2="12.5"
            y1="8.5"
            y2="12.5"
            strokeLinecap="round"
          ></line>
        </svg>
      </div>
      <div className="flex flex-col gap-2 max-w-lg">
        <h2 className="text-lg font-black text-neutral-text">
          {query
            ? "محصول موردنظر شما پیدا نشد"
            : "عبارت موردنظر خود را جستجو کنید"}
        </h2>
        <p className="text-sm text-neutral-muted leading-relaxed">
          {query
            ? `در حال حاضر وسیله‌ای مطابق «${query}» در اٌوِرا ثبت نشده است. عبارت دیگری را امتحان کنید یا از دسته‌بندی‌های زیر استفاده کنید.`
            : "نام وسیله، برند یا دسته‌بندی موردنظر خود را در کادر زیر بنویسید."}
        </p>
      </div>

      {/* Refine search — preserves the query and lets the user correct it */}
      <SearchRefineForm initialQuery={query} />

      <div
        className="w-full h-px bg-purple-100/70 max-w-md"
        aria-hidden="true"
      ></div>

      <div className="flex flex-col gap-3 items-center">
        <p className="text-xs font-bold text-neutral-text">
          دسته‌بندی‌های پرطرفدار
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categories?category=${c.slug}`}
              className="px-4 py-2 rounded-xl bg-primary-soft/60 text-primary text-xs font-bold hover:bg-primary-soft transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/"
        className="mt-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-colors"
      >
        بازگشت به صفحه اصلی
      </Link>
    </section>
  );
}
