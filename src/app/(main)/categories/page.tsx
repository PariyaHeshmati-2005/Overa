import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import CategoriesApp, { type CategoryTabListing } from "./CategoriesApp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "دسته‌بندی‌ها",
  description: "کاوش و اجاره در میان هزاران تجهیزات تخصصی در اورا",
};

export default async function CategoriesPage() {
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { slug: true, name: true } },
      owner: { select: { name: true } },
    },
  });

  const data: CategoryTabListing[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    brand: l.brand,
    description: l.description,
    specs: l.specs,
    categorySlug: l.category.slug,
    categoryName: l.category.name,
    dailyPrice: l.dailyPrice,
    weeklyPrice: l.weeklyPrice,
    deposit: l.deposit,
    city: l.city,
    area: l.area,
    instantBook: l.instantBook,
    rating: l.rating,
    reviewsCount: l.reviewsCount,
    createdAt: l.createdAt.toISOString(),
    ownerName: l.owner.name,
    imageUrl: l.images[0]?.url ?? "/assets/img/9ea4705013cf.jpg",
  }));

  return (
    <>
      {/* Page-local styles ported from the source page (not in globals.css) */}
      <style>{`
        .font-numeric-stat { font-family: "Plus Jakarta Sans", "Vazirmatn", ui-sans-serif, sans-serif; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <SiteHeader />
      <div className="flex-1 bg-m3-surface text-on-surface antialiased">
        <CategoriesApp listings={data} />
      </div>
      <SiteFooter />
    </>
  );
}
