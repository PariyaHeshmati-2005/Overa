import Link from "next/link";
import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import HeroCarousel from "@/components/home/HeroCarousel";
import AppPromoCard from "@/components/pwa/AppPromoCard";
import { installQrSvg } from "@/lib/qr";
import HomeExplore, {
  type HomeListing,
  type HomeCategory,
} from "@/components/home/HomeExplore";
import { toPersianDigits, faToman } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Real, locally-generated QR code pointing at the live /install URL.
  const qrSvg = await installQrSvg();

  // All active listings are passed to the client-side live filter.
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ createdAt: "desc" }],
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { slug: true, name: true } },
      owner: { select: { name: true } },
    },
    take: 60,
  });
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const activeCount = await db.listing.count({ where: { status: "ACTIVE" } });

  const homeListings: HomeListing[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    city: l.city,
    area: l.area,
    dailyPrice: l.dailyPrice,
    rating: l.rating,
    reviewsCount: l.reviewsCount,
    instantBook: l.instantBook,
    deliveryCourier: l.deliveryCourier,
    pickupInPerson: l.pickupInPerson,
    categorySlug: l.category.slug,
    createdAt: l.createdAt.toISOString(),
    imageUrl: l.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
  }));

  const homeCategories: HomeCategory[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    sortOrder: c.sortOrder,
  }));

  return (
    <>
      <SiteHeader />
      {/* Horizontal rhythm shared with the sticky header — products, banners
          and photographs no longer touch the viewport edges on phones or
          wide desktops (was flush edge-to-edge before). */}
      <main className="flex-1 w-full">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-2 pb-6 flex flex-col gap-6">
        {/* Hero carousel — real 4-slide banner (digital / camping / home /
            tools), autoplay + loop + swipe, no arrows. Replaces the former
            decorative hero while keeping its visual identity. */}
        <HeroCarousel />

        {/* Filters + listings — fully functional live filtering (Jalali calendar elsewhere) */}
        <HomeExplore listings={homeListings} categories={homeCategories} />

        {/* Trust badges strip — preserved from source */}
        <section className="bg-white rounded-3xl border border-purple-100 shadow-card p-6" aria-label="مزایای اورا">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-purple-100/70 text-center">
            {[
              { title: "بررسی و تایید کاربران", sub: "برای اطمینان بیشتر", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              { title: "تحویل در محل", sub: "در صورت نیاز", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" },
              { title: "پشتیبانی ۲۴ ساعته", sub: "همیشه در کنار شما", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
              { title: "بیمه کامل وسایل", sub: "در زمان اجاره", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { title: "پرداخت امن", sub: "با درگاه‌های معتبر", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-2 px-2 pt-3 md:pt-0">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={f.icon} strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <h4 className="text-xs font-bold text-neutral-text">{f.title}</h4>
                <p className="text-[11px] text-neutral-muted">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App download banner — real PWA install card + scannable QR.
            Replaces the decorative placeholder QR and the fake “به‌زودی”
            store chips with the working install flow (task requirement). */}
        <section className="rounded-3xl bg-gradient-to-r from-[#220D4C] via-[#371978] to-[#1E0942] text-white p-8 md:p-10 relative overflow-hidden shadow-xl" aria-label="اپلیکیشن اورا">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col gap-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs w-max backdrop-blur-sm">
                <span className="">📱</span>
                <span className="">نسخه وب‌اپ — همین حالا قابل نصب</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black">اپلیکیشن اورا</h3>
              <p className="text-sm text-purple-200/90 font-light leading-relaxed">
                همیشه و همه‌جا در دسترس شما. اجاره سریع، ثبت آگهی آسان و گفتگوی
                مستقیم با مالکین در جیب شما — بدون نیاز به فروشگاه‌های اپلیکیشن.
              </p>
            </div>
            <AppPromoCard
              qr={
                <span
                  className="block w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  aria-label="کد QR نصب اپلیکیشن اورا"
                  role="img"
                />
              }
            />
          </div>
        </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
