import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { faDate } from "@/lib/format";
import HostSidebar from "../host-dashboard/HostSidebar";
import MyItemsClient, { type ApiListing, type MyItemsStats } from "./MyItemsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت وسایل و آگهی‌های من",
};

export default async function MyItemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/my-items"));

  const sidebar = <HostSidebar active="items" />;

  /* ------------------------- non-host onboarding state -------------------- */
  if (!user.isHost) {
    return (
      <div className="flex min-h-screen w-full bg-m3-background items-stretch">
        {sidebar}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col justify-center">
            <section className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center gap-4">
              <div className="size-16 rounded-2xl bg-primary-fixed/60 text-m3-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">storefront</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">
                هنوز وسیله‌ای ثبت نکرده‌اید
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-md">
                با ثبت اولین وسیله، حساب شما به‌صورت خودکار میزبان می‌شود و فهرست
                آگهی‌ها، پیش‌نویس‌ها و آمار آن‌ها در همین صفحه فعال خواهد شد.
              </p>
              <Link
                href="/create-listing"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="">ثبت اولین وسیله</span>
              </Link>
            </section>
          </main>
        </div>
      </div>
    );
  }

  /* ----------------------------- host statistics --------------------------- */
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [statusGroups, revenueAgg, reviewsAgg, rentedReservations, claimsAgainst, myListings] =
    await Promise.all([
      db.listing.groupBy({ by: ["status"], where: { ownerId: user.id }, _count: { _all: true } }),
      db.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          type: "RENTAL_PAYMENT",
          amount: { gt: 0 },
          createdAt: { gte: monthStart },
        },
      }),
      db.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: { listing: { ownerId: user.id } },
      }),
      db.reservation.findMany({
        where: { hostId: user.id, status: { in: ["PAID", "DELIVERED"] } },
        select: { id: true, listingId: true, endDate: true },
      }),
      db.damageClaim.count({ where: { againstId: user.id } }),
      db.listing.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { name: true, slug: true } },
          owner: { select: { name: true } },
        },
      }),
    ]);

  const countByStatus = (s: string) =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;

  const rentedMap: Record<string, { id: string; endDateLabel: string }> = {};
  for (const r of rentedReservations) {
    rentedMap[r.listingId] = { id: r.id, endDateLabel: faDate(r.endDate) };
  }

  const stats: MyItemsStats = {
    total: statusGroups.reduce((a, g) => a + g._count._all, 0),
    active: countByStatus("ACTIVE"),
    pending: countByStatus("PENDING"),
    draft: countByStatus("DRAFT"),
    paused: countByStatus("PAUSED"),
    rejected: countByStatus("REJECTED"),
    archived: countByStatus("ARCHIVED"),
    rented: rentedReservations.length,
    revenueMonth: revenueAgg._sum.amount ?? 0,
    avgRating: reviewsAgg._avg.rating,
    reviewsCount: reviewsAgg._count._all,
    claimsAgainst,
  };

  const initialListings: ApiListing[] = myListings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    brand: l.brand,
    specs: l.specs,
    dailyPrice: l.dailyPrice,
    weeklyPrice: l.weeklyPrice,
    deposit: l.deposit,
    city: l.city,
    area: l.area,
    status: l.status,
    rejectionReason: l.rejectionReason,
    rating: l.rating,
    reviewsCount: l.reviewsCount,
    instantBook: l.instantBook,
    pickupInPerson: l.pickupInPerson,
    deliveryCourier: l.deliveryCourier,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    images: l.images.map((i) => ({ url: i.url })),
    category: { name: l.category.name, slug: l.category.slug },
    owner: { name: l.owner.name },
  }));

  return (
    <MyItemsClient
      user={{
        name: user.name,
        avatarUrl: user.avatarUrl,
        isHost: user.isHost,
        isAdmin: user.isAdmin,
      }}
      stats={stats}
      rentedMap={rentedMap}
      initialListings={initialListings}
    />
  );
}
