import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import M3Styles from "@/components/overa/M3Styles";
import SiteHeader from "@/components/layout/SiteHeader";
import ArbitrationPanelClient, {
  type PanelClaim,
} from "./ArbitrationPanelClient";

export const metadata: Metadata = { title: "پنل داوری و مدیریت خسارت" };
export const dynamic = "force-dynamic";

export default async function ArbitrationPanelPage() {
  const user = await getCurrentUser();
  if (!user)
    redirect("/signin-otp?next=" + encodeURIComponent("/arbitration-panel"));

  /* non-admin → access denied (no data rendered) */
  if (!user.isAdmin) {
    return (
      <>
        <SiteHeader />
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-m3-background p-6">
          <M3Styles />
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-md p-8 max-w-md text-center flex flex-col items-center gap-4">
            <span className="size-14 rounded-2xl bg-m3-error-container text-m3-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">
                gavel
              </span>
            </span>
            <h1 className="text-lg font-extrabold text-on-surface">
              دسترسی فقط برای مدیران
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              پنل داوری ودیعه تنها برای کارشناسان اٌوِرا فعال است؛ هیچ داده‌ای
              از پرونده‌ها برای سایر کاربران نمایش داده نمی‌شود.
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

  const claims = await db.damageClaim.findMany({
    include: {
      claimant: { select: { id: true, name: true, kycStatus: true } },
      against: { select: { id: true, name: true, kycStatus: true } },
      reservation: {
        select: {
          id: true,
          code: true,
          deposit: true,
          paymentMethod: true,
          status: true,
          renterId: true,
          hostId: true,
          deliveryStatus: true,
          deliveryNote: true,
          listing: {
            select: {
              title: true,
              images: { take: 1, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  /* All claims of the SAME reservation (the renter's delivery-stage
     declaration + the host's return-stage declaration) — the arbitrator must
     be able to read BOTH descriptions in one file before issuing the verdict. */
  const byReservation = new Map<string, typeof claims>();
  for (const c of claims) {
    const list = byReservation.get(c.reservationId) ?? [];
    list.push(c);
    byReservation.set(c.reservationId, list);
  }

  const dto: PanelClaim[] = claims.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    stage: c.stage,
    decision: c.decision,
    decidedAt: c.decidedAt ? c.decidedAt.toISOString() : null,
    appealMessage: c.appealMessage,
    settlementNote: c.settlementNote,
    evidenceUrls: (() => {
      try {
        const arr = JSON.parse(c.evidenceUrls || "[]");
        return Array.isArray(arr)
          ? arr.filter((x) => typeof x === "string").slice(0, 2)
          : [];
      } catch {
        return [];
      }
    })(),
    claimant: {
      id: c.claimant.id,
      name: c.claimant.name,
      kycStatus: c.claimant.kycStatus,
    },
    // Whether the CLAIMANT of this file is the renter or the host — drives
    // the «توضیح خسارت مستأجر / میزبان» reading block in the panel.
    claimantRole: c.reservation
      ? c.claimantId === c.reservation.renterId
        ? "renter"
        : "host"
      : "renter",
    against: {
      id: c.against.id,
      name: c.against.name,
      kycStatus: c.against.kycStatus,
    },
    counterparts: (byReservation.get(c.reservationId) ?? [])
      .filter((x) => x.id !== c.id)
      .map((x) => ({
        id: x.id,
        title: x.title,
        description: x.description,
        stage: x.stage,
        status: x.status,
        claimantName: x.claimant.name,
        claimantRole:
          c.reservation && x.claimantId === c.reservation.renterId
            ? "renter"
            : "host",
        createdAt: x.createdAt.toISOString(),
      })),
    reservation: c.reservation
      ? {
          id: c.reservation.id,
          code: c.reservation.code,
          deposit: c.reservation.deposit,
          paymentMethod: c.reservation.paymentMethod,
          status: c.reservation.status,
          deliveryStatus: c.reservation.deliveryStatus,
          deliveryNote: c.reservation.deliveryNote,
          itemTitle: c.reservation.listing?.title ?? null,
          imageUrl: c.reservation.listing?.images?.[0]?.url ?? null,
        }
      : null,
  }));

  return (
    <>
      <SiteHeader />
      <M3Styles />
      <ArbitrationPanelClient claims={dto} />
    </>
  );
}
