"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { faToman, faDateTime, faNumber, toPersianDigits } from "@/lib/format";

/* ---------------------------------- types --------------------------------- */

type WalletTx = {
  id: string;
  type: string;
  amount: number; // positive = credit, negative = debit (Toman)
  status: string; // PENDING | COMPLETED | FAILED
  reference: string | null;
  description: string;
  createdAt: string;
};

type WalletData = {
  balance: number;
  transactions: WalletTx[];
  notice: string;
};

type TabKey =
  | "all"
  | "earnings"
  | "escrow"
  | "rent-payments"
  | "settlement"
  | "topup";

const TABS: {
  key: TabKey;
  label: (n: number) => string;
  match: (t: WalletTx) => boolean;
}[] = [
  {
    key: "all",
    label: (n) => `همه تراکنش‌ها (${toPersianDigits(n)})`,
    match: () => true,
  },
  {
    key: "earnings",
    label: () => "درآمدهای اجاره",
    match: (t) => t.type === "RENTAL_PAYMENT" && t.amount > 0,
  },
  {
    key: "escrow",
    label: () => "ودیعه و صندوق امانی",
    match: (t) => t.type.startsWith("DEPOSIT"),
  },
  {
    key: "rent-payments",
    label: () => "پرداخت‌های کرایه من",
    match: (t) => t.type === "RENTAL_PAYMENT" && t.amount < 0,
  },
  {
    key: "settlement",
    label: () => "تسویه‌ها به حساب شبا",
    match: (t) => t.type === "PAYOUT",
  },
  {
    key: "topup",
    label: () => "شارژ کیف پول",
    match: (t) => t.type === "TOPUP",
  },
];

const TYPE_META: Record<string, { icon: string; label: string }> = {
  RENTAL_PAYMENT: { icon: "payments", label: "پرداخت کرایه" },
  DEPOSIT_HOLD: { icon: "lock_clock", label: "مسدودی ودیعه" },
  DEPOSIT_RELEASE: { icon: "lock_open", label: "آزادسازی ودیعه" },
  DEPOSIT_DEDUCTION: { icon: "gavel", label: "کسر از ودیعه" },
  PAYOUT: { icon: "account_balance", label: "تسویه به شبا" },
  TOPUP: { icon: "add_card", label: "شارژ کیف پول" },
};

const PAGE_SIZE = 5;
const QUICK_TOPUPS = [5_000_000, 10_000_000, 20_000_000];

/* ------------------------------ small helpers ----------------------------- */

function typeChip(t: WalletTx) {
  const meta = TYPE_META[t.type] ?? { icon: "receipt_long", label: t.type };
  return { icon: meta.icon, label: meta.label };
}

function statusBadge(status: string) {
  if (status === "COMPLETED")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-[#065F46] text-label-sm text-[12px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
        تسویه شده به موجودی
      </span>
    );
  if (status === "PENDING")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-label-sm text-[12px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-m3-primary animate-pulse"></span>
        در انتظار تسویه اپراتور
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-m3-error-container text-m3-on-error-container text-label-sm text-[12px] font-medium">
      ناموفق / لغو شده
    </span>
  );
}

/* ------------------------------- component -------------------------------- */

export default function WalletClient({ userName }: { userName: string }) {
  const [data, setData] = useState<WalletData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "month" | "last3" | "year" | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all-statuses" | "success" | "pending" | "failed"
  >("all-statuses");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | "deposit" | "withdraw">(null);
  const [topupAmount, setTopupAmount] = useState("2000000");
  const [payoutAmount, setPayoutAmount] = useState("100000");
  const [defaultBank, setDefaultBank] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    text: string;
    kind: "ok" | "err";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    setToast({ text, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.error ?? "خطا در دریافت اطلاعات کیف پول");
      setData({
        balance: body.balance ?? 0,
        transactions: body.transactions ?? [],
        notice: body.notice ?? "",
      });
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "خطای نامشخص");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const transactions = data?.transactions ?? [];

  /* derived aggregates (application ledger only — sandbox) */
  const agg = useMemo(() => {
    const absSum = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
    const released = transactions
      .filter((t) => t.type === "DEPOSIT_RELEASE")
      .reduce((s, t) => s + t.amount, 0);
    const holds = transactions.filter((t) => t.type === "DEPOSIT_HOLD");
    const holdsSum = holds.reduce((s, t) => s + Math.abs(t.amount), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const earnings = transactions
      .filter(
        (t) =>
          t.type === "RENTAL_PAYMENT" &&
          t.amount > 0 &&
          new Date(t.createdAt).getTime() >= monthStart,
      )
      .reduce((s, t) => s + t.amount, 0);
    const earningsCount = transactions.filter(
      (t) =>
        t.type === "RENTAL_PAYMENT" &&
        t.amount > 0 &&
        new Date(t.createdAt).getTime() >= monthStart,
    ).length;
    return { absSum, released, holdsSum, holds, earnings, earningsCount };
  }, [transactions]);

  /* client-side filters (tabs + search + date + status) */
  const filtered = useMemo(() => {
    const tabDef = TABS.find((t) => t.key === tab) ?? TABS[0];
    const now = Date.now();
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (!tabDef.match(t)) return false;
      const created = new Date(t.createdAt).getTime();
      if (dateFilter === "month" && created < now - 30 * 86400000) return false;
      if (dateFilter === "last3" && created < now - 90 * 86400000) return false;
      if (dateFilter === "year" && created < now - 365 * 86400000) return false;
      if (statusFilter === "success" && t.status !== "COMPLETED") return false;
      if (statusFilter === "pending" && t.status !== "PENDING") return false;
      if (statusFilter === "failed" && t.status !== "FAILED") return false;
      if (q) {
        const hay =
          `${t.description} ${t.reference ?? ""} ${typeChip(t).label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, tab, search, dateFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  /* ------------------------------- actions -------------------------------- */

  async function postWallet(action: "topup" | "payout", amount: number) {
    setBusy(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount }),
      });
      const body = await res.json();
      if (!res.ok) {
        showToast(body?.error ?? "عملیات ناموفق بود.", "err");
        return false;
      }
      showToast(body?.notice ?? "عملیات با موفقیت ثبت شد (شبیه‌سازی).");
      await load();
      return true;
    } catch {
      showToast("ارتباط با سرور برقرار نشد.", "err");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const balance = data?.balance ?? 0;

  return (
    <div className="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin pb-space-2xl">
      {/* Sandbox notice (application ledger only) */}
      <div className="mt-space-md mb-space-md flex items-start gap-2.5 rounded-xl bg-primary-fixed/40 border border-primary-fixed px-4 py-3 text-on-primary-fixed-variant">
        <span className="material-symbols-outlined text-m3-primary text-[20px] shrink-0 mt-0.5">
          science
        </span>
        <p className="text-body-sm leading-relaxed">
          <strong className="font-bold">
            دفتر مالی درون‌برنامه‌ای (شبیه‌سازی):
          </strong>{" "}
          {data?.notice ||
            "تا زمان اتصال درگاه پرداخت واقعی، همه عملیات «شبیه‌سازی» هستند."}{" "}
          هیچ پول واقعی جابه‌جا نمی‌شود و تسویه بانکی نیازمند اتصال سرویس‌دهنده
          مجاز است.
        </p>
      </div>

      {/* 1. Breadcrumb */}
      <nav
        aria-label="مسیریابی"
        className="flex items-center gap-space-xs text-body-sm font-medium text-m3-outline pt-space-sm mb-space-lg"
      >
        <a
          className="hover:text-m3-primary transition-colors flex items-center gap-1"
          href="/"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          <span>خانه</span>
        </a>
        <span className="material-symbols-outlined text-[16px] text-outline-variant">
          chevron_left
        </span>
        <a
          className="hover:text-m3-primary transition-colors"
          href="/host-dashboard"
        >
          حساب کاربری
        </a>
        <span className="material-symbols-outlined text-[16px] text-outline-variant">
          chevron_left
        </span>
        <span className="text-on-surface font-bold">درآمد و تسویه حساب</span>
      </nav>

      {/* Page Header Section with Micro Metas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl">
        <div className="space-y-space-xs">
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">
            کیف پول و صندوق امانی اٌوِرا
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
            مدیریت متمرکز درآمدهای میزبانی، کنترل لحظه‌ای ودیعه‌های مسدود شده در
            دفتر امن اٌوِرا و تسویه درخواستی (حالت شبیه‌سازی).
          </p>
        </div>
        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-space-sm shrink-0">
          <button
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-surface-container-lowest text-on-surface text-label-md font-semibold shadow-md hover:bg-surface-container transition-all active:scale-[0.98]"
            onClick={() => setModal("deposit")}
          >
            <span className="material-symbols-outlined text-m3-primary text-[20px]">
              add_card
            </span>
            <span>افزایش اعتبار کیف پول</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-container text-on-primary text-label-md font-semibold shadow-lg shadow-primary-container/25 hover:opacity-95 transition-all active:scale-[0.98]"
            onClick={() => setModal("withdraw")}
          >
            <span className="material-symbols-outlined text-[20px]">
              account_balance_wallet
            </span>
            <span>درخواست تسویه و برداشت</span>
          </button>
        </div>
      </div>

      {/* 2. Balance Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-gutter mb-space-2xl">
        {/* Card A: Main Withdrawable Balance */}
        <div className="lg:col-span-5 rounded-xl bg-gradient-to-br from-m3-primary via-primary-container to-m3-secondary p-space-lg text-on-primary relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[250px]">
          <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-primary-fixed/20 blur-xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-space-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-label-sm">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                موجودی نقد قابل برداشت
              </span>
              <span className="material-symbols-outlined text-white/70 text-[24px]">
                payments
              </span>
            </div>
            <div className="mt-space-sm mb-space-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-display-lg font-black tracking-tight leading-none text-white">
                  {data ? faToman(balance) : "…"}
                </span>
                <span className="text-headline-sm text-primary-fixed">
                  تومان
                </span>
              </div>
            </div>
            <p className="text-body-sm text-primary-fixed/80">
              آماده انتقال درخواستی به حساب بانکی یا استفاده در رزروهای جدید
              (دفتر درون‌برنامه‌ای).
            </p>
          </div>
          <div className="relative z-10 pt-space-md flex items-center justify-between border-t border-white/15 text-white/90 text-label-sm">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-green-300">
                sync_alt
              </span>
              تسویه‌ها فقط داخل دفتر اٌوِرا ثبت می‌شوند
            </span>
            <a
              className="underline underline-offset-4 hover:text-white transition-colors"
              href="#bank-accounts"
            >
              تغییر حساب
            </a>
          </div>
        </div>

        {/* Card B: Escrow Locked Deposits */}
        <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-label-sm">
                <span className="material-symbols-outlined text-[16px]">
                  lock
                </span>
                صندوق امانی (Escrow)
              </span>
              <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-m3-primary">
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
              </span>
            </div>
            <div className="my-space-sm">
              <span className="text-label-sm text-on-surface-variant block mb-1">
                مجموع ودیعه‌های مسدودشده در دفتر اٌوِرا (شبیه‌سازی)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-numeric-stat font-bold text-on-surface">
                  {faToman(agg.holdsSum)}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  تومان
                </span>
              </div>
            </div>
            <div className="space-y-1.5 bg-surface-container-low p-space-sm rounded-lg text-body-sm">
              {agg.holds.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-on-surface"
                >
                  <span className="truncate max-w-[160px] text-on-surface-variant">
                    {t.description}
                  </span>
                  <span className="font-bold text-on-surface">
                    {faToman(Math.abs(t.amount))} ت
                  </span>
                </div>
              ))}
              {agg.holds.length === 0 && (
                <div className="text-on-surface-variant">
                  در حال حاضر ودیعه مسدودی ثبت نشده است.
                </div>
              )}
            </div>
          </div>
          <p className="text-label-sm text-m3-outline mt-space-sm leading-relaxed">
            در نسخه واقعی، مبالغ تا لحظه بازگشت سالم تجهیزات در حساب امن بانکی
            مسدود است.
          </p>
        </div>

        {/* Card C & D: Rental Earnings & Credit Score */}
        <div className="lg:col-span-3 flex flex-col gap-gutter">
          <div className="flex-1 rounded-xl bg-surface-container-lowest p-space-md shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant">
                درآمد خالص این ماه (میزبانی)
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100 text-[#065F46] text-label-sm text-[11px] font-bold">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>
                {toPersianDigits(agg.earningsCount)} تراکنش
              </span>
            </div>
            <div className="my-space-xs">
              <div className="flex items-baseline gap-1">
                <span className="text-headline-lg font-bold text-m3-primary">
                  {faToman(agg.earnings)}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  تومان
                </span>
              </div>
            </div>
            <span className="text-label-sm text-m3-outline">
              محاسبه از دفتر درون‌برنامه‌ای این ماه
            </span>
          </div>
          <div className="flex-1 rounded-xl bg-surface-container-lowest p-space-md shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-label-sm text-on-surface-variant">
                  امتیاز خوش‌حسابی
                </span>
                <span className="material-symbols-outlined text-amber-500 text-[18px]">
                  verified
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-headline-lg font-black text-on-surface">
                  ۹۸
                </span>
                <span className="text-label-sm text-m3-outline">/ ۱۰۰</span>
              </div>
              <span className="inline-block text-label-sm text-[11px] text-[#065F46] font-semibold">
                ضمانت بدون سفته تا ۳۰ م.ت (شبیه‌سازی)
              </span>
            </div>
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                ></path>
                <path
                  className="text-primary-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="98, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
              </svg>
              <span className="absolute text-label-sm text-[12px] font-bold text-m3-primary">
                ۹۸٪
              </span>
            </div>
            <span className="sr-only">مقدار نمایشی</span>
          </div>
        </div>
      </div>

      {/* 3. Financial Breakdown Analytics Mini Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-md rounded-xl bg-surface-container-low mb-space-xl">
        <div className="p-space-sm space-y-1">
          <span className="text-label-sm text-m3-outline block">
            حجم کل تراکنش‌های دفتر
          </span>
          <span className="text-headline-sm font-bold text-on-surface">
            {faToman(agg.absSum)}{" "}
            <span className="text-body-sm text-[12px] font-normal text-on-surface-variant">
              تومان
            </span>
          </span>
        </div>
        <div className="p-space-sm space-y-1">
          <span className="text-label-sm text-m3-outline block">
            کارمزد و بیمه اٌوِراگارد پرداختی
          </span>
          <span className="text-headline-sm font-bold text-on-surface">
            {faNumber(0)}{" "}
            <span className="text-body-sm text-[12px] font-normal text-on-surface-variant">
              تومان
            </span>
          </span>
        </div>
        <div className="p-space-sm space-y-1">
          <span className="text-label-sm text-m3-outline block">
            ودیعه‌های تسویه و آزاد شده
          </span>
          <span className="text-headline-sm font-bold text-[#065F46]">
            {faToman(agg.released)}{" "}
            <span className="text-body-sm text-[12px] font-normal text-on-surface-variant">
              تومان
            </span>
          </span>
        </div>
        <div className="p-space-sm space-y-1">
          <span className="text-label-sm text-m3-outline block">
            سود ذخیره شده از اجاره بجای خرید
          </span>
          <span className="text-headline-sm font-bold text-m3-secondary">
            {faNumber(0)}{" "}
            <span className="text-body-sm text-[11px] font-normal text-m3-outline">
              (نمایش آزمایشی)
            </span>
          </span>
        </div>
      </div>

      {/* 4. Interactive Transaction Ledger & History */}
      <div className="rounded-xl bg-surface-container-lowest p-space-md md:p-space-lg shadow-md mb-space-2xl">
        <div className="flex flex-col gap-space-md mb-space-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            {/* Category Tabs */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {TABS.map((t) => {
                const active = tab === t.key;
                const count =
                  t.key === "all"
                    ? transactions.length
                    : transactions.filter(t.match).length;
                return (
                  <button
                    key={t.key}
                    className={
                      "px-4 py-2 rounded-full text-label-md whitespace-nowrap transition-all " +
                      (active
                        ? "bg-primary-container text-on-primary shadow-sm font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container font-semibold")
                    }
                    onClick={() => {
                      setTab(t.key);
                      setPage(1);
                    }}
                  >
                    {t.label(count)}
                  </button>
                );
              })}
            </div>
            {/* Export Actions */}
            <div className="flex items-center gap-space-xs shrink-0 self-end md:self-auto">
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high transition-all"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                <span>خروجی اکسل</span>
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high transition-all"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-[18px]">
                  picture_as_pdf
                </span>
                <span>گزارش PDF رسمی</span>
              </button>
            </div>
          </div>
          {/* Search & Date Filter Secondary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-sm pt-space-sm border-t border-surface-container-high">
            <div className="sm:col-span-6 relative">
              <span className="material-symbols-outlined absolute right-3 top-3 text-m3-outline text-[20px]">
                search
              </span>
              <input
                className="w-full h-11 pr-10 pl-4 rounded-lg bg-surface-container-low text-body-sm text-on-surface placeholder:text-m3-outline focus:outline-none focus:bg-white focus:ring-2 focus:ring-m3-primary/20 transition-all"
                placeholder="جستجو در شرح تراکنش، شناسه رزرو (OVR-...) یا نوع تراکنش..."
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="sm:col-span-3">
              <select
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:bg-white transition-all"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as typeof dateFilter)
                }
              >
                <option value="month">ماه جاری</option>
                <option value="last3">۳ ماه اخیر</option>
                <option value="year">سال جاری</option>
                <option value="all">همه زمان‌ها</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:bg-white transition-all"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="all-statuses">تمامی وضعیت‌ها</option>
                <option value="success">موفق و تسویه شده</option>
                <option value="pending">در انتظار تسویه اپراتور</option>
                <option value="failed">ناموفق</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Ledger Table (Desktop + Tablet) */}
        <div className="overflow-x-auto">
          <table className="w-full text-right align-middle">
            <thead>
              <tr className="bg-surface-container-low text-m3-outline text-label-sm">
                <th className="py-3 px-4 rounded-r-lg font-semibold">
                  شرح تراکنش و سفارش
                </th>
                <th className="py-3 px-4 font-semibold">نوع / کانال تراکنش</th>
                <th className="py-3 px-4 font-semibold">تاریخ و زمان</th>
                <th className="py-3 px-4 font-semibold">مبلغ (تومان)</th>
                <th className="py-3 px-4 font-semibold">وضعیت صندوق</th>
                <th className="py-3 px-4 rounded-l-lg font-semibold text-center">
                  رسید
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60 text-body-sm text-on-surface">
              {loadError && (
                <tr>
                  <td className="py-6 px-4 text-m3-error" colSpan={6}>
                    {loadError}
                  </td>
                </tr>
              )}
              {!loadError && pageRows.length === 0 && (
                <tr>
                  <td className="py-6 px-4 text-on-surface-variant" colSpan={6}>
                    تراکنشی با این فیلترها در دفتر ثبت نشده است.
                  </td>
                </tr>
              )}
              {pageRows.map((t) => {
                const chip = typeChip(t);
                const credit = t.amount > 0;
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-container-low/50 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-space-sm">
                        <div
                          className={
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 " +
                            (credit
                              ? "bg-green-100 text-[#065F46]"
                              : t.type === "DEPOSIT_HOLD"
                                ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                                : t.type === "PAYOUT"
                                  ? "bg-surface-container-high text-on-surface"
                                  : "bg-primary-fixed text-m3-primary")
                          }
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {chip.icon}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-label-md font-bold text-on-surface group-hover:text-m3-primary transition-colors">
                            {t.description}
                          </span>
                          <span className="text-label-sm text-m3-outline">
                            شناسه:{" "}
                            {t.reference
                              ? `#${t.reference}`
                              : `TX-${t.id.slice(-6).toUpperCase()}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-m3-primary text-[18px]">
                          shield
                        </span>
                        <span className="text-label-md">
                          {chip.label} — دفتر اٌوِرا
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-label-sm">
                      <div>{faDateTime(t.createdAt)}</div>
                      <div className="text-[11px] text-m3-outline">
                        حالت شبیه‌سازی
                      </div>
                    </td>
                    <td
                      className={
                        "py-4 px-4 text-headline-sm font-bold " +
                        (credit ? "text-[#065F46]" : "text-m3-error")
                      }
                    >
                      {credit ? "+ " : "- "}
                      {faToman(Math.abs(t.amount))}
                    </td>
                    <td className="py-4 px-4">{statusBadge(t.status)}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        className="p-2 rounded-lg text-m3-outline hover:text-m3-primary hover:bg-surface-container transition-all"
                        disabled
                        title="به‌زودی"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          receipt_long
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pt-space-md mt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <span className="text-body-sm text-m3-outline">
            نمایش{" "}
            {toPersianDigits(
              filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1,
            )}{" "}
            تا{" "}
            {toPersianDigits(Math.min(safePage * PAGE_SIZE, filtered.length))}{" "}
            از مجموع {toPersianDigits(filtered.length)} تراکنش فیلترشده
          </span>
          <div className="flex items-center gap-1 text-label-md">
            <button
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-m3-outline hover:text-on-surface disabled:opacity-40"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              aria-label="صفحه قبل"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
            {Array.from({ length: totalPages })
              .slice(0, 5)
              .map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={
                      "w-9 h-9 rounded-lg flex items-center justify-center font-bold " +
                      (p === safePage
                        ? "bg-primary-container text-on-primary"
                        : "hover:bg-surface-container text-on-surface-variant")
                    }
                    onClick={() => setPage(p)}
                  >
                    {toPersianDigits(p)}
                  </button>
                );
              })}
            <button
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-m3-outline hover:text-on-surface disabled:opacity-40"
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              aria-label="صفحه بعد"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Split Section: Connected Bank Accounts & Escrow Trust Framework */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Connected Bank Accounts (7 Cols) */}
        <div
          className="lg:col-span-7 rounded-xl bg-surface-container-lowest p-space-lg shadow-md"
          id="bank-accounts"
        >
          <div className="flex items-center justify-between mb-space-lg">
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">
                حساب‌های بانکی و شماره شبا
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                نمایش آزمایشی — تا اتصال سرویس بانکی، حسابی واقعی ثبت یا تسویه
                نمی‌شود (شبیه‌سازی).
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-m3-primary text-label-sm font-semibold transition-all"
              disabled
              title="به‌زودی"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              افزودن حساب جدید
            </button>
          </div>
          <div className="space-y-space-sm">
            {/* Primary Account Card */}
            <div
              className={
                "rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md " +
                (defaultBank === 0
                  ? "bg-gradient-to-r from-surface-container-low to-surface-container"
                  : "bg-surface-container-lowest")
              }
            >
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-headline-sm shadow-sm shrink-0">
                  <span>ملت</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-label-lg font-bold text-on-surface">
                      بانک ملت (حساب جاری)
                    </span>
                    {defaultBank === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-[#065F46] text-label-sm text-[11px] font-bold">
                        <span className="material-symbols-outlined text-[12px]">
                          verified
                        </span>
                        پیش‌فرض تسویه
                      </span>
                    )}
                  </div>
                  <div
                    className="font-mono text-body-sm text-on-surface font-semibold tracking-wider"
                    dir="ltr"
                  >
                    IR58 0120 0000 0000 4821 4401
                  </div>
                  <span className="text-label-sm text-on-surface-variant block">
                    به نام {userName} • حساب نمایشی (شبیه‌سازی)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {defaultBank !== 0 && (
                  <button
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-label-sm text-on-surface hover:bg-surface-container-high transition-all"
                    onClick={() => setDefaultBank(0)}
                  >
                    انتخاب به عنوان پیش‌فرض
                  </button>
                )}
              </div>
            </div>
            {/* Secondary Account Card */}
            <div
              className={
                "rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md " +
                (defaultBank === 1
                  ? "bg-gradient-to-r from-surface-container-low to-surface-container"
                  : "bg-surface-container-lowest")
              }
            >
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-headline-sm shadow-sm shrink-0">
                  <span>سامان</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-label-lg font-bold text-on-surface">
                      بانک سامان
                    </span>
                    <span className="text-label-sm text-[11px] text-m3-outline">
                      حساب پشتیبان
                    </span>
                  </div>
                  <div
                    className="font-mono text-body-sm text-on-surface font-semibold tracking-wider"
                    dir="ltr"
                  >
                    IR24 0560 0000 0000 1902 3349
                  </div>
                  <span className="text-label-sm text-on-surface-variant block">
                    به نام {userName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {defaultBank !== 1 && (
                  <button
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-label-sm text-on-surface hover:bg-surface-container-high transition-all"
                    onClick={() => setDefaultBank(1)}
                  >
                    انتخاب به عنوان پیش‌فرض
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Settlement Timeline Note */}
          <div className="mt-space-md p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-xs text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-m3-primary text-[20px] shrink-0 mt-0.5">
              schedule
            </span>
            <span>
              در نسخه واقعی، تسویه‌های درخواستی تا پیش از ساعت ۱۲:۰۰ ظهر در چرخه
              پایا ساعت ۱۳:۴۵ و درخواست‌های پس از آن در سیکل ۱۸:۰۰ شاپرک واریز
              می‌شود؛ در این نسخه تسویه فقط به‌صورت شبیه‌سازی در دفتر اٌوِرا ثبت
              می‌گردد.
            </span>
          </div>
        </div>

        {/* 6. Escrow & Security Trust Box (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl bg-surface-container-high/40 p-space-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-space-md">
              <div className="w-10 h-10 rounded-xl bg-m3-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">
                  shield_with_heart
                </span>
              </div>
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">
                  سازوکار صندوق امن ودیعه (Escrow)
                </h2>
                <span className="text-label-sm text-m3-outline">
                  تضمین ۱۰۰٪ امنیت مالی طرفین معامله
                </span>
              </div>
            </div>
            <div className="space-y-space-md text-body-sm text-on-surface-variant leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                  ۱
                </div>
                <p>
                  <strong className="text-on-surface">
                    عدم واریز مستقیم به مالک:
                  </strong>
                  مبالغ ودیعه تا پیش از دریافت کالا در حساب واسط امانی اٌوِرا
                  نزد بانک مسدود می‌ماند و مالک به آن دسترسی ندارد.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                  ۲
                </div>
                <p>
                  <strong className="text-on-surface">
                    آزادسازی خودکار ۲ ساعته:
                  </strong>
                  پس از ثبت فرم سلامت تحویل کالا توسط میزبان در اپلیکیشن، مبلغ
                  ودیعه حداکثر ظرف ۲ ساعت به صورت خودکار آزاد می‌گردد.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                  ۳
                </div>
                <p>
                  <strong className="text-on-surface">
                    شورای داوری تخصصی اٌوِرا:
                  </strong>
                  در صورت بروز هرگونه ادعای خسارت یا عدم تطابق، تیم کارشناسان
                  داوری مستندات تصویری را بررسی کرده و ودیعه تا پایان داوری فریز
                  می‌ماند.
                </p>
              </div>
            </div>
            <p className="mt-space-sm text-[11px] text-m3-outline leading-relaxed">
              * سازوکار واقعی مسدودی بانکی نیازمند اتصال به سرویس‌دهنده مجاز
              است؛ در این نسخه صرفاً شبیه‌سازی می‌شود.
            </p>
          </div>
          <div className="mt-space-lg pt-space-md border-t border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary text-[20px]">
                headset_mic
              </span>
              <span className="text-label-md font-bold text-on-surface">
                پشتیبانی ویژه امور مالی و داوری:
              </span>
            </div>
            <div className="flex items-center gap-1.5" dir="ltr">
              <a
                className="text-label-lg font-bold text-m3-primary hover:underline"
                href="tel:02191004242"
              >
                ۰۲۱-۹۱۰۰۴۲۴۲
              </a>
              <span className="text-label-sm text-m3-outline">داخلی ۳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Fast Balance Top-up */}
      {modal === "deposit" && (
        <div className="fixed inset-0 z-50 bg-m3-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-space-md">
              <h3 className="text-headline-sm font-bold text-on-surface">
                شارژ کیف پول اٌوِرا
              </h3>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-m3-outline hover:text-on-surface"
                onClick={() => setModal(null)}
                aria-label="بستن"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-space-md">
              مبلغ مورد نظر را وارد یا از پیشنهادهای سریع انتخاب کنید:
            </p>
            <div className="grid grid-cols-3 gap-2 mb-space-md">
              {QUICK_TOPUPS.map((v) => (
                <button
                  key={v}
                  className="py-2 rounded-lg bg-surface-container-low hover:bg-primary-container hover:text-on-primary text-label-sm text-on-surface font-semibold transition-all"
                  onClick={() => setTopupAmount(String(v))}
                >
                  {faToman(v)} ت
                </button>
              ))}
            </div>
            <div className="mb-space-md">
              <label
                className="block text-label-sm text-on-surface mb-1 font-semibold"
                htmlFor="topup-amount"
              >
                مبلغ دلخواه (تومان):
              </label>
              <input
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface text-headline-sm focus:outline-none focus:ring-2 focus:ring-m3-primary/20"
                id="topup-amount"
                type="text"
                inputMode="numeric"
                value={faToman(topupAmount || "0")}
                onChange={(e) =>
                  setTopupAmount(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </div>
            <p className="text-[11px] leading-relaxed text-on-surface-variant mb-space-md flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-m3-primary shrink-0">
                info
              </span>
              پرداخت آزمایشی (Sandbox) — هیچ پول واقعی جابه‌جا نمی‌شود؛ درگاه
              بانکی شاپرک در این نسخه متصل نیست و شارژ فقط در دفتر شبیه‌سازی ثبت
              می‌شود.
            </p>
            <button
              className="w-full h-12 rounded-lg bg-m3-primary text-on-primary text-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-60"
              disabled={busy}
              onClick={async () => {
                const ok = await postWallet("topup", Number(topupAmount) || 0);
                if (ok) setModal(null);
              }}
            >
              <span>اتصال به درگاه آزمایشی و شارژ کیف پول</span>
              <span className="material-symbols-outlined text-[20px] rtl:rotate-180">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Request Paya Withdrawal */}
      {modal === "withdraw" && (
        <div className="fixed inset-0 z-50 bg-m3-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-2xl relative">
            <div className="flex items-center justify-between mb-space-md">
              <h3 className="text-headline-sm font-bold text-on-surface">
                درخواست تسویه و برداشت وجه
              </h3>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-m3-outline hover:text-on-surface"
                onClick={() => setModal(null)}
                aria-label="بستن"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container-low mb-space-md flex items-center justify-between text-label-sm">
              <span className="text-on-surface-variant">موجودی در دسترس:</span>
              <span className="font-bold text-m3-primary">
                {faToman(balance)} تومان
              </span>
            </div>
            <div className="space-y-space-md mb-space-md">
              <div>
                <label
                  className="block text-label-sm text-on-surface mb-1 font-semibold"
                  htmlFor="payout-amount"
                >
                  مبلغ قابل برداشت (تومان) — حداقل {faToman(100000)}:
                </label>
                <input
                  className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface text-headline-sm focus:outline-none focus:ring-2 focus:ring-m3-primary/20"
                  id="payout-amount"
                  type="text"
                  inputMode="numeric"
                  value={faToman(payoutAmount || "0")}
                  onChange={(e) =>
                    setPayoutAmount(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface mb-1 font-semibold">
                  واریز به حساب:
                </label>
                <div className="p-3 rounded-lg bg-surface-container flex items-center justify-between">
                  <span className="text-label-sm font-bold text-on-surface">
                    {defaultBank === 0
                      ? "بانک ملت - IR5801...4401"
                      : "بانک سامان - IR2405...3349"}{" "}
                    (نمایشی)
                  </span>
                  <span className="material-symbols-outlined text-green-600 text-[18px]">
                    check_circle
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-on-surface-variant mb-space-md flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-m3-primary shrink-0">
                info
              </span>
              درخواست برداشت در حالت شبیه‌سازی ثبت می‌شود و تسویه واقعی توسط
              اپراتور پس از اتصال سرویس بانکی انجام خواهد شد.
            </p>
            <button
              className="w-full h-12 rounded-lg bg-primary-container text-on-primary text-label-md font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-60"
              disabled={busy}
              onClick={async () => {
                const ok = await postWallet(
                  "payout",
                  Number(payoutAmount) || 0,
                );
                if (ok) setModal(null);
              }}
            >
              <span>تایید و ثبت حواله (شبیه‌سازی)</span>
              <span className="material-symbols-outlined text-[20px]">
                send
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={
            "fixed bottom-6 right-1/2 translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-xl text-label-md font-semibold max-w-[92vw] text-center " +
            (toast.kind === "ok"
              ? "bg-m3-inverse-surface text-m3-inverse-on-surface"
              : "bg-m3-error text-m3-on-error")
          }
          role="status"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
