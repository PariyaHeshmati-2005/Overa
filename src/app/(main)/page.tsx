import Link from "next/link";
import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ListingCard from "@/components/overa/ListingCard";
import { toPersianDigits, faToman } from "@/lib/format";

export const dynamic = "force-dynamic";

const CITIES = ["همه شهرها", "تهران", "اصفهان", "شیراز", "مشهد", "کرج", "تبریز"];

export default async function HomePage() {
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ createdAt: "desc" }],
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { slug: true, name: true } },
      owner: { select: { name: true } },
    },
    take: 8,
  });
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const activeCount = await db.listing.count({ where: { status: "ACTIVE" } });

  return (
    <>
      <SiteHeader />
      <div className="flex-1">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* HeroBanner — preserved from source */}
        <section
          className="relative rounded-3xl overflow-hidden shadow-lg custom-gradient-banner min-h-[300px] flex items-center p-8 md:p-12 text-white mt-4 mx-4"
          aria-label="بنر اصلی"
        >
          <div className="relative z-10 max-w-2xl flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-100">
              <span>✨</span>
              <span className="">بزرگترین بستر تبادل و اجاره هوشمند در ایران</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black leading-snug tracking-tight">
              هر چیزی که نیاز داری،
              <br />
              فقط برای مدتی کوتاه!
            </h1>
            <p className="text-sm md:text-base text-purple-100/90 leading-relaxed max-w-xl font-normal">
              از وسایل سفر و تفریح گرفته تا ابزار کار، لوازم خانگی، تجهیزات
              عکاسی و ... همه‌چیز اینجاست.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/categories"
                className="px-7 py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-purple-900/40 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span className="">مشاهده همه دسته‌بندی‌ها</span>
                <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-purple-200/95 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                <span className="text-pink-300">♡</span>
                <span className="">اجاره کن به‌جای خرید</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10" aria-hidden="true">
            <span className="w-6 h-2 rounded-full bg-white transition-all"></span>
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
          </div>
        </section>

        {/* Two-column grid: filters + listings */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* FilterSidebar — preserved composition; rows navigate to /categories */}
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
              <Link href="/categories" className="text-xs text-neutral-muted hover:text-red-500 transition-colors font-medium">
                حذف همه فیلترها
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-neutral-text flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                دسته‌بندی
              </span>
              <div className="flex flex-col gap-1 text-xs font-medium">
                <Link
                  href="/categories"
                  className="flex items-center justify-between p-2 rounded-xl bg-primary-soft/70 text-primary font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="">همه دسته‌ها</span>
                  </div>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-primary">
                    {toPersianDigits(activeCount)}+
                  </span>
                </Link>
                {categories.map((c) => {
                  const count = listings.filter((l) => l.category.slug === c.slug).length;
                  return (
                    <Link
                      key={c.id}
                      href={`/categories?category=${c.slug}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300"></span>
                        <span className="">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-muted">
                        {toPersianDigits(count || c.sortOrder)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="h-px bg-purple-100/70"></div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-neutral-text">قیمت (تومان)</span>
              <div className="relative pt-2 pb-1" aria-hidden="true">
                <div className="h-2 bg-purple-100 rounded-full w-full relative">
                  <div className="absolute right-1/4 left-1/6 h-full bg-primary rounded-full"></div>
                  <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow cursor-pointer"></div>
                  <div className="absolute left-1/6 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow cursor-pointer"></div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <div className="bg-neutral-bg border border-purple-100 rounded-xl px-2.5 py-1.5 text-center flex-1">
                  <span className="text-[10px] text-neutral-muted block">از</span>
                  <span className="font-bold text-neutral-text">۵۰,۰۰۰</span>
                </div>
                <span className="text-neutral-muted font-bold">تا</span>
                <div className="bg-neutral-bg border border-purple-100 rounded-xl px-2.5 py-1.5 text-center flex-1">
                  <span className="text-[10px] text-neutral-muted block">تا</span>
                  <span className="font-bold text-neutral-text">۵,۰۰۰,۰۰۰</span>
                </div>
              </div>
            </div>
            <div className="h-px bg-purple-100/70"></div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-neutral-text" htmlFor="home-city">
                موقعیت مکانی
              </label>
              <div className="relative">
                <select
                  id="home-city"
                  className="w-full bg-neutral-bg border border-purple-100 text-xs rounded-xl py-2.5 pr-3 pl-8 text-neutral-text focus:border-primary focus:ring-0 appearance-none font-medium cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
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
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-neutral-text">امکانات ویژه</span>
              <div className="flex flex-col gap-2.5 text-xs">
                {["تحویل در محل", "بیمه وسایل", "امکان ارسال", "پشتیبانی ۲۴ ساعته"].map(
                  (label, i) => (
                    <label key={label} className="flex items-center justify-between cursor-pointer">
                      <span className={i === 1 ? "text-neutral-text font-medium" : "text-neutral-muted hover:text-neutral-text"}>
                        {label}
                      </span>
                      <input defaultChecked={i === 1} className="sr-only peer" type="checkbox" aria-label={label} />
                      <div className="w-9 h-5 bg-purple-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative"></div>
                    </label>
                  ),
                )}
              </div>
            </div>
            <Link
              href="/categories"
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm shadow-md shadow-primary/20 transition-all transform active:scale-98 mt-2 text-center"
            >
              اعمال فیلترها
            </Link>
          </aside>

          {/* Product grid */}
          <main className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6" aria-label="لیست وسایل">
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.157 2.128-1.572 3.652C7.755 9.877 7.002 12.025 7 14c.002.327.025.65.07.967a5.503 5.503 0 00-2.07-2.39 1 1 0 00-1.58.972C3.684 15.655 5.21 18 8.5 18c3.59 0 6.5-2.91 6.5-6.5 0-2.454-1.282-4.595-2.605-6.947zM10 16a3.5 3.5 0 01-3.486-3.218 5.48 5.48 0 001.37-2.083c.27-.674.52-1.393.754-2.138.33.68.73 1.34 1.18 1.968.742 1.037 1.682 2.35 1.682 3.471A3.5 3.5 0 0110 16z" fillRule="evenodd"></path>
                  </svg>
                </span>
                <h2 className="text-base font-bold text-neutral-text">محبوب‌ترین وسایل</h2>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/categories?sort=rating"
                  className="flex items-center gap-2 text-xs"
                  title="مرتب‌سازی بر اساس محبوبیت"
                >
                  <span className="text-neutral-muted">مرتب‌سازی:</span>
                  <span className="bg-neutral-bg border border-purple-100 rounded-xl py-1.5 px-4 text-xs text-neutral-text font-semibold">
                    محبوب‌ترین
                  </span>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((l) => (
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
                    imageUrl: l.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
                  }}
                />
              ))}
            </div>
            {listings.length === 0 && (
              <div className="bg-white rounded-3xl border border-purple-100 p-10 text-center text-sm text-neutral-muted">
                فعلاً وسیله‌ای برای نمایش نیست؛ اولین وسیله را{" "}
                <Link href="/create-listing" className="text-primary font-bold">
                  ثبت کنید
                </Link>
                .
              </div>
            )}
          </main>
        </div>

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

        {/* App download banner — preserved from source */}
        <section className="rounded-3xl bg-gradient-to-r from-[#220D4C] via-[#371978] to-[#1E0942] text-white p-8 md:p-10 relative overflow-hidden shadow-xl" aria-label="اپلیکیشن اورا">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col gap-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs w-max backdrop-blur-sm">
                <span className="">📱</span>
                <span className="">نسخه جدید iOS و اندروید</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black">اپلیکیشن اورا</h3>
              <p className="text-sm text-purple-200/90 font-light leading-relaxed">
                همیشه و همه‌جا در دسترس شما. اجاره سریع، ثبت آگهی آسان و گفتگوی
                مستقیم با مالکین در جیب شما.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <span className="flex items-center gap-3 bg-black/40 border border-white/15 px-4 py-2.5 rounded-2xl backdrop-blur-sm" title="به‌زودی">
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.05-.52 2.68-1.27z"></path>
                  </svg>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-purple-300">دریافت از</span>
                    <span className="text-xs font-bold">App Store</span>
                  </div>
                </span>
                <span className="flex items-center gap-3 bg-black/40 border border-white/15 px-4 py-2.5 rounded-2xl backdrop-blur-sm" title="به‌زودی">
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.793 12 3.61 22.186a1.996 1.996 0 0 1-.22-.924V2.738c0-.335.08-.65.219-.924zm11.243 11.245l2.257 2.257-12.016 6.94 9.759-9.197zm0-2.118L5.093 1.744l12.016 6.94-2.257 2.257zm1.464 1.464l3.188-1.84a1.5 1.5 0 0 0 0-2.59l-3.188-1.84-2.07 2.135 2.07 2.135z"></path>
                  </svg>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-purple-300">دریافت از</span>
                    <span className="text-xs font-bold">Google Play</span>
                  </div>
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-28 h-28 rounded-3xl bg-white/10 border border-white/15 flex flex-col items-center justify-center gap-1 backdrop-blur-sm" aria-hidden="true">
                <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                  <path d="M7 8h3M7 12h3M7 16h3M12 8h5M12 12h5M12 16h5" strokeLinecap="round"></path>
                </svg>
                <span className="text-[10px] text-purple-200">اسکن برای نصب</span>
              </div>
            </div>
          </div>
        </section>

        <p className="text-[11px] text-neutral-muted text-center pb-2">
          مجموعه‌ای از {toPersianDigits(activeCount)} وسیله فعال با قیمت‌های روز از{" "}
          {faToman(110_000)} تومان
        </p>
      </div>
      </div>
      <SiteFooter />
    </>
  );
}
