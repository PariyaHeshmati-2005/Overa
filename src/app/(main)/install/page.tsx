import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import InstallApp from "./InstallApp";
import { installQrSvg, getSiteBaseUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نصب اپلیکیشن اورا",
  description:
    "اپلیکیشن اورا را روی گوشی و دسکتاپ نصب کنید — دسترسی سریع‌تر به اجاره وسایل.",
};

export default async function InstallPage() {
  // Real, scannable QR (locally generated SVG) pointing at this page on the
  // canonical public URL of the deployment.
  const qrSvg = await installQrSvg();
  const baseUrl = getSiteBaseUrl();

  return (
    <>
      <SiteHeader />
      <div className="flex-1 w-full bg-[#fafafa]">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-neutral-muted" aria-label="مسیر صفحه">
            <Link href="/" className="hover:text-primary font-medium">خانه</Link>
            <span className="text-purple-100">/</span>
            <span className="font-bold text-neutral-text">نصب اپلیکیشن</span>
          </nav>

          {/* Header banner — same visual language as the app section on the homepage */}
          <section className="rounded-3xl bg-gradient-to-r from-[#220D4C] via-[#371978] to-[#1E0942] text-white p-6 md:p-10 relative overflow-hidden shadow-xl">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" aria-hidden="true"></div>
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <span className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/assets/img/pwa/icon-512.png"
                  alt="آیکون اپلیکیشن اورا"
                  className="w-full h-full object-contain p-2"
                />
              </span>
              <div className="flex-1 flex flex-col gap-2 text-center md:text-right">
                <h1 className="text-2xl md:text-3xl font-black">نصب اپلیکیشن اورا</h1>
                <p className="text-sm text-purple-200/90 leading-relaxed">
                  اورا را مثل یک اپلیکیشن واقعی روی گوشی یا کامپیوتر خود نصب
                  کنید؛ بدون نیاز به App Store یا Google Play.
                </p>
              </div>
              {/* Scannable QR — encodes the live /install URL */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="w-28 h-28 rounded-2xl bg-white p-2 shadow-lg overflow-hidden"
                  aria-label={`کد QR برای باز کردن ${baseUrl}/install`}
                  role="img"
                >
                  <span
                    className="block w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                </div>
                <span className="text-[10px] text-purple-200">
                  اسکن برای باز کردن صفحه نصب
                </span>
              </div>
            </div>
          </section>

          {/* Device-aware install flow (client component) */}
          <InstallApp />

          {/* Feature strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="مزایای اپلیکیشن">
            {[
              { t: "دسترسی سریع", d: "اجاره بدون تایپ آدرس", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { t: "تجربه اپلیکیشنی", d: "اجرای تمام‌صفحه", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
              { t: "رزروهای همیشه جلوی چشم", d: "پیگیری از حساب کاربری", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { t: "سبک و سریع", d: "حجم نصب بسیار کم", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            ].map((f) => (
              <div key={f.t} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex flex-col items-center gap-2 text-center">
                <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={f.icon} strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
                <span className="text-xs font-bold text-neutral-text">{f.t}</span>
                <span className="text-[10px] text-neutral-muted">{f.d}</span>
              </div>
            ))}
          </section>

          <p className="text-[11px] text-neutral-muted text-center pb-2">
            آدرس صفحه نصب: <span dir="ltr">{baseUrl}/install</span>
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
