"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/lib/pwa";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" &&
      (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1)
  )
    return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/**
 * Device-aware install experience for /install.
 * Never pretends iOS supports one-tap install — it shows the official
 * Safari guide instead. Chromium devices get the real native prompt.
 */
export default function InstallApp() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  async function handleInstall() {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") setAccepted(true);
    } finally {
      setBusy(false);
    }
  }

  if (isInstalled || accepted) {
    return (
      <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-6 flex flex-col items-center gap-3 text-center">
        <span className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </span>
        <h2 className="text-base font-black text-emerald-800">
          اورا روی این دستگاه نصب شده است
        </h2>
        <p className="text-xs text-emerald-700/80 leading-relaxed max-w-md">
          از حالا می‌توانید اورا را مثل یک اپلیکیشن واقعی از صفحه اصلی دستگاه
          باز کنید؛ تمام‌صفحه، سریع و همیشه در دسترس.
        </p>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="rounded-3xl bg-white border border-purple-100 shadow-card p-6 flex flex-col items-center gap-4 text-center">
        <span className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </span>
        <h2 className="text-base font-black text-neutral-text">
          نصب مستقیم روی این دستگاه
        </h2>
        <p className="text-xs text-neutral-muted leading-relaxed max-w-md">
          مرورگر شما از نصب مستقیم پشتیبانی می‌کند. با زدن دکمه زیر، پنجره نصب
          باز می‌شود و اورا مثل یک اپلیکیشن واقعی نصب خواهد شد.
        </p>
        <button
          type="button"
          onClick={handleInstall}
          disabled={busy}
          className="px-8 h-12 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-black shadow-lg shadow-primary/30 transition-all disabled:opacity-60"
        >
          {busy ? "در حال آماده‌سازی…" : "نصب اپلیکیشن اورا"}
        </button>
      </div>
    );
  }

  if (platform === "ios") {
    return (
      <div className="rounded-3xl bg-white border border-purple-100 shadow-card p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-base font-black text-neutral-text">
            راهنمای نصب روی آیفون و آیپد (Safari)
          </h2>
          <p className="text-xs text-neutral-muted leading-relaxed">
            iOS امکان نصب مستقیم با یک دکمه را نمی‌دهد؛ با{" "}
            <b className="text-neutral-text">۳ مرحله ساده</b> اورا را به صفحه
            اصلی اضافه کنید.
          </p>
        </div>
        <ol className="flex flex-col gap-3">
          {[
            {
              t: "۱. همین صفحه را در مرورگر Safari باز کنید",
              d: "اگر از داخل اپ دیگری این صفحه را می‌بینید، لینک را در Safari باز کنید.",
            },
            {
              t: "۲. روی دکمه Share (مربع با پیکان رو به بالا) بزنید",
              d: "دکمه اشتراک‌گذاری در نوار پایین یا بالای Safari قرار دارد.",
            },
            {
              t: "۳. گزینه «Add to Home Screen» را انتخاب کنید",
              d: "سپس روی «افزودن» بزنید تا آیکون اورا روی صفحه اصلی ساخته شود.",
            },
          ].map((s) => (
            <li key={s.t} className="flex items-start gap-3 bg-neutral-bg rounded-2xl p-4">
              <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-xs font-black shrink-0">
                {s.t.slice(0, 1)}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-neutral-text">
                  {s.t.slice(2)}
                </span>
                <span className="text-[11px] text-neutral-muted leading-relaxed">
                  {s.d}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-neutral-muted text-center">
          بعد از افزودن، اورا تمام‌صفحه و بدون نوار مرورگر اجرا می‌شود.
        </p>
      </div>
    );
  }

  // Fallback guidance (older browsers / desktop without the prompt event).
  return (
    <div className="rounded-3xl bg-white border border-purple-100 shadow-card p-6 flex flex-col gap-4">
      <h2 className="text-base font-black text-neutral-text text-center">
        نصب روی این دستگاه
      </h2>
      <div className="flex flex-col gap-3 text-xs text-neutral-muted leading-relaxed">
        {platform === "android" ? (
          <p>
            در مرورگر Chrome منوی سه‌نقطه بالا را باز کنید و گزینه
            «<b className="text-neutral-text">Add to Home screen</b>» یا
            «<b className="text-neutral-text">Install app</b>» را بزنید.
          </p>
        ) : (
          <p>
            در Chrome یا Edge روی آیکون نصب داخل نوار آدرس کلیک کنید یا از منوی
            مرورگر گزینه «<b className="text-neutral-text">Install Overa</b>»
            را انتخاب کنید.
          </p>
        )}
        <p className="bg-primary-soft/60 text-primary rounded-2xl p-4 font-medium">
          راهنما: می‌توانید همین صفحه را با گوشی دیگر اسکن کنید یا لینک را
          مستقیم باز کنید تا راهنمای مخصوص همان دستگاه نمایش داده شود.
        </p>
      </div>
    </div>
  );
}
