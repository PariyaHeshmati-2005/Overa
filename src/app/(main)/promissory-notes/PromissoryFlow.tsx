"use client";

import { useState } from "react";

const BANKS = [
  {
    id: "ayandeh",
    name: "بانک آینده (کیلید)",
    tag: "تایید آنی",
    tagClass: "bg-m3-primary/10 text-m3-primary",
    desc: "اتصال مستقیم به سامانه ثبت من، صدور بدون احراز مجدد",
  },
  {
    id: "melli",
    name: "بانک ملی ایران (بام)",
    tag: "رسمی",
    tagClass: "bg-surface-container-high text-on-surface-variant",
    desc: "سامانه نشان بانک ملی و گواهی الکترونیکی نماد",
  },
  {
    id: "resalat",
    name: "بانک قرض‌الحسنه رسالت",
    tag: "سامانه ام‌رسالت",
    tagClass: "bg-surface-container-high text-on-surface-variant",
    desc: "سفته تمام الکترونیک با پشتیبانی امضای دیجیتال",
  },
  {
    id: "judiciary",
    name: "درگاه ثنا (قوه قضاییه)",
    tag: "مرجع عام",
    tagClass: "bg-surface-container-high text-on-surface-variant",
    desc: "صدور مستقیم با حساب کاربری ثنا و امضای گواهی ریشه",
  },
];

/**
 * Interactive island of the promissory-note flow page (bank selection +
 * OTP signature card). The final signing action is intentionally disabled
 * until an authorized provider/legal review is connected.
 */
export default function PromissoryFlow() {
  const [bank, setBank] = useState("ayandeh");
  const [consent, setConsent] = useState(true);
  const [otp, setOtp] = useState("");

  return (
    <section className="lg:col-span-8 flex flex-col gap-6">
      {/* Card 1: Bank Selection */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-[22px]">
              domain
            </span>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              انتخاب سامانه یا بانک عامل صادرکننده
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            کارمزد مصوب: ۱۰,۰۰۰ تومان
          </span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
          بانک عامل به عنوان درگاه رسمی، اصالت سفته را در سامانه ملی سفته
          الکترونیک (سامانه برات و سفته وزارت امور اقتصادی و دارایی) ثبت و امضا
          می‌کند.
        </p>
        {/* Bank Radio Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BANKS.map((b) => {
            const active = bank === b.id;
            return (
              <label
                key={b.id}
                className={
                  "relative flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all " +
                  (active
                    ? "border-2 border-m3-primary bg-surface-container-low"
                    : "border border-outline-variant/50 bg-surface-container-lowest hover:border-m3-primary/50")
                }
              >
                <input
                  checked={active}
                  className="mt-1 size-4 text-m3-primary focus:ring-m3-primary border-m3-outline accent-[#630ed4]"
                  name="bank"
                  onChange={() => setBank(b.id)}
                  type="radio"
                  value={b.id}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-on-surface">
                      {b.name}
                    </span>
                    <span
                      className={
                        "text-[10px] px-2 py-0.5 rounded font-semibold " +
                        b.tagClass
                      }
                    >
                      {b.tag}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                    {b.desc}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Card 2: Official Promissory Note Preview */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-[20px]">
              description
            </span>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              پیش‌نمایش برگه سفته الکترونیک رسمی
            </h2>
          </div>
          <span className="text-[11px] font-mono bg-surface-container px-2.5 py-1 rounded text-m3-primary font-semibold">
            شناسه یکتا (نمونه): ۹۴۰۲-۷۱۸۳-۰۰۱۲-۸۹۴۲
          </span>
        </div>
        {/* The Promissory Note Official Frame */}
        <div className="border-2 border-dashed border-outline-variant/70 rounded-xl p-4 sm:p-5 bg-surface-container-low/40 relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-outline-variant/30 pb-3">
            <div>
              <span className="text-[11px] text-on-surface-variant block">
                جمهوری اسلامی ایران - وزارت امور اقتصادی و دارایی
              </span>
              <span className="text-sm font-extrabold text-on-surface">
                سفته الکترونیکی تعهد پرداخت با شرط ضمانت قرارداد
              </span>
            </div>
            <div className="flex items-center gap-2 self-start bg-surface-container-lowest p-1.5 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-m3-primary text-[28px]">
                qr_code_2
              </span>
              <div className="text-[10px] text-on-surface-variant leading-tight">
                <div>استعلام آنلاین</div>
                <div className="font-mono">mefa.gov.ir</div>
              </div>
            </div>
          </div>
          {/* Parameters Grid inside Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 py-3 text-xs">
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">مبلغ تعهد:</span>
              <span className="font-bold text-on-surface">
                ۱۵,۰۰۰,۰۰۰ تومان
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">
                تاریخ سررسید و ابطال:
              </span>
              <span className="font-bold text-on-surface">۱۷ آبان ۱۴۰۵</span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">
                متعهد (صادرکننده):
              </span>
              <span className="font-medium text-on-surface">
                اجاره‌گیرنده نمونه (۰۰۱۲۳۴۵۶۷۸)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">متعهدله (ذی‌نفع):</span>
              <span className="font-medium text-on-surface">
                صندوق امانی اٌوِرا به نفع مالک
              </span>
            </div>
          </div>
          {/* Legal Restriction Clause */}
          <div className="mt-2 p-3 bg-surface-container-lowest border border-m3-primary/20 rounded-lg">
            <p className="text-[11px] leading-relaxed text-on-surface-variant text-justify">
              <strong className="text-m3-primary font-bold">
                بند قانونی اختصاصی ضمانت:
              </strong>
              «این سفته الکترونیک منحصراً به منظور تضمین سلامت، عودت به‌موقع
              کالا و انجام تعهدات ذیل قرارداد اجاره موقت{" "}
              <span className="font-mono text-on-surface font-semibold">
                OVR-89420
              </span>{" "}
              صادر شده است و هرگونه مطالبه یا وصول آن خارج از شروط تعیین‌شده در
              پروتکل حل اختلاف اٌوِراگارد، باطل و از درجه اعتبار ساقط است.»
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Interactive Digital Signature & Action */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-m3-primary text-[22px]">
            draw
          </span>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            تایید هویت و امضای نهایی با رمز یک‌بارمصرف
          </h2>
        </div>
        {/* Legal Consent Checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low cursor-pointer mb-5 border border-outline-variant/30">
          <input
            checked={consent}
            className="mt-1 size-4 rounded text-m3-primary focus:ring-m3-primary border-m3-outline accent-[#630ed4]"
            onChange={(e) => setConsent(e.target.checked)}
            type="checkbox"
          />
          <span className="text-xs text-on-surface leading-relaxed">
            تمامی اطلاعات مندرج در سفته الکترونیکی را مطالعه نمودم و قوانین
            صندوق امانی اٌوِراگارد را برای مسدودی موقت تا پایان قرارداد و ابطال
            خودکار پس از تحویل کالا می‌پذیرم.
          </span>
        </label>
        {/* OTP Input Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <label
              className="text-xs font-bold text-on-surface"
              htmlFor="otp-code"
            >
              کد تایید امضای دیجیتال (پیامک‌شده به ۰۹۱۲***۳۴۵۶):
            </label>
            <button
              className="text-[11px] text-m3-primary hover:underline font-medium self-start sm:self-auto disabled:opacity-50 disabled:no-underline"
              disabled
              title="به‌زودی"
              type="button"
            >
              ارسال مجدد پیامک (۵۸ ثانیه)
            </button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              className="w-full max-w-sm rounded-xl border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-m3-outline text-sm px-4 py-2.5 focus:border-m3-primary focus:ring-m3-primary"
              id="otp-code"
              maxLength={6}
              placeholder="کد ۶ رقمی را وارد کنید (مثلاً: ۷۳۸۲۹۱)"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
            />
            <span className="inline-flex items-center text-xs text-m3-primary gap-1 shrink-0 font-medium">
              <span className="material-symbols-outlined text-[18px]">
                lock
              </span>
              امضای معتبر شاپرک
            </span>
          </div>
        </div>
        {/* Buttons Action Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <button
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors"
            type="button"
          >
            انصراف و بازگشت به سفارش
          </button>
          <button
            className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-m3-primary text-on-primary hover:bg-m3-primary/90 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
            title="به‌زودی — صدور واقعی نیازمند اتصال به سرویس‌دهنده مجاز و بررسی حقوقی است"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] fill">
              verified
            </span>
            <span>امضای نهایی سفته الکترونیک و ثبت ضمانت (۱۰,۰۰۰ تومان)</span>
          </button>
        </div>
        <p className="mt-3 text-[11px] text-on-surface-variant leading-relaxed">
          * «این بخش صرفاً راهنمای فرآیند است؛ صدور سند واقعی نیازمند اتصال به
          سرویس‌دهنده مجاز و بررسی حقوقی است و در این نسخه شبیه‌سازی نشده است.»
        </p>
      </div>
    </section>
  );
}
