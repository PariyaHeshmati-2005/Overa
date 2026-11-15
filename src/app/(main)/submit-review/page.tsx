import SiteHeader from "@/components/layout/SiteHeader";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
} from "@/lib/rental-state";
import { faDate, faToman, toPersianDigits } from "@/lib/format";
import SubmitReviewForm from "./SubmitReviewForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ثبت دیدگاه اجاره",
};

const listingInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  owner: { select: { name: true } },
};

/** White info-state card in the source's style (success screen geometry). */
function InfoState({
  icon,
  title,
  text,
  children,
}: {
  icon: "info" | "check" | "lock" | "hourglass";
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  const iconClass =
    icon === "check"
      ? "bg-emerald-100 text-emerald-600"
      : icon === "lock"
        ? "bg-rose-100 text-rose-600"
        : icon === "hourglass"
          ? "bg-amber-100 text-amber-600"
          : "bg-slate-100 text-slate-500";
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center space-y-4">
      <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${iconClass}`}>
        {icon === "check" ? (
          <svg className="w-7 h-7 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"></polyline>
          </svg>
        ) : icon === "lock" ? (
          <svg className="w-7 h-7 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="11" rx="2" width="18" x="3" y="11"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"></path>
          </svg>
        ) : icon === "hourglass" ? (
          <svg className="w-7 h-7 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 3" strokeLinecap="round"></path>
          </svg>
        ) : (
          <svg className="w-7 h-7 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round"></path>
          </svg>
        )}
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
      </div>
      {children}
    </section>
  );
}

export default async function SubmitReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ reservation?: string }>;
}) {
  const sp = await searchParams;
  const rawReservation = sp.reservation ?? "";
  const user = await getCurrentUser();
  const selfPath = rawReservation
    ? `/submit-review?reservation=${encodeURIComponent(rawReservation)}`
    : "/submit-review";
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent(selfPath));

  const myReviews = await db.review.findMany({
    where: { authorId: user.id },
    select: { reservationId: true },
  });
  const reviewedIds = new Set(
    myReviews.map((r) => r.reservationId).filter(Boolean) as string[],
  );

  /* ---------- No (or unusable) reservation picked: friendly chooser ---------- */
  if (!rawReservation) {
    const completed = await db.reservation.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ renterId: user.id }, { hostId: user.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: { listing: { include: listingInclude } },
    });
    const pending = completed.filter((r) => !reviewedIds.has(r.id));
    const done = completed.filter((r) => reviewedIds.has(r.id));

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-m3-primary selection:text-white">
        {/* Minimal header — preserved from source */}
                <SiteHeader />

        <main className="max-w-xl mx-auto px-4 py-8 space-y-5">
          <InfoState
            icon="info"
            title="اجاره‌ای برای ثبت دیدگاه انتخاب نشده است"
            text="برای ثبت دیدگاه، یکی از اجاره‌های تکمیل‌شده‌ی خود را از فهرست زیر انتخاب کنید. دیدگاه‌ها فقط برای اجاره‌های وضعیت «تکمیل شده» فعال می‌شوند."
          />
          {pending.length === 0 && done.length === 0 ? (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-center space-y-3">
              <p className="text-sm font-bold text-slate-800">
                هنوز اجاره‌ی تکمیل‌شده‌ای ندارید.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                پس از پایان اولین اجاره (وضعیت «اجاره تکمیل شد»)، دکمه ثبت دیدگاه
                همین‌جا برای شما فعال می‌شود.
              </p>
              <Link
                className="inline-flex items-center justify-center gap-2 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
                href="/"
              >
                مشاهده وسایل برای اجاره
              </Link>
            </section>
          ) : null}
          {pending.length > 0 ? (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
              <h3 className="text-sm font-black text-slate-800">
                آماده ثبت دیدگاه ({toPersianDigits(pending.length)} مورد)
              </h3>
              <ul className="space-y-2.5">
                {pending.map((r) => {
                  const img = r.listing.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg";
                  return (
                    <li
                      className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3"
                      key={r.id}
                    >
                      <img
                        alt={r.listing.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                        src={img}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 leading-snug">
                          {r.listing.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          کد رزرو: <span className="font-mono">{r.code}</span> • پایان:{" "}
                          {faDate(r.endDate)} • {faToman(r.total)} تومان
                        </p>
                      </div>
                      <Link
                        className="shrink-0 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
                        href={`/submit-review?reservation=${encodeURIComponent(r.id)}`}
                      >
                        ثبت دیدگاه
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {done.length > 0 ? (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
              <h3 className="text-sm font-black text-slate-800">
                دیدگاه ثبت‌شده ({toPersianDigits(done.length)} مورد)
              </h3>
              <ul className="space-y-2.5">
                {done.map((r) => (
                  <li
                    className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 opacity-80"
                    key={r.id}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-snug">
                        {r.listing.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        کد رزرو: <span className="font-mono">{r.code}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                      دیدگاه ثبت شده
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
      </div>
    );
  }

  /* --------------------- A reservation id was provided --------------------- */
  const reservation = await db.reservation.findUnique({
    where: { id: rawReservation },
    include: { listing: { include: listingInclude } },
  });

  const notFoundBlock = (
    <InfoState
      icon="info"
      title="رزرو پیدا نشد"
      text="لینک ثبت دیدگاه معتبر نیست یا این رزرو حذف شده است. از فهرست اجاره‌های تکمیل‌شده خود یکی را انتخاب کنید."
    >
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <Link
          className="flex-1 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
          href="/submit-review"
        >
          انتخاب از فهرست اجاره‌ها
        </Link>
        <Link
          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm border border-slate-200 transition-colors"
          href="/"
        >
          صفحه‌ی اصلی
        </Link>
      </div>
    </InfoState>
  );

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-m3-primary selection:text-white">
                <SiteHeader />
        <main className="max-w-xl mx-auto px-4 py-8">{notFoundBlock}</main>
      </div>
    );
  }

  const isParticipant =
    reservation.renterId === user.id || reservation.hostId === user.id;

  const renderShell = (inner: React.ReactNode) => (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-m3-primary selection:text-white">
      {/* Minimal header — preserved from source */}
            <SiteHeader />
      <main className="max-w-xl mx-auto px-4 py-8">{inner}</main>
    </div>
  );

  if (!isParticipant) {
    return renderShell(
      <InfoState
        icon="lock"
        title="دسترسی مجاز نیست"
        text="فقط طرفین این اجاره می‌توانند برای آن دیدگاه ثبت کنند."
      >
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            className="flex-1 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            href="/submit-review"
          >
            انتخاب اجاره دیگر
          </Link>
        </div>
      </InfoState>,
    );
  }

  if (reservation.status !== "COMPLETED") {
    const statusLabel =
      RESERVATION_STATUS_LABELS[reservation.status as ReservationStatus] ??
      reservation.status;
    return renderShell(
      <InfoState
        icon="hourglass"
        title="این اجاره هنوز تکمیل نشده است"
        text={`ثبت دیدگاه پس از تکمیل اجاره امکان‌پذیر است. وضعیت فعلی این رزرو: «${statusLabel}».`}
      >
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            className="flex-1 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            href={`/rental-lifecycle/${reservation.id}`}
          >
            مشاهده وضعیت اجاره
          </Link>
          <Link
            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm border border-slate-200 transition-colors"
            href="/submit-review"
          >
            انتخاب اجاره دیگر
          </Link>
        </div>
      </InfoState>,
    );
  }

  if (reviewedIds.has(reservation.id)) {
    return renderShell(
      <InfoState
        icon="check"
        title="قبلاً برای این اجاره دیدگاه ثبت کرده‌اید"
        text="برای هر اجاره فقط یک دیدگاه مجاز است. می‌توانید دیدگاه خود را در صفحه‌ی همین وسیله ببینید."
      >
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            className="flex-1 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            href={`/item-details/${reservation.listing.id}#reviews`}
          >
            دیدن دیدگاه در صفحه‌ی محصول
          </Link>
          <Link
            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm border border-slate-200 transition-colors"
            href="/"
          >
            صفحه‌ی اصلی
          </Link>
        </div>
      </InfoState>,
    );
  }

  /* ---------------------------- The review form ---------------------------- */
  const img = reservation.listing.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg";
  return renderShell(
    <SubmitReviewForm
      authorName={user.name}
      listing={{
        id: reservation.listing.id,
        title: reservation.listing.title,
        imageUrl: img,
        ownerName: reservation.listing.owner?.name ?? "میزبان اورا",
      }}
      reservationCode={reservation.code}
      reservationId={reservation.id}
    />,
  );
}