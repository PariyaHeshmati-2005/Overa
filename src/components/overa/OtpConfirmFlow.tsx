"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toPersianDigits } from "@/lib/format";
import type { ReservationOtpStage } from "@/lib/rental-state";

/**
 * Shared one-time-code flow for the two-sided delivery/return confirmation
 * cards (renter «تأیید دریافت کالا» and host «تأیید بازگشت کالا»).
 *
 * Request → (demo code box) → 6-digit input → verify; every state shown here
 * comes from the server response — the cards only mirror what
 * /api/reservations/[id]/otp/{request,verify} returns, so no local state can
 * fake a confirmation. All limits (60s resend, 3 sends / 15 min, 5 attempts,
 * 5-min expiry) are enforced server-side and their Persian errors surface
 * here verbatim. UI pattern follows SignInOtpForm (digit boxes + devCode box).
 */

/** Normalize Persian/Arabic digits to Latin so API validation passes. */
function foldDigit(ch: string): string {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  return ch.slice(-1);
}

const RESEND_COOLDOWN_SEC = 60; // mirrors the server-side cooldown

type Phase = "idle" | "requesting" | "awaiting" | "verifying" | "success";

type Props = {
  reservationId: string;
  stage: ReservationOtpStage;
  /** Label of the primary trigger button, e.g. «سالم تحویل گرفتم». */
  requestLabel: string;
  /** Persian message shown (toast + banner) after a verified code. */
  successMessage: string;
  /** Optional extra callback after a verified code (e.g. reload a list). */
  onVerified?: () => void;
  /**
   * Optional extra fields sent along with the verify request — e.g. the
   * renter's «تحویل کالا با وجود برخی مشکلات» note (issuesNote) which the
   * server stores on the order as arbitration evidence.
   */
  extraBody?: Record<string, string>;
};

export default function OtpConfirmFlow({
  reservationId,
  stage,
  requestLabel,
  successMessage,
  onVerified,
  extraBody,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* Resend countdown (server enforces the same window regardless). */
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  async function requestCode() {
    const wasAwaiting = phase === "awaiting" || phase === "verifying";
    setPhase("requesting");
    setError("");
    try {
      const res = await fetch(`/api/reservations/${reservationId}/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "درخواست کد ممکن نشد؛ دوباره تلاش کنید.");
        setPhase(wasAwaiting ? "awaiting" : "idle");
        return;
      }
      setDevCode(typeof data.devCode === "string" ? data.devCode : null);
      setPhase("awaiting");
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("کد تأیید صادر شد.");
      setTimeout(() => boxRefs.current[0]?.focus(), 50);
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
      setPhase(wasAwaiting ? "awaiting" : "idle");
    }
  }

  function setDigit(index: number, raw: string) {
    const value = foldDigit(raw);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError("");
    if (value && index < 5) boxRefs.current[index + 1]?.focus();
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      boxRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index < 5) boxRefs.current[index + 1]?.focus();
    if (e.key === "ArrowRight" && index > 0) boxRefs.current[index - 1]?.focus();
  }

  async function verify() {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("کد تأیید ۶ رقمی را وارد کنید.");
      return;
    }
    setPhase("verifying");
    setError("");
    try {
      const res = await fetch(`/api/reservations/${reservationId}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, code, ...extraBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "کد وارد‌شده صحیح نیست؛ دوباره تلاش کنید.");
        setPhase("awaiting");
        return;
      }
      setPhase("success");
      toast.success(successMessage);
      onVerified?.();
      // Let the success banner render briefly, then pull the new status.
      setTimeout(() => router.refresh(), 1400);
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
      setPhase("awaiting");
    }
  }

  const busy = phase === "requesting" || phase === "verifying";
  const codeComplete = digits.join("").length === 6;

  /* Verified state — success banner (parent refreshes the reservation). */
  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
        <div className="size-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">task_alt</span>
        </div>
        <p className="text-xs text-emerald-800 font-bold leading-relaxed">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary trigger */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={() => void requestCode()}
          disabled={busy}
          className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{busy ? "در حال درخواست کد..." : requestLabel}</span>
        </button>
      )}

      {/* Code entry — appears inside the same card after the request */}
      {phase !== "idle" && (
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-on-surface">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-m3-primary text-base">lock_clock</span>
              کد تأیید ۶ رقمی ارسال‌شده را وارد کنید:
            </span>
            {resendIn > 0 && (
              <span className="text-[11px] text-m3-secondary font-bold bg-secondary-fixed px-2 py-0.5 rounded-full whitespace-nowrap">
                {toPersianDigits(resendIn)} ثانیه تا ارسال مجدد
              </span>
            )}
          </div>

          {/* 6-digit OTP box (SignInOtpForm pattern) */}
          <div className="flex justify-between gap-1.5 sm:gap-2.5 py-1" dir="ltr">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxRefs.current[i] = el;
                }}
                className={`w-10 sm:w-12 h-12 text-center text-lg sm:text-xl font-bold bg-surface-container-lowest border-2 ${
                  d
                    ? "border-m3-primary text-m3-primary"
                    : "border-outline-variant text-on-surface"
                } rounded-xl focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/30`}
                inputMode="numeric"
                data-numeric="keep-zeros"
                maxLength={1}
                placeholder="•"
                type="text"
                value={toPersianDigits(d)}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(i, e)}
                disabled={busy}
                aria-label={`رقم ${i + 1} کد تأیید`}
              />
            ))}
          </div>

          {/* Demo mode: the code comes from the API response only — the
              server (env check) decides whether to include it, never the UI. */}
          {devCode && (
            <div className="rounded-xl border border-dashed border-m3-primary/50 bg-primary-fixed/40 p-3 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-m3-primary text-lg mt-0.5">science</span>
              <p className="text-xs font-bold text-m3-primary leading-relaxed">
                حالت توسعه: پیامک واقعی ارسال نشده است. کد شما:{" "}
                <span className="font-mono text-sm tracking-widest" dir="ltr">
                  {toPersianDigits(devCode)}
                </span>
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs font-bold text-m3-error flex items-center gap-1" role="alert">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => void requestCode()}
              disabled={busy || resendIn > 0}
              className="text-m3-primary font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline flex items-center gap-1"
              title={resendIn > 0 ? `ارسال مجدد تا ${toPersianDigits(resendIn)} ثانیه دیگر` : "ارسال مجدد کد"}
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              ارسال مجدد کد
            </button>
            <button
              type="button"
              onClick={() => void verify()}
              disabled={busy || !codeComplete}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-md transition active:scale-[0.99] flex items-center gap-1.5 ${
                codeComplete && !busy
                  ? "bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25"
                  : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-base">verified_user</span>
              {phase === "verifying" ? "در حال بررسی کد..." : "تأیید کد"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
