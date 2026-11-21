"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import OtpConfirmFlow from "./OtpConfirmFlow";

/**
 * Host «تأیید دریافت کالا» card — shown ONLY to the host of the reservation
 * and only while the renter has announced the return (status
 * RETURN_REQUESTED). Two options:
 *   1. «سالم تحویل گرفتم» → host OTP (RETURN_RECEIVED) → server completes the
 *      order and starts the deposit-refund pipeline (sandbox).
 *   2. «اعلام خسارت» → existing dispute action → DISPUTED (review stage);
 *      no auto-completion afterwards.
 */
export type ReturnConfirmCardProps = {
  reservationId: string;
  code: string;
  listingTitle: string;
  renterName: string;
  /** Optional callback after the card's action settles (e.g. reload a list). */
  onSettled?: () => void;
};

export default function ReturnConfirmCard({
  reservationId,
  code,
  listingTitle,
  renterName,
  onSettled,
}: ReturnConfirmCardProps) {
  const router = useRouter();
  const [otpOpen, setOtpOpen] = useState(false);
  const [disputing, setDisputing] = useState(false);

  async function declareDamage() {
    if (
      !window.confirm(
        `آیا برای سفارش «${code}» اعلام خسارت ثبت شود؟ سفارش به مرحله بررسی اختلاف منتقل می‌شود و تکمیل خودکار آن متوقف خواهد شد.`,
      )
    )
      return;
    setDisputing(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispute" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "ثبت اعلام خسارت ممکن نشد.");
        return;
      }
      toast.success("درخواست اعلام خسارت ثبت شد. سفارش برای بررسی اختلاف به مرحله بررسی منتقل گردید.");
      onSettled?.();
      router.refresh();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setDisputing(false);
    }
  }

  return (
    <article
      className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      data-purpose="return-confirmation-card"
    >
      {/* Card header + status chip */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">local_shipping</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">تأیید دریافت کالا</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              سفارش #{code} — {listingTitle}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/30 whitespace-nowrap">
          در انتظار تأیید شما
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-slate-800">آیا کالا را سالم تحویل گرفته‌اید؟</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            مستأجر ({renterName}) بازگشت این کالا را در سیستم ثبت کرده است. سلامت کالا را بررسی
            کنید؛ در صورت سالم بودن، بازگشت را با کد یک‌بارمصرف تأیید کنید تا سفارش تکمیل و فرآیند
            بازگشت ودیعه آغاز شود (شبیه‌سازی). در غیر این صورت خسارت را اعلام کنید.
          </p>
        </div>

        {otpOpen ? (
          /* Healthy-return OTP flow (RETURN_RECEIVED stage). */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-surface-container rounded-xl px-3 py-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-base">fact_check</span>
                تأیید دریافت سالم کالا با کد یک‌بارمصرف
              </span>
              <button
                type="button"
                onClick={() => setOtpOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
                title="بازگشت به گزینه‌ها"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <OtpConfirmFlow
              reservationId={reservationId}
              stage="RETURN_RECEIVED"
              requestLabel="دریافت کد تأیید سالم بودن"
              successMessage="بازگشت کالا با موفقیت تأیید شد. سفارش تکمیل شده و فرآیند بازگشت ودیعه آغاز گردید."
              onVerified={onSettled}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: healthy return (OTP-gated) */}
            <button
              type="button"
              onClick={() => setOtpOpen(true)}
              disabled={disputing}
              className="py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              سالم تحویل گرفتم
            </button>
            {/* Option 2: declare damage (existing dispute action) */}
            <button
              type="button"
              onClick={() => void declareDamage()}
              disabled={disputing}
              className="py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.99] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              {disputing ? "در حال ثبت اعلام خسارت..." : "اعلام خسارت"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
