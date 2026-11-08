"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

/** Normalize Persian/Arabic digits to Latin so API validation passes. */
function toEnDigits(v: string): string {
  return v
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

const RESEND_SECONDS = 60;

/**
 * Two-step OTP sign-in — faithful port of signin-otp.html.
 * Step 1: POST /api/auth/otp/request (demo mode returns `devCode`, shown in a
 * labelled demo box — never hard-coded). Step 2: 4 digit boxes → POST
 * /api/auth/otp/verify → redirect to `next` or "/".
 */
export default function SignInOtpForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown for resend (۶۰ ثانیه, Persian digits).
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const timerLabel =
    secondsLeft > 0
      ? `${toPersianDigits(String(Math.floor(secondsLeft / 60)).padStart(2, "0"))}:${toPersianDigits(String(secondsLeft % 60).padStart(2, "0"))} تا ارسال مجدد`
      : "کد منقضی شد";

  async function requestCode(phoneValue?: string) {
    const target = toEnDigits(phoneValue ?? phone).trim();
    setError("");
    if (!/^09\d{9}$/.test(target)) {
      setError("شماره موبایل معتبر نیست؛ باید با ۰۹ شروع شده و ۱۱ رقم باشد.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "خطایی در ارسال کد رخ داد؛ دوباره تلاش کنید.");
        setLoading(false);
        return;
      }
      setPhone(target);
      setDevCode(typeof data.devCode === "string" ? data.devCode : null);
      setDigits(["", "", "", ""]);
      setSecondsLeft(RESEND_SECONDS);
      if (step !== "code") setStep("code");
      boxRefs.current[0]?.focus();
      toast.success("کد تایید ایجاد شد.");
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    void requestCode();
  }

  function setDigit(index: number, raw: string) {
    const value = toEnDigits(raw).replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const nextDigits = [...prev];
      nextDigits[index] = value;
      return nextDigits;
    });
    if (value && index < 3) boxRefs.current[index + 1]?.focus();
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      setDigits((prev) => {
        const nextDigits = [...prev];
        nextDigits[index - 1] = "";
        return nextDigits;
      });
      boxRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = digits.join("");
    if (code.length !== 4) {
      setError("کد تایید ۴ رقمی را وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "کد وارد‌شده صحیح نیست؛ دوباره تلاش کنید.");
        setLoading(false);
        return;
      }
      toast.success("ورود با موفقیت انجام شد! خوش آمدید.");
      router.push(next || "/");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
      setLoading(false);
    }
  }

  return (
    <>
      <form
        className="space-y-5"
        noValidate
        onSubmit={step === "phone" ? handlePhoneSubmit : handleVerify}
      >
        {/* Step 1: Mobile Phone Number Input */}
        <div className={step === "phone" ? "space-y-2" : "hidden"}>
          <label className="block text-sm font-semibold text-on-surface" htmlFor="mobileInput">
            شماره موبایل
          </label>
          <div className="relative flex items-center rounded-xl border border-outline-variant bg-surface-container-low focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 transition-all">
            <div
              className="pl-3 pr-3.5 text-on-surface-variant flex items-center justify-center border-l border-outline-variant/40 text-sm font-bold text-left ltr"
              dir="ltr"
            >
              <span className="">+۹۸</span>
            </div>
            <input
              className="w-full bg-transparent px-3.5 py-3.5 text-base font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none border-none ring-0 text-right tracking-wider"
              dir="ltr"
              id="mobileInput"
              inputMode="numeric"
              maxLength={11}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="pl-3.5 text-on-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined">smartphone</span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            کد احراز هویت ۴ رقمی برای این شماره ارسال خواهد شد.
          </p>
        </div>

        {/* Step 2: OTP digits container */}
        {step === "code" ? (
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-on-surface">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-base">
                  lock_clock
                </span>
                کد تایید پیامک‌شده به {toPersianDigits(phone)} را وارد کنید:
              </span>
              <span
                className={
                  secondsLeft > 0
                    ? "text-xs text-m3-secondary font-bold bg-secondary-fixed px-2 py-0.5 rounded-full"
                    : "text-xs text-m3-error font-bold bg-m3-error-container px-2 py-0.5 rounded-full"
                }
              >
                {timerLabel}
              </span>
            </div>
            {/* 4-digit OTP box */}
            <div className="flex justify-between gap-2 sm:gap-3 py-1" dir="ltr">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxRefs.current[i] = el;
                  }}
                  className={`otp-box w-12 sm:w-14 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-surface-container-lowest border-2 ${
                    d
                      ? "border-m3-primary text-m3-primary"
                      : "border-outline-variant text-on-surface"
                  } rounded-xl focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/30`}
                  inputMode="numeric"
                  maxLength={1}
                  placeholder="•"
                  type="text"
                  value={toPersianDigits(d)}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                />
              ))}
            </div>
            {/* Resend Action & Edit Phone */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                className="text-on-surface-variant hover:text-m3-primary transition-colors flex items-center gap-1 font-medium"
                onClick={() => setStep("phone")}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                ویرایش شماره موبایل
              </button>
              <button
                className="text-m3-secondary font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline"
                disabled={loading || secondsLeft > 0}
                onClick={() => void requestCode()}
                title={secondsLeft > 0 ? `ارسال مجدد تا ${timerLabel}` : "ارسال مجدد کد"}
                type="button"
              >
                ارسال مجدد کد پیامکی
              </button>
            </div>
          </div>
        ) : null}

        {/* Demo mode: devCode box — the code comes from the API, never hard-coded */}
        {step === "code" && devCode ? (
          <div className="rounded-2xl border border-dashed border-m3-primary/50 bg-primary-fixed/40 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-m3-primary text-xl mt-0.5">
              science
            </span>
            <div className="space-y-1">
              <p className="text-xs font-bold text-m3-primary">
                حالت توسعه: ارسال پیامکی فعال نیست. کد شما:{" "}
                <span className="font-mono text-base tracking-widest" dir="ltr">
                  {toPersianDigits(devCode)}
                </span>
              </p>
              <p className="text-[10px] text-on-surface-variant/80">
                کد بالا به‌صورت آزمایشی تولید شده و فقط در این نسخه نمایشی معتبر
                است.
              </p>
            </div>
          </div>
        ) : null}

        {/* Inline API error */}
        {error ? (
          <div
            className="rounded-xl bg-m3-error-container text-m3-on-error-container px-4 py-3 text-xs font-bold"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {/* Alternative Auth: Password / Single Sign */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface-variant">
            <input
              checked={remember}
              className="rounded border-outline-variant text-m3-primary focus:ring-m3-primary w-4 h-4"
              type="checkbox"
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="">مرا به خاطر بسپار (تا ۳۰ روز)</span>
          </label>
          <Link
            className="text-xs font-bold text-m3-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1"
            href="/signin"
          >
            <span className="material-symbols-outlined text-sm">key</span>
            ورود با رمز عبور ثابت
          </Link>
        </div>

        {/* Primary Submit Button */}
        <button
          className="w-full h-12 sm:h-13 bg-primary-container hover:bg-m3-primary text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-primary-container/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              در حال بررسی و ورود...
            </>
          ) : step === "phone" ? (
            <>
              <span className="">دریافت کد تایید پیامکی</span>
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
            </>
          ) : (
            <>
              <span className="">ورود و تایید هویت</span>
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
            </>
          )}
        </button>
      </form>

      {/* Demo accounts hint — honest sandbox labelling (project playbook §7) */}
      <div className="mt-6 rounded-2xl border border-dashed border-m3-primary/40 bg-primary-fixed/40 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-m3-primary">
          <span className="material-symbols-outlined text-base">science</span>
          حساب‌های آزمایشی (نسخه نمایشی)
        </div>
        <p className="text-[11px] leading-relaxed text-on-surface-variant">
          اجاره‌دهنده <span className="font-mono font-bold">09121111111</span> —
          میزبان <span className="font-mono font-bold">09122222222</span> — مدیر{" "}
          <span className="font-mono font-bold">09120000000</span> — رمز:{" "}
          <span className="font-mono font-bold">overa1234</span>
        </p>
        <button
          className="w-full h-9 rounded-xl bg-m3-primary text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors active:scale-[0.99] disabled:opacity-70"
          disabled={loading}
          onClick={() => {
            setPhone("09122222222");
            setStep("phone");
            setError("");
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-sm">
            auto_fix_high
          </span>
          پرکردن خودکار حساب میزبان
        </button>
        <p className="text-[10px] text-on-surface-variant/80">
          در این نسخه آزمایشی، پیامک واقعی ارسال نمی‌شود و کد روی همین صفحه
          نمایش داده می‌شود.
        </p>
      </div>

      <Toaster position="top-center" richColors />
    </>
  );
}
