"use client";

import OtpConfirmFlow from "./OtpConfirmFlow";

/**
 * «تأیید دریافت کالا» card — shown ONLY to the renter of the reservation and
 * only while the host has recorded the hand-over (status DELIVERED). Confirming
 * requires the renter's one-time code (DELIVERY_RECEIVED stage); the server
 * flips the order to RENTAL_ACTIVE and records the real rental start.
 * Layout mirrors the existing Overa card composition (purple-100 border,
 * rounded-2xl, material symbol icon, status chip).
 */
export type DeliveryConfirmCardProps = {
  reservationId: string;
  code: string;
  listingTitle: string;
  hostName: string;
  /** Optional callback after a verified code (e.g. reload a list). */
  onSettled?: () => void;
};

export default function DeliveryConfirmCard({
  reservationId,
  code,
  listingTitle,
  hostName,
  onSettled,
}: DeliveryConfirmCardProps) {
  return (
    <article
      className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      data-purpose="delivery-confirmation-card"
    >
      {/* Card header + status chip */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-m3-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">package_2</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              تأیید دریافت کالا
            </h3>
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
          <p className="text-sm font-bold text-slate-800">
            آیا کالا را سالم تحویل گرفته‌اید؟
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            میزبان ({hostName}) تحویل این کالا را در سیستم ثبت کرده است. با زدن
            دکمه زیر، کد یک‌بارمصرف برای شما صادر می‌شود؛ پس از تأیید کد، دوره
            اجاره فعال شده و زمان شروع واقعی آن ثبت خواهد شد.
          </p>
        </div>

        <OtpConfirmFlow
          reservationId={reservationId}
          stage="DELIVERY_RECEIVED"
          requestLabel="سالم تحویل گرفتم"
          successMessage="تحویل کالا با موفقیت تأیید شد و دوره اجاره شما آغاز گردید."
          onVerified={onSettled}
        />

        <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-50 pt-3">
          در صورت مشاهده مغایرت در کالا، به‌جای تأیید از دکمه «اعلام خسارت» در
          همین صفحه استفاده کنید تا پرونده به کارشناسان اٌوِرا ارجاع شود.
        </p>
      </div>
    </article>
  );
}
