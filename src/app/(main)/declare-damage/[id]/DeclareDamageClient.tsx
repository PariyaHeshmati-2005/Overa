"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { faToman } from "@/lib/format";

/**
 * «اعلام خسارت» form — the damage DESCRIPTION page. Neither the renter nor
 * the host can file a claim without writing the description here; submitting
 * POSTs /api/claims (title + description, min 20 chars enforced server-side),
 * which creates the DamageClaim, moves the order to DISPUTED and notifies the
 * counterparty + admins — so the file shows up in EVERY panel.
 */
export type DeclareDamageClientProps = {
  reservationId: string;
  code: string;
  listingTitle: string;
  listingImage: string | null;
  againstName: string;
  viewerIsHost: boolean;
  deposit: number;
  renterDeliveryNote: string | null;
  renterDeliveryStatus: string | null;
  renterName: string;
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "بدون یادداشت بازرسی",
  ACCEPTED_CLEAN: "سالم تحویل گرفته شد",
  ACCEPTED_WITH_ISSUES: "با یادداشت مشکلات تحویل گرفته شد",
  REFUSED_DAMAGE: "تحویل رد شد (اجاره باطل شد)",
};

export default function DeclareDamageClient({
  reservationId,
  code,
  listingTitle,
  listingImage,
  againstName,
  viewerIsHost,
  deposit,
  renterDeliveryNote,
  renterDeliveryStatus,
  renterName,
}: DeclareDamageClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (title.trim().length < 4) {
      toast.error("عنوان اعلام خسارت کوتاه است.");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("شرح خسارت باید حداقل ۲۰ کاراکتر باشد.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          title: title.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "ثبت اعلام خسارت ممکن نشد.");
        return;
      }
      toast.success(
        "اعلام خسارت ثبت و به کارشناسان اٌوِرا ارجاع شد؛ روند پیگیری در صفحهٔ «خسارت و داوری» قابل مشاهده است.",
        { duration: 6000 },
      );
      router.push("/damage-claims");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-28">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-m3-error-container text-m3-on-error-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">gavel</span>
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-on-surface">
            ثبت توضیحات اعلام خسارت
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            سفارش #{code} — {listingTitle}
          </p>
        </div>
      </div>

      {/* Order summary */}
      <section className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          {listingImage && (
            <img
              src={listingImage}
              alt={listingTitle}
              className="size-14 rounded-xl object-cover border border-outline-variant/40 shrink-0"
            />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-800 text-sm">{listingTitle}</p>
            <p className="text-slate-500">
              {viewerIsHost
                ? `مستأجر: ${renterName}`
                : `میزبان: ${againstName}`}
              {" — "}
              ودیعه: {faToman(deposit)} تومان (شبیه‌سازی)
            </p>
          </div>
        </div>
      </section>

      {/* Renter's delivery inspection note — arbitration context */}
      {renterDeliveryNote && (
        <section className="rounded-2xl border border-accent-gold/40 bg-accent-gold/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-accent-gold">
            <span className="material-symbols-outlined text-base">
              report_problem
            </span>
            یادداشت بازرسی تحویل مستأجر ({DELIVERY_STATUS_LABELS[renterDeliveryStatus ?? ""] ?? renterDeliveryStatus})
          </div>
          <p className="text-xs text-slate-700 leading-6 whitespace-pre-wrap">
            {renterDeliveryNote}
          </p>
          <p className="text-[11px] text-slate-500">
            این متن هنگام تحویل کالا توسط مستأجر ثبت شده و مبنای داوری قرار می‌گیرد؛
            شرح خسارت خود را با در نظر گرفتن آن بنویسید.
          </p>
        </section>
      )}

      {/* The form */}
      <section className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            عنوان اعلام خسارت
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder={`مثلاً: خسارت لنز دوربین در بازگشت سفارش ${code}`}
            className="w-full text-xs rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            شرح کامل خسارت <span className="text-m3-error">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder={
              viewerIsHost
                ? "خسارت واردشده به وسیله را دقیق توضیح دهید: چه بخشی، چگونه، در چه زمانی و با استناد به یادداشت تحویل مستأجر…"
                : "مشکل وسیله را دقیق توضیح دهید: چه بخشی، چگونه و در چه زمانی…"
            }
            className="w-full text-xs rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-3 text-on-surface leading-6 focus:outline-none focus:ring-2 focus:ring-m3-primary/30 resize-none"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>حداقل ۲۰ کاراکتر — این متن به پروندهٔ داوری پیوست می‌شود.</span>
            <span>{description.trim().length}/2000</span>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container p-3 text-[11px] text-on-surface-variant leading-6">
          پس از ثبت، سفارش به مرحلهٔ «بررسی اختلاف» منتقل می‌شود، پرونده در
          صفحهٔ «خسارت و داوری» هر دو طرف و در پنل مدیریت باز می‌شود و گفتگوی
          متنی پرونده فعال می‌گردد. رأی کارشناسان دربارهٔ ودیعه (آزادسازی، کسر
          بخشی یا پرداخت به میزبان) در همان پرونده اعلام می‌شود.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="px-6 py-3 rounded-xl bg-m3-error hover:bg-m3-error/90 text-on-primary text-xs font-bold shadow-md transition active:scale-[0.99] flex items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">send</span>
            {busy ? "در حال ثبت پرونده…" : "ثبت اعلام خسارت و ارجاع به داوری"}
          </button>
          <Link
            href={`/rental-lifecycle/${reservationId}`}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            بازگشت به روند اجاره
          </Link>
        </div>
      </section>
    </main>
  );
}
