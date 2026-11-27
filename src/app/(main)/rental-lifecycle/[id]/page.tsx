import SiteHeader from "@/components/layout/SiteHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import UserMenu from "@/components/layout/UserMenu";
import {
  allowedActions,
  ACTION_ACTORS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  type ReservationAction,
  type ReservationStatus,
} from "@/lib/rental-state";
import RentalLifecycleClient from "./RentalLifecycleClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
};

/**
 * rental-lifecycle.html → /rental-lifecycle/[id] (protected + participant).
 * Deep-link compatibility: when [id] is not a reservation id, it (or the
 * `?code=` query) is treated as the OVR-XXXXX reference code.
 */
export default async function RentalLifecyclePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user)
    redirect(
      "/signin-otp?next=" + encodeURIComponent(`/rental-lifecycle/${id}`),
    );

  const include = {
    listing: {
      include: { images: { orderBy: { sortOrder: "asc" as const } } },
    },
    renter: { select: { id: true, name: true } },
    host: { select: { id: true, name: true } },
    events: { orderBy: { createdAt: "asc" as const } },
  };

  let reservation = await db.reservation.findUnique({ where: { id }, include });
  if (!reservation && sp.code) {
    reservation = await db.reservation.findUnique({
      where: { code: sp.code },
      include,
    });
  }
  if (!reservation && /^OVR-/i.test(id)) {
    reservation = await db.reservation.findUnique({
      where: { code: id.toUpperCase() },
      include,
    });
  }

  const isParticipant =
    Boolean(reservation) &&
    Boolean(
      reservation &&
      (reservation.renterId === user.id ||
        reservation.hostId === user.id ||
        user.isAdmin),
    );

  const role: "renter" | "host" | "admin" = !reservation
    ? "renter"
    : user.isAdmin &&
        reservation.renterId !== user.id &&
        reservation.hostId !== user.id
      ? "admin"
      : reservation.renterId === user.id
        ? "renter"
        : "host";

  const actions: ReservationAction[] = reservation
    ? allowedActions(reservation.status as ReservationStatus).filter((a) =>
        ACTION_ACTORS[a].includes(role),
      )
    : [];

  const lifecycleData =
    reservation && isParticipant
      ? {
          id: reservation.id,
          code: reservation.code,
          status: reservation.status,
          startDate: reservation.startDate.toISOString(),
          endDate: reservation.endDate.toISOString(),
          days: reservation.days,
          dailyPrice: reservation.dailyPrice,
          subtotal: reservation.subtotal,
          deposit: reservation.deposit,
          total: reservation.total,
          pickupMethod: reservation.pickupMethod,
          renterProtocol: reservation.renterProtocol,
          hostProtocol: reservation.hostProtocol,
          depositStatus: reservation.depositStatus,
          paymentMethod: reservation.paymentMethod,
          deliveryStatus: reservation.deliveryStatus,
          deliveryNote: reservation.deliveryNote,
          signedByRenterAt: reservation.signedByRenterAt
            ? reservation.signedByRenterAt.toISOString()
            : null,
          listing: {
            id: reservation.listing.id,
            title: reservation.listing.title,
            specs: reservation.listing.specs,
            city: reservation.listing.city,
            area: reservation.listing.area,
            rating: reservation.listing.rating,
            images: reservation.listing.images.map((i) => i.url),
            lat: reservation.listing.lat,
            lng: reservation.listing.lng,
          },
          renter: { id: reservation.renter.id, name: reservation.renter.name },
          host: { id: reservation.host.id, name: reservation.host.name },
          events: reservation.events.map((e) => ({
            id: e.id,
            actor: e.actor,
            type: e.type,
            message: e.message,
            createdAt: e.createdAt.toISOString(),
          })),
        }
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header — faithful to rental-lifecycle.html MainHeader, session-aware */}
      <SiteHeader />

      {!reservation || !isParticipant ? (
        /* Access-denied / not-found state (source-style error card) */
        <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white border border-m3-error-container rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="size-14 rounded-2xl bg-m3-error-container flex items-center justify-center text-m3-on-error-container">
              <span className="material-symbols-outlined text-3xl">
                gpp_bad
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-on-surface">
              دسترسی به این اجاره مجاز نیست
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-md">
              {reservation
                ? "این رزرو متعلق به حساب کاربری شما نیست و تنها طرفین اجاره و مدیران اٌوِرا به روند آن دسترسی دارند."
                : "رزروی با این شناسه یا کد پیگیری یافت نشد؛ کد پیگیری را از صفحه اجاره‌های من بررسی کنید."}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/rentals"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-m3-primary text-on-primary text-xs font-bold shadow-md hover:bg-surface-tint transition"
              >
                <span className="material-symbols-outlined text-sm">
                  list_alt
                </span>
                اجاره‌های من
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                بازگشت به خانه
              </Link>
            </div>
          </div>
        </main>
      ) : lifecycleData ? (
        <RentalLifecycleClient
          reservation={lifecycleData}
          role={role}
          actions={actions}
          statusLabels={RESERVATION_STATUS_LABELS}
          statusColors={RESERVATION_STATUS_COLORS}
          viewerWalletBalance={user.walletBalance}
        />
      ) : null}

      {/* Shared Footer — faithful to rental-lifecycle.html AppFooter */}
      <footer className="w-full bg-white border-t border-purple-100/80 mt-16 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-2xl from-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                  <img
                    src="/assets/img/overa_logo_transparent.png"
                    alt="لوگوی اٌوِرا"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">
                  اٌوِرا
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                سامانه هوشمند اشتراک و اجاره کالا و تجهیزات در سراسر کشور
                با ضمانت امانی.
              </p>
              <div className="text-xs text-m3-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">call</span>
                <span>پشتیبانی اٌوِرا: ۰۲۱-۸۸۸۸۹۹۹۹</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-3">
                دسته‌بندی‌های کالا
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>
                  <Link
                    href="/categories?tab=cameras"
                    className="hover:text-m3-primary transition"
                  >
                    دوربین و تجهیزات عکاسی
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories?tab=tools"
                    className="hover:text-m3-primary transition"
                  >
                    ابزارآلات فنی و کمپینگ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories?tab=gaming"
                    className="hover:text-m3-primary transition"
                  >
                    کنسول و گجت‌های هوشمند
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories?tab=camping"
                    className="hover:text-m3-primary transition"
                  >
                    تجهیزات سفر و طبیعت‌گردی
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-3">
                امنیت و قوانین
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>
                  <Link
                    href="/tos-support-faq"
                    className="hover:text-m3-primary transition"
                  >
                    صندوق امانی و ضمانت اٌوِرا
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tos-support-faq"
                    className="hover:text-m3-primary transition"
                  >
                    جبران خسارت
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tos-support-faq"
                    className="hover:text-m3-primary transition"
                  >
                    امضای معتبر الکترونیکی
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tos-support-faq"
                    className="hover:text-m3-primary transition"
                  >
                    قوانین لغو و داوری سریع
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-3">
                مجوزها و اصالت
              </h4>
              <div className="flex gap-2">
                <div className="p-2 border border-slate-200 rounded-lg text-center flex-1">
                  <span className="material-symbols-outlined text-m3-primary text-xl block mb-1">
                    verified
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    اینماد ۵ ستاره
                  </span>
                </div>
                <div className="p-2 border border-slate-200 rounded-lg text-center flex-1">
                  <span className="material-symbols-outlined text-indigo-600 text-xl block mb-1">
                    security
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    پرداخت امن
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div>
              © ۱۴۰۵ تمامی حقوق مادی و معنوی متعلق به پلتفرم هوشمند اٌوِرا
              (Overa) می‌باشد.
            </div>
            <div className="flex gap-4">
              <Link href="/tos-support-faq" className="hover:text-m3-primary">
                شرایط استفاده
              </Link>
              <Link href="/tos-support-faq" className="hover:text-m3-primary">
                حریم خصوصی
              </Link>
              <Link href="/tos-support-faq" className="hover:text-m3-primary">
                قوانین حل اختلاف
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
