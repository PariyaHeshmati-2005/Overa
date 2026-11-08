import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import SignUpForm from "./SignUpForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ثبت‌نام و ایجاد حساب کاربری",
};

/* Page-local styles ported from signup.html <style> (ov-card effects). */
const OV_CARD_CSS = `
main, footer { position: relative; z-index: 1; }
main .ov-card { position: relative; box-shadow: 0 30px 80px -30px rgba(99,14,212,.35), 0 0 0 1px rgba(124,58,237,.07); animation: ov-card-in .8s cubic-bezier(.2,.8,.2,1) both; }
main .ov-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; z-index: 2; background: linear-gradient(90deg,#630ed4,#a688fe,#7c3aed,#630ed4); background-size: 200% 100%; animation: ov-sheen 6s linear infinite; }
@keyframes ov-sheen { to { background-position: -200% 0; } }
@keyframes ov-card-in { from { opacity: 0; transform: translateY(28px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes ov-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.ov-card h1 { animation: ov-rise .6s .15s both; }
.ov-card h1 + p { animation: ov-rise .6s .22s both; }
.ov-card form > * { animation: ov-rise .6s both; }
.ov-card form > *:nth-child(1) { animation-delay: .28s; }
.ov-card form > *:nth-child(2) { animation-delay: .34s; }
.ov-card form > *:nth-child(3) { animation-delay: .40s; }
.ov-card form > *:nth-child(4) { animation-delay: .46s; }
.ov-card form > *:nth-child(n+5) { animation-delay: .52s; }
.ov-card button[type="submit"] { position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s, background-color .2s; }
.ov-card button[type="submit"]::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); transform: translateX(-120%); transition: transform .7s ease; }
.ov-card button[type="submit"]:hover { transform: translateY(-1px); }
.ov-card button[type="submit"]:hover::after { transform: translateX(120%); }
.ov-card input:not([type="checkbox"]):not([type="radio"]):focus { box-shadow: 0 6px 18px -8px rgba(99,14,212,.35); }
@media (prefers-reduced-motion: reduce) { .ov-blob, main .ov-card, main .ov-card::before, .ov-card * { animation: none !important; } }
`;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/";
  // Guest-state rule: source auth header has no user chip — nothing to swap.
  await getCurrentUser();

  return (
    <div className="bg-m3-background text-on-surface min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      <style href="ov-card-auth" precedence="default">{OV_CARD_CSS}</style>
      <div aria-hidden="true" className="ov-bg">
        <span className="ov-blob ov-blob-1"></span>
        <span className="ov-blob ov-blob-2"></span>
        <span className="ov-blob ov-blob-3"></span>
      </div>

      {/* Minimal Focused Header — preserved from source */}
      <header className="w-full border-b border-outline-variant/40 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Slogan */}
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
          {/* Quick Context Actions */}
          <div className="flex items-center gap-3">
            <Link
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-m3-secondary hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              <span className="material-symbols-outlined text-base">help</span>
              <span className="">راهنمای عضویت و قوانین</span>
            </Link>
            <Link
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs md:text-sm font-semibold transition-all"
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

      {/* Main Centered / Split Authentication Content (single card, as source) */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="ov-card w-full max-w-xl mx-auto bg-surface-container-lowest rounded-2xl md:rounded-3xl shadow-xl shadow-m3-primary/5 border border-outline-variant/30 overflow-hidden grid grid-cols-1 min-h-[660px]">
          {/* Right Side / Form Container (RTL Primary Interaction) */}
          <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-between">
            <div>
              {/* Title & Badges */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-sm">
                    verified_user
                  </span>
                  احراز هویت دومرحله‌ای امن
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  پشتیبانی: ۰۲۱-۹۱۰۰۲۴۲۴
                </span>
              </div>
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mb-2">
                  ایجاد حساب کاربری در اورا
                </h1>
                <p className="text-sm sm:text-base text-on-surface-variant font-normal">
                  به جمع بیش از ۴۵,۰۰۰ کاربر معتبر پلتفرم اجاره وسایل بپیوندید
                </p>
              </div>
              {/* Auth Mode Segmented Tab Switcher */}
              <div className="p-1 rounded-xl bg-surface-container mb-6 flex gap-1">
                <Link
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center gap-2"
                  href={next && next !== "/" ? `/signin-otp?next=${encodeURIComponent(next)}` : "/signin-otp"}
                >
                  <span className="material-symbols-outlined text-lg">sms</span>
                  <span className="">کد یکبار مصرف (OTP)</span>
                </Link>
                <div className="flex-1 py-2.5 rounded-lg text-sm font-bold text-center transition-all bg-surface-container-lowest text-m3-primary shadow-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">
                    person_add
                  </span>
                  <span className="">ثبت‌نام کاربر جدید</span>
                </div>
              </div>
              {/* Form Area (client) */}
              <SignUpForm next={next} />
            </div>
            {/* Footer / Terms agreement */}
            <div className="mt-8 pt-4 border-t border-outline-variant/30 text-center">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                با ورود و ثبت‌نام در اورا،{" "}
                <Link
                  className="text-m3-primary font-semibold underline hover:text-on-primary-fixed-variant"
                  href="/tos-support-faq"
                >
                  قوانین و شرایط استفاده
                </Link>{" "}
                و{" "}
                <Link
                  className="text-m3-primary font-semibold underline hover:text-on-primary-fixed-variant"
                  href="/tos-support-faq"
                >
                  سیاست حریم خصوصی
                </Link>{" "}
                پلتفرم را می‌پذیرید.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Trust Footer */}
      <footer className="py-5 text-center text-xs text-on-surface-variant/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="">
            تمامی حقوق مادی و معنوی متعلق به پلتفرم هوشمند «اورا» (Overa
            Technologies) می‌باشد.
          </span>
          <div className="flex items-center gap-4">
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
              پروانه کسب‌وکار مجازی
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
