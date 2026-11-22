"use client";

import OtpConfirmFlow from "./OtpConfirmFlow";

/**
 * «امضای دیجیتال قرارداد» card — shown ONLY to the renter of the reservation
 * while the order is REQUESTED or APPROVED. The host never signs the contract:
 * their approval stays the plain state-machine action.
 *
 * Flow (demo, Sandbox-labelled):
 *   1. renter ticks the contract-terms checkbox (parent gate, `agreed` prop)
 *   2. «دریافت کد امضا» issues a 6-digit one-time code (demo mode shows it in
 *      the labelled dev box — never hard-coded in the client)
 *   3. renter enters the code and presses «ثبت امضا»
 *   4. the server records the signature (signedByRenterAt + event) and sends
 *      the host a notification to confirm the contract as well; when the host
 *      has already approved, the signature doubles as «تایید قرارداد».
 */
export type SignatureCardProps = {
  reservationId: string;
  code: string;
  hostName: string;
  /** Whether the renter ticked the contract-terms checkbox. */
  agreed: boolean;
};

export default function SignatureCard({
  reservationId,
  code,
  hostName,
  agreed,
}: SignatureCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-800">
            امضای دیجیتال قرارداد با رمز یک‌بارمصرف
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            امضا فقط از سوی شما (مستأجر) ثبت می‌شود؛ پس از ثبت امضا، پیامی برای
            میزبان ({hostName}) ارسال می‌شود تا این قرارداد را نیز تایید کند.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-soft text-m3-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">fingerprint</span>
        </div>
      </div>

      {agreed ? (
        <OtpConfirmFlow
          reservationId={reservationId}
          stage="AGREEMENT_SIGNATURE"
          requestLabel="دریافت کد امضا و ثبت قرارداد"
          successMessage="امضای دیجیتال شما با موفقیت ثبت شد؛ پیام تایید برای میزبان ارسال گردید."
        />
      ) : (
        <div className="rounded-xl bg-surface-container-low border border-outline-variant/50 p-4 text-xs text-on-surface-variant font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-m3-primary text-base">
            lock
          </span>
          برای امضای قرارداد، ابتدا تیک «تایید شرایط قرارداد» را در کارت بالا
          بزنید.
        </div>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-50 pt-3">
        امضای نمایشی (Sandbox) — کد یک‌بارمصرف ۶ رقمی در حالت توسعه روی صفحه
        نمایش داده می‌شود؛ اعتبار کد ۵ دقیقه و حداکثر تلاش ۵ بار است.
      </p>
    </div>
  );
}
