"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { faToman, faDateTime, toPersianDigits } from "@/lib/format";

export type PanelClaim = {
  id: string;
  title: string;
  description: string;
  status: string;
  decision: string | null;
  decidedAt: string | null;
  appealMessage: string | null;
  settlementNote: string | null;
  evidenceUrls: string[];
  claimant: { id: string; name: string; kycStatus: string };
  against: { id: string; name: string; kycStatus: string };
  reservation: {
    id: string;
    code: string;
    deposit: number;
    paymentMethod?: string | null;
    deliveryStatus?: string | null;
    deliveryNote?: string | null;
    itemTitle: string | null;
    imageUrl: string | null;
  } | null;
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "بدون یادداشت بازرسی",
  ACCEPTED_CLEAN: "سالم تحویل گرفته شد",
  ACCEPTED_WITH_ISSUES: "با یادداشت مشکلات تحویل گرفته شد",
  REFUSED_DAMAGE: "تحویل رد شد (اجاره باطل شد)",
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  OPEN: {
    label: "پرونده باز — در انتظار بررسی اٌوِرا",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  COUNTER_EVIDENCE: {
    label: "مستندات متقابل ثبت شد",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  UNDER_REVIEW: {
    label: "در حال بررسی کارشناس رسمی داوری اٌوِرا",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  DECIDED: {
    label: "رأی داوری صادر شد",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  APPEALED: {
    label: "درخواست تجدیدنظر ثبت شد",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
  },
  REJECTED: {
    label: "پرونده رد شد",
    cls: "bg-m3-error-container text-m3-on-error-container border-m3-error/20",
  },
  SETTLED: {
    label: "تسویه و پایان پرونده",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
};

function initials(name: string) {
  const parts = (name ?? "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export default function ArbitrationPanelClient({
  claims,
}: {
  claims: PanelClaim[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("case");
  const selected = claims.find((c) => c.id === caseId) ?? claims[0] ?? null;

  const [busy, setBusy] = useState(false);
  const [decisionText, setDecisionText] = useState("");
  const [verdict, setVerdict] = useState<string>("RELEASE_TO_RENTER");
  const [chargeAmount, setChargeAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [toast, setToast] = useState<{
    text: string;
    kind: "ok" | "err";
  } | null>(null);

  const showToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 4500);
  }, []);

  async function patchClaim(
    id: string,
    body: Record<string, unknown>,
    okMessage: string,
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "ثبت تصمیم ناموفق بود.");
      showToast(okMessage);
      setDecisionText("");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "خطای نامشخص", "err");
    } finally {
      setBusy(false);
    }
  }

  function select(id: string) {
    router.push(`/arbitration-panel?case=${id}`);
  }

  const badge = selected
    ? (STATUS_BADGES[selected.status] ?? {
        label: selected.status,
        cls: "bg-surface-container text-on-surface-variant border-outline-variant/40",
      })
    : null;

  return (
    <div className="bg-background-light text-slate-800 min-h-screen flex flex-col antialiased selection:bg-purple-100 selection:text-m3-primary">
      {/* Admin context strip — sits under the shared site header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-700">
            <span className="material-symbols-outlined text-sm">verified</span>
            تضمین اصالت و بیمه سپرده / تجهیزات
          </div>
          <Link
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-m3-primary bg-m3-primary/10 hover:bg-m3-primary/20 transition-colors"
            href="/admin-dashboard"
          >
            <span className="material-symbols-outlined text-base">
              dashboard
            </span>
            بازگشت به داشبورد ادمین
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-5 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Link
          href="/"
          className="hover:text-m3-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          <span>خانه</span>
        </Link>
        <span className="material-symbols-outlined text-xs text-slate-400">
          chevron_left
        </span>
        <Link
          href="/admin-dashboard"
          className="hover:text-m3-primary transition-colors"
        >
          مرکز نظارت
        </Link>
        <span className="material-symbols-outlined text-xs text-slate-400">
          chevron_left
        </span>
        <span className="text-slate-800 font-bold">
          رسیدگی به ادعای خسارت و داوری ودیعه
          {selected?.reservation
            ? ` (سفارش #${selected.reservation.code})`
            : ""}
        </span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Truthful legal notice */}
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
            balance
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-800">
            <strong className="font-bold">توجه:</strong> تصمیمات این پنل جایگزین
            مراجع قانونی نیست و تسویه واقعی ودیعه نیازمند تایید حقوقی و اتصال به
            سرویس‌دهنده مجاز است (در این نسخه شبیه‌سازی).
          </p>
        </div>

        {/* Case list strip */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary">
                folder_shared
              </span>
              <h2 className="font-bold text-base text-slate-900">
                فهرست پرونده‌های داوری
              </h2>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                {toPersianDigits(claims.length)} پرونده
              </span>
            </div>
          </div>
          {claims.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              در حال حاضر هیچ پرونده داوری در سامانه ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {claims.map((c) => {
                const b = STATUS_BADGES[c.status] ?? {
                  label: c.status,
                  cls: "bg-slate-100 text-slate-600 border-slate-200",
                };
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => select(c.id)}
                    className={
                      "text-right p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 " +
                      (active
                        ? "border-m3-primary bg-m3-primary/5 ring-2 ring-m3-primary/30"
                        : "border-slate-200 bg-slate-50 hover:border-m3-primary/50 hover:bg-white")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border " +
                          b.cls
                        }
                      >
                        {b.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        #{c.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 line-clamp-1">
                      {c.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.claimant.name} ↔ {c.against.name}
                      {c.reservation ? ` • سفارش #${c.reservation.code}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selected && badge ? (
          <>
            {/* Case header card */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border " +
                        badge.cls
                      }
                    >
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                      {badge.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 font-mono">
                      پرونده: #{selected.id.slice(-6).toUpperCase()}
                    </span>
                    {selected.reservation && (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 font-mono">
                        سفارش: #{selected.reservation.code}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                    <span className="mt-2">{selected.title}</span>
                    {selected.reservation?.itemTitle && (
                      <span className="text-sm font-normal text-slate-400 mt-2">
                        | {selected.reservation.itemTitle}
                      </span>
                    )}
                  </h1>
                </div>
                {selected.reservation && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-right">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">
                        hourglass_top
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-amber-700 font-medium block mt-2">
                        {selected.reservation.paymentMethod === "PROMISSORY"
                          ? "ودیعه با سفته الکترونیک تضمین شده (نقدی نشده):"
                          : "ودیعه مسدود نزد اٌوِرا:"}
                      </span>
                      <div className="text-lg font-black font-mono text-amber-800 tracking-wider mt-2">
                        {faToman(selected.reservation.deposit)}{" "}
                        <span className="text-xs font-normal">
                          تومان (شبیه‌سازی)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {selected.reservation?.deliveryNote && (
                  <div className="md:col-span-3 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-xs text-slate-700 leading-6">
                    <span className="font-bold text-amber-800 block mb-1">
                      یادداشت بازرسی تحویل مستأجر (
                      {DELIVERY_STATUS_LABELS[selected.reservation.deliveryStatus ?? ""] ?? selected.reservation.deliveryStatus}):
                    </span>
                    {selected.reservation.deliveryNote}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-sm">
                {/* Claimant */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-11 h-11 rounded-full bg-violet-100 text-m3-primary flex items-center justify-center font-bold">
                    {initials(selected.claimant.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {selected.claimant.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                        شاکی
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      احراز: {selected.claimant.kycStatus}
                    </p>
                  </div>
                </div>
                {/* Against */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    {initials(selected.against.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {selected.against.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                        متقابل
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      احراز: {selected.against.kycStatus}
                    </p>
                  </div>
                </div>
                {/* Escrow box */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/70 border border-purple-200/60">
                  <div className="w-11 h-11 rounded-full bg-m3-primary text-white flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-xl">
                      shield_lock
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-m3-primary text-xs">
                      صندوق امانی امن اٌوِرا (Overa Escrow)
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      مبلغ{" "}
                      <span className="font-bold text-slate-900">
                        {faToman(selected.reservation?.deposit ?? 0)} تومان
                      </span>{" "}
                      تا پایان داوری در دفتر اٌوِرا بلوکه است (شبیه‌سازی).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left (7 cols): evidence & expert decision */}
              <div className="lg:col-span-7 space-y-6">
                {/* Evidence comparison */}
                <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-m3-primary">
                        compare
                      </span>
                      <h2 className="font-bold text-base text-slate-900">
                        ادله و مستندات طرفین (تحویل و بازگشت)
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    ادعای ثبت‌شده شاکی و پاسخ متقابل؛ کارشناس با بررسی این
                    مستندات رأی را صادر می‌کند.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-bold text-emerald-600">
                          <span className="material-symbols-outlined text-sm">
                            check_circle
                          </span>
                          ادعای شاکی: {selected.claimant.name}
                        </span>
                      </div>
                      <div className="rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-100 aspect-[4/3] flex items-center justify-center">
                        {selected.evidenceUrls[0] ? (
                          <img
                            className="w-full h-full object-cover"
                            src={selected.evidenceUrls[0]}
                            alt="مستند ادعای شاکی"
                          />
                        ) : (
                          <div className="p-4 text-center text-[11px] text-slate-500 leading-relaxed">
                            <span className="material-symbols-outlined text-3xl block mb-1 text-slate-400">
                              image
                            </span>
                            مستند تصویری برای این ادعا ثبت نشده است.
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                        <span className="">
                          {selected.description.slice(0, 80)}…
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-bold text-rose-600">
                          <span className="material-symbols-outlined text-sm">
                            error
                          </span>
                          مستندات متقابل / وضعیت عودت
                        </span>
                      </div>
                      <div className="rounded-xl overflow-hidden border-2 border-rose-500 bg-slate-100 aspect-[4/3] flex items-center justify-center">
                        {selected.evidenceUrls[1] ? (
                          <img
                            className="w-full h-full object-cover contrast-125"
                            src={selected.evidenceUrls[1]}
                            alt="مستند متقابل"
                          />
                        ) : (
                          <div className="p-4 text-center text-[11px] text-slate-500 leading-relaxed">
                            <span className="material-symbols-outlined text-3xl block mb-1 text-slate-400">
                              upload
                            </span>
                            {selected.appealMessage
                              ? "مستند متقابل تصویری ثبت نشده؛ پاسخ متقابل متنی در گفتگوی داوری آمده است."
                              : "در این پرونده پاسخ یا مستند متقابلی ثبت نشده است."}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                        <span>وضعیت مستندات:</span>
                        <span
                          className={
                            "font-bold " +
                            (selected.evidenceUrls[1]
                              ? "text-rose-600"
                              : "text-slate-600")
                          }
                        >
                          {selected.evidenceUrls[1]
                            ? "دو مستند ثبت شده"
                            : "مستند ثانویه ندارد"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Decision / expert report */}
                <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-m3-primary">
                        request_quote
                      </span>
                      <h2 className="font-bold text-base text-slate-900">
                        مرحله تصمیم‌گیری و تسویه خسارت
                      </h2>
                    </div>
                    {selected.decidedAt && (
                      <span className="text-xs text-slate-500 font-mono">
                        تاریخ رأی: {faDateTime(selected.decidedAt)}
                      </span>
                    )}
                  </div>
                  {selected.status === "UNDER_REVIEW" && (
                    <div className="space-y-3">
                      <label
                        className="text-xs font-bold text-slate-900 block"
                        htmlFor="arb-decision"
                      >
                        متن رأی کارشناسی (به طرفین اعلام می‌شود):
                      </label>
                      <textarea
                        id="arb-decision"
                        rows={3}
                        className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-m3-primary focus:ring-m3-primary px-3 py-2.5 text-slate-800 placeholder-slate-400 resize-none"
                        placeholder="مثلاً: با بررسی مستندات، خسارت تایید شد و مبلغ X تومان از ودیعه کسر و مابقی آزاد می‌شود..."
                        value={decisionText}
                        onChange={(e) => setDecisionText(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-m3-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-60"
                          disabled={busy}
                          onClick={() =>
                            patchClaim(
                              selected.id,
                              {
                                status: "DECIDED",
                                decision: decisionText || undefined,
                              },
                              "رأی داوری ثبت شد (شبیه‌سازی — نیازمند تایید حقوقی برای اجرا).",
                            )
                          }
                        >
                          <span className="material-symbols-outlined text-sm">
                            check_circle
                          </span>
                          تایید رأی داوری و ثبت تصمیم
                        </button>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          ثبت رأی در دفتر اٌوِرا انجام می‌شود؛ تسویه واقعی
                          وابسته به تایید حقوقی است.
                        </p>
                      </div>
                    </div>
                  )}
                  {(selected.status === "DECIDED" ||
                    selected.status === "APPEALED") && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-purple-50 border-r-4 border-r-m3-primary border border-purple-200 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-m3-primary block mb-1">
                          متن رأی ثبت‌شده:
                        </span>
                        {selected.decision ?? "—"}
                      </div>
                      {selected.status === "DECIDED" && (
                        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                          <p className="text-xs font-extrabold text-slate-800">
                            رأی دربارهٔ ودیعه (اجرای رأی، کیف پول طرفین را واقعاً تسویه می‌کند — شبیه‌سازی):
                          </p>
                          {[
                            { id: "RELEASE_TO_RENTER", label: "آزادسازی کامل ودیعه به نفع مستأجر", icon: "undo" },
                            { id: "PARTIAL_DEDUCTION", label: "کسر بخشی از ودیعه (سهم میزبان) و آزادسازی مابقی", icon: "content_cut" },
                            { id: "PAY_TO_HOST", label: "پرداخت کامل ودیعه به میزبان", icon: "payments" },
                          ].map((v) => (
                            <label
                              key={v.id}
                              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-bold cursor-pointer transition ${
                                verdict === v.id
                                  ? "border-m3-primary bg-white shadow-sm text-slate-900"
                                  : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
                              }`}
                            >
                              <input
                                type="radio"
                                name="verdict"
                                value={v.id}
                                checked={verdict === v.id}
                                onChange={() => setVerdict(v.id)}
                                className="accent-[#630ed4]"
                              />
                              <span className="material-symbols-outlined text-base text-m3-primary">
                                {v.icon}
                              </span>
                              {v.label}
                            </label>
                          ))}
                          {verdict === "PARTIAL_DEDUCTION" && selected.reservation && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={selected.reservation.deposit}
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(e.target.value)}
                                placeholder={`مبلغ کسر به تومان (حداکثر ${selected.reservation.deposit.toLocaleString("en-US")})`}
                                className="w-full text-xs rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                                از {faToman(selected.reservation.deposit)} تومان ودیعه
                              </span>
                            </div>
                          )}
                          <textarea
                            rows={2}
                            value={settleNote}
                            onChange={(e) => setSettleNote(e.target.value)}
                            placeholder="متن تسویه/توضیح اجرای رأی (اختیاری — به طرفین اعلام می‌شود)…"
                            className="w-full text-xs rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
                          />
                          <button
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-60"
                            disabled={busy}
                            onClick={() =>
                              patchClaim(
                                selected.id,
                                {
                                  status: "SETTLED",
                                  verdict,
                                  ...(verdict === "PARTIAL_DEDUCTION"
                                    ? { chargeAmount: Number(chargeAmount) || 0 }
                                    : {}),
                                  ...(settleNote.trim() ? { settlementNote: settleNote.trim() } : {}),
                                },
                                "رأی اجرا و ودیعه تسویه شد؛ سفارش تکمیل شد (شبیه‌سازی).",
                              )
                            }
                          >
                            <span className="material-symbols-outlined text-sm">
                              handshake
                            </span>
                            اجرای رأی و تسویه ودیعه و بستن پرونده
                          </button>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            با اجرای رأی، مبلغ ودیعه طبق انتخاب شما بین کیف پول
                            مستأجر و میزبان جابه‌جا می‌شود و سفارش تکمیل می‌گردد
                            (شبیه‌سازی — هر رأی فقط یک‌بار قابل اجراست).
                          </p>
                        </div>
                      )}
                      {selected.status === "APPEALED" && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
                          <span className="material-symbols-outlined text-base">
                            replay
                          </span>
                          درخواست تجدیدنظر کارشناسی دوم ثبت شده است؛ می‌توانید
                          پرونده را تسویه کنید یا به بررسی بازگردانید.
                        </div>
                      )}
                      {selected.status === "APPEALED" && (
                        <button
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                          disabled={busy}
                          onClick={() =>
                            patchClaim(
                              selected.id,
                              { status: "UNDER_REVIEW" },
                              "پرونده به مرحله بررسی بازگشت.",
                            )
                          }
                        >
                          <span className="material-symbols-outlined text-sm">
                            replay
                          </span>
                          بازگشت به بررسی کارشناسی
                        </button>
                      )}
                    </div>
                  )}
                  {selected.status === "SETTLED" && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                      <span className="font-bold block mb-1">
                        پرونده تسویه و بسته شد (شبیه‌سازی):
                      </span>
                      {selected.settlementNote ?? "تسویه ثبت شد."}
                    </div>
                  )}
                  {selected.status === "REJECTED" && (
                    <div className="p-3 rounded-xl bg-m3-error-container text-m3-on-error-container text-xs leading-relaxed">
                      این پرونده در فرآیند بررسی رد شده است و تصمیم آن نهایی
                      است.
                    </div>
                  )}
                  {(selected.status === "OPEN" ||
                    selected.status === "COUNTER_EVIDENCE") && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-m3-primary/40 text-m3-primary hover:bg-purple-50 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                        disabled={busy}
                        onClick={() =>
                          patchClaim(
                            selected.id,
                            { status: "UNDER_REVIEW" },
                            "پرونده به مرحله بررسی کارشناسی رفت.",
                          )
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          assured_workload
                        </span>
                        ارسال به بررسی کارشناسی رسمی
                      </button>
                      <button
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                        disabled={busy}
                        onClick={() =>
                          patchClaim(
                            selected.id,
                            { status: "REJECTED" },
                            "پرونده رد شد.",
                          )
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          block
                        </span>
                        رد پرونده (عدم ورود خسارت)
                      </button>
                      <p className="text-[10px] text-slate-400">
                        برای صدور رأی، ابتدا پرونده باید در مرحله «بررسی
                        کارشناسی» قرار گیرد.
                      </p>
                    </div>
                  )}
                </section>
              </div>

              {/* Right (5 cols): arbitration thread */}
              <div className="lg:col-span-5 space-y-6">
                <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-m3-primary">
                        forum
                      </span>
                      <h2 className="font-bold text-base text-slate-900">
                        گفتگوی داوری و تبادل شواهد
                      </h2>
                    </div>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      ۳ طرف متصل
                    </span>
                  </div>
                  <div className="flex-1 py-4 space-y-4 overflow-y-auto max-h-[460px] pr-1 custom-scroll">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            person
                          </span>
                          {selected.claimant.name} (شاکی)
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl rounded-tr-none text-xs text-slate-700 leading-relaxed">
                        {selected.description}
                      </div>
                    </div>
                    {selected.appealMessage && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">
                              person
                            </span>
                            {selected.against.name} (مستندات متقابل)
                          </span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl rounded-tr-none text-xs text-slate-700 leading-relaxed">
                          {selected.appealMessage}
                        </div>
                      </div>
                    )}
                    {selected.decision && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-m3-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs fill">
                              gavel
                            </span>
                            کارشناس داوری اٌوِرا
                          </span>
                          {selected.decidedAt && (
                            <span className="text-slate-400 font-mono">
                              {faDateTime(selected.decidedAt)}
                            </span>
                          )}
                        </div>
                        <div className="bg-purple-50 border-r-4 border-r-m3-primary border border-purple-200 p-3 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2">
                          <p>{selected.decision}</p>
                          {selected.settlementNote && (
                            <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60 text-[11px] text-purple-700 font-semibold">
                              <span className="material-symbols-outlined text-xs">
                                handshake
                              </span>
                              {selected.settlementNote}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {selected.reservation && (
                      <div className="flex justify-center my-2">
                        <div className="bg-slate-50 text-slate-500 text-[11px] font-medium px-4 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-m3-primary">
                            link
                          </span>
                          <span>
                            مرتبط با سفارش #{selected.reservation.code}
                          </span>
                          <Link
                            className="text-m3-primary font-bold hover:underline"
                            href={`/rental-lifecycle/${selected.reservation.id}`}
                          >
                            مشاهده چرخه رزرو
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-m3-primary focus:ring-m3-primary py-2 px-3 text-slate-800 placeholder-slate-400"
                        placeholder="نوشتن پاسخ یا توضیح تکمیلی شواهد..."
                        type="text"
                        disabled
                        title="به‌زودی"
                      />
                      <button
                        className="bg-m3-primary text-white p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                        disabled
                        title="به‌زودی"
                      >
                        <span className="material-symbols-outlined text-sm">
                          send
                        </span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      * تبادل پیام آزاد پرونده پس از اتصال سرویس پیام‌رسانی
                      داوری فعال می‌شود؛ تصمیم رسمی از طریق باکس «مرحله
                      تصمیم‌گیری» ثبت می‌شود.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          <section className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 text-center">
            <span className="material-symbols-outlined text-[44px] text-slate-300 block mb-2">
              folder_open
            </span>
            <p className="text-sm font-bold text-slate-900">
              پرونده‌ای برای نمایش انتخاب نشده است
            </p>
            <p className="text-xs text-slate-500 mt-1">
              با اتصال جریان اجاره و ثبت ادعای خسارت، پرونده‌ها در این پنل نمایش
              داده می‌شوند.
            </p>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-4 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-m3-primary"></span>
            <p className="font-semibold text-slate-800">
              پنل داوری و حل اختلاف اٌوِرا — نسخه شبیه‌سازی
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              مقررات داوری و حل اختلاف
            </Link>
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/admin-dashboard"
            >
              بازگشت به مرکز نظارت
            </Link>
          </div>
        </div>
      </footer>

      {toast && (
        <div
          className={
            "fixed bottom-6 right-1/2 translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-xl text-sm font-semibold max-w-[92vw] text-center " +
            (toast.kind === "ok"
              ? "bg-slate-900 text-white"
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
