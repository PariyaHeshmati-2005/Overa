"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import {
  faDateTime,
  faNumber,
  faToman,
  toPersianDigits,
} from "@/lib/format";
import { formatJalaliIso } from "@/lib/jalali";
import type { ReservationAction } from "@/lib/rental-state";
import DeliveryConfirmCard from "@/components/overa/DeliveryConfirmCard";
import ReturnConfirmCard from "@/components/overa/ReturnConfirmCard";
import SignatureCard from "@/components/overa/SignatureCard";
import MapView from "@/components/overa/MapView";

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
  depositStatus?: string | null;
  /** Payment method of the pay stage (CASH — deposit escrowed). */
  paymentMethod?: string | null;
  /** Delivery inspection outcome: PENDING | ACCEPTED_CLEAN | ACCEPTED_WITH_ISSUES | REFUSED_DAMAGE */
  deliveryStatus?: string | null;
  /** Renter's issue notes taken at delivery — arbitration evidence. */
  deliveryNote?: string | null;
  /** Timestamp of the renter's verified digital signature (null = unsigned). */
  signedByRenterAt?: string | null;
  listing: {
    id: string;
    title: string;
    specs: string | null;
    city: string;
    area: string | null;
    rating: number;
    images: string[];
    lat?: number | null;
    lng?: number | null;
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
  reservation: LifecycleReservation;
  role: "renter" | "host" | "admin";
  actions: ReservationAction[];
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  /** Signed-in user's wallet balance (Toman) — drives the pay-time warning. */
  viewerWalletBalance: number;
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
  RENTAL_ACTIVE: 4,
  RETURN_REQUESTED: 5,
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

const STEP_ICONS = [
  "search",
  "event",
  "draw",
  "lock",
  "local_shipping",
  "fact_check",
];

const ACTOR_LABELS: Record<string, string> = {
  renter: "مستأجر",
  host: "میزبان",
  admin: "مدیر",
  system: "سیستم",
};

const ACTOR_STYLES: Record<string, string> = {
  renter: "bg-amber-50 text-amber-700 border-amber-200",
  host: "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim",
  admin:
    "bg-m3-error-container text-m3-on-error-container border-m3-error-container",
  system:
    "bg-surface-container-high text-on-surface-variant border-outline-variant/60",
};

const ACTION_META: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  approve: {
    label: "تایید مالک",
    icon: "check_circle",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  reject: {
    label: "رد درخواست",
    icon: "cancel",
    className:
      "bg-m3-error-container text-m3-on-error-container hover:bg-m3-error hover:text-on-primary",
  },
  confirm_agreement: {
    label: "تایید قرارداد",
    icon: "draw",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  pay: {
    label: "پرداخت آزمایشی",
    icon: "lock_open",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  deliver: {
    label: "تحویل شد",
    icon: "local_shipping",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  confirm_delivery: {
    label: "تأیید دریافت کالا",
    icon: "package_2",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  request_return: {
    label: "درخواست بازگشت",
    icon: "replay",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  confirm_return: {
    label: "تایید بازگشت",
    icon: "fact_check",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  complete_inspection: {
    label: "ثبت صورت‌جلسه",
    icon: "task_alt",
    className:
      "bg-m3-primary text-white hover:bg-primary-container shadow-md shadow-m3-primary/25",
  },
  declare_damage: {
    label: "تحویل و اعلام خسارت",
    icon: "gavel",
    className:
      "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
  },
  dispute: {
    label: "اعلام خسارت",
    icon: "gavel",
    className:
      "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
  },
  cancel: {
    label: "لغو اجاره",
    icon: "block",
    className: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  },
};

/** Friendly icon + title for each reservation event type (timeline). */
const EVENT_META: Record<string, { title: string; icon: string }> = {
  REQUEST: { title: "ثبت درخواست اجاره", icon: "touch_app" },
  APPROVE: { title: "تایید مالک", icon: "check_circle" },
  REJECT: { title: "رد درخواست", icon: "cancel" },
  CONFIRM_AGREEMENT: { title: "تایید قرارداد", icon: "draw" },
  SIGN_AGREEMENT: { title: "امضای دیجیتال قرارداد", icon: "fingerprint" },
  PAY: { title: "پرداخت اجاره", icon: "lock_open" },
  DELIVER: { title: "ثبت تحویل کالا", icon: "local_shipping" },
  CONFIRM_DELIVERY: { title: "تایید دریافت کالا", icon: "package_2" },
  REQUEST_RETURN: { title: "ثبت بازگشت کالا", icon: "replay" },
  CONFIRM_RETURN: { title: "تایید بازگشت کالا", icon: "fact_check" },
  COMPLETE_INSPECTION: { title: "ثبت صورت‌جلسه تحویل", icon: "task_alt" },
  RELEASE_DEPOSIT: { title: "اختتامیهٔ پروندهٔ خسارت و تسویه ودیعه", icon: "payments" },
  DECLARE_DAMAGE: { title: "اعلام خسارت میزبان هنگام بازگشت کالا", icon: "gavel" },
  DISPUTE: { title: "اعلام خسارت", icon: "gavel" },
  REFUSE_DELIVERY: {
    title: "عدم تحویل و اعلام خسارت هنگام تحویل",
    icon: "block",
  },
  CANCEL: { title: "لغو رزرو", icon: "block" },
};

const ACTION_ORDER: ReservationAction[] = [
  "approve",
  "reject",
  "confirm_agreement",
  "pay",
  "deliver",
  "confirm_delivery",
  "request_return",
  "confirm_return",
  "complete_inspection",
  "declare_damage",
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
  viewerWalletBalance,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [contractTab, setContractTab] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [disputeNote, setDisputeNote] = useState("");

  const status = r.status;
  const stage = STAGE_BY_STATUS[status] ?? 2;
  const terminal = ["REJECTED", "CANCELLED"].includes(status);
  const statusLabel = statusLabels[status] ?? status;
  const statusColor =
    statusColors[status] ?? "bg-surface-container-high text-on-surface";
  const can = (a: string) => actions.includes(a as ReservationAction);
  /* Renter-side contract signature (renter ONLY — the host never signs). */
  const signatureAvailable =
    role === "renter" && ["REQUESTED", "APPROVED"].includes(status);
  const renterSigned = Boolean(r.signedByRenterAt);
  /* The pay stage charges the DEPOSIT (ودیعه) only — the daily-rate rent is
     charged after the renter confirms receipt («سلامت تحویل گرفتم»). */
  const payableNow = r.deposit;
  const insufficientBalance =
    role === "renter" && can("pay") && viewerWalletBalance < payableNow;

  /* Plain-language next step for the CURRENT viewer (kills the "what now?" deadlock). */
  type NextStep = { title: string; body: string; icon: string; anchor?: string };
  let nextStep: NextStep | null = null;
  let waitingOnOther: string | null = null;
  if (status === "REQUESTED") {
    if (role === "host") {
      nextStep = {
        title: "درخواست اجاره را بررسی و تایید کنید",
        body: "در صورت تایید، مستأجر قرارداد را با امضای دیجیتال ثبت می‌کند و پیام تایید برای شما ارسال می‌شود.",
        icon: "check_circle",
        anchor: "#contract",
      };
    } else if (role === "renter") {
      if (!renterSigned) {
        nextStep = {
          title: "قرارداد را با امضای دیجیتال ثبت کنید",
          body: "کد یک‌بارمصرف صادر شده را وارد و ثبت کنید؛ پس از امضا، پیام تایید برای میزبان ارسال می‌شود.",
          icon: "fingerprint",
          anchor: "#contract",
        };
      } else {
        waitingOnOther =
          "امضای شما ثبت شده است؛ در انتظار تایید درخواست توسط میزبان هستید.";
      }
    }
  } else if (status === "APPROVED") {
    if (role === "renter") {
      nextStep = renterSigned
        ? {
            title: "تایید قرارداد را نهایی کنید",
            body: "میزبان درخواست را تایید کرده و شما قبلاً قرارداد را امضا کرده‌اید؛ تایید قرارداد را ثبت کنید.",
            icon: "draw",
            anchor: "#contract",
          }
        : {
            title: "قرارداد را با امضای دیجیتال تایید کنید",
            body: "میزبان درخواست شما را تایید کرده است؛ کد یک‌بارمصرف امضا را وارد و ثبت کنید.",
            icon: "fingerprint",
            anchor: "#contract",
          };
    } else {
      waitingOnOther = "تایید شما ثبت شده است؛ در انتظار امضای قرارداد توسط مستأجر هستید.";
    }
  } else if (status === "AGREEMENT" || status === "PAYMENT") {
    if (role === "renter") {
      nextStep = {
        title: insufficientBalance
          ? "ابتدا کیف پول را شارژ کنید، سپس ودیعه را پرداخت کنید"
          : "ودیعه (بدون هزینهٔ اجاره) را پرداخت کنید",
        body: insufficientBalance
          ? `موجودی کیف پول شما ${faToman(viewerWalletBalance)} تومان است؛ ودیعهٔ این سفارش ${faToman(payableNow)} تومان است.`
          : `ودیعهٔ قابل پرداخت ${faToman(payableNow)} تومان است (بازگشت‌پذیر)؛ هزینهٔ اجارهٔ روزانه پس از تأیید دریافت کالا محاسبه می‌شود.`,
        icon: insufficientBalance ? "account_balance_wallet" : "lock_open",
        anchor: "#payment",
      };
    } else {
      waitingOnOther = "در انتظار پرداخت ودیعه توسط مستأجر هستید.";
    }
  } else if (status === "PAID") {
    if (role === "host") {
      nextStep = {
        title: "کالا را به مستأجر تحویل دهید و «تحویل شد» را ثبت کنید",
        body: "ودیعه پرداخت و بلوکه شده است؛ پس از ثبت تحویل، کد تأیید دریافت برای مستأجر صادر می‌شود.",
        icon: "local_shipping",
        anchor: "#delivery",
      };
    } else {
      waitingOnOther = "ودیعهٔ شما ثبت شده است؛ در انتظار تحویل کالا از سوی میزبان هستید.";
    }
  } else if (status === "DELIVERED") {
    if (role === "renter") {
      nextStep = {
        title: "دریافت کالا را با کد یک‌بارمصرف تأیید کنید",
        body: "کالا را بازرسی کنید؛ در صورت سلامت، کارت «تأیید دریافت کالا» را با کد صادرشده تکمیل کنید؛ با تأیید شما روند اجاره آغاز و هزینهٔ اجارهٔ روزانه کسر می‌شود.",
        icon: "package_2",
        anchor: "#delivery",
      };
    } else {
      waitingOnOther = "تحویل شما ثبت شده است؛ در انتظار تأیید دریافت کالا توسط مستأجر هستید.";
    }
  } else if (status === "RENTAL_ACTIVE") {
    if (role === "renter") {
      nextStep = {
        title: "در پایان دوره اجاره، بازگشت کالا را ثبت کنید",
        // No anchor jump: the «ثبت بازگشت کالا» panel renders directly below
        // this card, so on the return day the action is already open.
        body: `مهلت عودت ${formatJalaliIso(r.endDate.slice(0, 10))} است؛ کارت «ثبت بازگشت کالا» در همین‌جا باز است.`,
        icon: "replay",
      };
    } else {
      waitingOnOther = "دوره اجاره فعال است؛ در انتظار ثبت بازگشت از سوی مستأجر.";
    }
  } else if (status === "RETURN_REQUESTED") {
    if (role === "host") {
      nextStep = {
        title: "سلامت کالا را بررسی و بازگشت را تأیید کنید",
        // No anchor jump: the host decision card (تحویل سالم گرفتم /
        // تحویل و اعلام خسارت) renders directly below this guidance card.
        body: "کارت «تأیید دریافت کالا» در همین‌جا باز است؛ در صورت سلامت «تحویل سالم گرفتم» را تأیید کنید تا ودیعه خودکار آزاد شود یا «تحویل و اعلام خسارت» را ثبت کنید.",
        icon: "fact_check",
      };
    } else {
      waitingOnOther = "بازگشت شما ثبت شده است؛ در انتظار تأیید میزبان هستید.";
    }
  } else if (status === "INSPECTION") {
    nextStep = {
      title: "صورت‌جلسه تحویل را تکمیل کنید",
      body: "وضعیت نهایی وسیله را ثبت کنید تا سفارش تکمیل گردد.",
      icon: "task_alt",
      anchor: "#protocol",
    };
  } else if (status === "DISPUTED") {
    nextStep = {
      title: "پرونده در بخش «اعلام خسارت‌ها» پنل مدیریت در حال بررسی است",
      body: "کارشناسان اٌوِرا از طریق گفتگوی پرونده با شما در ارتباط هستند؛ رأی (درصد آزادسازی ودیعه) حداکثر تا یک هفته صادر و در همین صفحه اعلام می‌شود.",
      icon: "gavel",
      anchor: "#protocol",
    };
  } else if (status === "COMPLETED") {
    if (role === "renter") {
      nextStep = {
        title: "دیدگاه خود را درباره این اجاره ثبت کنید",
        body: "تجربه شما به میزبان و اجاره‌کنندگان بعدی کمک می‌کند.",
        icon: "rate_review",
      };
    } else {
      waitingOnOther = "این سفارش با موفقیت تکمیل شد.";
    }
  }
  /* OTP-gated actions never render as plain buttons: the renter's delivery
     confirmation and the host's RETURN_REQUESTED confirmation go through the
     confirmation cards (OtpConfirmFlow). The legacy RETURNED → INSPECTION
     confirm_return stays a plain action for old reservations. */
  const visibleActions = ACTION_ORDER.filter(
    (a) =>
      can(a) &&
      a !== "confirm_delivery" &&
      /* «اعلام خسارت» is contextual: at DELIVERED it lives in the renter's
         delivery card (عدم تحویل و اعلام خسارت); at RETURN_REQUESTED the
         host's «تحویل و اعلام خسارت» form (declare_damage) lives in the
         return card. Only the mid-rental stage keeps ONE plain row button. */
      !(a === "dispute" && status !== "RENTAL_ACTIVE") &&
      !(a === "declare_damage") &&
      !(a === "confirm_return" && status === "RETURN_REQUESTED") &&
      // While the signature card is active, «تایید قرارداد» happens through
      // the renter's one-time-code signature — not a plain button.
      !(a === "confirm_agreement" && signatureAvailable && !renterSigned) &&
      // Once already signed (before the host approved), a re-sign is
      // impossible; finalize via the plain action after approval.
      !(a === "confirm_agreement" && renterSigned && status !== "APPROVED"),
  );
  const image = r.listing.images[0] ?? null;

  async function act(
    action: ReservationAction,
    extra?: Record<string, string>,
  ) {
    setBusy(action);
    try {
      const res = await fetch(`/api/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.extra?.needTopup) {
          toast.error(
            "موجودی کیف پول شما برای این پرداخت کافی نیست؛ لطفاً ابتدا کیف پول را شارژ کنید.",
            { duration: 6000 },
          );
          router.push("/wallet");
          return;
        }
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
      act(
        "complete_inspection",
        protocol.trim() ? { protocol: protocol.trim() } : undefined,
      );
      return;
    }
    if (a === "dispute") {
      act(
        "dispute",
        disputeNote.trim() ? { note: disputeNote.trim() } : undefined,
      );
      return;
    }
    act(a);
  }

  /* Section states: done | active | locked */
  const contractDone = stage > 2 && !terminal;
  const contractActive =
    !terminal && ["REQUESTED", "APPROVED", "AGREEMENT"].includes(status);
  const paymentDone = [
    "PAID",
    "DELIVERED",
    "RENTAL_ACTIVE",
    "RETURN_REQUESTED",
    "RETURNED",
    "INSPECTION",
    "COMPLETED",
    "DISPUTED",
  ].includes(status);
  const paymentActive = can("pay");
  const deliveryDone = [
    "RENTAL_ACTIVE",
    "RETURN_REQUESTED",
    "RETURNED",
    "INSPECTION",
    "COMPLETED",
  ].includes(status);
  const deliveryActive = ["PAID", "DELIVERED"].includes(status);
  const protocolDone = status === "COMPLETED";
  const protocolActive = [
    "RETURN_REQUESTED",
    "RETURNED",
    "INSPECTION",
    "DISPUTED",
  ].includes(status);
  /* Deposit-aware copy for completed orders (new OTP flow vs legacy data). */
  const depositPendingRefund =
    status === "COMPLETED" && r.depositStatus === "REFUND_PENDING";

  const contractTerms = `این قرارداد بین ${r.renter.name} (مستأجر) و ${r.host.name} (میزبان)، بر اساس قوانین پلتفرم اٌوِرا و شرایط توافق‌شده، تنظیم گردیده و برای هر دو طرف لازم‌الاجرا می‌باشد. کلیه پرداخت‌ها و ودیعه‌ها در حالت شبیه‌سازی (Sandbox) ثبت می‌شوند و هیچ پول واقعی جابه‌جا نمی‌شود.`;

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Toaster position="top-center" richColors />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-slate-600">
          خانه
        </Link>
        <span>‹</span>
        <Link href="/rentals" className="hover:text-slate-600">
          اجاره‌های من
        </Link>
        <span>‹</span>
        <span className="text-m3-primary font-semibold">
          روند اجاره {r.code}
        </span>
      </nav>

      {/* Order Highlight Card (source screen-4 composition) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                timer
              </span>
              {statusLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">
              میزبان: {r.host.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
              مستأجر: {r.renter.name}
            </span>
            <span className="text-xs text-on-surface-variant font-mono">
              سفارش #{r.code}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {r.listing.title}
          </h3>
          {r.listing.specs && (
            <p className="text-xs text-slate-500">{r.listing.specs}</p>
          )}
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
                <span className="material-symbols-outlined text-sm">
                  rate_review
                </span>
                ثبت دیدگاه
              </Link>
            )}
          </div>
        </div>
        {image ? (
          <img
            className="w-36 h-28 object-cover rounded-xl border border-slate-100"
            src={image}
            alt={r.listing.title}
          />
        ) : (
          <div className="w-36 h-28 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-3xl">
              package_2
            </span>
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
          {depositPendingRefund
            ? "اجاره تکمیل شد؛ فرآیند بازگشت ودیعه در حالت شبیه‌سازی آغاز گردید."
            : "اجاره تکمیل شد؛ ودیعه به‌صورت خودکار به کیف پول مستأجر واریز شد."}
        </div>
      )}

      {/* Stepper Flow — faithful to source stepper */}
      <section className="border border-purple-100/70 rounded-2xl py-6 px-2 sm:px-10 shadow-sm relative overflow-hidden bg-primary-soft/70">
        <div
          className="max-w-4xl mx-auto flex items-center justify-between relative"
          dir="rtl"
        >
          {STEPS.map((s, i) => {
            const isPre = i < 2;
            const done = isPre || (status === "COMPLETED" ? true : i < stage);
            const current =
              !isPre && !terminal && i === stage && status !== "COMPLETED";
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
                      <span className="material-symbols-outlined text-base">
                        {STEP_ICONS[i]}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs">
                      {toPersianDigits(i + 1)}
                    </div>
                  )}
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${
                      current
                        ? "text-m3-primary font-extrabold"
                        : done
                          ? "text-slate-500"
                          : "text-slate-400"
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
        <SectionHeading
          title="قرارداد و ضمانت"
          state={
            terminal
              ? "locked"
              : contractDone
                ? "done"
                : contractActive
                  ? "active"
                  : "locked"
          }
        />
        {contractActive && (
          <>
            <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold text-slate-600">
              {["قرارداد اجاره", "شرایط ضمانت‌نامه", "اطلاعات ودیعه"].map(
                (t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setContractTab(i)}
                    className={`flex-1 py-2 rounded-xl transition ${
                      contractTab === i
                        ? "bg-white text-m3-primary font-bold shadow-sm"
                        : "hover:text-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-soft text-m3-primary rounded-lg">
                    <span className="material-symbols-outlined text-lg">
                      gavel
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {contractTab === 0
                      ? "قرارداد اجاره وسایل اٌوِرا"
                      : contractTab === 1
                        ? "شرایط ضمانت‌نامه و بیمه"
                        : "اطلاعات ودیعه امانی"}
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">
                  کد رزرو: {r.code}
                </span>
              </div>

              {contractTab === 0 && (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed text-justify">
                    {contractTerms}
                  </p>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-800">
                        مشخصات وسیله:
                      </div>
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
                      <div className="font-bold text-slate-800">
                        مدت زمان اجاره:
                      </div>
                      <div className="text-slate-600">
                        از {formatJalaliIso(r.startDate.slice(0, 10))} تا{" "}
                        {formatJalaliIso(r.endDate.slice(0, 10))} (
                        {faNumber(r.days)} روز کامل)
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
                      با مطالعه و تأیید این قرارداد، موافقت خود را با شرایط
                      اجاره و ضمانت‌نامه اعلام می‌کنم.
                    </span>
                  </label>
                </>
              )}
              {contractTab === 1 && (
                <p className="text-xs text-slate-500 leading-relaxed text-justify">
                  ضمانت‌نامه اٌوِرا سلامت کالا در زمان تحویل و عودت را پوشش
                  می‌دهد. در صورت اعلام خسارت، پرونده در بخش «اعلام خسارت‌ها»
                  پنل مدیریت توسط کارشناسان اٌوِرا بررسی و رأی حداکثر ظرف یک
                  هفته اجرا می‌شود؛ این فرآیند جایگزین مراجع قانونی نیست. ودیعه
                  در صورت بازگشت سالم به‌صورت خودکار به کیف پول مستأجر آزاد
                  می‌شود.
                </p>
              )}
              {contractTab === 2 && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">
                      ودیعه امانی (قابل استرداد):
                    </span>
                    <span className="font-bold text-m3-primary">
                      {faToman(r.deposit)} تومان
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">
                      اجاره {faNumber(r.days)} روزه:
                    </span>
                    <span className="font-bold text-slate-800">
                      {faToman(r.subtotal)} تومان
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ودیعه در حالت شبیه‌سازی (Sandbox) بلوکه می‌شود و هیچ پول
                    واقعی جابه‌جا نمی‌شود.
                  </p>
                </div>
              )}
            </div>

            {/* Digital signature — RENTER ONLY (demo code flow). The host
                never signs; their approval is the plain state-machine action.
                After the renter signs, a notification asks the host to
                confirm the contract as well. */}
            {signatureAvailable && !renterSigned && (
              <SignatureCard
                reservationId={r.id}
                code={r.code}
                hostName={r.host.name}
                agreed={agreed}
              />
            )}
            {signatureAvailable && renterSigned && status === "REQUESTED" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                <div className="size-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">fingerprint</span>
                </div>
                <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                  امضای دیجیتال شما ({faDateTime(r.signedByRenterAt ?? "")}) ثبت شد؛
                  پیام تایید برای میزبان ارسال گردید. پس از تایید مالک، قرارداد
                  نهایی می‌شود.
                </p>
              </div>
            )}
            {role === "host" && status === "REQUESTED" && (
              <div className="rounded-2xl border border-purple-100 bg-primary-soft/50 p-4 flex items-start gap-3">
                <div className="size-9 rounded-xl bg-primary-soft text-m3-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">hourglass_top</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  امضای دیجیتال قرارداد بر عهده مستأجر است. پس از امضای مستأجر،
                  پیامی برای شما ارسال می‌شود تا درخواست را تایید کنید.
                </p>
              </div>
            )}

            <ActionRow
              busy={busy}
              visible={visibleActions}
              onAction={handleAction}
            />
          </>
        )}
        {contractDone && !terminal && (
          <CompactDone
            text={`قرارداد و ضمانت‌نامه تایید شد؛ ودیعه ${faToman(r.deposit)} تومان در مرحلهٔ پرداخت بلوکه می‌شود و هزینهٔ اجارهٔ روزانه پس از تأیید دریافت کالا محاسبه می‌گردد.`}
          />
        )}
        {terminal && (
          <CompactLocked text="این مرحله برای رزروهای ردشده یا لغوشده فعال نمی‌شود." />
        )}
      </section>

      {/* Stage 2: پرداخت و تسویه */}
      <section id="payment" className="scroll-mt-32 space-y-4">
        <SectionHeading
          title="پرداخت و تسویه امانی"
          state={paymentDone ? "done" : paymentActive ? "active" : "locked"}
        />
        {paymentDone && (
          <CompactDone
            text={`وديعهٔ ${faToman(r.deposit)} تومان در حالت آزمایشی (Sandbox) پرداخت و بلوکه شد؛ هزینهٔ اجارهٔ روزانه (${faToman(r.subtotal)} تومان) پس از تأیید دریافت کالا محاسبه می‌شود؛ هیچ پول واقعی جابه‌جا نمی‌شود.`}
          />
        )}
        {!paymentDone && paymentActive && (
          <>
            {/* Escrow Banner */}
            <div className="w-full bg-gradient-to-tr from-surface-container-high via-surface-container-lowest to-surface-container rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 border border-purple-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-m3-primary to-primary-container text-white flex items-center justify-center shrink-0 shadow-md shadow-m3-primary/25">
                  <span className="material-symbols-outlined text-2xl">
                    shield_lock
                  </span>
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="text-base font-bold text-on-surface">
                      حساب امانی ودیعه اٌوِرا
                    </span>
                    <span className="bg-m3-primary/10 text-m3-primary text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        verified
                      </span>
                      تضمین اٌوِرا
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    مبلغ ودیعه تا زمان عودت تأییدشده کالا نزد صندوق امانی اٌوِرا
                    (شبیه‌سازی) مسدود می‌ماند.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl shrink-0 shadow-sm border border-purple-100 z-10">
                <span className="material-symbols-outlined text-m3-primary text-xl">
                  verified_user
                </span>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-on-surface font-bold">
                    مجوز نماد امانت‌داری
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    محیط آزمایشی اٌوِرا
                  </span>
                </div>
              </div>
            </div>

            {/* Deposit payment + breakdown (source screen-2 composition) */}
            <section className="bg-white rounded-xl p-5 shadow-sm border border-purple-100/60">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-on-surface">
                  ۱. پرداخت ودیعه امانی
                </h2>
                <span className="text-xs text-m3-secondary font-semibold">
                  بدون کارمزد
                </span>
              </div>

              <div className="bg-surface-container p-3 rounded-lg flex items-start gap-2.5 text-xs text-on-surface">
                <span className="material-symbols-outlined text-m3-primary text-base shrink-0 mt-0.5">
                  info
                </span>
                <span>
                  <span>
                    <strong>ضمانت امانی نقدی:</strong> مبلغ{" "}
                    {faToman(r.deposit)} تومان از طریق درگاه پرداخت و بلوکه
                    می‌شود و بلافاصله پس از ثبت تأیید سلامت در عودت، به‌صورت
                    خودکار به کیف پول شما مسترد خواهد شد (شبیه‌سازی). هزینهٔ
                    اجارهٔ روزانه جداگانه و پس از تأیید دریافت کالا محاسبه
                    می‌شود.
                  </span>
                </span>
              </div>

              <div className="space-y-3 mt-4">
                <h2 className="text-sm font-bold text-on-surface">
                  ۲. صورت‌حساب شفاف مالی
                </h2>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-600">
                    کرایه اجاره {faNumber(r.days)} روزه {r.listing.title}{" "}
                    (پس از تأیید دریافت کالا):
                  </span>
                  <span className="font-bold text-slate-800">
                    {faToman(r.subtotal)} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-high text-xs">
                  <span className="font-bold text-m3-primary">
                    ودیعه امانی مسدودشونده (قابل استرداد) — پرداخت همین حالا:
                  </span>
                  <span className="font-extrabold text-m3-primary text-sm">
                    {faToman(r.deposit)} تومان
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-800">
                      مجموع پرداختی در درگاه:
                    </span>
                    <div className="text-[11px] text-slate-400">
                      فقط ودیعه — هزینهٔ اجارهٔ روزانه پس از تأیید دریافت کالا
                      از کیف پول کسر می‌شود
                    </div>
                  </div>
                  <div className="text-base font-extrabold text-m3-primary">
                    {faToman(payableNow)} تومان
                  </div>
                </div>

                {/* Mandatory sandbox label INSIDE the payment card */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-fixed/60 border border-primary-fixed-dim text-xs text-on-primary-fixed-variant">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                    science
                  </span>
                  <span className="font-bold leading-relaxed">
                    پرداخت آزمایشی (Sandbox) — هیچ پول واقعی جابه‌جا نمی‌شود
                  </span>
                </div>

                {/* Wallet balance guard: no negative balances — the renter must
                    top up first (server enforces the same rule). */}
                {insufficientBalance && (
                  <div className="rounded-xl border border-m3-error/30 bg-m3-error-container/40 p-3.5 space-y-2">
                    <p className="text-xs font-bold text-m3-on-error-container flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">
                        account_balance_wallet
                      </span>
                      موجودی کیف پول شما کافی نیست
                    </p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      موجودی فعلی: {faToman(viewerWalletBalance)} تومان — ودیعهٔ
                      این سفارش: {faToman(payableNow)} تومان. ابتدا کیف پول را
                      شارژ کنید، سپس پرداخت را انجام دهید.
                    </p>
                    <Link
                      href="/wallet"
                      className="inline-flex items-center gap-1 rounded-lg bg-m3-primary px-3.5 py-2 text-[11px] font-bold text-white"
                    >
                      <span className="material-symbols-outlined text-sm">
                        add_card
                      </span>
                      شارژ کیف پول
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => can("pay") && act("pay")}
                  disabled={!can("pay") || busy === "pay"}
                  title={
                    insufficientBalance
                      ? "ابتدا کیف پول را شارژ کنید"
                      : undefined
                  }
                  className={`w-full mt-2 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] ${
                    can("pay") && !insufficientBalance
                      ? "bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25"
                      : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    lock_open
                  </span>
                  <span>
                    {busy === "pay"
                      ? "در حال ثبت پرداخت..."
                      : "پرداخت ودیعه و انتقال به درگاه (Sandbox)"}
                  </span>
                </button>
              </div>
            </section>
          </>
        )}
        {!paymentDone && !paymentActive && (
          <CompactLocked text="این مرحله پس از تایید قرارداد فعال می‌شود." />
        )}
      </section>

      {/* Stage 3: تحویل و بازرسی */}
      <section id="delivery" className="scroll-mt-32 space-y-4">
        <SectionHeading
          title="تحویل و بازرسی سلامت کالا"
          state={deliveryDone ? "done" : deliveryActive ? "active" : "locked"}
        />
        {/* Host's hand-over recording — one clear CTA in the stage where it
            belongs (previously buried in the sticky bar). */}
        {role === "host" && status === "PAID" && (
          <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary text-xl">
                local_shipping
              </span>
              <p className="text-xs font-extrabold text-slate-800">
                تحویل کالا به مستأجر
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              کالا را در قرار مقرر به مستأجر تحویل دهید و دکمهٔ زیر را بزنید؛
              پس از ثبت تحویل، کد یک‌بارمصرف تأیید دریافت برای مستأجر صادر
              می‌شود و دورهٔ اجاره با تأیید او فعال خواهد شد.
            </p>
            <button
              type="button"
              onClick={() => handleAction("deliver")}
              disabled={busy === "deliver"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-m3-primary text-white text-xs font-bold shadow-md shadow-m3-primary/25 transition active:scale-[0.99] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">
                local_shipping
              </span>
              {busy === "deliver" ? "در حال ثبت تحویل…" : "ثبت تحویل کالا (تحویل شد)"}
            </button>
          </div>
        )}
        {role === "renter" && status === "DELIVERED" && (
          <DeliveryConfirmCard
            reservationId={r.id}
            code={r.code}
            listingTitle={r.listing.title}
            hostName={r.host.name}
          />
        )}
        {/* Goods-receipt status — visible to BOTH sides (renter, host and the
            admin who opens this lifecycle) right in the delivery stage. */}
        {(r.deliveryStatus === "ACCEPTED_CLEAN" ||
          r.deliveryStatus === "ACCEPTED_WITH_ISSUES") && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-2 text-xs text-emerald-800 font-bold leading-6">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
              package_2
            </span>
            کالا تحویل گرفته شد
            {r.deliveryStatus === "ACCEPTED_WITH_ISSUES"
              ? " (با یادداشت مشکلات مستأجر — متن یادداشت در ادامه آمده است)"
              : " (سالم)"}{" "}
            — تأیید دریافت با کد یک‌بارمصرف ثبت شد.
          </div>
        )}
        {/* The renter's delivery inspection note — visible to BOTH sides and
            used as arbitration evidence if a damage claim follows. */}
        {r.deliveryNote && (
          <div className="rounded-2xl border border-accent-gold/40 bg-accent-gold/10 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-accent-gold">
              <span className="material-symbols-outlined text-base">
                report_problem
              </span>
              یادداشت بازرسی تحویل مستأجر
              {r.deliveryStatus === "REFUSED_DAMAGE" && " — اجاره باطل شد"}
            </div>
            <p className="text-xs text-slate-700 leading-6 whitespace-pre-wrap">
              {r.deliveryNote}
            </p>
            <p className="text-[11px] text-slate-500">
              این یادداشت در بخش «اعلام خسارت‌ها» پنل مدیریت مبنای رسیدگی قرار
              می‌گیرد.
            </p>
          </div>
        )}
        {deliveryActive && (
          <>
            <div className="bg-white rounded-xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">
                    location_on
                  </span>
                  <h2 className="text-sm font-bold text-on-surface">
                    روش و محل تحویل کالا
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                  {r.pickupMethod === "COURIER"
                    ? "ارسال با پیک اٌوِرا"
                    : "تحویل حضوری"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface-container-low rounded-xl text-xs">
                <div>
                  <span className="text-slate-400">محل تحویل:</span>
                  <p className="font-semibold text-slate-800 mt-1">
                    {r.listing.city}
                    {r.listing.area ? `، ${r.listing.area}` : ""} — هماهنگی از
                    طریق گفتگو
                  </p>
                </div>
                <div className="md:border-r md:border-slate-200 md:pr-4">
                  <span className="text-slate-400">زمان مقرر تحویل:</span>
                  <p className="font-bold text-m3-primary mt-1">
                    {formatJalaliIso(r.startDate.slice(0, 10))}
                  </p>
                </div>
              </div>
              {/* Exact pickup location on the shared map (city centroid when
                  the listing has no saved coordinates). */}
              <MapView
                lat={r.listing.lat}
                lng={r.listing.lng}
                city={r.listing.city}
                area={r.listing.area}
                title={r.listing.title}
                height={180}
              />
            </div>

            <div className="bg-white rounded-xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">
                    fact_check
                  </span>
                  <h2 className="text-sm font-bold text-on-surface">
                    بازرسی اقلام و سلامت تجهیزات
                  </h2>
                </div>
                <span className="text-xs bg-surface-container px-2.5 py-1 rounded-full text-m3-primary font-bold">
                  وضعیت وسیله را هنگام تحویل بررسی کنید
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">
                    sensors
                  </span>
                  <span className="font-bold text-slate-800">
                    بازرسی سلامت ظاهری و فنی توسط طرفین
                  </span>
                </div>
                <span className="text-m3-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    task_alt
                  </span>{" "}
                  الزامی
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                در صورت مشاهده مغایرت، پیش از ادامه از گزینهٔ «عدم تحویل و اعلام
                خسارت» در کارت تأیید دریافت استفاده کنید تا پرونده به کارشناسان
                اٌوِرا ارجاع شود؛ این فرآیند جایگزین مراجع قانونی نیست.
              </p>
            </div>
          </>
        )}
        {deliveryDone && (
          <CompactDone text="دریافت کالا تأیید شد و دوره اجاره فعال است؛ عودت و صورت‌جلسه در مرحله بعد انجام می‌شود." />
        )}
        {!deliveryDone && !deliveryActive && (
          <CompactLocked text="تحویل کالا پس از انجام پرداخت توسط مستأجر فعال می‌شود." />
        )}
      </section>

      {/* Stage 4: پروتکل دوطرفه و عودت */}
      <section id="protocol" className="scroll-mt-32 space-y-4">
        <SectionHeading
          title="پروتکل تایید دوطرفه و عودت کالا"
          state={protocolDone ? "done" : protocolActive ? "active" : "locked"}
        />
        {protocolDone && (
          <div className="space-y-3">
            <CompactDone
              text={
                depositPendingRefund
                  ? "بازگشت کالا با کد یک‌بارمصرف تأیید و سفارش تکمیل شد؛ فرآیند بازگشت ودیعه در حالت شبیه‌سازی آغاز گردید."
                  : "بازگشت کالا تأیید و ودیعه به‌صورت خودکار به کیف پول مستأجر واریز شد؛ اجاره تکمیل شد."
              }
            />
            {(r.renterProtocol || r.hostProtocol) && (
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 space-y-2 text-xs">
                {r.renterProtocol && (
                  <p className="text-slate-600">
                    <span className="font-bold text-slate-800">
                      صورت‌جلسه مستأجر:
                    </span>{" "}
                    {r.renterProtocol}
                  </p>
                )}
                {r.hostProtocol && (
                  <p className="text-slate-600">
                    <span className="font-bold text-slate-800">
                      صورت‌جلسه میزبان:
                    </span>{" "}
                    {r.hostProtocol}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {protocolActive && (
          <>
            {/* Host decision card moved to the inline return panel right under
                the «گام بعدی شما» guidance — no scrolling to #protocol needed. */}
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-m3-primary text-white flex items-center justify-center font-bold text-sm">
                    ۱
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      فاز ۱: تحویل اولیه کالا
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ثبت اقلام و آغاز مسئولیت بیمه
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  تحویل تایید شده ✓
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <span>مهلت عودت</span>
                    <span className="text-m3-primary">
                      {formatJalaliIso(r.endDate.slice(0, 10))}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    وسیله باید در موعد مقرر عودت داده شود؛ در غیر این صورت جریمه
                    تاخیر بر اساس تعرفه اٌوِرا محاسبه می‌شود.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 text-xs">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-2">
                    روند عودت
                  </div>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-center gap-2">
                      ۱. ثبت درخواست بازگشت توسط مستأجر
                    </li>
                    <li className="flex items-center gap-2">
                      ۲. تایید بازگشت و بررسی سلامت توسط میزبان
                    </li>
                    <li className="flex items-center gap-2">
                      ۳. تکمیل سفارش و آغاز فرآیند بازگشت ودیعه (شبیه‌سازی)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-m3-secondary text-white flex items-center justify-center font-bold text-sm">
                    ۲
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      فاز ۲: عودت کالا، صورت‌جلسه و بازگشت ودیعه
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      کنش‌های طرفین بر اساس وضعیت فعلی اجاره
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="p-5 space-y-4">
                {can("confirm_return") && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    سلامت فیزیکی وسیله را بررسی کنید؛ در صورت سالم بودن، بازگشت
                    را تایید کنید تا صورت‌جلسه تکمیل شود.
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
                      پرونده‌ها توسط کارشناسان اٌوِرا بررسی می‌شوند؛ این فرآیند
                      جایگزین مراجع قانونی نیست.
                    </p>
                  </div>
                )}
                <ActionRow
                  busy={busy}
                  visible={visibleActions}
                  onAction={handleAction}
                />
              </div>
            </div>
          </>
        )}
        {!protocolDone && !protocolActive && (
          <CompactLocked text="پروتکل دوطرفه پس از عودت کالا فعال می‌شود." />
        )}
      </section>

      {/* Next-step guidance — the single source of "what do I do now?" */}
      {nextStep && !terminal && (
        <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="size-10 rounded-xl bg-primary-soft text-m3-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">
              {nextStep.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-slate-800">
              گام بعدی شما: {nextStep.title}
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              {nextStep.body}
            </p>
          </div>
          {nextStep.anchor && (
            <a
              href={nextStep.anchor}
              className="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-m3-primary text-white text-xs font-bold shadow-md shadow-m3-primary/25"
            >
              رفتن به مرحله مربوطه
              <span className="material-symbols-outlined text-sm">arrow_left</span>
            </a>
          )}
        </div>
      )}
      {/* Inline return flow — opens automatically at the return stage, right
          below the guidance card. The renter registers the hand-back here
          (one press, no jump); the host gets the OTP healthy-return /
          damage-declaration card in the same spot. Every action lands in the
          «رویدادهای این اجاره» timeline below. */}
      {!terminal && role === "renter" && status === "RENTAL_ACTIVE" && (
        <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-xl">
              replay
            </span>
            <p className="text-xs font-extrabold text-slate-800">
              ثبت بازگشت کالا به میزبان
            </p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            وسیله را در روز عودت ({formatJalaliIso(r.endDate.slice(0, 10))}) به
            میزبان بازگردانید و دکمهٔ زیر را بزنید؛ میزبان اعلان می‌گیرد، سلامت
            کالا را بررسی و با کد یک‌بارمصرف تأیید می‌کند. ثبت بازگشت بلافاصله
            در رویدادهای همین اجاره نوشته می‌شود.
          </p>
          <button
            type="button"
            onClick={() => handleAction("request_return")}
            disabled={busy === "request_return"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-m3-primary text-white text-xs font-bold shadow-md shadow-m3-primary/25 transition active:scale-[0.99] disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">replay</span>
            {busy === "request_return"
              ? "در حال ثبت بازگشت…"
              : "ثبت درخواست بازگشت کالا"}
          </button>
        </div>
      )}
      {!terminal && role === "host" && status === "RETURN_REQUESTED" && (
        <ReturnConfirmCard
          reservationId={r.id}
          code={r.code}
          listingTitle={r.listing.title}
          renterName={r.renter.name}
        />
      )}
      {waitingOnOther && !terminal && (
        <div className="rounded-2xl border border-slate-200 bg-surface-container-low p-3.5 text-xs text-slate-600 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-m3-secondary text-base">
            hourglass_top
          </span>
          {waitingOnOther}
        </div>
      )}

      {/* Event timeline — grouped by actor, icon per event type, newest first */}
      <section className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-purple-100 flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-m3-primary text-xl">
            timeline
          </span>
          <h2 className="text-sm font-bold text-on-surface">
            رویدادهای این اجاره
          </h2>
          <span className="text-xs text-on-surface-variant">
            ({faNumber(r.events.length)} رویداد)
          </span>
          <div className="flex items-center gap-2 mr-auto text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="size-2 rounded-full bg-amber-400"></span>
              مستأجر
            </span>
            <span className="inline-flex items-center gap-1 text-m3-secondary">
              <span className="size-2 rounded-full bg-m3-secondary"></span>
              میزبان
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <span className="size-2 rounded-full bg-slate-300"></span>
              سیستم
            </span>
          </div>
        </div>
        <div className="p-5">
          <ol className="relative border-r-2 border-surface-container-high mr-3 space-y-4">
            {r.events
              .slice()
              .reverse()
              .map((e) => {
                const meta = EVENT_META[e.type] ?? {
                  title: "رویداد سفارش",
                  icon: "flag",
                };
                const actorLabel = ACTOR_LABELS[e.actor] ?? e.actor;
                const isRenter = e.actor === "renter";
                const isHost = e.actor === "host";
                const dotCls = isRenter
                  ? "bg-amber-400"
                  : isHost
                    ? "bg-m3-secondary"
                    : "bg-slate-300";
                const iconBgCls = isRenter
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : isHost
                    ? "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim"
                    : "bg-surface-container-high text-on-surface-variant border-outline-variant/60";
                const whoName = isRenter
                  ? r.renter.name
                  : isHost
                    ? r.host.name
                    : null;
                return (
                  <li key={e.id} className="mr-5 pr-1">
                    <span
                      className={`absolute -right-[9px] top-1 size-4 rounded-full ${dotCls} border-4 border-white shadow-sm`}
                    ></span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${iconBgCls}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {meta.icon}
                        </span>
                        {meta.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          ACTOR_STYLES[e.actor] ?? ACTOR_STYLES.system
                        }`}
                      >
                        {actorLabel}
                        {whoName ? `: ${whoName}` : ""}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {faDateTime(e.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5 text-justify">
                      {e.message}
                    </p>
                  </li>
                );
              })}
            {r.events.length === 0 && (
              <li className="text-xs text-slate-400">رویدادی ثبت نشده است.</li>
            )}
          </ol>
        </div>
      </section>

      {/* Sticky bottom bar (source composition) */}
      <div className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur-xl border-t border-purple-100 shadow-lg py-3 rounded-t-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="material-symbols-outlined text-emerald-600 text-lg">
              verified_user
            </span>
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
            {/* Deliberately minimal: every PRIMARY action (pay, agreement,
                delivery, return, damage) lives inside its own stage card in
                the page flow — the sticky bar only carries navigation aids so
                the user never faces duplicate or confusing buttons. */}
            <Link
              href="/rentals"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              بازگشت به اجاره‌ها
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- sub-components */

function SectionHeading({
  title,
  state,
}: {
  title: string;
  state: "done" | "active" | "locked";
}) {
  const chip =
    state === "done"
      ? {
          cls: "bg-emerald-100 text-emerald-800",
          icon: "check_circle",
          label: "انجام شد",
        }
      : state === "active"
        ? {
            cls: "bg-m3-primary/10 text-m3-primary",
            icon: "pending_actions",
            label: "مرحله جاری",
          }
        : {
            cls: "bg-surface-container-high text-on-surface-variant",
            icon: "lock",
            label: "غیرفعال",
          };
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <h2 className="text-lg font-extrabold text-[#130e1b]">{title}</h2>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${chip.cls}`}
      >
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
        <span className="material-symbols-outlined text-m3-primary text-base">
          touch_app
        </span>
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
              <span className="material-symbols-outlined text-base">
                {meta.icon}
              </span>
              {busy === a ? "در حال ثبت..." : meta.label}
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="text-xs text-slate-400">
            در این وضعیت کنشی برای شما ثبت نشده است؛ منتظر کنش طرف مقابل باشید.
          </p>
        )}
      </div>
    </div>
  );
}
