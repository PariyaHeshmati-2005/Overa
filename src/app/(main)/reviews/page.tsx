import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import UserMenu from "@/components/layout/UserMenu";
import { faDateTime, faNumber, toPersianDigits } from "@/lib/format";
import ReviewsClient from "./ReviewsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "نظرات کاربران (پنل میزبان)" };

/**
 * reviews.html → /reviews (protected, host-oriented)
 * Reviews on the session user's own listings only; users without listings see
 * the source-style empty state with a CTA to /create-listing.
 */
export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/reviews"));

  const listings = await db.listing.findMany({
    where: { ownerId: user.id },
    select: {
      id: true,
      title: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const reviews = await db.review.findMany({
    where: { listing: { ownerId: user.id } },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      listing: { select: { id: true, title: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
      reservation: { select: { code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  /* Summary computed from real data (never hard-coded) */
  const count = reviews.length;
  const avg = count > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));
  const needsReply = reviews.filter((r) => !r.hostReply).length;

  return (
    <>
      {/* Header — faithful to reviews.html, session-aware */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/40 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            {/* Brand */}
            <Link className="flex items-center gap-3 group shrink-0" href="/">
              <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200">
                <img src="/assets/img/overa_logo_transparent.png" alt="logo" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">اٌوِرا</span>
                <span className="text-[11px] font-medium text-neutral-muted -mt-1">وسایل بهتر، زندگی سبک‌تر</span>
              </div>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-[520px] mx-2 hidden md:block">
              <form action="/categories" className="relative flex items-center">
                <input
                  name="q"
                  className="w-full bg-[#f6f2fc] border border-outline-variant/40 rounded-full py-2.5 pr-5 pl-14 text-xs font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-m3-primary focus:bg-white transition-all text-right"
                  placeholder="جستجو در بین هزاران وسیله..."
                  type="text"
                />
                <button
                  className="absolute left-1.5 size-8 bg-m3-primary hover:bg-primary-container text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
                  title="جستجو"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                </button>
              </form>
            </div>

            {/* User profile & icons — session-aware per guest-state rule */}
            <div className="flex flex-row-reverse items-center gap-2 sm:gap-3 shrink-0">
              {user ? (
                <UserMenu
                  user={{ name: user.name, avatarUrl: user.avatarUrl, isHost: user.isHost, isAdmin: user.isAdmin }}
                />
              ) : (
                <a
                  href="/signin-otp"
                  className="inline-flex items-center h-9 px-4 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm hover:bg-surface-tint transition-colors"
                >
                  ورود | ثبت‌نام
                </a>
              )}
              <div className="h-6 w-px bg-outline-variant/50 mx-1 hidden sm:block"></div>
              <div className="relative">
                <button
                  className="size-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:border-m3-primary/40 transition-colors"
                  title="به‌زودی"
                  disabled
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                </button>
              </div>
              <Link
                href="/live-chat"
                className="size-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:border-m3-primary/40 transition-colors"
                title="گفتگو و پیام‌ها"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
              </Link>
            </div>
          </div>

          {/* Bottom Tier: Nav + status */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2.5 pb-2 text-xs font-semibold overflow-x-auto">
            <nav className="flex items-center gap-4 sm:gap-8 shrink-0 text-on-surface/80">
              <Link href="/" className="text-m3-primary border-b-2 border-m3-primary py-1 font-bold shrink-0">خانه</Link>
              <Link href="/categories" className="text-on-surface-variant hover:text-m3-primary transition-colors py-1 shrink-0">دسته‌بندی‌ها</Link>
              <Link href="/categories" className="text-on-surface-variant hover:text-m3-primary transition-colors py-1 shrink-0">اجاره وسایل</Link>
              <Link href="/create-listing" className="text-on-surface-variant hover:text-m3-primary transition-colors py-1 shrink-0">ثبت وسیله</Link>
              <Link href="/how-it-works" className="text-on-surface-variant hover:text-m3-primary transition-colors py-1 shrink-0">چگونه کار می‌کند؟</Link>
              <Link href="/about" className="text-on-surface-variant hover:text-m3-primary transition-colors py-1 shrink-0">درباره ما</Link>
            </nav>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold shrink-0 mr-4">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>پشتیبانی آنلاین فعال</span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        {/* Breadcrumbs + Title */}
        <div className="pt-6 pb-2 mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3 font-medium">
            <Link href="/" className="hover:text-m3-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">home</span>
              <span>خانه</span>
            </Link>
            <span className="material-symbols-outlined text-xs text-outline-variant">chevron_left</span>
            <Link href="/account-settings" className="hover:text-m3-primary transition-colors">حساب کاربری</Link>
            <span className="material-symbols-outlined text-xs text-outline-variant">chevron_left</span>
            <span className="text-m3-primary font-bold">نظرات کاربران</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-on-surface tracking-tight">نظرات کاربران</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-m3-primary text-xs font-bold border border-m3-primary/20">
                پنل میزبان
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">مدیریت و تحلیل بازخوردها و پاسخگویی به مستاجران اورا</p>
          </div>
        </div>

        {listings.length === 0 ? (
          /* Source-style empty state for users without listings */
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-10 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="size-16 rounded-2xl bg-surface-container flex items-center justify-center text-m3-primary">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>award_star</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface">هنوز وسیله‌ای برای اجاره ثبت نکرده‌اید</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-md">
              این بخش، دیدگاه‌های مستاجران درباره وسیله‌های شما را نشان می‌دهد. با ثبت اولین وسیله و تکمیل اجاره،
              نظرات و امکان پاسخ‌گویی میزبان در همین صفحه فعال می‌شود.
            </p>
            <Link
              href="/create-listing"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-m3-primary text-on-primary text-xs font-bold shadow-md shadow-m3-primary/25 hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_business</span>
              ثبت وسیله و شروع درآمدزایی
            </Link>
          </section>
        ) : (
          <>
            {/* Summary header — computed from real reviews */}
            <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>award_star</span>
                  </div>
                  <div>
                    <h3 className="text-on-surface text-lg font-bold">خلاصه امتیازهای ثبت‌شده</h3>
                    <p className="text-on-surface-variant text-sm">
                      ارزیابی ثبت‌شده توسط مستاجران برای {faNumber(listings.length)} وسیله فعال شما
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <div className="text-2xl font-black text-on-surface">{toPersianDigits(avg.toFixed(1))}</div>
                    <div className="text-[11px] text-on-surface-variant">از ۵ ★</div>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <div className="text-2xl font-black text-on-surface">{faNumber(count)}</div>
                    <div className="text-[11px] text-on-surface-variant">دیدگاه ثبت‌شده</div>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-2xl font-black text-amber-700">{faNumber(needsReply)}</div>
                    <div className="text-[11px] text-amber-700">نیازمند پاسخ</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {distribution.map((d) => {
                  const pct = count > 0 ? Math.round((d.n / count) * 100) : 0;
                  return (
                    <div key={d.star} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-on-surface font-semibold text-sm">{toPersianDigits(d.star)} ستاره</span>
                        <span className="text-m3-primary font-bold text-base">
                          {faNumber(d.n)} <span className="text-xs text-on-surface-variant">نظر</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden mb-2">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-xs text-on-surface-variant">{faNumber(pct)}٪ از دیدگاه‌ها</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <ReviewsClient
              reviews={reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt.toISOString(),
                hostReply: r.hostReply,
                hostReplyAt: r.hostReplyAt ? faDateTime(r.hostReplyAt) : null,
                author: { id: r.author.id, name: r.author.name },
                listing: {
                  id: r.listing.id,
                  title: r.listing.title,
                  image: r.listing.images[0]?.url ?? null,
                },
                reservationCode: r.reservation?.code ?? null,
              }))}
              listings={listings.map((l) => ({ id: l.id, title: l.title }))}
            />
          </>
        )}
      </main>

      {/* Standard Host Platform Footer — faithful to reviews.html */}
      <footer className="border-t border-outline-variant/40 bg-surface-container-lowest mt-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-m3-primary text-white flex items-center justify-center font-black text-sm">O</div>
              <div>
                <p className="text-sm font-bold text-on-surface">سامانه هوشمند اشتراک‌گذاری و اجاره تجهیزات اٌوِرا</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  تمامی حقوق برای پلتفرم اورا و میزبانان تاییدشده محفوظ است © ۱۴۰۴
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant font-medium">
              <Link className="hover:text-m3-primary transition-colors flex items-center gap-1" href="/tos-support-faq">
                <span className="material-symbols-outlined text-sm">headset_mic</span>
                پشتیبانی ۲۴ ساعته میزبانان
              </Link>
              <Link className="hover:text-m3-primary transition-colors" href="/wallet">قوانین تضمین و ودیعه اورا</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/reviews">راهنمای پاسخ‌گویی به نظرات</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
