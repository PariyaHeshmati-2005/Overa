import type { Metadata } from "next";
import Link from "next/link";
import M3Styles from "@/components/overa/M3Styles";
import PromissoryFlow from "./PromissoryFlow";

export const metadata: Metadata = { title: "صدور سفته دیجیتال و امضای تضمین" };
export const dynamic = "force-dynamic";

export default function PromissoryNotesPage() {
  return (
    <div className="bg-m3-background text-on-surface antialiased min-h-screen flex flex-col justify-between">
      <M3Styles />
      {/* Header: Focused Task Header (Back to Main flow) — preserved from source */}
      <header className="border-b border-outline-variant/40 bg-surface-container-lowest sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-surface-container transition-colors text-on-surface"
              href="/rentals"
              title="بازگشت به اجاره‌های من"
            >
              <span className="material-symbols-outlined text-[20px] rtl:rotate-180">arrow_forward</span>
            </Link>
            <div className="h-5 w-px bg-outline-variant/60"></div>
            <div className="flex items-center gap-2">
              {/* Brand Logo & Slogan */}
              <Link className="flex items-center gap-3 group shrink-0" href="/">
                <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br">
                  { }
                  <img src="/assets/img/overa_logo_transparent.png" alt="لوگوی اورا" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">اٌوِرا</span>
                </div>
              </Link>
              <span className="font-bold text-base text-on-surface mt-2"> | ضمانت امن سفته الکترونیک</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-m3-primary">
              <span className="size-1.5 rounded-full bg-m3-primary animate-pulse"></span>
              پرونده نمونه: OVR-89420
            </span>
            <Link
              className="text-xs font-medium text-on-surface-variant hover:text-m3-primary transition-colors flex items-center gap-1"
              href="/promissory-notes/registration"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span>راهنما</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mandatory sandbox/legal notice */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5">
        <div className="rounded-xl border border-m3-error/30 bg-m3-error-container/60 px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-m3-on-error-container text-[20px] shrink-0 mt-0.5">gavel</span>
          <p className="text-xs sm:text-sm leading-relaxed text-m3-on-error-container">
            <strong className="font-bold">توجه:</strong> این بخش صرفاً راهنمای فرآیند است؛ صدور سند واقعی
            نیازمند اتصال به سرویس‌دهنده مجاز و بررسی حقوقی است و در این نسخه شبیه‌سازی نشده است.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex-1">
        {/* Title and Subtitle */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              صدور سفته دیجیتال و امضای تضمین
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              دوربین حرفه‌ای سونی Alpha 7 IV • تحویل موقت به اجاره‌گیرنده (نمونه فرآیندی)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-surface-container-lowest border border-outline-variant/50 px-3 py-1.5 rounded-lg text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-m3-primary text-[18px]">account_balance</span>
            <span>سامانه یکپارچه سفته و برات الکترونیکی خزانه‌داری کل کشور</span>
          </div>
        </div>

        {/* 3-Step Simple Progress Stepper */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            {/* Step 1 */}
            <div className="flex items-center justify-center gap-2 py-1.5 border-b-2 border-m3-primary text-m3-primary font-bold">
              <span className="material-symbols-outlined text-[18px] fill">check_circle</span>
              <span className="truncate">۱. تایید اطلاعات (انجام شد)</span>
            </div>
            {/* Step 2 */}
            <div className="flex items-center justify-center gap-2 py-1.5 border-b-2 border-m3-primary text-m3-primary font-bold">
              <span className="material-symbols-outlined text-[18px] fill">account_balance</span>
              <span className="truncate">۲. انتخاب بانک و امضا (اکنون)</span>
            </div>
            {/* Step 3 */}
            <div className="flex items-center justify-center gap-2 py-1.5 border-b-2 border-transparent text-m3-outline font-medium">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span className="truncate">۳. ثبت در خزانه‌داری</span>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right Column: Interactive Process & Signing (client island) */}
          <PromissoryFlow />

          {/* Left Column: Guarantee Summary & Trust Anchors (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            {/* Commitment Summary Box */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-[20px]">receipt_long</span>
                <span>خلاصه تعهد ضمانت (نمونه)</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant">مبلغ ضمانت:</span>
                  <span className="font-extrabold text-sm text-on-surface">۱۵,۰۰۰,۰۰۰ تومان</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant">کالای امانی:</span>
                  <span className="font-medium text-on-surface">Sony Alpha 7 IV</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant">مالک کالا:</span>
                  <span className="font-medium text-on-surface">میزبان نمونه</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant">کارمزد سامانه دولتی:</span>
                  <span className="font-medium text-m3-primary">۱۰,۰۰۰ تومان</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-on-surface-variant">مالیات تمبر کاغذی:</span>
                  <span className="font-semibold text-m3-primary">۰ تومان (معاف)</span>
                </div>
              </div>
            </div>
            {/* Automatic Cancellation Notice (Peace of Mind) */}
            <div className="bg-surface-container-high/60 border border-m3-primary/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] fill">auto_delete</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface mb-1">ابطال خودکار و آنی پس از تحویل</h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    به محض اینکه کالا در پایان مدت اجاره تحویل مالک گردید و کد تایید سلامت در اپلیکیشن اورا ثبت
                    شد، شناسه این سفته در سامانه خزانه‌داری به وضعیت «باطل‌شده» تغییر یافته و هیچ‌گونه تعهد مالی
                    باقی نخواهد ماند.
                  </p>
                </div>
              </div>
            </div>
            {/* Legal Pillars & Badges */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider text-m3-outline">
                پشتوانه‌های قانونی و امنیتی
              </h3>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div className="text-xs">
                  <div className="font-bold text-on-surface">سامانه ثبت من (سازمان ثبت)</div>
                  <div className="text-[11px] text-on-surface-variant">استعلام مستقیم کدملی و شناسه صیادی</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                </div>
                <div className="text-xs">
                  <div className="font-bold text-on-surface">صندوق امانی هوشمند (Escrow)</div>
                  <div className="text-[11px] text-on-surface-variant">سفته در دسترس طرفین نیست و نزد ناظر امین است</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <div className="text-xs">
                  <div className="font-bold text-on-surface">پشتیبانی اختصاصی پرونده</div>
                  <div className="text-[11px] text-on-surface-variant">تلفن: ۰۲۱-۹۱۰۰۸۰۰۰ داخلی ۴</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-8 border-t border-outline-variant/30 py-4 bg-surface-container-lowest text-center text-xs text-on-surface-variant">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>پلتفرم اشتراک‌گذاری و اجاره تجهیزات اورا (Overa Guard) • تمامی حقوق محفوظ است</div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link className="hover:underline" href="/tos-support-faq">قوانین و مقررات سفته دیجیتال</Link>
            <span>•</span>
            <Link className="hover:underline" href="/tos-support-faq">پروتکل حل اختلاف</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
