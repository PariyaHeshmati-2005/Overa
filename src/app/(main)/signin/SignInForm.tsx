"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

/** Normalize Persian/Arabic digits to Latin so API validation passes. */
function toEnDigits(v: string): string {
  return v
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * Password sign-in form — faithful port of signin.html form block.
 * POSTs to /api/auth/login; API `error` messages are shown inline in Persian.
 */
export default function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalizedPhone = toEnDigits(phone).trim();
    if (!normalizedPhone) {
      setError("شماره موبایل یا ایمیل حساب کاربری را وارد کنید.");
      return;
    }
    if (!password) {
      setError("رمز عبور را وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "خطایی در ورود رخ داد؛ دوباره تلاش کنید.");
        setLoading(false);
        return;
      }
      toast.success("ورود موفق! خوش آمدید.");
      router.push(next || "/");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
      setLoading(false);
    }
  }

  function fillHostDemo() {
    setPhone("09122222222");
    setPassword("overa1234");
    setError("");
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Mobile/Email Input */}
        <div className="space-y-1.5">
          <label
            className="block text-xs font-bold text-on-surface"
            htmlFor="user-identifier"
          >
            شماره موبایل یا ایمیل حساب کاربری
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full h-12 pr-11 pl-16 rounded-xl border border-outline-variant bg-surface-bright text-on-surface placeholder:text-m3-outline text-sm font-medium focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-all outline-none"
              id="user-identifier"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا info@example.com"
              type="text"
              autoComplete="username"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="absolute right-3.5 flex items-center pointer-events-none text-m3-secondary">
              <span className="material-symbols-outlined text-xl">
                smartphone
              </span>
            </div>
            <div className="absolute left-3 text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md border border-outline-variant/30 font-mono">
              +۹۸
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            برای حساب‌های تایید شده، می‌توانید از آدرس ایمیل نیز استفاده نمایید.
          </p>
        </div>
        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              className="block text-xs font-bold text-on-surface"
              htmlFor="user-password"
            >
              رمز عبور
            </label>
            <Link
              className="text-xs font-bold text-m3-primary hover:text-m3-secondary transition-colors inline-flex items-center gap-1"
              href="/signin-otp"
              title="با کد یکبار مصرف (OTP) وارد شوید"
            >
              <span className="">رمز عبور خود را فراموش کرده‌اید؟</span>
            </Link>
          </div>
          <div className="relative flex items-center">
            <input
              className="w-full h-12 pr-11 pl-11 rounded-xl border border-outline-variant bg-surface-bright text-on-surface placeholder:text-m3-outline text-sm font-medium focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-all outline-none"
              id="user-password"
              placeholder="••••••••••••"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="absolute right-3.5 flex items-center pointer-events-none text-m3-secondary">
              <span className="material-symbols-outlined text-xl">key</span>
            </div>
            <button
              className="absolute left-3.5 flex items-center text-m3-outline hover:text-on-surface transition-colors cursor-pointer"
              onClick={() => setShowPassword((v) => !v)}
              title="نمایش یا پنهان‌سازی رمز عبور"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>
        {/* Inline API error */}
        {error ? (
          <div
            className="rounded-xl bg-m3-error-container text-m3-on-error-container px-4 py-3 text-xs font-bold"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {/* Options Row (Remember me + 2FA flag) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              checked={remember}
              className="w-4 h-4 rounded text-m3-primary border-outline-variant focus:ring-m3-primary/30"
              type="checkbox"
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="text-xs font-semibold text-on-surface">
              مرا به خاطر بسپار (تا ۳۰ روز)
            </span>
          </label>
          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-m3-secondary">
            <span className="material-symbols-outlined text-sm text-m3-primary">
              security
            </span>
            <span className="">
              ورود امن با تایید پیامکی در صورت فعالیت مشکوک
            </span>
          </div>
        </div>
        {/* Primary Submit CTA */}
        <button
          className="w-full h-12 rounded-xl bg-primary-container hover:bg-m3-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-m3-primary/25 transition-all duration-200 hover:shadow-m3-primary/35 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span className="">در حال ورود…</span>
            </>
          ) : (
            <>
              <span className="">ورود به حساب کاربری</span>
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 text-center w-full max-w-md mx-auto">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/40"></div>
        </div>
        <div className="relative inline-block px-4 bg-surface-container-lowest text-xs text-on-surface-variant font-bold">
          یا ورود با روش‌های دیگر
        </div>
      </div>
      {/* Alternative: Quick OTP Link */}
      <Link
        className="w-full max-w-md mx-auto h-11 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-2 text-xs font-bold text-on-surface transition-all"
        href={
          next && next !== "/"
            ? `/signin-otp?next=${encodeURIComponent(next)}`
            : "/signin-otp"
        }
      >
        <span className="material-symbols-outlined text-m3-primary text-lg">
          phonelink_ring
        </span>
        <span className="">ورود با ارسال کد تایید یکبار مصرف (OTP)</span>
      </Link>

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
          className="w-full h-9 rounded-xl bg-m3-primary text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors active:scale-[0.99]"
          onClick={fillHostDemo}
          type="button"
        >
          <span className="material-symbols-outlined text-sm">
            auto_fix_high
          </span>
          پرکردن خودکار حساب میزبان
        </button>
        <p className="text-[10px] text-on-surface-variant/80">
          این صفحه به محیط آزمایشی اٌوِرا متصل است؛ هیچ پیامک واقعی ارسال
          نمی‌شود.
        </p>
      </div>

      <Toaster position="top-center" richColors />
    </>
  );
}
