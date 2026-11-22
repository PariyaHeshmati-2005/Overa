import SiteHeader from "@/components/layout/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import M3Styles from "@/components/overa/M3Styles";
import LoadingProgress from "./LoadingProgress";

export const metadata: Metadata = { title: "بارگذاری | اٌوِرا" };
export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/", label: "خانه", active: true },
  { href: "/categories", label: "اجاره وسایل", active: false },
  { href: "/create-listing", label: "ثبت وسیله", active: false },
  { href: "/how-it-works", label: "چگونه کار می‌کند؟", active: false },
  { href: "/about", label: "درباره ما", active: false },
];

export default async function LoadingPage() {
  const user = await getCurrentUser();

  return (
    <div className="bg-[#f9f8fc] text-[#130e1b] min-h-screen antialiased selection:bg-primary-container selection:text-white flex flex-col">
      <M3Styles />
      {/* TopNavBar — preserved from loading.html */}
      <SiteHeader />

      {/* Main Content */}
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        <div className="flex flex-col w-full relative">
          {/* Top Shimmer Progress Line */}
          <div className="w-full h-1 bg-surface-container-high overflow-hidden rounded-full relative mb-6">
            <div className="h-full bg-gradient-to-r from-m3-primary via-primary-container to-secondary-container rounded-full animate-pulse transition-all duration-300 w-3/4"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[ov-shimmer_1.8s_infinite]"></div>
          </div>
          {/* Ambient Violet Glow Effects */}
          <div className="pointer-events-none absolute -top-12 right-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl -z-10"></div>
          <div className="pointer-events-none absolute top-48 left-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-3xl -z-10"></div>

          {/* Smart Fetching Card */}
          <div className="w-full bg-gradient-to-r from-m3-primary via-primary-container to-m3-secondary text-on-primary rounded-xl p-6 sm:p-8 shadow-xl shadow-m3-primary/15 relative overflow-hidden mb-10">
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute right-0 bottom-0 w-64 h-32 bg-white/5 rounded-full blur-xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                {/* Brand Pulsing Spinner */}
                <div className="relative size-14 shrink-0 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                  <svg
                    className="animate-spin size-8 text-on-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    ></circle>
                    <path
                      className="opacity-90"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  <span className="material-symbols-outlined absolute text-base text-on-primary opacity-90 fill">
                    sync
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-on-primary text-label-sm tracking-wide">
                      اتصال امن ابری Overa-Edge
                    </span>
                    <span className="inline-flex size-2 rounded-full bg-emerald-300 animate-ping"></span>
                  </div>
                  <h2 className="text-headline-md text-on-primary tracking-tight font-bold">
                    در حال بارگذاری تجهیزات آماده تحویل و استعلام ودیعه‌های
                    امن...
                  </h2>
                  <p className="text-body-sm text-on-primary-container opacity-90">
                    بررسی اصالت ۱,۴۸۰ وسیله موجود در تهران و کرج بر اساس رتبه
                    میزبانان برتر
                  </p>
                </div>
              </div>
              {/* Live Loading Metric & Bar */}
              <div className="w-full md:w-72 bg-white/15 backdrop-blur-lg rounded-xl p-4 shadow-sm">
                <LoadingProgress />
              </div>
            </div>
          </div>

          {/* Breadcrumbs & Category Bar Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-surface-container-high rounded-full animate-pulse"></div>
              <span className="material-symbols-outlined text-m3-outline text-xs">
                arrow_back_ios
              </span>
              <div className="h-4 w-28 bg-surface-container-high rounded-full animate-pulse"></div>
              <span className="material-symbols-outlined text-m3-outline text-xs">
                arrow_back_ios
              </span>
              <div className="h-4 w-36 bg-surface-container-highest rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <div className="h-9 w-28 bg-surface-container-high rounded-full animate-pulse shrink-0"></div>
              <div className="h-9 w-32 bg-surface-container-high rounded-full animate-pulse shrink-0"></div>
              <div className="h-9 w-24 bg-surface-container-high rounded-full animate-pulse shrink-0"></div>
              <div className="h-9 w-10 bg-surface-container-high rounded-full animate-pulse shrink-0"></div>
            </div>
          </div>

          {/* Main Catalog Grid Layout: Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="hidden lg:flex lg:col-span-4 flex-col gap-6 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <div className="size-5 bg-surface-container-highest rounded-lg animate-pulse"></div>
                  <div className="h-5 w-24 bg-surface-container-highest rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-12 bg-surface-container rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-28 bg-surface-container-high rounded animate-pulse"></div>
                <div className="h-12 w-full bg-surface-container-low rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse"></div>
                <div className="flex flex-col gap-2.5">
                  {[28, 36, 20].map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low"
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-4 bg-surface-container-highest rounded animate-pulse"></div>
                        <div
                          className={
                            "h-3 bg-surface-container-highest rounded animate-pulse"
                          }
                          style={{ width: `${w * 4}px` }}
                        ></div>
                      </div>
                      <div className="size-4 bg-surface-container rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-surface-container rounded animate-pulse"></div>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-3 w-14 bg-surface-container rounded animate-pulse"></div>
                  <div className="h-3 w-14 bg-surface-container rounded animate-pulse"></div>
                </div>
              </div>
              <div className="p-3.5 bg-surface-container-low rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-surface-container-highest rounded animate-pulse"></div>
                  <div className="h-3 w-36 bg-surface-container rounded animate-pulse"></div>
                </div>
                <div className="w-10 h-6 bg-surface-container-highest rounded-full animate-pulse"></div>
              </div>
            </aside>
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Sort Bar Skeleton */}
              <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-20 bg-surface-container-high rounded animate-pulse"></div>
                  <div className="hidden sm:flex gap-2">
                    <div className="h-7 w-20 bg-primary-container/20 rounded-full animate-pulse"></div>
                    <div className="h-7 w-24 bg-surface-container rounded-full animate-pulse"></div>
                    <div className="h-7 w-20 bg-surface-container rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-surface-container rounded-lg animate-pulse"></div>
                  <div className="size-8 bg-surface-container rounded-lg animate-pulse"></div>
                </div>
              </div>
              {/* Equipment 3-Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[
                  { pill: "bg-surface-container-highest", w: "w-24" },
                  { pill: "bg-emerald-100", w: "w-28" },
                  { pill: "bg-surface-container-highest", w: "w-20" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="w-full h-48 bg-surface-container-high rounded-xl relative overflow-hidden animate-pulse">
                        <div
                          className={
                            "absolute top-3 right-3 h-6 rounded-full " +
                            c.pill +
                            " " +
                            c.w
                          }
                        ></div>
                        <div className="absolute bottom-3 left-3 size-8 bg-surface-container-highest rounded-full"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-20 bg-surface-container rounded-full animate-pulse"></div>
                        <div className="flex items-center gap-1">
                          <div className="size-3.5 bg-amber-200 rounded-full animate-pulse"></div>
                          <div className="h-3 w-6 bg-surface-container rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div
                        className={
                          "h-5 bg-surface-container-highest rounded-lg animate-pulse " +
                          (i === 0 ? "w-4/5" : i === 1 ? "w-11/12" : "w-3/4")
                        }
                      ></div>
                      <div
                        className={
                          "h-3.5 bg-surface-container rounded animate-pulse " +
                          (i === 0 ? "w-3/5" : i === 1 ? "w-1/2" : "w-2/3")
                        }
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-surface-container">
                      <div className="h-6 bg-surface-container-low rounded animate-pulse"></div>
                      <div className="h-6 bg-surface-container-low rounded animate-pulse"></div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-3 w-12 bg-surface-container rounded animate-pulse"></div>
                        <div
                          className={
                            "h-5 bg-primary-container/20 rounded-lg animate-pulse " +
                            (i === 0 ? "w-24" : i === 1 ? "w-28" : "w-20")
                          }
                        ></div>
                      </div>
                      <div className="h-9 w-20 bg-surface-container-highest rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Additional Horizontal Skeleton Row */}
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="size-12 bg-surface-container-highest rounded-xl animate-pulse shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-48 sm:w-64 bg-surface-container-highest rounded animate-pulse"></div>
                    <div className="h-3 w-32 sm:w-44 bg-surface-container rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="h-8 w-24 bg-surface-container rounded-lg animate-pulse"></div>
                  <div className="h-8 w-28 bg-primary-container/20 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Reassuring Low-Stress Footer Message */}
          <div className="mt-12 bg-surface-container-low rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-full bg-secondary-fixed flex items-center justify-center text-m3-primary shrink-0">
                <span className="material-symbols-outlined text-xl">
                  cloud_sync
                </span>
              </div>
              <div>
                <p className="text-label-md text-on-surface font-semibold">
                  داده‌ها از نزدیک‌ترین سرورهای ابری اٌوِرا دریافت می‌شوند،
                  لطفاً چند لحظه شکیبا باشید.
                </p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  موجودی تجهیزات و مبالغ ودیعه ضمانت به صورت لحظه‌ای با دفتر امن
                  اٌوِرا تطبیق داده می‌شوند (حالت شبیه‌سازی).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-m3-primary shrink-0">
              <span className="inline-block size-2 rounded-full bg-m3-primary animate-ping"></span>
              <span>همگام‌سازی زنده فعال است</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/40 bg-surface-container-lowest mt-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-m3-primary text-white flex items-center justify-center font-black text-sm">
                O
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  سامانه هوشمند اشتراک‌گذاری و اجاره تجهیزات اٌوِرا (Overa)
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  تمامی حقوق برای پلتفرم اٌوِرا و میزبانان تاییدشده محفوظ است ©
                  ۱۴۰۴
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant font-medium">
              <Link
                className="hover:text-m3-primary transition-colors flex items-center gap-1"
                href="/tos-support-faq"
              >
                <span className="material-symbols-outlined text-sm">
                  headset_mic
                </span>
                پشتیبانی ۲۴ ساعته میزبانان (۰۲۱-۸۸۹۹۰۰۱۱)
              </Link>
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/wallet"
              >
                قوانین تضمین و ودیعه اٌوِرا
              </Link>
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/tos-support-faq"
              >
                شرایط نشان سوپرمیزبان
              </Link>
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/reviews"
              >
                راهنمای پاسخ‌گویی به نظرات
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
