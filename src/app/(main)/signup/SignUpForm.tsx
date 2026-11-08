"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

/** Normalize Persian/Arabic digits to Latin so API validation passes. */
function toEnDigits(v: string): string {
  return v
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

type Intent = "both" | "renter" | "host";

const INTENT_OPTIONS: Array<{ value: Intent; icon: string; label: string }> = [
  { value: "both", icon: "sync_alt", label: "هر دو" },
  { value: "renter", icon: "shopping_bag", label: "مستاجر وسایل" },
  { value: "host", icon: "storefront", label: "میزبان و مالک" },
];

/** Registration form — faithful port of signup.html, wired to /api/auth/register. */
export default function SignUpForm({ next }: { next: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [intent, setIntent] = useState<Intent>("both");
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live password strength meter (same 3-segment visual as the source).
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/\d/.test(password) && /[a-zA-Zآ-ی]/.test(password)) score++;
    return score;
  }, [password]);
  const strengthLabel =
    password.length === 0
      ? ""
      : strength <= 1
        ? "ضعیف"
        : strength === 2
          ? "متوسط"
          : "قوی";
  const strengthColor =
    strength <= 1 ? "bg-m3-error" : strength === 2 ? "bg-accent-gold" : "bg-m3-primary";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalizedPhone = toEnDigits(phone).trim();
    if (name.trim().length < 2) {
      setError("نام و نام خانوادگی را کامل وارد کنید.");
      return;
    }
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError("شماره موبایل معتبر نیست؛ باید با ۰۹ شروع شده و ۱۱ رقم باشد.");
      return;
    }
    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (!agree) {
      setError("برای ایجاد حساب، پذیرش قوانین و حریم خصوصی الزامی است.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: normalizedPhone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "خطایی در ثبت‌نام رخ داد؛ دوباره تلاش کنید.");
        setLoading(false);
        return;
      }
      toast.success("ثبت‌نام انجام شد! به اورا خوش آمدید.");
      router.push(next || "/");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
      setLoading(false);
    }
  }

  return (
    <>
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Field 1: Full Name */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="fullNameInput">
              نام و نام خانوادگی
            </label>
            <div className="relative flex items-center rounded-xl border border-outline-variant bg-surface-container-low focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 transition-all">
              <input
                className="w-full bg-transparent px-3.5 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none border-none ring-0"
                id="fullNameInput"
                placeholder="مثال: سارا محمدی"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="pl-3.5 text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
            </div>
          </div>
          {/* Field 2: Mobile Number */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="mobileInput">
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
                className="w-full bg-transparent px-3.5 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none border-none ring-0 text-right tracking-wider"
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
          </div>
          {/* Field 3: National ID (demo: not stored — clearly labelled) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-on-surface" htmlFor="nationalCodeInput">
                کد ملی (جهت اعتبارسنجی و استعلام امن)
              </label>
              <span className="text-[11px] text-m3-primary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                تایید هویت آنی
              </span>
            </div>
            <div className="relative flex items-center rounded-xl border border-outline-variant bg-surface-container-low focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 transition-all">
              <input
                className="w-full bg-transparent px-3.5 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none border-none ring-0 text-right tracking-wider"
                dir="ltr"
                id="nationalCodeInput"
                inputMode="numeric"
                maxLength={10}
                placeholder="۰۰۱۲۳۴۵۶۷۸"
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
              />
              <div className="pl-3.5 text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">badge</span>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
              تنها برای استعلام اصالت و فعال‌سازی پوشش بیمه ۵۰ میلیون تومانی
              اوراگارد استفاده می‌شود.
            </p>
          </div>
          {/* Field 4: Password with strength meter */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="passwordInput">
              رمز عبور
            </label>
            <div className="relative flex items-center rounded-xl border border-outline-variant bg-surface-container-low focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 transition-all">
              <input
                className="w-full bg-transparent px-3.5 py-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none border-none ring-0 text-left ltr"
                dir="ltr"
                id="passwordInput"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="pl-3.5 text-on-surface-variant hover:text-m3-primary transition-colors flex items-center justify-center"
                onClick={() => setShowPassword((v) => !v)}
                title="نمایش یا پنهان‌سازی رمز عبور"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {/* Password strength indicator */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1 font-medium">
                <span className="">
                  امنیت رمز عبور:{" "}
                  {strengthLabel ? (
                    <strong className={strength === 3 ? "text-m3-primary" : "text-accent-gold"}>
                      {strengthLabel}
                    </strong>
                  ) : (
                    <strong className="text-on-surface-variant">—</strong>
                  )}
                </span>
                <span className="text-[10px] text-on-surface-variant/80">
                  حداقل ۸ کاراکتر ترکیبی
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5">
                <div className={`rounded-full ${strength >= 1 ? strengthColor : "bg-surface-container-highest"}`}></div>
                <div className={`rounded-full ${strength >= 2 ? strengthColor : "bg-surface-container-highest"}`}></div>
                <div className={`rounded-full ${strength >= 3 ? strengthColor : "bg-primary-container/60"}`}></div>
              </div>
            </div>
          </div>
          {/* Field 5: Intent / Role Selection Chips */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              قصد شما از عضویت در اورا چیست؟
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer text-center transition-all ${
                    intent === opt.value
                      ? "border-2 border-m3-primary bg-primary-fixed/20"
                      : "border border-outline-variant/60 bg-surface-container-low hover:border-m3-primary/50"
                  }`}
                >
                  <input
                    checked={intent === opt.value}
                    className="hidden"
                    name="userIntent"
                    type="radio"
                    value={opt.value}
                    onChange={() => setIntent(opt.value)}
                  />
                  <span
                    className={`material-symbols-outlined text-xl mb-1 ${intent === opt.value ? "text-m3-primary" : "text-on-surface-variant"}`}
                  >
                    {opt.icon}
                  </span>
                  <span className={`text-xs ${intent === opt.value ? "font-bold text-m3-primary" : "font-semibold text-on-surface"}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {/* Agreement Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-on-surface-variant leading-relaxed">
              <input
                checked={agree}
                className="rounded border-outline-variant text-m3-primary focus:ring-m3-primary w-4 h-4 mt-0.5"
                type="checkbox"
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span className="">
                <Link
                  className="text-m3-primary font-semibold underline hover:text-on-primary-fixed-variant"
                  href="/tos-support-faq"
                >
                  شرایط و قوانین استفاده
                </Link>{" "}
                از پلتفرم اورا و{" "}
                <Link
                  className="text-m3-primary font-semibold underline hover:text-on-primary-fixed-variant"
                  href="/tos-support-faq"
                >
                  سیاست حفظ حریم خصوصی
                </Link>{" "}
                را می‌پذیرم.
              </span>
            </label>
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
        {/* Primary CTA Submit Button */}
        <button
          className="w-full h-12 sm:h-13 bg-primary-container hover:bg-m3-primary text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-primary-container/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              در حال ایجاد حساب...
            </>
          ) : (
            <>
              <span className="">تکمیل ثبت‌نام و ورود به حساب</span>
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
            </>
          )}
        </button>
        {/* Switch to Existing Account Option */}
        <div className="text-center pt-2">
          <p className="text-xs text-on-surface-variant">
            قبلاً در اورا حساب کاربری ساخته‌اید؟
            <Link
              className="text-m3-primary font-bold hover:underline transition-colors cursor-pointer mr-1"
              href="/signin"
            >
              ورود به حساب کاربری
            </Link>
          </p>
        </div>
      </form>

      {/* Demo accounts hint — honest sandbox labelling (project playbook §7) */}
      <div className="mt-6 rounded-2xl border border-dashed border-m3-primary/40 bg-primary-fixed/40 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-m3-primary">
          <span className="material-symbols-outlined text-base">science</span>
          نسخه آزمایشی اورا
        </div>
        <p className="text-[11px] leading-relaxed text-on-surface-variant">
          حساب‌های آزمایشی آماده: اجاره‌دهنده{" "}
          <span className="font-mono font-bold">09121111111</span> — میزبان{" "}
          <span className="font-mono font-bold">09122222222</span> — مدیر{" "}
          <span className="font-mono font-bold">09120000000</span> — رمز:{" "}
          <span className="font-mono font-bold">overa1234</span>
        </p>
        <p className="text-[10px] text-on-surface-variant/80">
          در این نسخه آزمایشی، کد ملی و انتخاب نقش ذخیره نمی‌شوند؛ ثبت‌نام با
          شماره موبایل و رمز عبور انجام می‌شود و بلافاصله وارد حساب می‌شوید. برای
          استفاده از حساب‌های آماده از{" "}
          <Link className="font-bold text-m3-primary underline" href="/signin">
            صفحه ورود
          </Link>{" "}
          دیدن کنید.
        </p>
      </div>

      <Toaster position="top-center" richColors />
    </>
  );
}
