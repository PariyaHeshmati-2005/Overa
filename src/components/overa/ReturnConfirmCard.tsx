"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import OtpConfirmFlow from "./OtpConfirmFlow";

/**
 * Host «تأیید دریافت کالا» card — shown ONLY to the host of the reservation
 * and only while the renter has handed the item back (status
 * RETURN_REQUESTED). TWO options, exactly like the physical hand-back:
 *   1. «تحویل سالم گرفتم» → host OTP (RETURN_RECEIVED) → the rental process
 *      ends, the deposit is released automatically to the renter's wallet and
 *      a successful-rental comment is recorded on the host's reviews.
 *   2. «تحویل و اعلام خسارت» → the damage-description form opens right here;
 *      submitting flips the order to DISPUTED and the case lands DIRECTLY in
 *      the admin dashboard's «اعلام خسارت‌ها» section where the admin chats
 *      with the renter and issues the deposit-split ruling (max one week).
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
  const [damageOpen, setDamageOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* «تحویل و اعلام خسارت»: the damage description MUST be written (min 20
     chars); submitting creates the DamageClaim + flips the order to DISPUTED
     so the case shows up in the admin dashboard's «اعلام خسارت‌ها» queue. */
  async function submitDamage() {
    const text = note.trim();
    if (text.length < 20) {
      toast.error("شرح خسارت باید حداقل ۲۰ کاراکتر باشد.");
      return;
    }
    if (
      !window.confirm(
        `آیا برای سفارش «${code}» «تحویل و اعلام خسارت» ثبت شود؟ سفارش به مرحلهٔ بررسی خسارت می‌رود و پرونده مستقیماً به بخش «اعلام خسارت‌ها» پنل مدیریت ارجاع می‌شود.`,
      )
    )
      return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "declare_damage", note: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "ثبت اعلام خسارت ممکن نشد.");
        return;
      }
      toast.success(
        "اعلام خسارت ثبت شد؛ پرونده به بخش «اعلام خسارت‌ها» پنل مدیریت ارجاع شد و رأی تا حداکثر یک هفته اعلام می‌شود.",
        { duration: 6000 },
      );
      onSettled?.();
      router.refresh();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
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
            کنید؛ در صورت سالم بودن، «تحویل سالم گرفتم» را تأیید کنید تا اجاره تکمیل شود، ودیعه
            به‌صورت خودکار به کیف پول مستأجر آزاد گردد و اجارهٔ موفق در نظرات شما ثبت شود. در غیر
            این صورت «تحویل و اعلام خسارت» را انتخاب و شرح خسارت را بنویسید تا پرونده مستقیماً به
            کارشناسان اٌوِرا ارجاع شود.
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
              successMessage="بازگشت کالا با موفقیت تأیید شد. اجاره تکمیل و ودیعه به‌صورت خودکار به کیف پول مستأجر آزاد گردید."
              onVerified={onSettled}
            />
          </div>
        ) : damageOpen ? (
          /* Damage-description form — opens in place; submitting files the
             case directly to the admin dashboard's «اعلام خسارت‌ها» queue. */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-surface-container rounded-xl px-3 py-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-rose-600 text-base">gavel</span>
                شرح خسارت کالا
              </span>
              <button
                type="button"
                onClick={() => setDamageOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
                title="بازگشت به گزینه‌ها"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              خسارت مشاهده‌شده را دقیق شرح دهید (بخش آسیب‌دیده، میزان خسارت و
              هر توضیح مؤثر برای کارشناسی). پس از ثبت، پرونده مستقیماً به بخش
              «اعلام خسارت‌ها» پنل مدیریت ارجاع می‌شود؛ کارشناسان از طریق
              گفتگوی پرونده با مستأجر در ارتباط خواهند بود و رأی (درصد آزادسازی
              ودیعه به مستأجر و مابقی به کیف پول شما) تا حداکثر یک هفته صادر و
              اجرا می‌شود.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              rows={4}
              maxLength={2000}
              placeholder="مثلاً: لنز دوربین خط و خش عمیق دارد و فوکوس نمی‌کند؛ ضربهٔ گوشهٔ بدنه مشهود است…"
              className="w-full text-xs rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30 resize-none"
            />
            <p className="text-[11px] text-slate-400 font-semibold">
              {note.trim().length < 20
                ? "برای ثبت پرونده، شرح خسارت را بنویسید (حداقل ۲۰ کاراکتر)."
                : "شرح خسارت کامل است؛ دکمهٔ ثبت را بزنید."}
            </p>
            <button
              type="button"
              onClick={() => void submitDamage()}
              disabled={submitting || note.trim().length < 20}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.99] bg-m3-error hover:bg-m3-error/90 text-on-primary shadow-md disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              {submitting
                ? "در حال ثبت اعلام خسارت…"
                : "ثبت شرح خسارت و ارجاع به پنل مدیریت"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: healthy return (OTP-gated) */}
            <button
              type="button"
              onClick={() => setOtpOpen(true)}
              className="py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              تحویل سالم گرفتم
            </button>
            {/* Option 2: declare damage → inline description form */}
            <button
              type="button"
              onClick={() => setDamageOpen(true)}
              className="py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.99] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              تحویل و اعلام خسارت
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
