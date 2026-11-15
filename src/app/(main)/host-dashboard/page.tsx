import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import {
  RESERVATION_STATUS_COLORS,
  RESERVATION_STATUS_LABELS,
  canAct,
  type ReservationStatus,
} from "@/lib/rental-state";
import { faDate, faNumber, faToman } from "@/lib/format";
import HostSidebar from "./HostSidebar";
import ReservationsCard, { type ReservationRow } from "./ReservationsCard";
import RevenueChart, { type ChartBucket, type ChartRanges } from "./RevenueChart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پیشخوان مدیریت میزبان",
};

type ChartRow = { createdAt: Date; subtotal: number };

/** Bucket real reservations into equal periods for the revenue chart. */
function buildBuckets(days: number, parts: number, rows: ChartRow[]): ChartBucket[] {
  const now = Date.now();
  const size = (days * 86400000) / parts;
  const buckets: ChartBucket[] = [];
  for (let i = parts - 1; i >= 0; i--) {
    const startMs = now - (i + 1) * size;
    const endMs = now - i * size;
    const inRange = rows.filter(
      (r) => r.createdAt.getTime() >= startMs && r.createdAt.getTime() < endMs,
    );
    buckets.push({
      label: faDate(new Date(startMs)),
      count: inRange.length,
      revenue: inRange.reduce((a, r) => a + r.subtotal, 0),
    });
  }
  return buckets;
}

export default async function HostDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/host-dashboard"));

  /* ------------------------------ data queries ---------------------------- */
  const statusGroups = await db.listing.groupBy({
    by: ["status"],
    where: { ownerId: user.id },
    _count: { _all: true },
  });
  const countByStatus = (s: string) =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;
  const activeListings = countByStatus("ACTIVE");
  const pendingListings = countByStatus("PENDING");

  const [requestedCount, activeRentals, completedCount, revenueAgg, paymentsCount, reviewsAgg] =
    await Promise.all([
      db.reservation.count({ where: { hostId: user.id, status: "REQUESTED" } }),
      db.reservation.count({ where: { hostId: user.id, status: { in: ["PAID", "DELIVERED"] } } }),
      db.reservation.count({ where: { hostId: user.id, status: "COMPLETED" } }),
      db.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: "RENTAL_PAYMENT", amount: { gt: 0 } },
      }),
      db.walletTransaction.count({
        where: { userId: user.id, type: "RENTAL_PAYMENT", amount: { gt: 0 } },
      }),
      db.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: { listing: { ownerId: user.id } },
      }),
      db.notification.count({ where: { userId: user.id, read: false } }),
    ]);

  const revenue = revenueAgg._sum.amount ?? 0;
  const avgRating = reviewsAgg._avg.rating;
  const reviewsCount = reviewsAgg._count._all;

  const [recentReservations, pendingListingsList, recentReviews, ratingGroups, chartRows] =
    await Promise.all([
      db.reservation.findMany({
        where: { hostId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          listing: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          renter: { select: { name: true } },
        },
      }),
      pendingListings > 0
        ? db.listing.findMany({
            where: { ownerId: user.id, status: "PENDING" },
            orderBy: { createdAt: "desc" },
            select: { id: true, title: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          })
        : Promise.resolve([]),
      db.review.findMany({
        where: { listing: { ownerId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 2,
        include: { author: { select: { name: true, avatarUrl: true } } },
      }),
      db.review.groupBy({
        by: ["rating"],
        where: { listing: { ownerId: user.id } },
        _count: { _all: true },
      }),
      db.reservation.findMany({
        where: { hostId: user.id, createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
        select: { createdAt: true, subtotal: true },
      }),
    ]);

  const ranges: ChartRanges = {
    "7d": buildBuckets(7, 7, chartRows),
    "30d": buildBuckets(30, 6, chartRows),
    "90d": buildBuckets(90, 6, chartRows),
  };

  const reservationRows: ReservationRow[] = recentReservations.map((r) => {
    const status = r.status as ReservationStatus;
    const actions: ("approve" | "reject" | "deliver")[] = [];
    if (canAct(status, "approve", "host")) actions.push("approve", "reject");
    else if (canAct(status, "deliver", "host")) actions.push("deliver");
    return {
      id: r.id,
      code: r.code,
      status: r.status,
      statusLabel: RESERVATION_STATUS_LABELS[status] ?? r.status,
      statusColor: RESERVATION_STATUS_COLORS[status] ?? "bg-neutral-muted/15 text-neutral-muted",
      createdAtLabel: faDate(r.createdAt),
      subtotal: r.subtotal,
      listingTitle: r.listing.title,
      listingImage: r.listing.images[0]?.url ?? null,
      renterName: r.renter.name,
      allowedActions: actions,
    };
  });

  const maxBreakdown = Math.max(1, ...ratingGroups.map((g) => g._count._all));
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratingGroups.find((g) => g.rating === star)?._count._all ?? 0,
  }));

  const kycVerified = user.kycStatus === "VERIFIED";


  const kycCard = (
    <div
      className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between"
      data-purpose="kyc-status-card"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                kycVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                ></path>
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-base">احراز هویت</h3>
          </div>
          {kycVerified ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                ></path>
              </svg>
              تأیید شده
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200/60 px-2.5 py-0.5 rounded-full text-xs font-medium">
              در انتظار تایید
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          {kycVerified
            ? "هویت شما با موفقیت تأیید شده است."
            : "برای دریافت درخواست‌های اجاره، احراز هویت را تکمیل کنید."}
        </p>
        <div className="space-y-2.5 text-xs text-slate-600">
          {["کارت ملی", "شماره موبایل", "آدرس و مدارک محل سکونت"].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                {item}
              </span>
              {kycVerified ? (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></path>
                </svg>
              ) : (
                <span className="size-2 rounded-full bg-amber-400"></span>
              )}
            </div>
          ))}
        </div>
      </div>
      <Link
        className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-purple-600 transition"
        href="/account-settings"
      >
        <span className="">مشاهده جزئیات احراز هویت</span>
        <svg className="w-4 h-4 text-slate-400 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M9 5l7 7-7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
        </svg>
      </Link>
    </div>
  );

  const welcomeBanner = (
    <div
      className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-gradient-to-l from-purple-100/60 via-purple-50 to-white border border-purple-100 shadow-sm p-6 sm:p-7 flex flex-col justify-center"
      data-purpose="welcome-banner"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        { }
        <img
          alt="تجهیزات سفر و کمپینگ اورا"
          className="h-full w-full object-cover object-center"
          src="/assets/img/e64ceb2ed1fb.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-purple-100/90 via-purple-50/80 to-white/60"></div>
      </div>
      <div className="relative z-10 max-w-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-base text-purple-600">👑</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
            سلام {user.name}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
          خوش آمدید! اینجا می‌توانید وضعیت وسایل، اجاره‌ها، درآمد و نظرات کاربران
          رو مشاهده و مدیریت کنید.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 bg-white/80 border border-purple-100 text-[11px] font-bold text-purple-700 px-3 py-1 rounded-full shadow-xs">
            {faNumber(activeListings)} وسیله فعال
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/80 border border-amber-200 text-[11px] font-bold text-amber-600 px-3 py-1 rounded-full shadow-xs">
            {faNumber(pendingListings)} در انتظار تایید کارشناس
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/80 border border-emerald-200 text-[11px] font-bold text-emerald-600 px-3 py-1 rounded-full shadow-xs">
            {faNumber(requestedCount)} درخواست جدید
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/80 border border-slate-200 text-[11px] font-bold text-slate-600 px-3 py-1 rounded-full shadow-xs">
            {faNumber(completedCount)} اجاره تکمیل‌شده
          </span>
        </div>
        <div>
          <Link
            className="inline-flex items-center gap-2 bg-[#6d28d9] hover:bg-purple-700 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md shadow-purple-600/20 transition duration-150"
            href="/my-items"
          >
            <span className="">مشاهده وسایل من</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );

  const footer = (
    <footer
      className="pt-6 pb-2 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60"
      data-purpose="site-footer"
    >
      <p className="">© ۲۰۲۵ RentMo. تمامی حقوق محفوظ است.</p>
      <p className="mt-1 sm:mt-0">اجاره وسایل، فرصت‌های جدید، درآمد پایدار</p>
    </footer>
  );

  /* --------------------------- non-host onboarding ------------------------- */
  if (!user.isHost) {
    return (
      <div className="bg-[#f8fafc] text-slate-800 antialiased min-h-screen">
        <div className="min-h-screen flex flex-row">
          <HostSidebar active="dashboard" />
          <main className="flex-1 flex flex-col min-w-0 pb-12">
            <SiteHeader />
            <div className="px-6 sm:px-8 pt-6 space-y-6 max-w-7xl mx-auto w-full">
              <section
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                data-purpose="hero-top-row"
              >
                {kycCard}
                {welcomeBanner}
              </section>

              <section
                className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4"
                data-purpose="host-onboarding"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">storefront</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                  پنل میزبانی شما خالی است
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">
                  هنوز وسیله‌ای برای اجاره ثبت نکرده‌اید. اولین وسیله‌تان را ثبت کنید
                  تا پیشخوان مدیریت، آمار درآمد و درخواست‌های اجاره همین‌جا فعال شود.
                </p>
                <Link
                  href="/create-listing"
                  className="inline-flex items-center gap-2 bg-[#6d28d9] hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md shadow-purple-600/20 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="">ثبت اولین وسیله</span>
                </Link>
                <p className="text-[11px] text-slate-400">
                  با ثبت اولین وسیله، حساب شما به‌صورت خودکار میزبان می‌شود.
                </p>
              </section>

              {footer}
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ------------------------------ host dashboard --------------------------- */
  return (
    <div className="bg-[#f8fafc] text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900">
      <div className="min-h-screen flex flex-row">
        <HostSidebar active="dashboard" />
        <main className="flex-1 flex flex-col min-w-0 pb-12">
          <SiteHeader />
          <div className="px-6 sm:px-8 pt-6 space-y-6 max-w-7xl mx-auto w-full">
            {/* HeroTopRow */}
            <section
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              data-purpose="hero-top-row"
            >
              {kycCard}
              {welcomeBanner}
            </section>

            {/* KpiMetricsRow — real aggregates */}
            <section
              className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5"
              data-purpose="kpi-metrics-cards"
            >
              <div
                className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between"
                data-purpose="kpi-income"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">درآمد کل</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      {faToman(revenue)}
                    </span>
                    <span className="text-xs text-slate-500">تومان</span>
                  </div>
                  <div className="flex items-center text-[11px] text-emerald-600 font-semibold gap-1">
                    <span className="material-symbols-outlined text-sm">payments</span>
                    <span className="text-slate-400 font-normal">
                      {faNumber(paymentsCount)} پرداخت اجاره — شبیه‌سازی
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between"
                data-purpose="kpi-rentals"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">تعداد اجاره‌ها</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      {faNumber(activeRentals + completedCount)}
                    </span>
                  </div>
                  <div className="flex items-center text-[11px] gap-1">
                    <span className="text-emerald-600 font-semibold">
                      {faNumber(activeRentals)} در حال انجام
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-amber-600 font-semibold">
                      {faNumber(requestedCount)} درخواست جدید
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between"
                data-purpose="kpi-score"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">میانگین امتیاز</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <svg className="w-5 h-5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      {avgRating != null ? faNumber(Math.round(avgRating * 10) / 10) : "—"}
                    </span>
                    <span className="text-xs text-slate-400">از ۵</span>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${avgRating ? "text-amber-400" : "text-slate-300"}`}>
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between"
                data-purpose="kpi-reviews"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">تعداد نظرات</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      {faNumber(reviewsCount)}
                    </span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 gap-1">
                    <span className="material-symbols-outlined text-sm text-amber-400">star</span>
                    <span className="font-normal">
                      میانگین {avgRating != null ? faNumber(Math.round(avgRating * 10) / 10) : "—"} از ۵
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Pending moderation note */}
            {pendingListingsList.length > 0 && (
              <section
                className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                data-purpose="pending-moderation-note"
              >
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-800">
                      آگهی‌های در انتظار تایید کارشناس
                    </h3>
                    <p className="text-xs text-amber-700/90 leading-relaxed mt-1">
                      تا زمان تایید کارشناس، این آگهی‌ها برای عموم کاربران نمایش داده
                      نمی‌شوند و امکان تایید خودکار وجود ندارد.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {pendingListingsList.map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1 bg-white border border-amber-200 text-[11px] font-semibold text-amber-700 px-2.5 py-1 rounded-full"
                        >
                          <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                          {l.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  href="/my-items"
                  className="shrink-0 inline-flex items-center gap-2 bg-amber-500/90 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  مدیریت وسایل
                </Link>
              </section>
            )}

            {/* MiddleRow */}
            <section
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              data-purpose="middle-stats-and-promo"
            >
              <div
                className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#21093f] via-[#1c0836] to-[#120424] text-white p-6 relative overflow-hidden flex flex-col justify-between shadow-md"
                data-purpose="guarantee-promo-card"
              >
                <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-purple-600/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="mb-5 flex justify-center">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-2xl rotate-6"></div>
                      <div className="w-24 h-24 bg-gradient-to-tr from-purple-200 to-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-3 relative">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mb-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.2"
                            ></path>
                          </svg>
                        </div>
                        <div className="w-12 h-1.5 bg-purple-200 rounded-full mb-1"></div>
                        <div className="w-8 h-1.5 bg-purple-100 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-center text-white mb-2">
                    با خیال راحت اجاره بده!
                  </h2>
                  <p className="text-xs text-purple-200/80 text-center leading-relaxed">
                    با ضمانت‌نامه معتبر، امنیت اجاره وسیله شما تضمین می‌شود.
                  </p>
                </div>
                <div className="mt-6 relative z-10">
                  <Link
                    href="/create-listing"
                    className="block w-full py-2.5 px-4 bg-purple-800/60 hover:bg-purple-700/80 border border-purple-500/40 rounded-xl text-xs sm:text-sm font-medium transition text-center text-white backdrop-blur-xs"
                  >
                    ثبت وسایل
                  </Link>
                </div>
              </div>

              <RevenueChart ranges={ranges} />
            </section>

            {/* BottomRow */}
            <section
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              data-purpose="recent-rentals-and-reviews"
            >
              <ReservationsCard reservations={reservationRows} />

              <div
                className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
                data-purpose="user-reviews-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                      href="/reviews"
                    >
                      مشاهده همه
                    </Link>
                    <h2 className="text-base font-bold text-slate-800">نظرات کاربران</h2>
                  </div>

                  <div className="grid grid-cols-12 gap-4 pb-5 border-b border-slate-100 items-center">
                    <div className="col-span-8 space-y-1.5 text-xs text-slate-500">
                      {breakdown.map((b) => (
                        <div key={b.star} className="flex items-center gap-2">
                          <span className="w-4 text-[10px] text-slate-400 text-left">
                            {faNumber(b.count)}
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`bg-purple-600 h-full rounded-full`}
                              style={{ width: `${Math.round((b.count / maxBreakdown) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-slate-600 text-right">
                            {faNumber(b.star)} ستاره
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="col-span-4 text-center border-r border-slate-100 pr-3">
                      <div className="text-3xl font-black text-slate-800 leading-tight">
                        {avgRating != null ? faNumber(Math.round(avgRating * 10) / 10) : "—"}
                      </div>
                      <div className={`text-sm my-0.5 ${avgRating ? "text-amber-400" : "text-slate-300"}`}>
                        ★★★★★
                      </div>
                      <div className="text-xs text-slate-400">از ۵</div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    {recentReviews.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">
                        هنوز نظری برای وسایل شما ثبت نشده است.
                      </p>
                    )}
                    {recentReviews.map((rv) => (
                      <div key={rv.id} className="flex items-start gap-3">
                        {rv.author.avatarUrl ? (
                           
                          <img
                            alt={rv.author.name}
                            className="w-9 h-9 rounded-full object-cover"
                            src={rv.author.avatarUrl}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {rv.author.name?.trim()?.[0] ?? "ک"}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-xs text-slate-800">{rv.author.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{faDate(rv.createdAt)}</span>
                              <div className="text-amber-400 text-xs">
                                {"★".repeat(rv.rating)}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{rv.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {footer}
          </div>
        </main>
      </div>
    </div>
  );
}
