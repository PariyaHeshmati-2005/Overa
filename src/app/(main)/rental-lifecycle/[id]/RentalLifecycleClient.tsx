"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { faDate, faDateTime, faNumber, faToman, toPersianDigits } from "@/lib/format";
import type { ReservationAction } from "@/lib/rental-state";

/* ------------------------------------------------------------------ types */

export type LifecycleReservation = {
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
  renterProtocol: string | null;
  hostProtocol: string | null;
  listing: {
    id: string;
    title: string;
    specs: string | null;
    city: string;
    area: string | null;
    rating: number;
    images: string[];
  };
  renter: { id: string; name: string };
  host: { id: string; name: string };
  events: { id: string; actor: string; type: string; message: string; createdAt: string }[];
};

type Props = {
  reservation: LifecycleReservation;
  role: "renter" | "host" | "admin";
  actions: ReservationAction[];
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
};

/* ------------------------------------------------- stage mapping (4-stage journey) */

/* Statuses are mapped onto the source's 4-stage journey:
   قرارداد → پرداخت → تحویل → صورت‌جلسه/عودت */
const STAGE_BY_STATUS: Record<string, number> = {
  REQUESTED: 2,
  APPROVED: 2,
  AGREEMENT: 2,
  PAYMENT: 3,
  PAID: 3,
  DELIVERED: 4,
  RETURNED: 5,
  INSPECTION: 5,
  DISPUTED: 5,
  COMPLETED: 6,
  REJECTED: 2,
  CANCELLED: 2,
};

const STEPS = [
  { label: "انتخاب وسیله" },
  { label: "تاریخ و قیمت" },
  { label: "قرارداد و ضمانت" },
  { label: "پرداخت و تسویه" },
  { label: "تحویل کالا" },
  { label: "صورت‌جلسه و عودت" },
];

const STEP_ICONS = ["search", "event", "draw", "lock", "local_shipping", "fact_check"];

const ACTOR_LABELS: Record<string, string> = {
  renter: "مستأجر",
  host: "میزبان",
  admin: "مدیر",
  system: "سیستم",
};

const ACTOR_STYLES: Record<string, string> = {
  renter: "bg-amber-50 text-amber-700 border-amber-200",
  host: "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim",
  admin: "bg-m3-error-container text-m3-on-error-container border-m3-error-container",
  system: "bg-surface-container-high text-on-surface-variant border-outline-variant/60",
};

const ACTION_META: Record<string, { label: string; icon: string; className: string }> = {
  approve: {
    label: "تایید مالک",
    icon: "check_circle",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  reject: {
    label: "رد درخواست",
    icon: "cancel",
    className: "bg-m3-error-container text-m3-on-error-container hover:bg-m3-error hover:text-on-primary",
  },
  confirm_agreement: {
    label: "تایید قرارداد",
    icon: "draw",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  pay: {
    label: "پرداخت آزمایشی",
    icon: "lock_open",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  deliver: {
    label: "تحویل شد",
    icon: "local_shipping",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  request_return: {
    label: "درخواست بازگشت",
    icon: "replay",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  confirm_return: {
    label: "تایید بازگشت",
    icon: "fact_check",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  complete_inspection: {
    label: "ثبت صورت‌جلسه",
    icon: "task_alt",
    className: "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  release_deposit: {
    label: "آزادسازی ودیعه",
    icon: "payments",
    className: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
  },
  dispute: {
    label: "اعلام خسارت",
    icon: "gavel",
    className: "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
  },
  cancel: {
    label: "لغو اجاره",
    icon: "block",
    className: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  },
};

const ACTION_ORDER: ReservationAction[] = [
  "approve",
  "reject",
  "confirm_agreement",
  "pay",
  "deliver",
  "request_return",
  "confirm_return",
  "complete_inspection",
  "release_deposit",
  "dispute",
  "cancel",
];

/* ---------------------------------------------------------------- component */

export default function RentalLifecycleClient({
  reservation: r,
  role,
  actions,
  statusLabels,
  statusColors,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [contractTab, setContractTab] = useState(0);
  const [depositMode, setDepositMode] = useState("cash");
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [protocol, setProtocol] = useState("");
  const [disputeNote, setDisputeNote] = useState("");

  const status = r.status;
  const stage = STAGE_BY_STATUS[status] ?? 2;
  const terminal = ["REJECTED", "CANCELLED"].includes(status);
  const statusLabel = statusLabels[status] ?? status;
  const statusColor = statusColors[status] ?? "bg-surface-container-high text-on-surface";
  const can = (a: string) => actions.includes(a as ReservationAction);
  const visibleActions = ACTION_ORDER.filter((a) => can(a));
  const image = r.listing.images[0] ?? null;

  async function act(action: ReservationAction, extra?: Record<string, string>) {
    setBusy(action);
    try {
      const res = await fetch(`/api/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "انجام این کنش در وضعیت فعلی مجاز نیست.");
        return;
      }
      toast.success("کنش با موفقیت ثبت شد؛ وضعیت به‌روزرسانی می‌شود.");
      router.refresh();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (
      !window.confirm(
        `آیا از لغو رزرو «${r.code}» مطمئن هستید؟ وجه پرداختی به‌صورت شبیه‌سازی‌شده بازگردانده می‌شود.`,
      )
    )
      return;
    await act("cancel");
  }

  async function openChat() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: r.id }),
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

  function handleAction(a: ReservationAction) {
    if (a === "cancel") {
      cancel();
      return;
    }
    if (a === "confirm_agreement") {
      if (!agreed) {
        toast.error("لطفاً ابتدا شرایط قرارداد را تایید فرمایید.");
        return;
      }
      act("confirm_agreement");
      return;
    }
    if (a === "complete_inspection") {
      act("complete_inspection", protocol.trim() ? { protocol: protocol.trim() } : undefined);
      return;
    }
    if (a === "dispute") {
      act("dispute", disputeNote.trim() ? { note: disputeNote.trim() } : undefined);
      return;
    }
    act(a);
  }

  /* Section states: done | active | locked */
  const contractDone = stage > 2 && !terminal;
  const contractActive = !terminal && ["REQUESTED", "APPROVED", "AGREEMENT"].includes(status);
  const paymentDone = ["PAID", "DELIVERED", "RETURNED", "INSPECTION", "COMPLETED", "DISPUTED"].includes(status);
  const paymentActive = can("pay");
  const deliveryDone = ["RETURNED", "INSPECTION", "COMPLETED"].includes(status);
  const deliveryActive = ["PAID", "DELIVERED"].includes(status);
  const protocolDone = status === "COMPLETED";
  const protocolActive = ["RETURNED", "INSPECTION", "DISPUTED"].includes(status);

  const contractTerms = `این قرارداد بین ${r.renter.name} (مستأجر) و ${r.host.name} (میزبان)، بر اساس قوانین پلتفرم اورا و شرایط توافق‌شده، تنظیم گردیده و برای هر دو طرف لازم‌الاجرا می‌باشد. کلیه پرداخت‌ها و ودیعه‌ها در حالت شبیه‌سازی (Sandbox) ثبت می‌شوند و هیچ پول واقعی جابه‌جا نمی‌شود.`;

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Toaster position="top-center" richColors />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-slate-600">خانه</Link>
        <span>‹</span>
        <Link href="/rentals" className="hover:text-slate-600">اجاره‌های من</Link>
        <span>‹</span>
        <span className="text-m3-primary font-semibold">روند اجاره {r.code}</span>
      </nav>

      {/* Order Highlight Card (source screen-4 composition) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>timer</span>
              {statusLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">
              میزبان: {r.host.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
              مستأجر: {r.renter.name}
            </span>
            <span className="text-xs text-on-surface-variant font-mono">سفارش #{r.code}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">{r.listing.title}</h3>
          {r.listing.specs && <p className="text-xs text-slate-500">{r.listing.specs}</p>}
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ودیعه امانی: {faToman(r.deposit)} تومان (شبیه‌سازی — Sandbox)
            </span>
            <button
              type="button"
              onClick={openChat}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-purple-200 text-m3-primary font-semibold hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              گفتگو
            </button>
            {role === "renter" && status === "COMPLETED" && (
              <Link
                href={`/submit-review?reservation=${r.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-purple-200 text-m3-primary font-semibold hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">rate_review</span>
                ثبت دیدگاه
              </Link>
            )}
          </div>
        </div>
        {image ? (
          <img className="w-36 h-28 object-cover rounded-xl border border-slate-100" src={image} alt={r.listing.title} />
        ) : (
          <div className="w-36 h-28 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-3xl">package_2</span>
          </div>
        )}
      </div>

      {/* Terminal banners */}
      {terminal && (
        <div className="rounded-2xl border border-m3-error-container bg-m3-error-container/60 p-4 text-sm text-m3-on-error-container font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          وضعیت نهایی این اجاره: {statusLabel}
        </div>
      )}
      {status === "COMPLETED" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">task_alt</span>
          اجاره تکمیل شد؛ ودیعه در حالت شبیه‌سازی آزاد شد.
        </div>
      )}

      {/* Stepper Flow — faithful to source stepper */}
      <section className="border border-purple-100/70 rounded-2xl py-6 px-2 sm:px-10 shadow-sm relative overflow-hidden bg-primary-soft/70">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative" dir="rtl">
          {STEPS.map((s, i) => {
            const isPre = i < 2;
            const done = isPre || (status === "COMPLETED" ? true : i < stage);
            const current = !isPre && !terminal && i === stage && status !== "COMPLETED";
            const connector =
              i > 0 ? (
                <div
                  className={`flex-1 mx-1 sm:mx-2 -mt-5 rounded-full ${
                    done || current ? "h-1 bg-m3-primary" : "h-0.5 bg-slate-200"
                  }`}
                ></div>
              ) : null;
            return (
              <div key={s.label} className="contents">
                {connector}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  {done ? (
                    <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed-variant font-bold text-xs">
                      ✓
                    </div>
                  ) : current ? (
                    <div className="w-10 h-10 rounded-full bg-m3-primary text-white flex items-center justify-center ring-4 ring-primary-fixed-dim shadow-md">
                      <span className="material-symbols-outlined text-base">{STEP_ICONS[i]}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs">
                      {toPersianDigits(i + 1)}
                    </div>
                  )}
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${
                      current ? "text-m3-primary font-extrabold" : done ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stage 1: قرارداد و ضمانت */}
      <section id="contract" className="scroll-mt-32 space-y-4">
        <SectionHeading title="قرارداد و ضمانت" state={terminal ? "locked" : contractDone ? "done" : contractActive ? "active" : "locked"} />
        {contractActive && (
          <>
            <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold text-slate-600">
              {["قرارداد اجاره", "شرایط ضمانت‌نامه", "اطلاعات ودیعه"].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setContractTab(i)}
                  className={`flex-1 py-2 rounded-xl transition ${
                    contractTab === i ? "bg-white text-m3-primary font-bold shadow-sm" : "hover:text-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-soft text-m3-primary rounded-lg">
                    <span className="material-symbols-outlined text-lg">gavel</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {contractTab === 0
                      ? "قرارداد اجاره وسایل اورا"
                      : contractTab === 1
                        ? "شرایط ضمانت‌نامه و بیمه"
                        : "اطلاعات ودیعه امانی"}
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">کد رزرو: {r.code}</span>
              </div>

              {contractTab === 0 && (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed text-justify">{contractTerms}</p>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-800">مشخصات وسیله:</div>
                      <div className="text-slate-600">
                        {r.listing.title}
                        {r.listing.specs ? ` | ${r.listing.specs}` : ""}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        محل تحویل: {r.listing.city}
                        {r.listing.area ? ` — ${r.listing.area}` : ""}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-800">مدت زمان اجاره:</div>
                      <div className="text-slate-600">
                        از {faDate(r.startDate)} تا {faDate(r.endDate)} ({faNumber(r.days)} روز کامل)
                      </div>
                    </div>
                  </div>
                  <label className="bg-primary-soft/70 border border-primary-fixed-dim/70 rounded-xl p-3 flex items-center gap-3 cursor-pointer">
                    <input
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 rounded accent-m3-primary focus:ring-0 border-slate-300 cursor-pointer"
                      id="accept-terms"
                      type="checkbox"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      با مطالعه و تأیید این قرارداد، موافقت خود را با شرایط اجاره و ضمانت‌نامه اعلام می‌کنم.
                    </span>
                  </label>
                </>
              )}
              {contractTab === 1 && (
                <p className="text-xs text-slate-500 leading-relaxed text-justify">
                  ضمانت‌نامه اورا سلامت کالا در زمان تحویل و عودت را پوشش می‌دهد. در صورت اعلام خسارت، پرونده توسط
                  کارشناسان اورا بررسی می‌شود؛ این فرآیند جایگزین مراجع قانونی نیست. ودیعه فقط پس از تایید
                  صورت‌جلسه دوطرفه آزاد می‌شود.
                </p>
              )}
              {contractTab === 2 && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">ودیعه امانی (قابل استرداد):</span>
                    <span className="font-bold text-m3-primary">{faToman(r.deposit)} تومان</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">اجاره {faNumber(r.days)} روزه:</span>
                    <span className="font-bold text-slate-800">{faToman(r.subtotal)} تومان</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ودیعه در حالت شبیه‌سازی (Sandbox) بلوکه می‌شود و هیچ پول واقعی جابه‌جا نمی‌شود.
                  </p>
                </div>
              )}
            </div>

            {/* Digital signature (visual; final confirmation goes through the state machine) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">امضای دیجیتال قرارداد با رمز یکبارمصرف</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    در این نسخه آزمایشی، تایید نهایی با دکمه «تایید قرارداد» ثبت می‌شود؛ کد نمایشی است.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-soft text-m3-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">fingerprint</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 py-1" dir="ltr">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    className="w-10 h-11 text-center text-lg font-bold rounded-lg border border-primary-fixed-dim focus:border-m3-primary bg-primary-soft/20 text-m3-primary focus:outline-none"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const next = [...otp];
                      next[i] = e.target.value.slice(-1);
                      setOtp(next);
                    }}
                    placeholder="-"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                <button
                  className="text-m3-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-60"
                  disabled
                  title="به‌زودی"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>ارسال مجدد کد</span>
                </button>
                <span className="text-slate-400 font-medium">امضای نمایشی (Sandbox)</span>
              </div>
            </div>

            <ActionRow busy={busy} visible={visibleActions} onAction={handleAction} />
          </>
        )}
        {contractDone && !terminal && (
          <CompactDone
            text={`قرارداد و ضمانت‌نامه تایید شد؛ ودیعه ${faToman(r.deposit)} تومان به‌صورت شبیه‌سازی بلوکه شد.`}
          />
        )}
        {terminal && <CompactLocked text="این مرحله برای رزروهای ردشده یا لغوشده فعال نمی‌شود." />}
      </section>

      {/* Stage 2: پرداخت و تسویه */}
      <section id="payment" className="scroll-mt-32 space-y-4">
        <SectionHeading title="پرداخت و تسویه امانی" state={paymentDone ? "done" : paymentActive ? "active" : "locked"} />
        {paymentDone && (
          <CompactDone
            text={`پرداخت ${faToman(r.subtotal)} تومان اجاره + ${faToman(r.deposit)} تومان ودیعه در حالت آزمایشی (Sandbox) انجام شد؛ هیچ پول واقعی جابه‌جا نمی‌شود.`}
          />
        )}
        {!paymentDone && paymentActive && (
          <>
            {/* Escrow Banner */}
            <div className="w-full bg-gradient-to-tr from-surface-container-high via-surface-container-lowest to-surface-container rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 border border-purple-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-m3-primary to-primary-container text-white flex items-center justify-center shrink-0 shadow-md shadow-m3-primary/25">
                  <span className="material-symbols-outlined text-2xl">shield_lock</span>
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="text-base font-bold text-on-surface">حساب امانی ودیعه اٌوِرا</span>
                    <span className="bg-m3-primary/10 text-m3-primary text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span>تضمین اورا
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    مبلغ ودیعه تا زمان عودت تأییدشده کالا نزد صندوق امانی اورا (شبیه‌سازی) مسدود می‌ماند.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl shrink-0 shadow-sm border border-purple-100 z-10">
                <span className="material-symbols-outlined text-m3-primary text-xl">verified_user</span>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-on-surface font-bold">مجوز نماد امانت‌داری</span>
                  <span className="text-[10px] text-on-surface-variant font-medium">محیط آزمایشی اورا</span>
                </div>
              </div>
            </div>

            {/* Deposit option + breakdown (source screen-2 composition) */}
            <section className="bg-white rounded-xl p-5 shadow-sm border border-purple-100/60">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-on-surface">۱. انتخاب نوع ضمانت و ودیعه</h2>
                <span className="text-xs text-m3-secondary font-semibold">بدون کارمزد</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {[
                  { id: "cash", icon: "account_balance_wallet", title: "ودیعه نقدی امانی", sub: "بازگشت آنی پس از تحویل" },
                  { id: "promissory", icon: "description", title: "سفته الکترونیک", sub: "سامانه بانک مرکزی (بدون نقد)" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDepositMode(d.id)}
                    className={`flex flex-col text-right p-3.5 rounded-xl transition-all border ${
                      depositMode === d.id
                        ? "bg-surface-container-high border-m3-primary shadow-sm"
                        : "bg-surface-container-low border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="material-symbols-outlined text-m3-primary text-xl">{d.icon}</span>
                      <span className={`w-3.5 h-3.5 rounded-full ${depositMode === d.id ? "bg-m3-primary" : "border border-slate-300"}`}></span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">{d.title}</span>
                    <span className="text-[10px] text-on-surface-variant mt-0.5">{d.sub}</span>
                  </button>
                ))}
              </div>

              <div className="bg-surface-container p-3 rounded-lg flex items-start gap-2.5 text-xs text-on-surface">
                <span className="material-symbols-outlined text-m3-primary text-base shrink-0 mt-0.5">info</span>
                <span>
                  {depositMode === "cash" ? (
                    <span>
                      <strong>ضمانت امانی نقدی:</strong> مبلغ {faToman(r.deposit)} تومان همزمان با هزینه اجاره از طریق درگاه
                      پرداخت می‌شود و بلافاصله پس از ثبت تأیید سلامت در عودت، مسترد خواهد شد (شبیه‌سازی).
                    </span>
                  ) : (
                    <span>
                      <strong>سفته الکترونیک:</strong> پس از پرداخت هزینه اجاره ({faToman(r.subtotal)} تومان)، به سامانه سفته
                      الکترونیک منتقل می‌شوید تا سفته بدون نیاز به مسدودی وجه ثبت گردد (شبیه‌سازی).
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-3 mt-4">
                <h2 className="text-sm font-bold text-on-surface">۲. صورت‌حساب شفاف مالی</h2>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-600">کرایه اجاره {faNumber(r.days)} روزه {r.listing.title}:</span>
                  <span className="font-bold text-slate-800">{faToman(r.subtotal)} تومان</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-high text-xs">
                  <span className="font-bold text-m3-primary">ودیعه امانی مسدودشونده (قابل استرداد):</span>
                  <span className="font-extrabold text-m3-primary text-sm">{faToman(r.deposit)} تومان</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-800">مجموع پرداختی در درگاه:</span>
                    <div className="text-[11px] text-slate-400">شامل هزینه اجاره + ودیعه بازگشت‌پذیر امانی</div>
                  </div>
                  <div className="text-base font-extrabold text-m3-primary">{faToman(r.total)} تومان</div>
                </div>

                {/* Mandatory sandbox label INSIDE the payment card */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-fixed/60 border border-primary-fixed-dim text-xs text-on-primary-fixed-variant">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">science</span>
                  <span className="font-bold leading-relaxed">
                    پرداخت آزمایشی (Sandbox) — هیچ پول واقعی جابه‌جا نمی‌شود
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => can("pay") && act("pay")}
                  disabled={!can("pay") || busy === "pay"}
                  className={`w-full mt-2 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] ${
                    can("pay")
                      ? "bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25"
                      : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">lock_open</span>
                  <span>{busy === "pay" ? "در حال ثبت پرداخت..." : "پرداخت آزمایشی و انتقال به درگاه (Sandbox)"}</span>
                </button>
              </div>
            </section>
          </>
        )}
        {!paymentDone && !paymentActive && <CompactLocked text="این مرحله پس از تایید قرارداد فعال می‌شود." />}
      </section>

      {/* Stage 3: تحویل و بازرسی */}
      <section id="delivery" className="scroll-mt-32 space-y-4">
        <SectionHeading title="تحویل و بازرسی سلامت کالا" state={deliveryDone ? "done" : deliveryActive ? "active" : "locked"} />
        {deliveryActive && (
          <>
            <div className="bg-white rounded-xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">location_on</span>
                  <h2 className="text-sm font-bold text-on-surface">روش و محل تحویل کالا</h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                  {r.pickupMethod === "COURIER" ? "ارسال با پیک اورا" : "تحویل حضوری"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface-container-low rounded-xl text-xs">
                <div>
                  <span className="text-slate-400">محل تحویل:</span>
                  <p className="font-semibold text-slate-800 mt-1">
                    {r.listing.city}
                    {r.listing.area ? `، ${r.listing.area}` : ""} — هماهنگی از طریق گفتگو
                  </p>
                </div>
                <div className="md:border-r md:border-slate-200 md:pr-4">
                  <span className="text-slate-400">زمان مقرر تحویل:</span>
                  <p className="font-bold text-m3-primary mt-1">{faDate(r.startDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">fact_check</span>
                  <h2 className="text-sm font-bold text-on-surface">بازرسی اقلام و سلامت تجهیزات</h2>
                </div>
                <span className="text-xs bg-surface-container px-2.5 py-1 rounded-full text-m3-primary font-bold">
                  وضعیت وسیله را هنگام تحویل بررسی کنید
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">sensors</span>
                  <span className="font-bold text-slate-800">بازرسی سلامت ظاهری و فنی توسط طرفین</span>
                </div>
                <span className="text-m3-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">task_alt</span> الزامی
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                در صورت مشاهده مغایرت، پیش از ادامه از دکمه «اعلام خسارت» استفاده کنید تا پرونده به کارشناسان اورا ارجاع شود؛
                این فرآیند جایگزین مراجع قانونی نیست.
              </p>
            </div>
          </>
        )}
        {deliveryDone && <CompactDone text="وسیله تحویل داده شد و دوران استفاده آغاز شد؛ عودت و صورت‌جلسه در مرحله بعد انجام می‌شود." />}
        {!deliveryDone && !deliveryActive && <CompactLocked text="تحویل کالا پس از انجام پرداخت توسط مستأجر فعال می‌شود." />}
      </section>

      {/* Stage 4: پروتکل دوطرفه و عودت */}
      <section id="protocol" className="scroll-mt-32 space-y-4">
        <SectionHeading title="پروتکل تایید دوطرفه و عودت کالا" state={protocolDone ? "done" : protocolActive ? "active" : "locked"} />
        {protocolDone && (
          <div className="space-y-3">
            <CompactDone text="صورت‌جلسه تحویل ثبت و ودیعه در حالت شبیه‌سازی آزاد شد؛ اجاره تکمیل شد." />
            {(r.renterProtocol || r.hostProtocol) && (
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 space-y-2 text-xs">
                {r.renterProtocol && (
                  <p className="text-slate-600">
                    <span className="font-bold text-slate-800">صورت‌جلسه مستأجر:</span> {r.renterProtocol}
                  </p>
                )}
                {r.hostProtocol && (
                  <p className="text-slate-600">
                    <span className="font-bold text-slate-800">صورت‌جلسه میزبان:</span> {r.hostProtocol}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {protocolActive && (
          <>
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-m3-primary text-white flex items-center justify-center font-bold text-sm">۱</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">فاز ۱: تحویل اولیه کالا</h4>
                    <p className="text-[11px] text-slate-500">ثبت اقلام و آغاز مسئولیت بیمه</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">تحویل تایید شده ✓</span>
              </div>
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <span>مهلت عودت</span>
                    <span className="text-m3-primary">{faDate(r.endDate)}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    وسیله باید در موعد مقرر عودت داده شود؛ در غیر این صورت جریمه تاخیر بر اساس تعرفه اورا محاسبه می‌شود.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 text-xs">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-2">روند عودت</div>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-center gap-2">۱. ثبت درخواست بازگشت توسط مستأجر</li>
                    <li className="flex items-center gap-2">۲. تایید بازگشت و بررسی سلامت توسط میزبان</li>
                    <li className="flex items-center gap-2">۳. ثبت صورت‌جلسه دوطرفه و آزادسازی ودیعه (شبیه‌سازی)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-m3-secondary text-white flex items-center justify-center font-bold text-sm">۲</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">فاز ۲: عودت کالا، صورت‌جلسه و بازگشت ودیعه</h4>
                    <p className="text-[11px] text-slate-500">کنش‌های طرفین بر اساس وضعیت فعلی اجاره</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusColor}`}>{statusLabel}</span>
              </div>
              <div className="p-5 space-y-4">
                {can("confirm_return") && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    سلامت فیزیکی وسیله را بررسی کنید؛ در صورت سالم بودن، بازگشت را تایید کنید تا صورت‌جلسه تکمیل شود.
                  </p>
                )}
                {can("complete_inspection") && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      صورت‌جلسه تحویل — وضعیت وسیله را شرح دهید (اختیاری):
                    </label>
                    <textarea
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value)}
                      rows={2}
                      className="w-full p-3 text-xs bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      placeholder="مثلاً: وسیله سالم و بدون خسارت بازگشت داده شد."
                    />
                  </div>
                )}
                {can("dispute") && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      شرح خلاصه ایراد یا کسری کالا برای اعلام خسارت (اختیاری):
                    </label>
                    <textarea
                      value={disputeNote}
                      onChange={(e) => setDisputeNote(e.target.value)}
                      rows={2}
                      className="w-full p-3 text-xs bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      placeholder="مثلاً: خط و خش عمیق روی لنز مشاهده شد."
                    />
                    <p className="text-[11px] text-slate-400">
                      پرونده‌ها توسط کارشناسان اورا بررسی می‌شوند؛ این فرآیند جایگزین مراجع قانونی نیست.
                    </p>
                  </div>
                )}
                <ActionRow busy={busy} visible={visibleActions} onAction={handleAction} />
              </div>
            </div>
          </>
        )}
        {!protocolDone && !protocolActive && <CompactLocked text="پروتکل دوطرفه پس از عودت کالا فعال می‌شود." />}
      </section>

      {/* Event timeline */}
      <section className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-purple-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-m3-primary text-xl">timeline</span>
          <h2 className="text-sm font-bold text-on-surface">رویدادهای این اجاره</h2>
          <span className="text-xs text-on-surface-variant">({faNumber(r.events.length)} رویداد)</span>
        </div>
        <div className="p-5">
          <ol className="relative border-r-2 border-surface-container-high mr-3 space-y-5">
            {r.events.map((e) => (
              <li key={e.id} className="mr-5 pr-1">
                <span className="absolute -right-[9px] top-1 size-4 rounded-full bg-m3-primary border-4 border-white shadow-sm"></span>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      ACTOR_STYLES[e.actor] ?? ACTOR_STYLES.system
                    }`}
                  >
                    {ACTOR_LABELS[e.actor] ?? e.actor}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{faDateTime(e.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{e.message}</p>
              </li>
            ))}
            {r.events.length === 0 && <li className="text-xs text-slate-400">رویدادی ثبت نشده است.</li>}
          </ol>
        </div>
      </section>

      {/* Sticky bottom bar (source composition) */}
      <div className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur-xl border-t border-purple-100 shadow-lg py-3 rounded-t-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="material-symbols-outlined text-emerald-600 text-lg">verified_user</span>
            <span>
              وضعیت: {statusLabel} — کد پیگیری {r.code}
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-center">
            <button
              type="button"
              onClick={openChat}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              گفتگو
            </button>
            {can("pay") && (
              <button
                type="button"
                onClick={() => act("pay")}
                disabled={busy === "pay"}
                className="px-6 py-2.5 bg-m3-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-md shadow-m3-primary/25 transition"
              >
                {busy === "pay" ? "در حال ثبت..." : "پرداخت آزمایشی (Sandbox)"}
              </button>
            )}
            {can("confirm_agreement") && (
              <button
                type="button"
                onClick={() => (agreed ? act("confirm_agreement") : toast.error("لطفاً ابتدا شرایط قرارداد را تایید فرمایید."))}
                disabled={busy === "confirm_agreement"}
                className="px-6 py-2.5 bg-m3-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-md shadow-m3-primary/25 transition flex items-center justify-center gap-1"
              >
                <span>{busy === "confirm_agreement" ? "در حال ثبت..." : "تایید قرارداد"}</span>
                <span className="material-symbols-outlined text-sm">arrow_left</span>
              </button>
            )}
            {can("deliver") && (
              <button
                type="button"
                onClick={() => act("deliver")}
                disabled={busy === "deliver"}
                className="px-6 py-2.5 bg-m3-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-md shadow-m3-primary/25 transition"
              >
                {busy === "deliver" ? "در حال ثبت..." : "تحویل شد"}
              </button>
            )}
            <Link href="/rentals" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
              بازگشت به اجاره‌ها
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- sub-components */

function SectionHeading({ title, state }: { title: string; state: "done" | "active" | "locked" }) {
  const chip =
    state === "done"
      ? { cls: "bg-emerald-100 text-emerald-800", icon: "check_circle", label: "انجام شد" }
      : state === "active"
        ? { cls: "bg-m3-primary/10 text-m3-primary", icon: "pending_actions", label: "مرحله جاری" }
        : { cls: "bg-surface-container-high text-on-surface-variant", icon: "lock", label: "غیرفعال" };
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <h2 className="text-lg font-extrabold text-[#130e1b]">{title}</h2>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${chip.cls}`}>
        <span className="material-symbols-outlined text-sm">{chip.icon}</span>
        {chip.label}
      </span>
    </div>
  );
}

function CompactDone({ text }: { text: string }) {
  return (
    <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined">task_alt</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function CompactLocked({ text }: { text: string }) {
  return (
    <div className="bg-white/70 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
      <div className="size-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined">lock</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}

function ActionRow({
  busy,
  visible,
  onAction,
}: {
  busy: string | null;
  visible: ReservationAction[];
  onAction: (a: ReservationAction) => void;
}) {
  return (
    <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <span className="material-symbols-outlined text-m3-primary text-base">touch_app</span>
        کنش‌های شما در وضعیت فعلی
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {visible.map((a) => {
          const meta = ACTION_META[a];
          return (
            <button
              key={a}
              type="button"
              disabled={busy !== null}
              onClick={() => onAction(a)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-60 ${meta.className}`}
            >
              <span className="material-symbols-outlined text-base">{meta.icon}</span>
              {busy === a ? "در حال ثبت..." : meta.label}
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="text-xs text-slate-400">در این وضعیت کنشی برای شما ثبت نشده است؛ منتظر کنش طرف مقابل باشید.</p>
        )}
      </div>
    </div>
  );
}
