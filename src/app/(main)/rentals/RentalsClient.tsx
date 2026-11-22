"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { daysBetween, faDate, faNumber, faToman } from "@/lib/format";
import DeliveryConfirmCard from "@/components/overa/DeliveryConfirmCard";
import ReturnConfirmCard from "@/components/overa/ReturnConfirmCard";

/* ------------------------------------------------------------------ types */

type ApiReservation = {
  id: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
  dailyPrice: number;
  subtotal: number;
  deposit: number;
  total: number;
  pickupMethod: string;
  renterNote: string | null;
  depositStatus?: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    area: string | null;
    images: { url: string; alt: string | null }[];
  };
  renter: { id: string; name: string };
  host: { id: string; name: string };
  events: {
    id: string;
    actor: string;
    type: string;
    message: string;
    createdAt: string;
  }[];
};

type Props = {
  user: { id: string; name: string; kycStatus: string; isHost: boolean };
  initialReservations: ApiReservation[];
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
};

/* --------------------------------------------------- status tab definitions */

const TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: "pending", label: "در انتظار پاسخ", statuses: ["REQUESTED"] },
  {
    key: "delivery",
    label: "در انتظار تحویل",
    statuses: ["APPROVED", "AGREEMENT", "PAYMENT"],
  },
  {
    key: "active",
    label: "فعال",
    statuses: [
      "PAID",
      "DELIVERED",
      "RENTAL_ACTIVE",
      "RETURN_REQUESTED",
      "RETURNED",
      "INSPECTION",
    ],
  },
  { key: "completed", label: "تکمیل‌شده", statuses: ["COMPLETED"] },
  { key: "closed", label: "لغو/رد", statuses: ["CANCELLED", "REJECTED"] },
  { key: "disputed", label: "اختلاف", statuses: ["DISPUTED"] },
];

const ESCROWED_STATUSES = [
  "AGREEMENT",
  "PAYMENT",
  "PAID",
  "DELIVERED",
  "RENTAL_ACTIVE",
  "RETURN_REQUESTED",
  "RETURNED",
  "INSPECTION",
];
const CANCELABLE = ["REQUESTED", "APPROVED", "AGREEMENT", "PAYMENT", "PAID"];

const SORTS: { key: string; label: string }[] = [
  { key: "return", label: "نزدیک‌ترین به تاریخ عودت" },
  { key: "newest", label: "جدیدترین رزروها" },
  { key: "deposit", label: "بیشترین مبلغ ودیعه" },
];

/* ------------------------------------------------------------ tab icons (source SVGs) */

function TabIcon({ tab, active }: { tab: string; active: boolean }) {
  const cls = active ? "text-[#130e1b]" : "text-[#694d99]";
  const paths: Record<string, string> = {
    pending:
      "M200,75.64V40a16,16,0,0,0-16-16H72A16,16,0,0,0,56,40V76a16.07,16.07,0,0,0,6.4,12.8L114.67,128,62.4,167.2A16.07,16.07,0,0,0,56,180v36a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V180.36a16.09,16.09,0,0,0-6.35-12.77L141.27,128l52.38-39.59A16.09,16.09,0,0,0,200,75.64ZM184,40V64H72V40Zm0,176H72V180l56-42,56,42.35Z",
    delivery:
      "M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z",
    active:
      "M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z",
    completed:
      "M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z",
    closed:
      "M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z",
    disputed:
      "M236.73,208.32,141.9,40.75a16,16,0,0,0-27.8,0L19.27,208.32a16,16,0,0,0,13.9,23.68H222.83a16,16,0,0,0,13.9-23.68ZM128,168a12,12,0,1,1,12-12A12,12,0,0,1,128,168Zm12-50.93a12,12,0,1,1-24,0V104a12,12,0,1,1,24,0Z",
  };
  return (
    <svg
      fill="currentColor"
      height="22px"
      viewBox="0 0 256 256"
      width="22px"
      xmlns="http://www.w3.org/2000/svg"
      className={cls}
    >
      <path d={paths[tab] ?? paths.active}></path>
    </svg>
  );
}

/* ---------------------------------------------------------------- component */

export default function RentalsClient({
  user,
  initialReservations,
  statusLabels,
  statusColors,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(initialReservations.length === 0);
  const [reservations, setReservations] =
    useState<ApiReservation[]>(initialReservations);
  const [role, setRole] = useState<"renter" | "host">("renter");
  const [tab, setTab] = useState<string>("pending");
  const [sort, setSort] = useState("return");

  const load = useCallback(async (showSkeleton?: boolean) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "خطا در دریافت اجاره‌ها");
        setReservations([]);
      } else {
        setReservations(data.reservations ?? []);
      }
    } catch {
      toast.error("خطا در دریافت اجاره‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* Live refresh through the API; initial server-rendered data already paints. */
    load(initialReservations.length === 0);
  }, [load, initialReservations.length]);

  /* Role-filtered list: the API returns the caller's reservations both as
     renter and as host; the source toggle switches between the two views. */
  const mine = useMemo(
    () =>
      reservations.filter((r) =>
        role === "renter" ? r.renter.id === user.id : r.host.id === user.id,
      ),
    [reservations, role, user.id],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mine.length };
    for (const t of TABS)
      c[t.key] = mine.filter((r) => t.statuses.includes(r.status)).length;
    return c;
  }, [mine]);

  const shown = useMemo(() => {
    const list = mine.filter((r) =>
      TABS.find((t) => t.key === tab)?.statuses.includes(r.status),
    );
    const sorted = [...list];
    if (sort === "return")
      sorted.sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate));
    else if (sort === "newest")
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === "deposit") sorted.sort((a, b) => b.deposit - a.deposit);
    return sorted;
  }, [mine, tab, sort]);

  /* Header stats — computed from real data */
  const escrowed = useMemo(
    () =>
      mine
        .filter(
          (r) => role === "renter" && ESCROWED_STATUSES.includes(r.status),
        )
        .reduce((s, r) => s + r.deposit, 0),
    [mine, role],
  );
  const escrowedItems = useMemo(
    () =>
      mine
        .filter(
          (r) => role === "renter" && ESCROWED_STATUSES.includes(r.status),
        )
        .slice(0, 2),
    [mine, role],
  );
  const activeCount = useMemo(
    () =>
      mine.filter((r) =>
        [
          ...TABS[0].statuses,
          ...TABS[1].statuses,
          ...TABS[2].statuses,
        ].includes(r.status),
      ).length,
    [mine],
  );
  const awaitingDelivery = useMemo(
    () => mine.filter((r) => ["PAID", "DELIVERED"].includes(r.status)).length,
    [mine],
  );
  const dealsCount = useMemo(
    () => mine.filter((r) => r.status === "COMPLETED").length,
    [mine],
  );

  /* Two-sided confirmation cards (OTP flow):
     renter → orders delivered by the host awaiting receipt confirmation;
     host → orders whose return was announced by the renter. */
  const deliveryPending = useMemo(
    () =>
      role === "renter" ? mine.filter((r) => r.status === "DELIVERED") : [],
    [mine, role],
  );
  const returnPending = useMemo(
    () =>
      role === "host"
        ? mine.filter((r) => r.status === "RETURN_REQUESTED")
        : [],
    [mine, role],
  );

  /* ------------------------------------------------------------- actions */

  async function openConversation(reservationId: string) {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "خطا در باز کردن گفت‌وگو");
        return;
      }
      router.push(`/live-chat?c=${data.conversationId}`);
    } catch {
      toast.error("خطا در باز کردن گفت‌وگو");
    }
  }

  async function cancelReservation(r: ApiReservation) {
    if (
      !window.confirm(
        `آیا از لغو رزرو «${r.code}» مطمئن هستید؟ وجه پرداختی به‌صورت شبیه‌سازی‌شده بازگردانده می‌شود.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "لغو رزرو ممکن نشد");
        return;
      }
      toast.success("رزرو لغو شد");
      load();
    } catch {
      toast.error("خطا در لغو رزرو");
    }
  }

  const kycVerified = user.kycStatus === "VERIFIED";

  /* ------------------------------------------------------------- render */

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <Toaster position="top-center" richColors />

      {/* Page title block — preserved from source */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#130e1b] text-3xl sm:text-4xl font-bold leading-tight tracking-[-0.033em]">
            مدیریت اجاره‌ها و رزروهای من
          </p>
          <p className="text-[#694d99] text-base font-normal leading-normal">
            پیگیری سفارشات، زمان‌بندی عودت، آزادسازی ودیعه امانی و ارتباط مستقیم
            با مالکان
          </p>
        </div>
      </div>

      {/* Stat cards — computed from real reservations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 w-full">
        {/* Card 1: ودیعه امانی در گردش */}
        <div className="relative bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-m3-primary/5 rounded-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">
              ودیعه امانی در گردش
            </span>
            <div className="size-10 rounded-xl bg-m3-primary/10 flex items-center justify-center text-m3-primary">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-on-surface tracking-tight">
                  {faToman(escrowed)}
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  تومان
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="material-symbols-outlined text-xs">
                trending_up
              </span>
              شبیه‌سازی (Sandbox)
            </span>
            <span className="text-[10px] text-on-surface-variant">
              ضمانت امن اٌوِرا
            </span>
          </div>
        </div>

        {/* Card 2: اجاره‌های فعال جاری */}
        <div className="relative bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-m3-primary/5 rounded-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">
              اجاره‌های فعال جاری
            </span>
            <div className="size-10 rounded-xl bg-m3-primary/10 flex items-center justify-center text-m3-primary">
              <span className="material-symbols-outlined text-xl">
                inventory_2
              </span>
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-on-surface tracking-tight">
                  {faNumber(activeCount)}
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  سفارش
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-m3-primary bg-m3-primary/10 px-2 py-0.5 rounded-full border border-m3-primary/20">
              <span className="material-symbols-outlined text-xs">
                add_circle
              </span>
              {faNumber(counts.pending ?? 0)} در انتظار پاسخ
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {faNumber(awaitingDelivery)} در دست تحویل
            </span>
          </div>
        </div>

        {/* Card 3: امتیاز اعتماد و خوش‌حسابی */}
        <div className="relative bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">
              امتیاز اعتماد و خوش‌حسابی
            </span>
            <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-300">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                verified
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-on-surface tracking-tight">
                ۹۸
              </span>
              <span className="text-xs font-semibold text-on-surface-variant">
                از ۱۰۰
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
              <span className="material-symbols-outlined text-xs">star</span>
              عالی
            </span>
            <span className="text-[10px] font-bold text-emerald-600">
              {kycVerified ? "تایید هویت شده" : "احراز هویت ناقص"}
            </span>
          </div>
        </div>

        {/* Card 4: کل معاملات موفق */}
        <div className="relative bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">
              کل معاملات موفق
            </span>
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <span className="material-symbols-outlined text-xl">
                workspace_premium
              </span>
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-on-surface tracking-tight">
                  {faNumber(dealsCount)}
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  مرتبه
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="material-symbols-outlined text-xs">
                thumb_up
              </span>
              رضایت طرفین
            </span>
            <span className="text-[10px] text-on-surface-variant">
              بدون تاخیر و خسارت
            </span>
          </div>
        </div>
      </div>

      {/* Role toggle — مستأجر / میزبان */}
      <div className="flex px-4 py-3">
        <div className="flex h-10 flex-1 min-w-0 w-full items-center justify-center rounded-lg bg-[#ece7f3] p-1 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setRole("renter")}
            className={`flex cursor-pointer h-full grow min-w-0 items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all ${
              role === "renter"
                ? "bg-[#f9f8fc] shadow-[0_0_4px_rgba(0,0,0,0.1)] text-[#130e1b]"
                : "text-[#694d99]"
            }`}
          >
            <span className="truncate">وسایلی که اجاره کرده‌ام (مستأجر)</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("host")}
            className={`flex cursor-pointer h-full grow min-w-0 items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all ${
              role === "host"
                ? "bg-[#f9f8fc] shadow-[0_0_4px_rgba(0,0,0,0.1)] text-[#130e1b]"
                : "text-[#694d99]"
            }`}
          >
            <span className="truncate">وسایلی که اجاره داده‌ام (میزبان)</span>
          </button>
        </div>
      </div>

      {/* Status tabs — computed counts */}
      <div className="pb-3">
        <div className="flex border-b border-[#d8d0e7] px-4 gap-5 sm:gap-8 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center justify-center gap-1 pb-[7px] pt-2.5 border-b-[3px] shrink-0 transition-colors ${
                  active
                    ? "border-b-[#7b3aed] text-[#130e1b]"
                    : "border-b-transparent text-[#694d99] hover:text-[#130e1b]"
                }`}
              >
                <TabIcon tab={t.key} active={active} />
                <p
                  className={`text-sm font-bold leading-normal tracking-[0.015em] ${active ? "text-[#130e1b]" : "text-[#694d99]"}`}
                >
                  {t.label} ({faNumber(counts[t.key] ?? 0)})
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
        {/* Main cards column */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Action-needed: renter delivery confirmations (OTP) */}
          {deliveryPending.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-lg">
                  package_2
                </span>
                نیازمند تأیید شما
              </h2>
              {deliveryPending.map((r) => (
                <DeliveryConfirmCard
                  key={r.id}
                  reservationId={r.id}
                  code={r.code}
                  listingTitle={r.listing.title}
                  hostName={r.host.name}
                  onSettled={() => void load()}
                />
              ))}
            </div>
          )}

          {/* Action-needed: host return confirmations (OTP / damage) */}
          {returnPending.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-lg">
                  local_shipping
                </span>
                نیازمند بررسی و تأیید شما
              </h2>
              {returnPending.map((r) => (
                <ReturnConfirmCard
                  key={r.id}
                  reservationId={r.id}
                  code={r.code}
                  listingTitle={r.listing.title}
                  renterName={r.renter.name}
                  onSettled={() => void load()}
                />
              ))}
            </div>
          )}

          {/* Sort / refresh bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-m3-primary text-xl">
                filter_list
              </span>
              <span className="text-sm font-bold text-on-surface">
                مرتب‌سازی بر اساس:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/80 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-m3-primary text-on-surface"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>به‌روزرسانی خودکار وضعیت‌ها: هم‌اکنون</span>
              <button
                type="button"
                onClick={() => void load()}
                className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-m3-primary transition-colors"
                title="به‌روزرسانی فهرست"
              >
                <span className="material-symbols-outlined text-base">
                  refresh
                </span>
              </button>
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <>
              {[0, 1].map((i) => (
                <article
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 overflow-hidden shadow-sm"
                >
                  <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/50">
                    <Skeleton className="h-6 w-52" />
                  </div>
                  <div className="p-6 flex flex-col sm:flex-row gap-6">
                    <Skeleton className="w-full sm:w-44 h-44 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-16 w-full rounded-xl" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </article>
              ))}
            </>
          )}

          {/* Cards */}
          {!loading &&
            shown.map((r) => {
              const statusLabel = statusLabels[r.status] ?? r.status;
              const statusColor =
                statusColors[r.status] ??
                "bg-surface-container-high text-on-surface";
              const remaining = daysBetween(new Date(), r.endDate);
              const isRenterView = r.renter.id === user.id;
              const counterparty = isRenterView ? r.host.name : r.renter.name;
              const canCancel = isRenterView && CANCELABLE.includes(r.status);
              return (
                <article
                  key={r.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header & Status Banner */}
                  <div className="bg-surface-container-low px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}
                      >
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: '"FILL" 1' }}
                        >
                          timer
                        </span>
                        {statusLabel}
                        {["DELIVERED", "PAID"].includes(r.status) && (
                          <span className="opacity-80">
                            ({faNumber(remaining)} روز باقی‌مانده)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono">
                        کد پیگیری: #{r.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          <span className="material-symbols-outlined text-sm">
                            verified_user
                          </span>
                          {r.depositStatus === "REFUND_PENDING"
                            ? "در انتظار بازگشت ودیعه (شبیه‌سازی)"
                            : "ودیعه مسترد شد (شبیه‌سازی)"}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface font-semibold bg-primary-fixed/40 px-2.5 py-1 rounded-md">
                          {r.pickupMethod === "COURIER"
                            ? "ارسال با پیک اٌوِرا"
                            : "تحویل حضوری"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body Details */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Item Image */}
                      <Link
                        href={`/item-details/${r.listing.id}`}
                        className="relative w-full sm:w-44 h-44 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/40 block"
                      >
                        {r.listing.images?.[0]?.url ? (
                          <img
                            alt={r.listing.title}
                            className="w-full h-full object-cover"
                            src={r.listing.images[0].url}
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl">
                              package_2
                            </span>
                          </span>
                        )}
                        <span className="absolute top-2 right-2 bg-m3-inverse-surface/80 text-m3-inverse-on-surface backdrop-blur-sm text-[11px] font-bold px-2 py-0.5 rounded">
                          {r.listing.city}
                        </span>
                      </Link>
                      {/* Item Core Metadata */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-bold text-on-surface">
                                {r.listing.title}
                              </h3>
                              <p className="text-xs text-on-surface-variant mt-1">
                                {isRenterView ? "مالک" : "مستأجر"}:{" "}
                                {counterparty}
                                <span className="text-outline-variant">
                                  {" "}
                                  ●{" "}
                                </span>
                                {r.listing.area ? `${r.listing.area}، ` : ""}
                                {r.listing.city}
                              </p>
                            </div>
                            <span className="text-xs text-m3-primary font-bold bg-primary-fixed/50 px-2.5 py-1 rounded-lg shrink-0">
                              {faNumber(r.days)} روز اجاره
                            </span>
                          </div>
                          {/* Date Range & Timeline */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3 bg-surface-container-low rounded-xl text-xs">
                            <div>
                              <span className="text-on-surface-variant block">
                                تاریخ شروع تحویل:
                              </span>
                              <span className="font-bold text-on-surface mt-0.5 block">
                                {faDate(r.startDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block">
                                موعد عودت نهایی:
                              </span>
                              <span
                                className={`font-bold mt-0.5 block ${["COMPLETED", "CANCELLED", "REJECTED"].includes(r.status) ? "text-on-surface" : "text-m3-error"}`}
                              >
                                {faDate(r.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Financial Ledger Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-outline-variant/40 text-xs">
                          <div>
                            <span className="text-on-surface-variant">
                              اجاره روزانه:
                            </span>
                            <span className="font-bold text-on-surface mr-1">
                              {faToman(r.dailyPrice)} تومان
                            </span>
                            <span className="text-on-surface-variant mx-1.5">
                              |
                            </span>
                            <span className="text-on-surface-variant">
                              کل مبلغ اجاره ({faNumber(r.days)} روز):
                            </span>
                            <span className="font-bold text-m3-primary mr-1">
                              {faToman(r.subtotal)} تومان
                            </span>
                          </div>
                          <div className="bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/50">
                            <span className="text-on-surface-variant">
                              ودیعه امانی:
                            </span>
                            <span className="font-bold text-on-surface mr-1">
                              {faToman(r.deposit)} تومان
                            </span>
                            <span className="text-[10px] text-emerald-600 block sm:inline mr-1">
                              (شبیه‌سازی — Sandbox)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-outline-variant/40">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openConversation(r.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            forum
                          </span>
                          گفت‌وگوی آنلاین با {isRenterView ? "مالک" : "مستأجر"}
                        </button>
                        {r.status === "COMPLETED" && (
                          <Link
                            href={`/submit-review?reservation=${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-bold transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">
                              rate_review
                            </span>
                            ثبت دیدگاه
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => cancelReservation(r)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-m3-error hover:bg-m3-error-container/40 text-xs font-semibold transition-colors"
                          >
                            لغو رزرو و استرداد وجه
                          </button>
                        )}
                        <Link
                          href={`/rental-lifecycle/${r.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-m3-primary hover:bg-surface-tint text-on-primary text-xs font-bold shadow-sm transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            route
                          </span>
                          مشاهده روند اجاره
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

          {/* Empty state per tab */}
          {!loading && shown.length === 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
              <div className="size-14 rounded-2xl bg-surface-container flex items-center justify-center text-m3-primary">
                <span className="material-symbols-outlined text-3xl">
                  inventory_2
                </span>
              </div>
              <p className="text-base font-bold text-on-surface">
                {role === "renter"
                  ? "در این دسته اجاره‌ای ثبت نشده است"
                  : "در این دسته اجاره‌ای به شما ثبت نشده است"}
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                به‌محض ثبت درخواست جدید، وضعیت آن با کد پیگیری OVR-XXXXX در همین
                صفحه قابل پیگیری خواهد بود.
              </p>
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-m3-primary text-on-primary text-xs font-bold shadow-sm hover:bg-surface-tint transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  search
                </span>
                مشاهده دسته‌بندی‌ها
              </Link>
            </div>
          )}
        </section>

        {/* Sidebar: Escrow & Support (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Escrow Deposit Status Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/70 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary">
                  account_balance_wallet
                </span>
                کیف پول ودیعه امانی (Escrow)
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">
                شبیه‌سازی
              </span>
            </div>
            <div className="bg-surface-container p-4 rounded-xl mb-4 border border-outline-variant/40">
              <span className="text-xs text-on-surface-variant block">
                موجودی مسدودشده در چرخه اجاره:
              </span>
              <div className="text-2xl font-black text-on-surface mt-1">
                {faToman(escrowed)}
                <span className="text-xs font-medium text-on-surface-variant">
                  {" "}
                  تومان
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                ودیعه‌های اجاره‌های فعال شما تا تایید سلامت کالا و تکمیل
                صورت‌جلسه نگه‌داری می‌شوند. مبالغ در حالت شبیه‌سازی (Sandbox)
                ثبت می‌شوند و هیچ پول واقعی جابه‌جا نمی‌شود.
              </p>
            </div>
            <div className="space-y-2.5 text-xs">
              {escrowedItems.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center py-1.5 border-b border-outline-variant/40"
                >
                  <span className="text-on-surface-variant truncate max-w-[55%]">
                    {r.listing.title}:
                  </span>
                  <span className="font-bold text-on-surface">
                    {faToman(r.deposit)} ت (مسدود)
                  </span>
                </div>
              ))}
              {dealsCount > 0 && (
                <div className="flex justify-between items-center py-1.5 text-emerald-700">
                  <span>آزادشده‌ها (تکمیل‌شده):</span>
                  <span className="font-bold">
                    {faToman(
                      mine
                        .filter((r) => r.status === "COMPLETED")
                        .reduce((s, r) => s + r.deposit, 0),
                    )}{" "}
                    ت
                  </span>
                </div>
              )}
              {escrowedItems.length === 0 && dealsCount === 0 && (
                <p className="text-on-surface-variant py-1.5">
                  در حال حاضر ودیعه‌ای در گردش نیست.
                </p>
              )}
            </div>
            <Link
              href="/wallet"
              className="w-full mt-5 py-2.5 px-4 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">
                account_balance
              </span>
              مدیریت حساب‌های بانکی و شبای واریز
            </Link>
          </div>

          {/* Dedicated Support & Dispute Resolution */}
          <div className="bg-gradient-to-br from-surface-container to-surface-container-high rounded-2xl p-6 border border-outline-variant/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-m3-primary/20 flex items-center justify-center text-m3-primary">
                <span className="material-symbols-outlined">headset_mic</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">
                  پشتیبانی اختصاصی اجاره‌ها
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  پاسخگویی فوری در ۲۴ ساعت شبانه‌روز
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              در صورت بروز مغایرت در کالا، تاخیر پیک، یا نیاز به داوری بین شما و
              مالک، کارشناسان اٌوِرا همراه شما هستند.
            </p>
            <div className="flex gap-2">
              <Link
                href="/damage-claims"
                className="flex-1 py-2 px-3 bg-m3-primary text-on-primary rounded-lg text-xs font-bold hover:bg-surface-tint transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">
                  support_agent
                </span>
                ثبت تیکت داوری
              </Link>
              <a
                href="tel:02188223344"
                className="py-2 px-3 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-bold border border-outline-variant/80 hover:bg-surface-bright transition-colors flex items-center justify-center"
              >
                تماس ۰۲۱-۸۸۲۲۳۳۴۴
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
