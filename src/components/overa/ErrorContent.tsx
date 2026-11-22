"use client";

import { useEffect, useState } from "react";

/**
 * Global 500 design — converted from the source 500.html.
 * Truthfulness fixes per playbook: provider/escrow claims are labelled as
 * simulation until a real provider is configured.
 */
export default function ErrorContent({ reset }: { reset?: () => void }) {
  const [seconds, setSeconds] = useState(30);
  const [statusText, setStatusText] = useState(
    "در حال بررسی مجدد پاسخ پایانه اٌوِرا...",
  );

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setStatusText("پاسخ دریافت نشد؛ منتظر تلاش شما هستیم.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const dashOffset = seconds > 0 ? 100 - (100 * seconds) / 30 : 100;

  return (
    <div
      className="min-h-screen flex flex-col bg-m3-background text-on-surface antialiased"
      dir="rtl"
      lang="fa"
    >
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1">
        <div className="flex flex-col w-full">
          {/* Ambient atmospheric glow */}
          <div className="relative w-full overflow-hidden py-12 md:py-16">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[440px] bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute top-10 right-10 w-72 h-72 bg-m3-primary/10 rounded-full blur-2xl pointer-events-none -z-10"></div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Right column (RTL: content & diagnostics) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="inline-flex items-center gap-3 self-start px-4 py-2 rounded-full bg-surface-container-high shadow-sm flex-wrap">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-m3-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-m3-primary"></span>
                  </span>
                  <span className="text-label-md text-m3-primary font-bold">
                    کد وضعیت: ۵۰۰ • خطای موقت ارتباط با سرور
                  </span>
                  <span className="text-label-sm px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface-variant font-mono">
                    Incident #OV-8924
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <h1 className="text-headline-lg text-on-surface tracking-tight text-2xl font-bold">
                    در حال تنظیمات فنی و همگام‌سازی سرورها هستیم
                  </h1>
                  <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-2xl">
                    سرورهای اٌوِرا به دلیل اوج ترافیک رزروها یا به‌روزرسانی
                    زیرساخت با وقفه روبه‌رو شده‌اند. جای هیچ‌گونه نگرانی نیست؛
                    اطلاعات حساب و قراردادهای اجاره شما با امنیت کامل ذخیره شده
                    و محفوظ هستند.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="size-10 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary shrink-0">
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-md text-on-surface font-bold">
                      وضعیت مالی شما صرفاً در دفتر درون‌برنامه‌ای ثبت می‌شود
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      تا زمان اتصال درگاه پرداخت واقعی، همه عملیات مالی
                      «شبیه‌سازی» هستند و هیچ پول واقعی جابه‌جا نمی‌شود.
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-surface-container-lowest shadow-md flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 flex items-center justify-center shrink-0">
                        <svg
                          className="size-12 -rotate-90 text-surface-container"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-surface-container-highest"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                          ></path>
                          <path
                            className="text-m3-primary transition-all duration-1000 ease-linear"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray="100, 100"
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            strokeWidth="3.5"
                          ></path>
                        </svg>
                        <span className="absolute font-bold text-m3-primary">
                          {new Intl.NumberFormat("fa-IR").format(seconds)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-label-md text-on-surface font-bold">
                          تلاش خودکار برای برقراری مجدد ارتباط
                        </span>
                        <span className="text-body-sm text-on-surface-variant">
                          {statusText}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSeconds(30);
                        setStatusText(
                          "در حال بررسی مجدد پاسخ پایانه اٌوِرا...",
                        );
                        if (reset) {
                          reset();
                        } else {
                          window.location.reload();
                        }
                      }}
                      className="h-12 px-6 rounded-lg bg-m3-primary hover:bg-primary-container text-on-primary font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm self-stretch sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-xl">
                        refresh
                      </span>
                      <span>بارگذاری مجدد صفحه</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-secondary-container font-semibold flex items-center gap-2 transition-colors"
                      href="/"
                    >
                      <span className="material-symbols-outlined text-lg">
                        home
                      </span>
                      <span>بازگشت به خانه</span>
                    </a>
                    <a
                      className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-secondary-container font-semibold flex items-center gap-2 transition-colors"
                      href="tel:02191002424"
                    >
                      <span className="material-symbols-outlined text-lg">
                        call
                      </span>
                      <span dir="ltr">۰۲۱-۹۱۰۰۲۴۲۴</span>
                      <span>پشتیبانی اضطراری</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Left column (RTL: visual & telemetry) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="relative w-full rounded-xl bg-surface-container-lowest p-6 shadow-md flex flex-col items-center justify-center overflow-hidden min-h-[300px]">
                  <div className="absolute -top-12 -left-12 size-48 bg-m3-primary/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="relative size-44 flex items-center justify-center my-2">
                    <svg
                      className="w-full h-full text-m3-primary"
                      fill="none"
                      viewBox="0 0 160 160"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        className="fill-surface-container stroke-primary-container"
                        height="28"
                        rx="8"
                        strokeWidth="2"
                        width="110"
                        x="25"
                        y="25"
                      ></rect>
                      <circle
                        className="fill-m3-primary animate-pulse"
                        cx="42"
                        cy="39"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-secondary-container"
                        cx="56"
                        cy="39"
                        r="4"
                      ></circle>
                      <line
                        opacity="0.3"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                        x1="72"
                        x2="118"
                        y1="39"
                        y2="39"
                      ></line>
                      <rect
                        className="fill-surface-container-high stroke-m3-primary"
                        height="28"
                        rx="8"
                        strokeWidth="2.5"
                        width="110"
                        x="25"
                        y="66"
                      ></rect>
                      <circle
                        className="fill-m3-error animate-ping"
                        cx="42"
                        cy="80"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-m3-error"
                        cx="42"
                        cy="80"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-m3-secondary"
                        cx="56"
                        cy="80"
                        r="4"
                      ></circle>
                      <line
                        opacity="0.4"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                        x1="72"
                        x2="100"
                        y1="80"
                        y2="80"
                      ></line>
                      <rect
                        className="fill-surface-container stroke-primary-container"
                        height="28"
                        rx="8"
                        strokeWidth="2"
                        width="110"
                        x="25"
                        y="107"
                      ></rect>
                      <circle
                        className="fill-m3-primary"
                        cx="42"
                        cy="121"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-m3-primary animate-pulse"
                        cx="56"
                        cy="121"
                        r="4"
                      ></circle>
                      <line
                        opacity="0.3"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                        x1="72"
                        x2="114"
                        y1="121"
                        y2="121"
                      ></line>
                      <circle
                        className="fill-surface-container-lowest stroke-m3-primary shadow-lg"
                        cx="120"
                        cy="80"
                        r="22"
                        strokeWidth="3"
                      ></circle>
                      <path
                        d="M115 75 L125 85 M125 75 L115 85"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      ></path>
                    </svg>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-label-md text-on-surface font-bold">
                      زیرساخت ابری اٌوِرا در منطقه مرکزی
                    </span>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      تیم فنی در حال هدایت بار شبکه به کلاسترهای پشتیبان هستند.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-headline-sm text-on-surface font-bold flex items-center gap-2 text-lg">
                      <span className="material-symbols-outlined text-m3-primary text-xl">
                        pulse_alert
                      </span>
                      <span>وضعیت سرویس‌های اصلی</span>
                    </h3>
                    <span className="text-label-sm text-on-surface-variant font-mono">
                      بروزرسانی زنده
                    </span>
                  </div>
                  {[
                    {
                      name: "سامانه ودیعه و تراکنش‌ها",
                      sub: "حالت شبیه‌سازی (Sandbox) — بدون اتصال بانکی",
                      dot: "bg-emerald-600",
                      badge: "فعال (شبیه‌سازی)",
                      badgeCls: "bg-emerald-50 text-emerald-800",
                    },
                    {
                      name: "پایگاه داده آگهی‌ها و جستجوی اقلام",
                      sub: "همگام‌سازی فهرست‌ها و زمان‌بندی تقویم",
                      dot: "bg-amber-500 animate-pulse",
                      badge: "در حال بازیابی",
                      badgeCls: "bg-amber-100 text-amber-900",
                    },
                    {
                      name: "تیم داوری و پشتیبانی اضطراری",
                      sub: "خطوط تلفنی و سامانه پیامک",
                      dot: "bg-emerald-600",
                      badge: "پاسخ‌گوی فوری",
                      badgeCls: "bg-emerald-50 text-emerald-800",
                    },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`size-2 rounded-full ${s.dot}`}></span>
                        <div className="flex flex-col">
                          <span className="text-label-md text-on-surface font-semibold">
                            {s.name}
                          </span>
                          <span className="text-label-sm text-on-surface-variant">
                            {s.sub}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${s.badgeCls}`}
                      >
                        {s.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
