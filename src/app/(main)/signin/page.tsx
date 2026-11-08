import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import SignInForm from "./SignInForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ورود با رمز عبور",
};

/* Page-local styles ported from signin.html <style> (ov-card effects). */
const OV_CARD_CSS = `
main, footer { position: relative; z-index: 1; }
main .ov-card { position: relative; box-shadow: 0 30px 80px -30px rgba(99,14,212,.35), 0 0 0 1px rgba(124,58,237,.07); animation: ov-card-in .8s cubic-bezier(.2,.8,.2,1) both; }
main .ov-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; z-index: 2; background: linear-gradient(90deg,#630ed4,#a688fe,#7c3aed,#630ed4); background-size: 200% 100%; animation: ov-sheen 6s linear infinite; }
@keyframes ov-sheen { to { background-position: -200% 0; } }
@keyframes ov-card-in { from { opacity: 0; transform: translateY(28px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes ov-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.ov-card h2 { animation: ov-rise .6s .15s both; }
.ov-card h2 + p { animation: ov-rise .6s .22s both; }
.ov-card form > * { animation: ov-rise .6s both; }
.ov-card form > *:nth-child(1) { animation-delay: .28s; }
.ov-card form > *:nth-child(2) { animation-delay: .34s; }
.ov-card form > *:nth-child(3) { animation-delay: .40s; }
.ov-card form > *:nth-child(4) { animation-delay: .46s; }
.ov-card form > *:nth-child(5) { animation-delay: .52s; }
.ov-card form > *:nth-child(n+6) { animation-delay: .58s; }
.ov-card button[type="submit"] { position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s, background-color .2s; }
.ov-card button[type="submit"]::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); transform: translateX(-120%); transition: transform .7s ease; }
.ov-card button[type="submit"]:hover { transform: translateY(-1px); }
.ov-card button[type="submit"]:hover::after { transform: translateX(120%); }
.ov-card input:not([type="checkbox"]):not([type="radio"]):focus { box-shadow: 0 6px 18px -8px rgba(99,14,212,.35); }
@media (prefers-reduced-motion: reduce) { .ov-blob, main .ov-card, main .ov-card::before, .ov-card * { animation: none !important; } }
`;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  // `next` must be a local path (starts with "/", never "//") — otherwise ignore.
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/";
  // Guest-state rule: the source header shows no user chip on auth pages,
  // so we only read the session to keep the page session-aware (no name render).
  await getCurrentUser();

  return (
    <div className="bg-m3-background text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <style href="ov-card-auth" precedence="default">{OV_CARD_CSS}</style>
      {/* Ambient background (classes shared in globals.css) */}
      <div aria-hidden="true" className="ov-bg">
        <span className="ov-blob ov-blob-1"></span>
        <span className="ov-blob ov-blob-2"></span>
        <span className="ov-blob ov-blob-3"></span>
      </div>

      {/* Top Minimal Focused Navigation — preserved from source */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="max-w-[1360px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo & Identity */}
          <Link
            className="flex items-center gap-3 group shrink-0"
            data-purpose="brand-logo"
            href="/"
          >
            <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200">
              <img src="/assets/img/overa_logo_transparent.png" alt="logo" />
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
          {/* Links & Back Button */}
          <div className="flex items-center gap-6">
            <Link
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              <span className="material-symbols-outlined text-[18px]">
                verified_user
              </span>
              راهنمای عضویت و قوانین
            </Link>
            <div className="h-4 w-px bg-outline-variant/50 hidden md:block"></div>
            <a
              className="hidden sm:flex items-center gap-2 text-xs font-semibold text-m3-secondary hover:text-m3-primary transition-colors bg-surface-container px-3 py-1.5 rounded-full"
              href="tel:02191002424"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              پشتیبانی: ۰۲۱-۹۱۰۰۲۴۲۴
            </a>
            <Link
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all border border-outline-variant/30"
              href="/"
            >
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
              <span className="">بازگشت به خانه</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split-Card View */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="ov-card w-full max-w-xl mx-auto bg-surface-container-lowest rounded-3xl shadow-xl shadow-m3-secondary/5 border border-outline-variant/30 overflow-hidden grid grid-cols-1 min-h-[640px]">
          {/* Right Column: Login with Password Form (Active) */}
          <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center items-center">
            <div className="w-full max-w-md mx-auto">
              {/* Security Top Badge & Phone Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-m3-primary font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">
                    verified_user
                  </span>
                  <span className="">احراز هویت دو مرحله‌ای امن</span>
                </div>
                <span className="text-xs text-on-surface-variant font-medium hidden sm:inline-block">
                  پشتیبانی برخط ۲۴/۷
                </span>
              </div>
              {/* Section Headings */}
              <div className="space-y-2 mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  ورود به حساب کاربری در اورا
                </h2>
                <p className="text-sm text-on-surface-variant font-normal">
                  خوش آمدید! برای دسترسی به پنل و اجاره وسایل، اطلاعات حساب خود
                  را وارد نمایید.
                </p>
              </div>
              {/* Segmented Tab Navigation (single active tab, as in source) */}
              <div className="bg-surface-container p-1.5 rounded-2xl flex items-center mb-7 gap-1">
                <div className="flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold bg-surface-container-lowest text-m3-primary shadow-sm flex items-center justify-center gap-1.5 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-base">
                    lock
                  </span>
                  <span className="">ورود با رمز عبور</span>
                </div>
              </div>
              {/* Active Form + divider + OTP alternative + demo hint (client) */}
              <SignInForm next={next} />
            </div>
            {/* Footer Card Meta */}
            <div className="pt-6 mt-6 border-t border-outline-variant/30 space-y-3 w-full max-w-md mx-auto">
              <div className="text-center text-xs text-on-surface-variant">
                <span className="">هنوز در اورا ثبت‌نام نکرده‌اید؟ </span>
                <Link
                  className="font-extrabold text-m3-primary hover:underline"
                  href="/signup"
                >
                  ثبت‌نام و ایجاد حساب جدید
                </Link>
              </div>
              <p className="text-[11px] text-center text-on-surface-variant/80 leading-relaxed">
                با ورود به پلتفرم اورا،{" "}
                <Link
                  className="text-m3-secondary font-semibold hover:underline"
                  href="/tos-support-faq"
                >
                  قوانین و شرایط استفاده
                </Link>{" "}
                و{" "}
                <Link
                  className="text-m3-secondary font-semibold hover:underline"
                  href="/tos-support-faq"
                >
                  سیاست حفظ حریم خصوصی
                </Link>{" "}
                را می‌پذیرید.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Standard Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-6 mt-auto">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="">
              © ۱۴۰۳ تمامی حقوق مادی و معنوی برای پلتفرم اورا (Overa) محفوظ است.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              تماس با ما
            </Link>
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              سوالات متداول
            </Link>
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              قوانین و ضمانت اوراگارد
            </Link>
            <span className="inline-flex items-center gap-1 text-m3-secondary font-bold">
              <span className="material-symbols-outlined text-sm">
                verified
              </span>
              دارای پروانه کسب‌وکارهای مجازی
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
