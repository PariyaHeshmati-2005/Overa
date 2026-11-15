import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FavoritesClient, { type FavoriteRow } from "./FavoritesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "علاقه‌مندی‌های من" };

/**
 * /favorites — the page the header heart opens (was /account-settings).
 * Protected: guests are redirected to login like every other account page.
 * Uses the shared site header + footer and renders saved listings with the
 * exact product-card visual language of the homepage.
 */
export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/favorites"));

  /* Server-rendered initial data (same shape as GET /api/favorites) so the
     page paints real content immediately. */
  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          area: true,
          dailyPrice: true,
          rating: true,
          reviewsCount: true,
          instantBook: true,
          status: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  const initialFavorites: FavoriteRow[] = favorites.map((f) => ({
    id: f.id,
    createdAt: f.createdAt.toISOString(),
    listing: {
      id: f.listing.id,
      title: f.listing.title,
      city: f.listing.city,
      area: f.listing.area,
      dailyPrice: f.listing.dailyPrice,
      rating: f.listing.rating,
      reviewsCount: f.listing.reviewsCount,
      instantBook: f.listing.instantBook,
      status: f.listing.status,
      imageUrl: f.listing.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
      imageAlt: f.listing.images[0]?.alt ?? null,
    },
  }));

  return (
    <>
      {/* Shared site header — identical to the homepage (slide-out menu,
          live DB search, session-aware user area) */}
      <SiteHeader />

      {/* Breadcrumb — same pattern as the other account pages */}
      <nav
        aria-label="مسیریابی"
        className="flex items-center gap-2 text-sm text-neutral-muted pt-4 mb-4 mt-3 px-4 sm:px-6 max-w-[1440px] w-full mx-auto"
      >
        <Link
          className="hover:text-primary transition-colors flex items-center gap-1"
          href="/"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
            <path d="M3 10.5L12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>خانه</span>
        </Link>
        <svg className="w-3.5 h-3.5 opacity-50 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <Link className="hover:text-primary transition-colors" href="/account-settings">حساب کاربری</Link>
        <svg className="w-3.5 h-3.5 opacity-50 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className="text-neutral-text font-bold">علاقه‌مندی‌ها</span>
      </nav>

      <FavoritesClient initialFavorites={initialFavorites} />

      <SiteFooter />
    </>
  );
}
