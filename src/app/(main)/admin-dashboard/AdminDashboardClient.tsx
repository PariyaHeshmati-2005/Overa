"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faToman, faNumber, faDateTime, toPersianDigits } from "@/lib/format";

/* ---------------------------------- types --------------------------------- */

export type AdminListing = {
  id: string;
  title: string;
  category: string;
  dailyPrice: number;
  deposit: number;
  city: string;
  imageUrl: string;
  owner: { id: string; name: string; kycStatus: string; isHost: boolean };
};

export type AdminClaim = {
  id: string;
  title: string;
  description: string;
  status: string;
  decision: string | null;
  appealMessage: string | null;
  evidenceUrls: string[];
  claimant: { id: string; name: string };
  against: { id: string; name: string };
  reservation: { id: string; code: string; deposit: number; itemTitle: string | null } | null;
};

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  kycStatus: string;
  isHost: boolean;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string;
  createdAt: string;
};

type Stats = {
  users: number;
  activeListings: number;
  pendingListings: number;
  reservations: number;
  activeRentals: number;
  claims: number;
  openClaims: number;
  completedRentals: number;
  totalRentalsRevenue: number;
  kycPending: number;
  notice: string;
};

const CLAIM_STATUS_LABELS: Record<string, string> = {
  OPEN: "پرونده باز",
  COUNTER_EVIDENCE: "مستندات متقابل",
  UNDER_REVIEW: "در حال بررسی کارشناس",
  DECIDED: "رأی صادر شد",
  APPEALED: "تجدیدنظرخواهی",
  REJECTED: "رد شده",
  SETTLED: "تسویه شده",
};

const CLAIM_STATUS_CLASSES: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-800 border-amber-200",
  COUNTER_EVIDENCE: "bg-blue-50 text-blue-800 border-blue-200",
  UNDER_REVIEW: "bg-m3-primary/10 text-m3-primary border-m3-primary/20",
  APPEALED: "bg-purple-50 text-purple-800 border-purple-200",
  DECIDED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-m3-error-container text-m3-on-error-container border-m3-error/20",
  SETTLED: "bg-emerald-50 text-emerald-800 border-emerald-300",
};

const KYC_LABELS: Record<string, string> = {
  UNVERIFIED: "احراز نشده",
  PENDING: "در انتظار بررسی",
  VERIFIED: "احراز شده",
  REJECTED: "احراز رد شده",
};

function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

/* ------------------------------- component -------------------------------- */

export default function AdminDashboardClient({
  listings: initialListings,
  claims: initialClaims,
  users: initialUsers,
  auditLog,
}: {
  listings: AdminListing[];
  claims: AdminClaim[];
  users: AdminUser[];
  auditLog: AuditEntry[];
}) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [listings, setListings] = useState(initialListings);
  const [claims, setClaims] = useState(initialClaims);
  const [users, setUsers] = useState(initialUsers);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [decisionTarget, setDecisionTarget] = useState<string | null>(null);
  const [decisionText, setDecisionText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "err" } | null>(null);

  const showToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 4200);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "خطا در دریافت آمار");
      setStats(body);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "خطای نامشخص", "err");
    }
  }, [showToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function patchJson(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.error ?? "عملیات ناموفق بود.");
    return payload;
  }

  /* --------------------------- moderation actions --------------------------- */

  async function decideListing(id: string, decision: "approve" | "reject", reason?: string) {
    setBusyId(id);
    try {
      await patchJson(`/api/admin/listings/${id}`, { decision, reason });
      setListings((ls) => ls.filter((l) => l.id !== id));
      showToast(decision === "approve" ? "آگهی تایید و منتشر شد (شبیه‌سازی)." : "آگهی رد شد و به مالک اطلاع داده شد.");
      loadStats();
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "خطای نامشخص", "err");
    } finally {
      setBusyId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  }

  async function decideClaim(id: string, body: Record<string, unknown>, okMessage: string) {
    setBusyId(id);
    try {
      await patchJson(`/api/admin/claims/${id}`, body);
      setClaims((cs) => cs.filter((c) => c.id !== id));
      showToast(okMessage);
      loadStats();
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "خطای نامشخص", "err");
    } finally {
      setBusyId(null);
      setDecisionTarget(null);
      setDecisionText("");
    }
  }

  async function setKyc(id: string, kycStatus: "VERIFIED" | "REJECTED") {
    setBusyId(id);
    try {
      await patchJson(`/api/admin/users/${id}`, { kycStatus });
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, kycStatus } : u)));
      showToast(kycStatus === "VERIFIED" ? "احراز هویت کاربر تایید شد." : "احراز هویت کاربر رد شد.");
      loadStats();
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "خطای نامشخص", "err");
    } finally {
      setBusyId(null);
    }
  }

  const kpiCards = stats
    ? [
        {
          title: "گردش مالی کرایه‌ها (دفتر اورا)",
          icon: "payments",
          gradient: "from-m3-primary to-primary-container",
          iconClass: "bg-surface-container text-m3-primary",
          value: faToman(stats.totalRentalsRevenue),
          unit: "تومان",
          sub: "مبالغ صرفاً دفتر درون‌برنامه‌ای (شبیه‌سازی) هستند",
          subClass: "text-emerald-600",
          subIcon: "verified",
        },
        {
          title: "قراردادهای فعال و در جریان",
          icon: "lock",
          gradient: "from-m3-secondary to-secondary-container",
          iconClass: "bg-purple-50 text-m3-secondary",
          value: faNumber(stats.activeRentals),
          unit: "قرارداد",
          sub: `از مجموع ${faNumber(stats.reservations)} رزرو ثبت‌شده`,
          subClass: "text-emerald-600",
          subIcon: "assignment",
        },
        {
          title: "کاربران ثبت‌نامی پلتفرم",
          icon: "group",
          gradient: "from-blue-500 to-indigo-500",
          iconClass: "bg-blue-50 text-blue-600",
          value: faNumber(stats.users),
          unit: "کاربر",
          sub: `${faNumber(stats.kycPending)} مورد در انتظار احراز هویت`,
          subClass: "text-m3-primary",
          subIcon: "verified_user",
        },
        {
          title: "آگهی‌های فعال و در صف تایید",
          icon: "inventory_2",
          gradient: "from-amber-500 to-orange-500",
          iconClass: "bg-amber-50 text-amber-700",
          value: faNumber(stats.activeListings),
          unit: "قلم فعال",
          sub: `${faNumber(stats.pendingListings)} آگهی در صف تایید`,
          subClass: "text-amber-700",
          subIcon: "category",
        },
        {
          title: "سلامت معاملات و مناقشات",
          icon: "health_and_safety",
          gradient: "from-emerald-500 to-teal-500",
          iconClass: "bg-emerald-50 text-emerald-700",
          value: `${faNumber(stats.completedRentals)}`,
          unit: "قرارداد تکمیل‌شده",
          sub: `${faNumber(stats.openClaims)} مناقشه باز از ${faNumber(stats.claims)} پرونده`,
          subClass: "text-m3-error",
          subIcon: "gavel",
        },
      ]
    : [];

  return (
    <div className="bg-m3-background text-on-background antialiased min-h-screen flex flex-col">
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40 px-4 lg:px-8 py-3.5 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-m3-primary to-primary-container flex items-center justify-center text-white shadow-md shadow-m3-primary/20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 48 48">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-on-surface">
                    اورا&nbsp;مرکز فرماندهی و نظارت
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-primary-container text-white rounded-full">
                    ادمین کل v4.2
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  سامانه نظارت زنده بر تجهیزات، صندوق امانی و امنیت معاملات
                </p>
              </div>
            </div>
            <div className="hidden xl:flex items-center bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 w-72 focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all">
              <span className="material-symbols-outlined text-m3-primary text-xl ml-2">search</span>
              <input
                className="bg-transparent border-none text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none w-full p-0"
                placeholder="جستجوی سریع کد ملی، سفارش، کاربر..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>همگام‌سازی زنده با دیتابیس فعال</span>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-container text-white text-xs font-bold rounded-xl hover:bg-m3-primary shadow-sm hover:shadow-m3-primary/25 transition-all"
              onClick={() => {
                loadStats();
                router.refresh();
              }}
            >
              <span className="material-symbols-outlined text-sm">autorenew</span>
              <span>به‌روزرسانی آنی</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container-highest border border-outline-variant/40 transition-all"
              disabled
              title="به‌زودی"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>خروجی اکسل و PDF</span>
            </button>
          </div>
        </div>
      </header>
      {/* ==================== SUB-NAVIGATION & MODULE TABS ==================== */}
      <nav className="bg-surface-container-lowest border-b border-outline-variant/30 px-4 lg:px-8 py-2 sticky top-[65px] z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            <Link
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-m3-primary text-white shadow-sm shadow-m3-primary/20"
              href="/admin-dashboard"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>داشبورد کلان و تحلیل مالی</span>
            </Link>
            <Link
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
              href="/rentals"
            >
              <span className="material-symbols-outlined text-base">assignment</span>
              <span>مدیریت قراردادهای جاری</span>
              {stats && (
                <span className="bg-primary-container/10 text-m3-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {faNumber(stats.activeRentals)} فعال
                </span>
              )}
            </Link>
            <Link
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
              href="/my-items"
            >
              <span className="material-symbols-outlined text-base">verified_user</span>
              <span>صف تایید آگهی و احراز</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {faNumber(listings.length)} معلق
              </span>
            </Link>
            <Link
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
              href="/wallet"
            >
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
              <span>صندوق ودیعه امانی (Escrow)</span>
            </Link>
            <Link
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-m3-primary hover:bg-surface-container transition-colors"
              href="/arbitration-panel"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>پرونده‌های داوری و خسارت</span>
              <span className="bg-m3-error-container text-m3-on-error-container text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {faNumber(claims.length)} مناقشه
              </span>
            </Link>
          </div>
          <div className="hidden lg:flex items-center gap-2 min-w-max border-r border-outline-variant/30 pr-3">
            <span className="text-[11px] text-on-surface-variant font-medium">وضعیت داده‌ها:</span>
            <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/40 text-xs">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-m3-primary shadow-xs">
                داده واقعی دیتابیس
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium text-on-surface-variant">
                مبالغ: شبیه‌سازی
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== MAIN DASHBOARD BODY ==================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8">
        {/* 1. KPI PULSE & FINANCIAL METRICS */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg lg:text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary">monitoring</span>
                نبض لحظه‌ای و شاخص‌های سلامت مالی پلتفرم اورا
              </h2>
              <p className="text-xs text-on-surface-variant">
                گزارش زنده از پایگاه داده اورا؛ مبالغ از دفتر درون‌برنامه‌ای خوانده می‌شوند (شبیه‌سازی).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="size-2 rounded-full bg-emerald-500"></span>
              <span>{stats?.notice ?? "در حال دریافت آمار از سرور…"}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {kpiCards.map((k) => (
              <div
                key={k.title}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className={"absolute top-0 right-0 left-0 h-1 bg-gradient-to-r " + k.gradient}></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-on-surface-variant">{k.title}</span>
                  <div className={"p-2 rounded-xl " + k.iconClass}>
                    <span className="material-symbols-outlined text-lg">{k.icon}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-on-surface tracking-tight">
                    {k.value}
                    <span className="text-xs font-semibold text-on-surface-variant"> {k.unit}</span>
                  </p>
                  <div className={"flex items-center gap-1.5 text-xs font-bold " + k.subClass}>
                    <span className="material-symbols-outlined text-sm">{k.subIcon}</span>
                    <span>{k.sub}</span>
                  </div>
                </div>
              </div>
            ))}
            {!stats && (
              <div className="sm:col-span-2 lg:col-span-5 p-5 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest text-xs text-on-surface-variant animate-pulse">
                در حال دریافت شاخص‌ها از /api/admin/stats…
              </div>
            )}
          </div>
        </section>

        {/* 2. QUICK INSPECTOR BAR (sandbox-labelled) */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/50 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">manage_search</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">ابزار بازرسی سریع هویت و تراکنش</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    استعلام مستقیم سامانه ثبت‌احوال، شاهکار و فیلترهای ضدتقلب
                  </p>
                </div>
              </div>
              <div className="flex-1 flex items-center bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary">
                <span className="material-symbols-outlined text-m3-outline text-lg ml-2">person_search</span>
                <input
                  className="bg-transparent border-none text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none w-full p-0"
                  placeholder="ورود کد ملی (۱۰ رقم) / شماره موبایل (۰۹...) / کد رهگیری سفارش..."
                  type="text"
                />
                <button
                  className="bg-m3-primary text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-primary-container shrink-0 transition-colors"
                  disabled
                  title="به‌زودی"
                >
                  استعلام فوری
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <div className="flex items-center gap-2 bg-primary-fixed/40 text-on-primary-fixed-variant border border-m3-primary/20 px-3 py-2 rounded-xl text-xs font-semibold shrink-0">
                <span className="material-symbols-outlined text-m3-primary text-base">science</span>
                <span>درگاه‌ها و استعلام‌های بیرونی در این نسخه شبیه‌سازی هستند</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PENDING LISTINGS MODERATION QUEUE */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary">verified</span>
                <h3 className="text-base font-extrabold text-on-surface">
                  صف تایید آگهی‌های در انتظار بررسی (Moderation Queue)
                </h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {faNumber(listings.length)} آگهی در صف
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                تصمیم‌های تایید/رد از طریق /api/admin/listings ثبت و برای مالک اطلاع‌رسانی می‌شود.
              </p>
            </div>
            <Link
              className="text-xs font-bold text-m3-primary hover:underline flex items-center gap-1"
              href="/my-items"
            >
              <span>مشاهده همه موارد در انتظار بررسی</span>
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_left</span>
            </Link>
          </div>
          {listings.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-8 text-center text-xs text-on-surface-variant">
              در حال حاضر آگهی در انتظار تاییدی وجود ندارد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden aspect-video mb-3 bg-surface-container">
                      { }
                      <img className="w-full h-full object-cover" src={l.imageUrl} alt={l.title} />
                      <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">hourglass_top</span>
                        <span>در انتظار تصمیم ادمین</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                        {l.city}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-m3-primary font-bold">{l.category}</span>
                        <span className="text-xs font-extrabold text-on-surface">{faToman(l.dailyPrice)} تومان / روز</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-on-surface line-clamp-1">{l.title}</h4>
                      <p className="text-xs text-on-surface-variant">
                        ارائه‌دهنده: {l.owner.name}
                        {l.owner.isHost ? " (میزبان)" : ""} • احراز: {KYC_LABELS[l.owner.kycStatus] ?? l.owner.kycStatus}
                      </p>
                      <div className="bg-surface-container p-2.5 rounded-xl text-[11px] space-y-1 text-on-surface-variant mt-2">
                        <div className="flex justify-between">
                          <span>ودیعه پیشنهادی آگهی:</span>
                          <span className="font-bold text-m3-primary">{faToman(l.deposit)} تومان</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مبلغ اجاره روزانه:</span>
                          <span className="font-bold text-on-surface">{faToman(l.dailyPrice)} تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Moderation Actions */}
                  {rejectTarget === l.id ? (
                    <div className="mt-4 pt-3 border-t border-outline-variant/30 space-y-2">
                      <input
                        className="w-full text-xs rounded-lg bg-surface-container-low border border-outline-variant/60 px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
                        placeholder="دلیل رد آگهی (به مالک نمایش داده می‌شود)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="py-1.5 px-2 bg-m3-error/10 hover:bg-m3-error/20 text-m3-error rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                          disabled={busyId === l.id}
                          onClick={() => decideListing(l.id, "reject", rejectReason || undefined)}
                        >
                          ثبت رد آگهی
                        </button>
                        <button
                          className="py-1.5 px-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold transition-colors"
                          onClick={() => {
                            setRejectTarget(null);
                            setRejectReason("");
                          }}
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-outline-variant/30">
                      <button
                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                        disabled={busyId === l.id}
                        onClick={() => decideListing(l.id, "approve")}
                      >
                        <span className="material-symbols-outlined text-xs">done</span>
                        <span>تایید فوری</span>
                      </button>
                      <Link
                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold transition-colors"
                        href={`/item-details/${l.id}`}
                        title="مشاهده پیش‌نمایش آگهی"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        <span>مشاهده</span>
                      </Link>
                      <button
                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-m3-error/10 hover:bg-m3-error/20 text-m3-error rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                        disabled={busyId === l.id}
                        onClick={() => setRejectTarget(l.id)}
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                        <span>رد آگهی</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. DISPUTES QUEUE */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary">gavel</span>
                <h3 className="text-base font-extrabold text-on-surface">صف پرونده‌های داوری و خسارت</h3>
                <span className="bg-m3-error-container text-m3-on-error-container text-xs font-bold px-2 py-0.5 rounded-full">
                  {faNumber(claims.length)} پرونده فعال
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                تصمیم‌های داوری از طریق /api/admin/claims ثبت می‌شوند؛ تسویه واقعی وابسته به تایید حقوقی است
                (شبیه‌سازی).
              </p>
            </div>
            <Link
              className="text-xs font-bold text-m3-primary hover:underline flex items-center gap-1"
              href="/arbitration-panel"
            >
              <span>ورود به پنل داوری</span>
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_left</span>
            </Link>
          </div>
          {claims.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-8 text-center text-xs text-on-surface-variant">
              در حال حاضر مناقشه بازی وجود ندارد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {claims.map((c) => (
                <div
                  key={c.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border " +
                            (CLAIM_STATUS_CLASSES[c.status] ?? "bg-surface-container text-on-surface-variant border-outline-variant/40")
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {CLAIM_STATUS_LABELS[c.status] ?? c.status}
                        </span>
                        <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          پرونده: #{c.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-on-surface">{c.title}</h4>
                    </div>
                    {c.evidenceUrls[0] && (
                       
                      <img
                        className="size-14 rounded-xl object-cover border border-outline-variant/40 shrink-0"
                        src={c.evidenceUrls[0]}
                        alt="مستند ادعا"
                      />
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{c.description}</p>
                  <div className="bg-surface-container rounded-xl p-2.5 text-[11px] space-y-1 text-on-surface-variant">
                    <div className="flex justify-between">
                      <span>شاکی / متقابل:</span>
                      <span className="font-bold text-on-surface">
                        {c.claimant.name} ↔ {c.against.name}
                      </span>
                    </div>
                    {c.reservation && (
                      <div className="flex justify-between">
                        <span>قرارداد مرتبط:</span>
                        <span className="font-mono font-bold text-m3-primary">
                          #{c.reservation.code} — ودیعه {faToman(c.reservation.deposit)} ت (شبیه‌سازی)
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Decision flow actions */}
                  {decisionTarget === c.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        className="w-full text-xs rounded-lg bg-surface-container-low border border-outline-variant/60 px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30 resize-none"
                        rows={2}
                        placeholder="متن رأی داوری (به طرفین اعلام می‌شود؛ ثبت تصمیم نیازمند بررسی حقوقی است)..."
                        value={decisionText}
                        onChange={(e) => setDecisionText(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                          disabled={busyId === c.id}
                          onClick={() =>
                            decideClaim(
                              c.id,
                              { status: "DECIDED", decision: decisionText || undefined },
                              "رأی داوری ثبت شد (شبیه‌سازی).",
                            )
                          }
                        >
                          ثبت رأی نهایی
                        </button>
                        <button
                          className="py-1.5 px-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold transition-colors"
                          onClick={() => {
                            setDecisionTarget(null);
                            setDecisionText("");
                          }}
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {(c.status === "OPEN" || c.status === "COUNTER_EVIDENCE") && (
                        <button
                          className="flex items-center gap-1 py-1.5 px-2.5 bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                          disabled={busyId === c.id}
                          onClick={() => decideClaim(c.id, { status: "UNDER_REVIEW" }, "پرونده به مرحله بررسی کارشناسی رفت.")}
                        >
                          <span className="material-symbols-outlined text-xs">manage_search</span>
                          ارسال به بررسی کارشناسی
                        </button>
                      )}
                      {(c.status === "OPEN" || c.status === "COUNTER_EVIDENCE") && (
                        <button
                          className="flex items-center gap-1 py-1.5 px-2.5 bg-m3-error/10 hover:bg-m3-error/20 text-m3-error rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                          disabled={busyId === c.id}
                          onClick={() => decideClaim(c.id, { status: "REJECTED" }, "پرونده رد شد.")}
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                          رد پرونده
                        </button>
                      )}
                      {c.status === "UNDER_REVIEW" && (
                        <button
                          className="flex items-center gap-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                          disabled={busyId === c.id}
                          onClick={() => setDecisionTarget(c.id)}
                        >
                          <span className="material-symbols-outlined text-xs">gavel</span>
                          صدور رأی داوری
                        </button>
                      )}
                      {c.status === "APPEALED" && (
                        <button
                          className="flex items-center gap-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                          disabled={busyId === c.id}
                          onClick={() =>
                            decideClaim(
                              c.id,
                              { status: "SETTLED", settlementNote: "تسویه پس از تجدیدنظرخواهی ثبت شد (شبیه‌سازی)." },
                              "پرونده تسویه شد (شبیه‌سازی).",
                            )
                          }
                        >
                          <span className="material-symbols-outlined text-xs">handshake</span>
                          تسویه پرونده
                        </button>
                      )}
                      <Link
                        className="flex items-center gap-1 py-1.5 px-2.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold transition-colors"
                        href={`/arbitration-panel?case=${c.id}`}
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        جزئیات و ادله
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. USERS & KYC TABLE */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-m3-primary animate-pulse"></span>
                <h3 className="text-base font-extrabold text-on-surface">کاربران و صف احراز هویت (KYC)</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                شماره تماس‌ها برای حریم خصوصی به‌صورت ماسک نمایش داده می‌شوند؛ تغییر وضعیت احراز از طریق
                /api/admin/users ثبت می‌شود.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
                <tr>
                  <th className="px-5 py-3.5">کاربر</th>
                  <th className="px-5 py-3.5">شماره تماس (ماسک)</th>
                  <th className="px-5 py-3.5">نقش</th>
                  <th className="px-5 py-3.5">وضعیت احراز</th>
                  <th className="px-5 py-3.5">تاریخ عضویت</th>
                  <th className="px-5 py-3.5 text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-[11px] font-bold shrink-0">
                          {u.name?.trim()?.[0] ?? "ک"}
                        </div>
                        <span className="font-bold text-on-surface">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono" dir="ltr">
                      {maskPhone(u.phone)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          "px-2 py-0.5 rounded text-[10px] font-bold " +
                          (u.isHost ? "bg-purple-100 text-purple-700" : "bg-surface-container text-on-surface-variant")
                        }
                      >
                        {u.isHost ? "میزبان" : "کاربر"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border " +
                          (u.kycStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : u.kycStatus === "REJECTED"
                              ? "bg-m3-error-container text-m3-on-error-container border-m3-error/20"
                              : u.kycStatus === "PENDING"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-surface-container text-on-surface-variant border-outline-variant/40")
                        }
                      >
                        {KYC_LABELS[u.kycStatus] ?? u.kycStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{faDateTime(u.createdAt)}</td>
                    <td className="px-5 py-3.5 text-center">
                      {u.kycStatus === "VERIFIED" || u.kycStatus === "REJECTED" ? (
                        <span className="text-[11px] text-m3-outline">— تصمیم نهایی ثبت شده —</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-60"
                            disabled={busyId === u.id}
                            onClick={() => setKyc(u.id, "VERIFIED")}
                          >
                            تایید احراز
                          </button>
                          <button
                            className="px-2.5 py-1.5 rounded-lg bg-m3-error/10 hover:bg-m3-error/20 text-m3-error text-[11px] font-bold transition-colors disabled:opacity-60"
                            disabled={busyId === u.id}
                            onClick={() => setKyc(u.id, "REJECTED")}
                          >
                            رد احراز
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. AUDIT LOG */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-sm">
          <div className="p-5 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary">security</span>
              <h3 className="text-base font-extrabold text-on-surface">لاگ‌های امنیتی و تصمیم‌های ثبت‌شده (Audit Log)</h3>
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                ۲۰ رویداد اخیر
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              همه تصمیم‌های مدیریتی (تایید آگهی، رأی داوری، تغییر احراز) با نام کارشناس و زمان دقیق ثبت می‌شوند.
            </p>
          </div>
          <div className="p-5 space-y-2 max-h-[420px] overflow-y-auto custom-scroll">
            {auditLog.length === 0 && (
              <div className="text-xs text-on-surface-variant p-4 bg-surface-container-low rounded-xl">
                هنوز رویدادی در لاگ امنیتی ثبت نشده است؛ با انجام اولین تصمیم مدیریتی، رویداد اینجا نمایش داده
                می‌شود.
              </div>
            )}
            {auditLog.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-surface-container-low text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary shrink-0">
                    <span className="material-symbols-outlined text-base">history</span>
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-on-surface block truncate">
                      {a.action} — {a.entityType}
                      {a.entityId ? ` (#${a.entityId.slice(-6).toUpperCase()})` : ""}
                    </span>
                    <span className="text-on-surface-variant">عامل: {a.actorName}</span>
                  </div>
                </div>
                <span className="text-on-surface-variant font-mono shrink-0">{faDateTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-auto bg-surface-container-lowest border-t border-outline-variant/40 py-4 px-4 lg:px-8 text-xs text-on-surface-variant">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-m3-primary"></span>
            <p className="font-semibold text-on-surface">
              مرکز مانیتورینگ ۳۶۰ درجه و پنل ادمین اورا (Overa Core v4.2)
            </p>
            <span className="text-[10px] text-outline-variant">|</span>
            <span>تمام حقوق و لاگ‌های امنیتی محفوظ است.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link className="hover:text-m3-primary transition-colors" href="/arbitration-panel">
              مقررات داوری و حل اختلاف
            </Link>
            <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
              دستورالعمل بیمه تجهیزات
            </Link>
            <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
              پشتیبانی فنی ۲۴/۷
            </Link>
          </div>
        </div>
      </footer>

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
