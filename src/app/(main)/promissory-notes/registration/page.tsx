import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import M3Styles from "@/components/overa/M3Styles";

export const metadata: Metadata = { title: "ثبت در خزانه‌داری و صدور سند سفته الکترونیک" };
export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/categories", label: "اجاره وسایل" },
  { href: "/create-listing", label: "ثبت وسیله" },
  { href: "/how-it-works", label: "چگونه کار می‌کند؟" },
  { href: "/about", label: "درباره ما" },
];

export default async function PromissoryRegistrationPage() {
  const user = await getCurrentUser();

  return (
    <div className="bg-m3-surface text-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <M3Styles />
      {/* Header — preserved from Registration-in-the-Treasury source */}
      <header
        className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm transition-all"
        data-purpose="top-header"
      >
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-6">
            {/* Brand Logo & Slogan */}
            <Link className="flex items-center gap-3 group shrink-0" href="/">
              <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br">
                { }
                <img src="/assets/img/overa_logo_transparent.png" alt="لوگوی اورا" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">اٌوِرا</span>
                <span className="text-[11px] font-medium text-neutral-muted -mt-1">
                  وسایل بهتر، زندگی سبک‌تر
                </span>
              </div>
            </Link>
            {/* Big Search Bar */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block" data-purpose="global-search">
              <form action="/categories" className="relative flex items-center">
                <input
                  className="w-full h-11 pr-5 pl-14 text-sm bg-surface-container-low border border-purple-100/90 rounded-full focus:bg-white focus:border-m3-primary focus:ring-4 focus:ring-m3-primary/10 transition-all text-on-surface placeholder:text-m3-outline"
                  placeholder="جستجو در بین هزاران وسیله..."
                  type="text"
                  name="q"
                />
                <button
                  aria-label="جستجو"
                  className="absolute left-1.5 w-8 h-8 rounded-full bg-m3-primary hover:bg-primary-container text-white flex items-center justify-center shadow-sm transition-colors duration-150"
                  type="submit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                  </svg>
                </button>
              </form>
            </div>
            {/* User Profile & Action Icons — session aware (guest state rule) */}
            <div className="flex items-center gap-3 shrink-0" data-purpose="user-actions">
              <Link
                aria-label="پیام‌ها"
                className="w-10 h-10 rounded-full flex items-center justify-center text-m3-outline hover:text-m3-primary hover:bg-primary-fixed/30 transition-colors"
                href="/live-chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </Link>
              <button
                aria-label="علاقه‌مندی‌ها"
                className="w-10 h-10 rounded-full flex items-center justify-center text-m3-outline hover:text-m3-primary hover:bg-primary-fixed/30 transition-colors"
                disabled
                title="به‌زودی"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </button>
              <div className="relative">
                <button
                  aria-label="اعلانات"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-m3-outline hover:text-m3-primary hover:bg-primary-fixed/30 transition-colors"
                  disabled
                  title="به‌زودی"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </button>
              </div>
              <div className="h-6 w-px bg-purple-200/80 mx-1 hidden sm:block"></div>
              {user ? (
                <UserMenu
                  user={{ name: user.name, avatarUrl: user.avatarUrl, isHost: user.isHost, isAdmin: user.isAdmin }}
                />
              ) : (
                <Link
                  className="px-4 py-2 rounded-xl bg-m3-primary text-white text-xs font-bold hover:bg-primary-container transition-colors"
                  href="/signin-otp"
                >
                  ورود | ثبت‌نام
                </Link>
              )}
            </div>
          </div>
          {/* Bottom Level Row: Navigation Links */}
          <nav
            className="hidden sm:flex items-center gap-8 text-sm font-medium border-t border-purple-100/60 pt-2 text-on-surface-variant"
            data-purpose="sub-navigation"
          >
            {NAV_LINKS.map((l, i) => (
              <Link key={l.label + i} className="text-on-surface hover:text-m3-primary transition-colors" href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Breadcrumb sub-strip matching flow */}
        <div className="bg-surface-container-low/70 border-t border-purple-100/60 py-1.5">
          <div className="max-w-[1440px] mx-auto px-6 flex items-center gap-1.5 text-xs text-m3-outline font-medium">
            <Link className="hover:text-m3-primary transition-colors flex items-center gap-1" href="/">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path>
              </svg>
              <span>خانه</span>
            </Link>
            <svg className="w-3 h-3 text-outline-variant/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <Link className="hover:text-m3-primary transition-colors" href="/promissory-notes">
              صدور سفته الکترونیک
            </Link>
            <svg className="w-3 h-3 text-outline-variant/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span className="text-on-surface font-semibold">ثبت در خزانه‌داری و ضمانت</span>
          </div>
        </div>
      </header>

      <main className="w-full bg-m3-surface pt-36 flex-1">
        <div className="flex flex-col w-full">
          {/* Mandatory sandbox/legal notice */}
          <div className="max-w-[1440px] mx-auto px-6 w-full">
            <div className="rounded-xl border border-m3-error/30 bg-m3-error-container/60 px-4 py-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-m3-on-error-container text-[20px] shrink-0 mt-0.5">gavel</span>
              <p className="text-xs sm:text-sm leading-relaxed text-m3-on-error-container">
                <strong className="font-bold">توجه:</strong> این صفحه یک نمونه نمایشی از خروجی فرآیند است؛{" "}
                این بخش صرفاً راهنمای فرآیند است؛ صدور سند واقعی نیازمند اتصال به سرویس‌دهنده مجاز و بررسی
                حقوقی است و در این نسخه شبیه‌سازی نشده است.
              </p>
            </div>
          </div>

          <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col gap-8">
            {/* Top Stepper Component */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                {/* Step 1 (Completed) */}
                <div className="flex items-center gap-3.5 z-10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-on-surface">۱. تایید اطلاعات هویتی و ثنا</span>
                    <span className="text-xs text-emerald-600 font-semibold">تکمیل و احراز هویت شد</span>
                  </div>
                </div>
                <div className="hidden md:block flex-1 h-0.5 bg-emerald-300 mx-2"></div>
                {/* Step 2 (Completed) */}
                <div className="flex items-center gap-3.5 z-10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-on-surface">۲. صدور بانکی و امضای دیجیتال</span>
                    <span className="text-xs text-emerald-600 font-semibold">امضا با توکن معتبر بانک عامل</span>
                  </div>
                </div>
                <div className="hidden md:block flex-1 h-0.5 bg-gradient-to-l from-m3-primary to-emerald-400 mx-2"></div>
                {/* Step 3 (Active Success) */}
                <div className="flex items-center gap-3.5 z-10">
                  <div className="w-10 h-10 rounded-full bg-m3-primary text-on-primary flex items-center justify-center shadow-lg shadow-m3-primary/30 ring-4 ring-primary-fixed">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-m3-primary font-bold">۳. ثبت در خزانه‌داری و صدور سند</span>
                    <span className="text-xs text-m3-primary font-semibold">ثبت نهایی و صدور شناسه شمس</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Success Celebration Banner */}
            <section className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-xl p-8 shadow-md relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-m3-primary/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-m3-primary text-on-primary flex items-center justify-center shadow-lg shadow-m3-primary/25 shrink-0">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM19.79 10.22C19.92 10.79 20 11.39 20 12c0 4.41-3.59 8-8 8s-8-3.59-8-8 3.59-8 8-8c1.28 0 2.49.3 3.56.84l1.52-1.52C15.54 2.48 13.85 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39l-1.61 1.61z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                        </svg>
                        ثبت رسمی و معتبر - دارای شناسه یکتای ملی (شمس)
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                        قرارداد شماره: OVR-89420
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-on-surface tracking-tight leading-snug">
                      سفته الکترونیک با موفقیت در سامانه یکپارچه خزانه‌داری کل کشور ثبت و صادر گردید
                    </h1>
                    <p className="text-sm text-on-surface-variant max-w-4xl leading-relaxed">
                      ضمانت حسن انجام تعهدات قرارداد اجاره دوربین Sony Alpha 7 IV به ارزش ۱۵,۰۰۰,۰۰۰ تومان در
                      صندوق امنیتی امانی اوراگارد فعال شد. بدون نیاز به مسدودی وجه نقد از حساب شما.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 bg-surface-container-lowest/80 backdrop-blur-md p-4 rounded-xl shadow-sm flex flex-col items-center gap-1 text-center min-w-[170px]">
                  <span className="text-xs text-m3-outline font-medium">وضعیت اعتبار سند</span>
                  <span className="text-lg text-emerald-600 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    فعال و معتبر
                  </span>
                  <span className="text-xs text-on-surface-variant">سامانه استعلام وزارت اقتصاد</span>
                </div>
              </div>
            </section>

            {/* Main Workspace (2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Right Column: Official Certificate Card */}
              <section className="lg:col-span-8 flex flex-col gap-6">
                <article className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden relative border border-purple-100/50">
                  {/* Security Top Pattern Strip */}
                  <div className="h-3 w-full bg-gradient-to-r from-m3-primary via-m3-secondary to-m3-primary"></div>
                  <div className="p-8 md:p-10 flex flex-col gap-8 relative">
                    {/* Watermark Impression Backdrop */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"></path>
                      </svg>
                    </div>
                    {/* Certificate Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 bg-surface-container-low/50 p-6 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-center text-m3-primary">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"></path>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-m3-outline font-medium">
                            جمهوری اسلامی ایران - وزارت امور اقتصادی و دارایی
                          </span>
                          <h2 className="text-lg md:text-xl text-on-surface font-extrabold leading-snug">
                            سند رسمی تعهد پرداخت و گواهی ثبت در خزانه‌داری کل کشور
                          </h2>
                          <span className="text-xs text-m3-primary font-semibold">
                            سامانه صدور و اعتبارسنجی سفته الکترونیک (سامانه شمس)
                          </span>
                        </div>
                      </div>
                      {/* Barcode & QR Verification Block */}
                      <div className="flex items-center gap-3 bg-surface-container-lowest p-2.5 rounded-lg shadow-sm border border-purple-50">
                        <svg className="w-14 h-14 text-on-surface shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 8h8v8H2v-8zm2 2v4h4v-4H4zm8-12h8v8h-8V2zm2 2v4h4V4h-4zm3 8h2v2h-2v-2zm-3 2h2v2h-2v-2zm2 2h2v2h-2v-2zm3-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-5 0h2v2h-2v-2z"></path>
                        </svg>
                        <div className="flex flex-col text-right text-xs">
                          <span className="font-bold text-on-surface">استعلام اصالت سند</span>
                          <span className="text-m3-outline text-[11px]">اسکن بارکد در mefa.gov.ir</span>
                          <span className="text-m3-primary font-semibold text-[11px]">کد امنیتی: #904128</span>
                        </div>
                      </div>
                    </div>
                    {/* Official Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">شناسه یکتای ملی خزانه‌داری (کد شمس)</span>
                        <span className="text-sm md:text-base font-bold text-m3-primary tracking-wider font-mono" dir="ltr">
                          IR-4039-8812-9041-0028
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">کد رهگیری تراکنش بانکی (بانک عامل)</span>
                        <span className="text-sm md:text-base font-bold text-on-surface font-mono" dir="ltr">
                          ۹۸۲۴۷۱-TRX-AYANDEH
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">مشخصات صادرکننده (متعهد)</span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-on-surface">
                            {user ? user.name : "کاربر اورا"} (نمونه)
                          </span>
                          <span className="text-xs text-m3-outline font-mono">کد ملی: ۰۰۱۲۳۴۵۶۷۸</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                          </svg>
                          امضای دیجیتال گواهی‌شده ثنا (معتبر)
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">ذی‌نفع سند تعهد (متعهدله)</span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-on-surface">صندوق امانی پلتفرم اورا</span>
                          <span className="text-xs text-m3-outline font-mono">شناسه ملی: ۱۴۰۰۹۸۷۲۱۱۰</span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant mt-0.5">
                          به نمایندگی و به نفع میزبان نمونه
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">مبلغ اسمی وجه‌الضمان</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-m3-primary">۱۵,۰۰۰,۰۰۰</span>
                          <span className="text-xs text-on-surface-variant font-bold">
                            تومان (پانزده میلیون تومان تمام)
                          </span>
                        </div>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">تاریخ سررسید و انقضای تعهد</span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-on-surface">۱۷ آبان ۱۴۰۳</span>
                          <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                            مشروط به تایید سلامت
                          </span>
                        </div>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">زمان دقیق ثبت و تایید در خزانه‌داری</span>
                        <span className="text-sm font-medium text-on-surface">۱۴ آبان ۱۴۰۳ — ساعت ۱۰:۲۴:۱۸</span>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-m3-outline">کارمزد دولتی تمبر الکترونیک</span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-on-surface">۱۰,۰۰۰ تومان</span>
                          <span className="text-xs text-emerald-600 font-semibold">پرداخت‌شده از درگاه شاپرک</span>
                        </div>
                      </div>
                    </div>
                    {/* Legal Safeguard Clause */}
                    <div className="bg-primary-fixed/30 p-5 rounded-xl flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full bg-m3-primary text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1 21h12v2H1zM5.245 8.07l2.83-2.827 8.992 8.992-2.828 2.828zM12.317 1l5.657 5.656-1.414 1.415-5.657-5.657zm4.243 4.243l2.828-2.829 2.829 2.829-2.829 2.828z"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-bold text-on-primary-fixed">بند صریح حقوقی ضمانت امانت‌داری</h4>
                        <p className="text-xs text-on-primary-fixed-variant leading-relaxed">
                          مطابق مفاد بند (ب) ماده ۶ قانون تجارت الکترونیک، این سند صرفاً به منظور تضمین سلامت،
                          نگهداری اصولی و عودت به موقع تجهیزات مورد اجاره نزد صندوق امانی اورا توثیق گردیده
                          است. بلافاصله پس از ثبت کد تایید دوطرفه تحویل در اپلیکیشن اورا و بررسی سلامت کالا،
                          این سند در بستر خزانه‌داری به صورت خودکار به وضعیت
                          <strong className="text-on-primary-fixed font-bold"> «باطل‌شده و فاقد اثر حقوقی» </strong>
                          درآمده و امکان هرگونه واخواست، انتقال یا مطالبه وجه منتفی خواهد بود.
                        </p>
                      </div>
                    </div>
                    {/* Digital Seal & Authority Verification Block */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 bg-surface-container-low/40 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-emerald-800">گواهی امضای دیجیتال معتبر بانکی</span>
                          <span className="text-xs text-m3-outline">
                            مرکز ریشه گواهی الکترونیکی کشور (سازمان ثبت اسناد و املاک)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest shadow-sm border border-purple-50">
                        <svg className="w-4 h-4 text-m3-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                        </svg>
                        <span className="text-xs font-bold text-on-surface font-mono">کد هش سند: 8A4F-29E1-C73B</span>
                      </div>
                    </div>
                  </div>
                  {/* Bottom Action Deck Inside Certificate Section */}
                  <div className="bg-surface-container-high/60 border-t border-purple-100 p-6 flex flex-col gap-6">
                    {/* Direct Official Certificate Download Spotlight Card */}
                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-m3-primary/20 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
                      <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-m3-primary/5 pointer-events-none"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-m3-primary text-on-primary flex items-center justify-center shadow-md shadow-m3-primary/25 shrink-0">
                          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                          </svg>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-on-surface">
                              گواهی رسمی و معتبر خزانه‌داری کل کشور
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                              دارای امضای توکن دیجیتال
                            </span>
                          </div>
                          <span className="text-xs text-m3-outline">
                            فرمت PDF امن | حجم فایل: ۱.۴ مگابایت | شناسه یکتای شمس: IR-4039-8812-9041-0028
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-10">
                        <button
                          className="flex-1 sm:flex-initial h-12 px-6 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary text-sm font-bold shadow-md shadow-m3-primary/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled
                          title="به‌زودی — فایل رسمی پس از اتصال به سرویس‌دهنده مجاز صادر می‌شود"
                        >
                          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                          <span className="text-[12px]">دانلود مستقیم فایل رسمی گواهی (PDF)</span>
                        </button>
                      </div>
                    </div>
                    {/* Flow Actions: Return or Finalize Order */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                      <div className="flex items-center gap-2 text-xs text-m3-outline">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                        </svg>
                        <span>
                          سند به مدت ۱۰ سال در آرشیو الکترونیک خزانه‌داری قابل بازیابی و استعلام مستقیم است.
                        </span>
                      </div>
                      <Link
                        className="w-full sm:w-auto h-12 px-8 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary text-base font-bold shadow-lg shadow-m3-primary/25 transition-all flex items-center justify-center gap-2"
                        href="/rentals"
                      >
                        <span>ادامه و نهایی‌سازی سفارش اجاره</span>
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M19 12H5m7 7l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
                {/* Mini FAQ Accordion / Quick Assistance */}
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <svg className="w-5 h-5 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" strokeLinecap="round"></path>
                    </svg>
                    پرسش‌های متداول در خصوص سفته الکترونیک اورا
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-container-low rounded-lg flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-on-surface">آیا پولی از حساب من کسر شده است؟</span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        خیر، به هیچ وجه وجهی کسر نشده است. سفته الکترونیک یک ضمانت اعتباری است که تا زمان عودت
                        صحیح کالا در صندوق امانی باقی می‌ماند و تنها هزینه پرداختی کارمزد ۱۰ هزار تومانی تمبر
                        دولتی بوده است.
                      </p>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-lg flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-on-surface">سفته چه زمانی و چگونه باطل می‌شود؟</span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        در روز سررسید، پس از تحویل کالا به میزبان و تایید نهایی در سامانه، سفته به‌طور آنی در
                        سامانه خزانه‌داری باطل شده و پیامک ابطال رسمی همراه با کد رهگیری برای شما ارسال می‌گردد.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Left Column: Security Lifecycle & Rental Summary */}
              <aside className="lg:col-span-4 flex flex-col gap-6">
                {/* Card 1: Interactive Lifecycle Tracker */}
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 bg-surface-container-low p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                      <span className="text-sm font-bold text-on-surface">چرخه عمر ضمانت دیجیتال</span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      مرحله ۱ از ۴
                    </span>
                  </div>
                  <div className="flex flex-col gap-6 relative pr-2">
                    {/* Timeline Item 1 (Current Active) */}
                    <div className="flex items-start gap-3.5 relative">
                      <div className="w-8 h-8 rounded-full bg-m3-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-m3-primary">۱. ثبت و فعال‌سازی در خزانه‌داری</span>
                        <span className="text-xs text-emerald-700 font-semibold">
                          وضعیت فعلی: فعال و امانت‌گذاری‌شده
                        </span>
                        <span className="text-xs text-on-surface-variant leading-relaxed">
                          سند در گاوصندوق امنیتی دیجیتال اورا توثیق شده است.
                        </span>
                      </div>
                    </div>
                    {/* Timeline Item 2 */}
                    <div className="flex items-start gap-3.5 relative opacity-85">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-m3-outline flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11 6h2v4h-2zm-3 8h8v2H8zm8-12H8C6.9 2 6 2.9 6 4v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H8V4h8v16z"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-on-surface">۲. تحویل کالا و شروع اجاره</span>
                        <span className="text-xs text-on-surface-variant">
                          مراجعه به میزبان و بررسی فیزیکی کالا (۱۴ تا ۱۷ آبان)
                        </span>
                      </div>
                    </div>
                    {/* Timeline Item 3 */}
                    <div className="flex items-start gap-3.5 relative opacity-85">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-m3-outline flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-on-surface">۳. عودت سالم کالا</span>
                        <span className="text-xs text-on-surface-variant">
                          ثبت کد تایید سلامت و ترخیص توسط هر دو طرف در سامانه
                        </span>
                      </div>
                    </div>
                    {/* Timeline Item 4 */}
                    <div className="flex items-start gap-3.5 relative opacity-85">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-m3-outline flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9"></circle>
                          <path d="M9 9l6 6m0-6l-6 6" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-on-surface">۴. ابطال آنی و دائم سند</span>
                        <span className="text-xs text-on-surface-variant">
                          ابطال سیستمی در خزانه‌داری کل و ارسال پیامک تاییدیه به کاربر
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card 2: Rental Summary & Item Details */}
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center gap-2 pb-2">
                    <svg className="w-5 h-5 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                    <span className="text-sm font-bold text-on-surface">خلاصه پرونده اجاره</span>
                  </div>
                  <div className="flex gap-4 p-3 bg-surface-container-low rounded-lg items-center">
                    { }
                    <img
                      className="w-20 h-20 rounded-lg object-cover shadow-sm shrink-0"
                      src="/assets/img/73dad3f2ef21.jpg"
                      alt="دوربین سونی Alpha 7 IV"
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-bold text-on-surface truncate">دوربین Sony Alpha 7 IV</span>
                      <span className="text-xs text-m3-outline truncate">+ لنز تخصصی 24-70mm F/2.8</span>
                      <span className="text-xs text-m3-primary font-semibold">مدت اجاره: ۳ روز کاری</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-3">
                      { }
                      <img
                        className="w-10 h-10 rounded-full object-cover shadow-xs"
                        src="/assets/img/618b29c1485c.jpg"
                        alt="میزبان نمونه"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">مهیار رضایی</span>
                        <span className="text-xs text-m3-outline">میزبان برگزیده (SuperHost)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                      </svg>
                      <span>۴.۹</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v4h-2zm0 6h2v2h-2z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-emerald-900">پوشش بیمه اوراگارد فعال است</span>
                      <span className="text-[11px] text-emerald-700">
                        پوشش حوادث و خسارت ناگهانی تا سقف ۵۰ میلیون تومان
                      </span>
                    </div>
                  </div>
                </div>
                {/* Card 3: Dedicated Support Hotline */}
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.829m-2.829 2.829L3 21m5.636-15.536a5 5 0 010 7.072m0 0L5.807 9.879"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                    <h4 className="text-sm font-bold text-on-surface">پشتیبانی اختصاصی پرونده</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    کارشناسان حقوقی و مالی اورا در تمام مراحل تحویل و عودت کالا همراه شما هستند.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                      <span className="text-xs text-m3-outline">شماره تماس مستقیم کارشناس</span>
                      <span className="text-xs font-bold text-m3-primary font-mono" dir="ltr">
                        ۰۲۱-۹۱۰۰۸۰۰۰ (داخلی ۴)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                      <span className="text-xs text-m3-outline">پاسخگویی آنلاین در چت</span>
                      <Link className="text-xs text-emerald-700 font-bold flex items-center gap-1.5" href="/live-chat">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        آنلاین و فعال
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — preserved from source */}
      <footer
        className="mt-16 bg-white border-t border-purple-100 pt-12 pb-8 text-on-surface-variant text-xs"
        data-purpose="global-footer"
      >
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col gap-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-m3-primary to-primary-container flex items-center justify-center text-white shadow-md shadow-m3-primary/20">
                  <svg className="w-5 h-5 stroke-current fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-m3-primary">اورا</span>
                  <span className="text-[11px] text-m3-outline font-medium">
                    پلتفرم امن کرایه و اشتراک تجهیزات تخصصی
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-m3-outline max-w-sm">
                اورا نخستین پلتفرم هوشمند اجاره و تبادل وسایل در ایران است که امکان کرایه مطمئن تجهیزات عکاسی،
                دیجیتال، کمپینگ و ابزارآلات را با تضمین اصالت، سفته الکترونیک خزانه‌داری و بیمه کامل فراهم
                می‌سازد.
              </p>
              <div className="flex items-center gap-4 text-m3-outline pt-2 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-m3-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                  </svg>
                  ضمانت سلامت کالا
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-m3-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path>
                  </svg>
                  سپرده امن بانکی
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h5 className="text-sm font-bold text-on-surface">دسترسی سریع</h5>
              <div className="flex flex-col gap-2.5 text-xs text-m3-outline">
                <Link className="hover:text-m3-primary transition-colors" href="/categories">اجاره وسایل عکاسی و فیلمبرداری</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/categories">تجهیزات دیجیتال و لپ‌تاپ</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/categories">وسایل سفر و کمپینگ</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/categories">ابزارآلات فنی و کارگاهی</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/create-listing">ثبت و اجاره دادن وسایل</Link>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h5 className="text-sm font-bold text-on-surface">خدمات مشتریان</h5>
              <div className="flex flex-col gap-2.5 text-xs text-m3-outline">
                <Link className="hover:text-m3-primary transition-colors" href="/how-it-works">چگونه کار می‌کند؟</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/promissory-notes">راهنمای سفته الکترونیک و ضمانت</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">پوشش بیمه و خسارت وسایل</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">قوانین و مقررات پلتفرم</Link>
                <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">پرسش‌های متداول (FAQ)</Link>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h5 className="text-sm font-bold text-on-surface">ارتباط و پشتیبانی</h5>
              <div className="flex flex-col gap-2.5 text-xs text-m3-outline">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <span>تلفن: ۹۱۰۰۲۴۰۰-۰۲۱</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>ایمیل: support@overa.ir</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-m3-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>پشتیبانی: ۲۴ ساعته در ۷ روز هفته</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-12 h-14 rounded-xl border border-purple-100 bg-surface-container-low flex flex-col items-center justify-center p-1 text-[9px] font-bold text-center text-m3-outline">
                  <svg className="w-5 h-5 text-m3-primary mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path>
                  </svg>
                  <span>اینماد</span>
                </div>
                <div className="w-12 h-14 rounded-xl border border-purple-100 bg-surface-container-low flex flex-col items-center justify-center p-1 text-[9px] font-bold text-center text-m3-outline">
                  <svg className="w-5 h-5 text-m3-primary mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"></path>
                  </svg>
                  <span>ثنا</span>
                </div>
                <div className="w-12 h-14 rounded-xl border border-purple-100 bg-surface-container-low flex flex-col items-center justify-center p-1 text-[9px] font-bold text-center text-m3-outline">
                  <svg className="w-5 h-5 text-m3-primary mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>
                  </svg>
                  <span>SSL</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-purple-100/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-m3-outline">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-m3-primary flex items-center justify-center text-white shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </div>
              <span className="font-bold text-on-surface">پلتفرم اجاره وسایل اورا (Overa)</span>
              <span>— تمامی حقوق محفوظ است ۱۴۰۳</span>
            </div>
            <div className="flex items-center gap-6">
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">قوانین و مقررات</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">حفظ حریم خصوصی</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">راهنمای اعتماد و امنیت</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">پرسش‌های متداول</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
