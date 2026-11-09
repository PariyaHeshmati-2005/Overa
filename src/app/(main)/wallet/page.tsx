import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import M3Styles from "@/components/overa/M3Styles";
import WalletClient from "./WalletClient";

export const metadata: Metadata = { title: "کیف پول و صندوق امانی" };
export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/categories", label: "اجاره وسایل" },
  { href: "/create-listing", label: "ثبت وسیله" },
  { href: "/how-it-works", label: "چگونه کار می‌کند؟" },
  { href: "/about", label: "درباره ما" },
];

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/wallet"));

  return (
    <div className="bg-m3-surface font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">
      <M3Styles />
      {/* Header — preserved from wallet.html (M3 shell) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-m3-surface/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(76,42,158,0.05)]">
        <div className="h-20 w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin flex items-center justify-between gap-gutter">
          {/* Brand Logo & Slogan */}
          <Link className="flex items-center gap-3 group shrink-0" href="/">
            <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br">
              { }
              <img src="/assets/img/overa_logo_transparent.png" alt="لوگوی اورا" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">
                اٌوِرا
              </span>
              <span className="text-[11px] font-medium text-neutral-muted -mt-1">
                وسایل بهتر، زندگی سبک‌تر
              </span>
            </div>
          </Link>
          {/* Search (navigates to /categories) */}
          <div className="hidden md:flex flex-1 max-w-md mx-space-lg">
            <form action="/categories" className="relative w-full flex items-center bg-surface-container-low rounded-full px-space-md py-space-xs shadow-[0_2px_12px_rgba(76,42,158,0.03)] focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all">
              <span className="material-symbols-outlined text-m3-outline text-[20px] ml-space-xs">search</span>
              <input
                className="w-full bg-transparent border-0 outline-none text-on-surface text-body-sm placeholder:text-m3-outline"
                placeholder="جستجوی دوربین، تجهیزات سفر، صوتی تصویری..."
                type="text"
                name="q"
              />
            </form>
          </div>
          <div className="flex items-center gap-space-sm sm:gap-space-md">
            <div className="flex items-center gap-space-xs">
              <Link
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                href="/live-chat"
                title="گفتگو و پیام‌ها"
              >
                <span className="material-symbols-outlined text-[22px]">chat_bubble_outline</span>
              </Link>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-[22px]">favorite_border</span>
              </button>
              <button
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-m3-error ring-2 ring-m3-surface"></span>
              </button>
            </div>
            <div className="h-7 w-[1px] bg-outline-variant/40 hidden sm:block"></div>
            {/* Signed-in user menu (guest state rule) */}
            <UserMenu
              user={{ name: user.name, avatarUrl: user.avatarUrl, isHost: user.isHost, isAdmin: user.isAdmin }}
            />
          </div>
        </div>
        <div className="h-12 w-full bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="h-full w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin flex items-center overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-space-xs sm:gap-space-sm whitespace-nowrap">
              {NAV_LINKS.map((l, i) => (
                <Link
                  key={l.label + i}
                  href={l.href}
                  className="px-space-md py-1.5 rounded-full text-label-md font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="w-full pt-32 bg-m3-surface min-h-[calc(100vh-280px)] flex-1">
        <div className="flex flex-col w-full">
          <WalletClient userName={user.name} />
        </div>
      </main>

      {/* Footer — preserved from wallet.html */}
      <footer className="w-full bg-surface-container-low text-on-surface mt-space-2xl">
        <div className="w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin pt-space-2xl pb-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-space-2xl">
            <div className="space-y-space-md md:col-span-1">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-xl bg-m3-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">all_inclusive</span>
                </div>
                <span className="text-headline-md font-bold text-m3-primary">اورا</span>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                پلتفرم اشتراک‌گذاری و اجاره تجهیزات با تضمین امنیت سپرده و بیمه
                اختصاصی. وسایل بهتر، تجربه‌های ماندگار و زندگی آسوده‌تر.
              </p>
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#065F46] text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  تضمین بازپرداخت و بیمه
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-headline-sm font-bold text-on-surface mb-space-md">دسترسی سریع</h4>
              <ul className="space-y-space-sm text-body-sm text-on-surface-variant">
                <li><Link className="hover:text-m3-primary transition-colors" href="/categories">جستجوی وسایل</Link></li>
                <li><Link className="hover:text-m3-primary transition-colors" href="/create-listing">درآمدزایی با وسایل</Link></li>
                <li><Link className="hover:text-m3-primary transition-colors" href="/wallet">مدیریت کیف پول</Link></li>
                <li><Link className="hover:text-m3-primary transition-colors" href="/how-it-works">راهنمای سلامت کالا</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-headline-sm font-bold text-on-surface mb-space-md">پشتیبانی و امنیت</h4>
              <ul className="space-y-space-sm text-body-sm text-on-surface-variant">
                <li><Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">پوشش بیمه تجهیزات</Link></li>
                <li><Link className="hover:text-m3-primary transition-colors" href="/wallet">سازوکار امانت و ودیعه</Link></li>
                <li><Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">پرسش‌های متداول</Link></li>
                <li><Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">تماس با پشتیبانی ۲۴/۷</Link></li>
              </ul>
            </div>
            <div className="space-y-space-md">
              <div>
                <h4 className="text-headline-sm font-bold text-on-surface mb-space-sm">
                  نمادهای اعتماد و اعتبارسنجی
                </h4>
                <p className="text-body-sm text-on-surface-variant">
                  تمامی تراکنش‌ها و سپرده‌های مالی در حساب امانی امن نگهداری
                  می‌شوند.
                </p>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="w-16 h-16 rounded-xl bg-surface-container-lowest p-2 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(76,42,158,0.06)]">
                  <span className="material-symbols-outlined text-m3-primary text-[24px]">lock</span>
                  <span className="text-label-sm text-on-surface-variant mt-1">امانت امن</span>
                </div>
                <div className="w-16 h-16 rounded-xl bg-surface-container-lowest p-2 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(76,42,158,0.06)]">
                  <span className="material-symbols-outlined text-[#10B981] text-[24px]">verified</span>
                  <span className="text-label-sm text-on-surface-variant mt-1">مجوز رسمی</span>
                </div>
                <div className="w-16 h-16 rounded-xl bg-surface-container-lowest p-2 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(76,42,158,0.06)]">
                  <span className="material-symbols-outlined text-m3-secondary text-[24px]">shield</span>
                  <span className="text-label-sm text-on-surface-variant mt-1">بیمه کالا</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md text-body-sm text-on-surface-variant">
            <p>© ۱۴۰۳ پلتفرم اورا (Overa). کلیه حقوق مادی و معنوی محفوظ است.</p>
            <div className="flex items-center gap-space-lg text-label-sm">
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">شرایط استفاده</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">حریم خصوصی کاربران</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/wallet">قوانین ودیعه نقدی</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
