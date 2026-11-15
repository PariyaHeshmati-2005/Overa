import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import RentalsClient from "./RentalsClient";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "@/lib/rental-state";

export const dynamic = "force-dynamic";

export const metadata = { title: "مدیریت اجاره‌های من" };

/**
 * rentals.html → /rentals (protected)
 * Uses the shared site header (homepage header with the right slide-out
 * menu); per the guest-state rule the page itself redirects guests to login.
 */
export default async function RentalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/rentals"));

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
      {/* Shared site header — identical to the homepage (slide-out menu,
          live DB search, session-aware user area) */}
      <SiteHeader />

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
