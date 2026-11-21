import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/layout/SiteHeader";
import M3Styles from "@/components/overa/M3Styles";
import WalletClient from "./WalletClient";

export const metadata: Metadata = { title: "کیف پول و صندوق امانی" };
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/wallet"));

  return (
    <div className="bg-m3-surface font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">
      <M3Styles />
      {/* Shared site header — identical to the homepage (slide-out menu,
          live DB search, session-aware user area). Replaces the former fixed
          M3 header, so the compensating pt-32 on <main> is gone too. */}
      <SiteHeader />

      <main className="w-full pt-6 bg-m3-surface min-h-[calc(100vh-280px)] flex-1">
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
                  <span className="material-symbols-outlined text-[20px]">
                    all_inclusive
                  </span>
                </div>
                <span className="text-headline-md font-bold text-m3-primary">
                  اورا
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                پلتفرم اشتراک‌گذاری و اجاره تجهیزات با تضمین امنیت سپرده و بیمه
                اختصاصی. وسایل بهتر، تجربه‌های ماندگار و زندگی آسوده‌تر.
              </p>
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#065F46] text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[16px]">
                    verified_user
                  </span>
                  تضمین بازپرداخت و بیمه
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-headline-sm font-bold text-on-surface mb-space-md">
                دسترسی سریع
              </h4>
              <ul className="space-y-space-sm text-body-sm text-on-surface-variant">
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/categories"
                  >
                    جستجوی وسایل
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/create-listing"
                  >
                    درآمدزایی با وسایل
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/wallet"
                  >
                    مدیریت کیف پول
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/how-it-works"
                  >
                    راهنمای سلامت کالا
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-headline-sm font-bold text-on-surface mb-space-md">
                پشتیبانی و امنیت
              </h4>
              <ul className="space-y-space-sm text-body-sm text-on-surface-variant">
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/tos-support-faq"
                  >
                    پوشش بیمه تجهیزات
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/wallet"
                  >
                    سازوکار امانت و ودیعه
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/tos-support-faq"
                  >
                    پرسش‌های متداول
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-m3-primary transition-colors"
                    href="/tos-support-faq"
                  >
                    تماس با پشتیبانی ۲۴/۷
                  </Link>
                </li>
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
                  <span className="material-symbols-outlined text-m3-primary text-[24px]">
                    lock
                  </span>
                  <span className="text-label-sm text-on-surface-variant mt-1">
                    امانت امن
                  </span>
                </div>
                <div className="w-16 h-16 rounded-xl bg-surface-container-lowest p-2 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(76,42,158,0.06)]">
                  <span className="material-symbols-outlined text-[#10B981] text-[24px]">
                    verified
                  </span>
                  <span className="text-label-sm text-on-surface-variant mt-1">
                    مجوز رسمی
                  </span>
                </div>
                <div className="w-16 h-16 rounded-xl bg-surface-container-lowest p-2 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(76,42,158,0.06)]">
                  <span className="material-symbols-outlined text-m3-secondary text-[24px]">
                    shield
                  </span>
                  <span className="text-label-sm text-on-surface-variant mt-1">
                    بیمه کالا
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md text-body-sm text-on-surface-variant">
            <p>© ۱۴۰۵ پلتفرم اورا (Overa). کلیه حقوق مادی و معنوی محفوظ است.</p>
            <div className="flex items-center gap-space-lg text-label-sm">
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/tos-support-faq"
              >
                شرایط استفاده
              </Link>
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/tos-support-faq"
              >
                حریم خصوصی کاربران
              </Link>
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/wallet"
              >
                قوانین ودیعه نقدی
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
