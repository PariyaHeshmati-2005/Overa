"use client";

import { useState } from "react";
import Link from "next/link";
import { usePwaInstall } from "@/lib/pwa";
import { toPersianDigits } from "@/lib/format";

/**
 * Compact app promotion card (placed inside the existing dark «اپلیکیشن اورا»
 * banner on the homepage). Matches the banner's glass styling.
 *
 * The «نصب اپلیکیشن» button is wired to the REAL browser install flow:
 *  - Chromium (Android/desktop): fires the captured beforeinstallprompt.
 *  - iOS Safari: navigates to /install which shows the official
 *    «Share → Add to Home Screen» guide (no fake one-tap install button).
 *  - Already installed: shows a calm confirmation instead of the button.
 */
export default function AppPromoCard({
  qr,
}: {
  /** Server-rendered QR SVG (real, scannable) passed from the homepage. */
  qr?: React.ReactNode;
}) {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  async function handleInstall() {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") setJustInstalled(true);
    } finally {
      setBusy(false);
    }
  }

  const FEATURES = [
    "دسترسی سریع به محصولات",
    "اجاره و ثبت آگهی ساده‌تر",
    "پیگیری رزروها در حساب کاربری",
    "اجرای تمام‌صفحه و شبیه اپلیکیشن",
  ];

  return (
    <div className="w-full max-w-sm bg-white/10 border border-white/15 rounded-3xl backdrop-blur-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src="/assets/img/overa_logo_transparent.png"
            alt="لوگوی اورا"
            className="w-full h-full object-contain p-1"
          />
        </span>
        <div className="flex flex-col">
          <span className="text-base font-black text-white">اپلیکیشن اورا</span>
          <span className="text-[11px] text-purple-200">
            نصب روی گوشی و دسکتاپ — بدون فروشگاه اپلیکیشن
          </span>
        </div>
      </div>

      <p className="text-xs text-purple-100/90 leading-relaxed">
        اورا را مثل یک اپلیکیشن واقعی روی دستگاه خودت داشته باش؛ سریع‌تر باز
        می‌شود و همیشه در دسترس است.
      </p>

      <ul className="flex flex-col gap-1.5" aria-label="ویژگی‌های اپلیکیشن">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[11px] text-purple-100/90">
            <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 pt-1">
        {isInstalled || justInstalled ? (
          <span className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            اپلیکیشن روی این دستگاه نصب شده است
          </span>
        ) : canInstall ? (
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className="flex-1 h-11 rounded-2xl bg-white text-primary text-sm font-black shadow-md hover:bg-purple-50 active:scale-98 transition-all disabled:opacity-60"
          >
            {busy ? "در حال آماده‌سازی…" : "نصب اپلیکیشن"}
          </button>
        ) : (
          <Link
            href="/install"
            className="flex-1 h-11 rounded-2xl bg-white text-primary text-sm font-black shadow-md hover:bg-purple-50 transition-colors flex items-center justify-center"
          >
            راهنمای نصب اپلیکیشن
          </Link>
        )}

        {qr ? (
          <Link
            href="/install"
            aria-label="اسکن کد QR برای نصب اورا"
            className="w-14 h-14 rounded-xl bg-white p-1 shrink-0 block shadow-md"
            title="اسکن کد QR برای نصب روی گوشی"
          >
            {qr}
          </Link>
        ) : null}
      </div>

      <p className="text-[10px] text-purple-200/70 leading-relaxed">
        راهنمای گام‌به‌گام نصب روی اندروید، آیفون و دسکتاپ در صفحه{" "}
        <Link href="/install" className="underline hover:text-white">
          نصب اپلیکیشن
        </Link>{" "}
        — با {toPersianDigits(4)} مرحله ساده.
      </p>
    </div>
  );
}
