import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/layout/SiteHeader";
import M3Styles from "@/components/overa/M3Styles";
import AdminDashboardClient, {
  type AdminClaim,
  type AdminListing,
  type AdminCatalogListing,
  type AdminUser,
  type AuditEntry,
} from "./AdminDashboardClient";

export const metadata: Metadata = { title: "مرکز فرماندهی و نظارت اٌوِرا" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  /* -------- guest → sign in -------- */
  if (!user)
    redirect("/signin-otp?next=" + encodeURIComponent("/admin-dashboard"));

  /* -------- non-admin → access denied (no data rendered at all) -------- */
  if (!user.isAdmin) {
    return (
      <>
        <SiteHeader />
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-m3-background p-6">
          <M3Styles />
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-md p-8 max-w-md text-center flex flex-col items-center gap-4">
            <span className="size-14 rounded-2xl bg-m3-error-container text-m3-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">
                shield_lock
              </span>
            </span>
            <h1 className="text-lg font-extrabold text-on-surface">
              دسترسی فقط برای مدیران
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              این بخش (مرکز فرماندهی و نظارت اٌوِرا) تنها برای حساب‌های مدیر
              پلتفرم فعال است؛ هیچ داده‌ای برای سایر کاربران نمایش داده نمی‌شود.
            </p>
            <Link
              className="px-5 py-2.5 rounded-xl bg-m3-primary text-white text-xs font-bold hover:bg-primary-container transition-colors"
              href="/"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* -------- admin: query moderation queues server-side -------- */
  const [
    pendingListings,
    claims,
    users,
    auditLog,
    allListings,
    reservationCounts,
  ] = await Promise.all([
    db.listing.findMany({
      where: { status: "PENDING" },
      include: {
        owner: {
          select: { id: true, name: true, kycStatus: true, isHost: true },
        },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    db.damageClaim.findMany({
      where: {
        status: {
          in: ["OPEN", "COUNTER_EVIDENCE", "UNDER_REVIEW", "APPEALED"],
        },
      },
      include: {
        claimant: { select: { id: true, name: true } },
        against: { select: { id: true, name: true } },
        reservation: {
          select: {
            id: true,
            code: true,
            deposit: true,
            listing: { select: { title: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        kycStatus: true,
        isHost: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.auditLog.findMany({
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    // Full catalog for the products management section (all statuses).
    db.listing.findMany({
      include: {
        owner: {
          select: { id: true, name: true, kycStatus: true, isHost: true },
        },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    // Reservation counts per listing — drives the safe archive-vs-delete rule.
    db.reservation.groupBy({ by: ["listingId"], _count: { _all: true } }),
  ]);

  const reservationCountMap = new Map(
    reservationCounts.map((r) => [r.listingId, r._count._all]),
  );

  const listings: AdminListing[] = pendingListings.map((l) => ({
    id: l.id,
    title: l.title,
    category: l.category?.name ?? "—",
    dailyPrice: l.dailyPrice,
    deposit: l.deposit,
    city: l.city,
    imageUrl: l.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
    owner: {
      id: l.owner.id,
      name: l.owner.name,
      kycStatus: l.owner.kycStatus,
      isHost: l.owner.isHost,
    },
  }));

  const catalog: AdminCatalogListing[] = allListings.map((l) => ({
    id: l.id,
    title: l.title,
    category: l.category?.name ?? "—",
    dailyPrice: l.dailyPrice,
    city: l.city,
    status: l.status,
    rejectionReason: l.rejectionReason,
    isDemo: l.isDemo,
    createdAt: l.createdAt.toISOString(),
    reservationsCount: reservationCountMap.get(l.id) ?? 0,
    imageUrl: l.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
    owner: {
      id: l.owner.id,
      name: l.owner.name,
      kycStatus: l.owner.kycStatus,
      isHost: l.owner.isHost,
    },
  }));

  const claimDtos: AdminClaim[] = claims.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    decision: c.decision,
    appealMessage: c.appealMessage,
    evidenceUrls: (() => {
      try {
        const arr = JSON.parse(c.evidenceUrls || "[]");
        return Array.isArray(arr)
          ? arr.filter((x) => typeof x === "string").slice(0, 3)
          : [];
      } catch {
        return [];
      }
    })(),
    claimant: { id: c.claimant.id, name: c.claimant.name },
    against: { id: c.against.id, name: c.against.name },
    reservation: c.reservation
      ? {
          id: c.reservation.id,
          code: c.reservation.code,
          deposit: c.reservation.deposit,
          itemTitle: c.reservation.listing?.title ?? null,
        }
      : null,
  }));

  const userDtos: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    kycStatus: u.kycStatus,
    isHost: u.isHost,
    createdAt: u.createdAt.toISOString(),
  }));

  const auditDtos: AuditEntry[] = auditLog.map((a) => ({
    id: a.id,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    actorName: a.actor?.name ?? "سیستم",
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <>
      {/* Shared site header — identical to the homepage (slide-out menu) */}
      <SiteHeader />
      <AdminDashboardClient
        listings={listings}
        catalog={catalog}
        claims={claimDtos}
        users={userDtos}
        auditLog={auditDtos}
      />
    </>
  );
}
