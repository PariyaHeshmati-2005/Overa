import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import HowItWorksContent from "./HowItWorksContent";

export const metadata = {
  title: "راهنمای استفاده",
  description: "چگونه در اٌوِرا وسایل را اجاره کنیم یا کسب درآمد داشته باشیم؟",
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex-1 bg-[#f8f6fc] text-neutral-text antialiased flex flex-col gap-6 px-6 py-6 max-w-[1440px] mx-auto w-full">
        <HowItWorksContent />
      </div>
      {/* TrustAndFeatureStrip — preserved from source */}
      <section
        className="max-w-[1440px] mx-auto px-6 w-full"
        data-purpose="trust-badges-strip"
      >
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-card my-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-purple-100/70 text-center">
            <div className="flex flex-col items-center gap-2 px-2 pt-3 md:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <h4 className="text-xs font-bold text-neutral-text">
                بررسی و تایید کاربران
              </h4>
              <p className="text-[11px] text-neutral-muted">
                برای اطمینان بیشتر
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 px-2 pt-3 md:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <h4 className="text-xs font-bold text-neutral-text">
                تحویل در محل
              </h4>
              <p className="text-[11px] text-neutral-muted">در صورت نیاز</p>
            </div>
            <div className="flex flex-col items-center gap-2 px-2 pt-3 md:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <h4 className="text-xs font-bold text-neutral-text">
                پشتیبانی ۲۴ ساعته
              </h4>
              <p className="text-[11px] text-neutral-muted">
                همیشه در کنار شما
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 px-2 pt-3 md:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <h4 className="text-xs font-bold text-neutral-text">
                بیمه کامل وسایل
              </h4>
              <p className="text-[11px] text-neutral-muted">در زمان اجاره</p>
            </div>
            <div className="flex flex-col items-center gap-2 px-2 pt-3 md:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <h4 className="text-xs font-bold text-neutral-text">
                پرداخت امن
              </h4>
              <p className="text-[11px] text-neutral-muted">
                با درگاه‌های معتبر
              </p>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
