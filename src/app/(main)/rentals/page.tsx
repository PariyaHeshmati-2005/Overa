import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import UserMenu from "@/components/layout/UserMenu";
import RentalsClient from "./RentalsClient";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "@/lib/rental-state";

export const dynamic = "force-dynamic";

export const metadata = { title: "مدیریت اجاره‌های من" };

/**
 * rentals.html → /rentals (protected)
 * The source header renders a signed-in user chip; per the guest-state rule
 * that position shows <UserMenu/> for the session user, or the source-style
 * «ورود | ثبت‌نام» button for guests.
 */
export default async function RentalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/rentals"));

  const unreadNotifications = await db.notification.count({
    where: { userId: user.id, read: false },
  });

  /* Server-rendered initial data (same shape as GET /api/reservations) so the
     page paints real content immediately; the client still refreshes through
     the API. */
  const reservations = await db.reservation.findMany({
    where: { OR: [{ renterId: user.id }, { hostId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
      renter: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  const initialReservations = reservations.map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    days: r.days,
    dailyPrice: r.dailyPrice,
    subtotal: r.subtotal,
    deposit: r.deposit,
    total: r.total,
    pickupMethod: r.pickupMethod,
    renterNote: r.renterNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    listing: {
      id: r.listing.id,
      title: r.listing.title,
      city: r.listing.city,
      area: r.listing.area,
      images: r.listing.images.map((i) => ({ url: i.url, alt: i.alt })),
    },
    renter: { id: r.renter.id, name: r.renter.name },
    host: { id: r.host.id, name: r.host.name },
    events: r.events.map((e) => ({
      id: e.id,
      actor: e.actor,
      type: e.type,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      {/* Header — faithful to rentals.html top-header, session-aware */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 sm:gap-6">
            {/* Brand Logo & Slogan */}
            <Link
              className="flex items-center gap-3 group shrink-0"
              href="/"
            >
              <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200">
                <img src="/assets/img/overa_logo_transparent.png" alt="logo" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">
                  اٌوِرا
                </span>
                <span className="text-[11px] font-medium text-neutral-muted -mt-1">
                  وسایل بهتر، زندگی سبک‌تر
                </span>
              </div>
            </Link>
            {/* Big Search Bar (GET form — real navigation to /categories?q=) */}
            <div className="flex-1 max-w-xl mx-2 hidden md:block">
              <form action="/categories" className="relative flex items-center">
                <input
                  className="w-full h-12 pr-5 pl-14 text-sm bg-surface-container-low border border-purple-100 rounded-full focus:bg-white focus:border-m3-primary focus:ring-4 focus:ring-m3-primary/10 transition-all text-on-surface placeholder:text-[#694d99]/70"
                  placeholder="جستجو در بین هزاران وسیله..."
                  type="text"
                  name="q"
                />
                <button
                  aria-label="جستجو"
                  className="absolute left-1.5 w-9 h-9 rounded-full bg-m3-primary hover:bg-surface-tint text-white flex items-center justify-center shadow-sm transition-colors duration-150"
                  type="submit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                  </svg>
                </button>
              </form>
            </div>
            {/* User Profile & Action Icons — session-aware per guest-state rule */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/live-chat"
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
                title="گفت‌وگوها"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </Link>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
                disabled
                title="به‌زودی"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
              <div className="relative">
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
                  disabled
                  title="به‌زودی"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {new Intl.NumberFormat("fa-IR").format(unreadNotifications)}
                    </span>
                  )}
                </button>
              </div>
              <div className="h-6 w-px bg-purple-200/80 mx-1"></div>
              {user ? (
                <UserMenu
                  user={{
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    isHost: user.isHost,
                    isAdmin: user.isAdmin,
                  }}
                />
              ) : (
                <a
                  href="/signin-otp?next=%2Frentals"
                  className="inline-flex items-center h-10 px-5 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm hover:bg-surface-tint transition-colors"
                >
                  ورود | ثبت‌نام
                </a>
              )}
            </div>
          </div>
          {/* Bottom Level Row: Navigation Links */}
          <nav className="flex items-center gap-4 sm:gap-8 text-sm font-medium border-t border-purple-100/60 pt-2.5 text-on-surface-variant overflow-x-auto">
            <Link className="hover:text-m3-primary transition-colors shrink-0" href="/">خانه</Link>
            <Link className="hover:text-m3-primary transition-colors shrink-0" href="/categories">دسته‌بندی‌ها</Link>
            <Link className="hover:text-m3-primary transition-colors shrink-0" href="/categories">اجاره وسایل</Link>
            <Link className="hover:text-m3-primary transition-colors shrink-0" href="/create-listing">ثبت وسیله</Link>
            <Link className="hover:text-m3-primary transition-colors shrink-0" href="/how-it-works">چگونه کار می‌کند؟</Link>
            <Link className="hover:text-m3-primary transition-colors shrink-0" href="/about">درباره ما</Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav
        aria-label="مسیریابی"
        className="flex items-center gap-2 text-sm text-m3-outline pt-4 mb-4 mt-3 mr-3 sm:mr-6"
      >
        <Link className="hover:text-m3-primary transition-colors flex items-center gap-1" href="/">
          <span className="material-symbols-outlined text-[18px]">home</span>
          <span>خانه</span>
        </Link>
        <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_left</span>
        <Link className="hover:text-m3-primary transition-colors" href="/account-settings">حساب کاربری</Link>
        <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_left</span>
        <span className="text-on-surface font-bold">اجاره ها</span>
      </nav>

      <RentalsClient
        user={{
          id: user.id,
          name: user.name,
          kycStatus: user.kycStatus,
          isHost: user.isHost,
        }}
        initialReservations={initialReservations}
        statusLabels={RESERVATION_STATUS_LABELS}
        statusColors={RESERVATION_STATUS_COLORS}
      />

      {/* Lightweight footer — faithful to rentals.html */}
      <footer className="mt-16 border-t border-outline-variant/50 bg-surface-container-lowest py-8 text-center text-xs text-on-surface-variant">
        <div className="max-w-[1240px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">اٌوِرا</span>
            <span>— سامانه هوشمند کرایه و اشتراک تجهیزات در سراسر کشور</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">قوانین بیمه و ضمانت</Link>
            <Link className="hover:text-m3-primary transition-colors" href="/wallet">شرایط بازگشت ودیعه</Link>
            <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">مرکز تماس و پشتیبانی</Link>
          </div>
          <div>
            <span>تمامی حقوق محفوظ است © ۱۴۰۳</span>
          </div>
        </div>
      </footer>
    </>
  );
}
