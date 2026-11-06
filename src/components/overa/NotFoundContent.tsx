import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import M3Styles from "@/components/overa/M3Styles";

/**
 * Shared 404 markup (source: 404.html) — rendered by the root
 * src/app/not-found.tsx and the direct /404 route. It renders its own
 * header/footer exactly like the source, with a session-aware user chip
 * (guest state rule).
 */
export default async function NotFoundContent() {
  const user = await getCurrentUser();

  return (
    <div className="bg-[#f9f8fc] text-[#130e1b] min-h-screen antialiased selection:bg-primary-container selection:text-white flex flex-col">
      <M3Styles />
      {/* TopNavBar */}
      <header className="w-full bg-white border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3.5 gap-4">
            <Link className="flex items-center gap-3 group shrink-0" href="/">
              <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br">
                { }
                <img src="/assets/img/overa_logo_transparent.png" alt="لوگوی اورا" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">اٌوِرا</span>
                <span className="text-[11px] font-medium text-neutral-muted -mt-1">وسایل بهتر، زندگی سبک‌تر</span>
              </div>
            </Link>
            {/* Center: Search Input Bar */}
            <div className="flex-1 max-w-[520px] mx-2 hidden md:block">
              <form action="/categories" className="relative flex items-center">
                <input
                  className="w-full bg-[#f6f2fc] border border-outline-variant/40 rounded-full py-2.5 pr-5 pl-14 text-xs font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-m3-primary focus:bg-white transition-all text-right"
                  placeholder="جستجو در بین هزاران وسیله..."
                  type="text"
                  name="q"
                />
                <button
                  className="absolute left-1.5 size-8 bg-m3-primary hover:bg-m3-primary/90 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
                  title="جستجو"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                </button>
              </form>
            </div>
            {/* User chip — session aware (guest state rule) */}
            <div className="flex flex-row-reverse items-center gap-2 sm:gap-3 shrink-0">
              {user ? (
                <UserMenu
                  user={{ name: user.name, avatarUrl: user.avatarUrl, isHost: user.isHost, isAdmin: user.isAdmin }}
                />
              ) : (
                <Link
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/40 bg-surface-container-low/50 text-xs font-bold text-on-surface hover:border-m3-primary/40 transition-all"
                  href="/signin-otp"
                >
                  <span className="material-symbols-outlined text-base text-m3-primary">person</span>
                  ورود | ثبت‌نام
                </Link>
              )}
              <div className="h-6 w-px bg-outline-variant/50 mx-1 hidden sm:block"></div>
              <div className="relative">
                <button
                  className="size-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:border-m3-primary/40 transition-colors"
                  disabled
                  title="به‌زودی"
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                </button>
                <span className="absolute -top-1 -right-1 size-4 bg-m3-error text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  ۱
                </span>
              </div>
              <button
                className="size-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:border-m3-primary/40 transition-colors"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-lg">favorite</span>
              </button>
              <Link
                className="size-9 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:border-m3-primary/40 transition-colors"
                href="/live-chat"
                title="گفتگو و پیام‌ها"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2.5 pb-2 text-xs font-semibold overflow-x-auto">
            <nav className="flex items-center gap-6 sm:gap-8 shrink-0 text-on-surface/80">
              <Link className="text-m3-primary border-b-2 border-m3-primary py-1 font-bold" href="/">خانه</Link>
              <Link className="text-on-surface-variant hover:text-m3-primary transition-colors py-1" href="/categories">اجاره وسایل</Link>
              <Link className="text-on-surface-variant hover:text-m3-primary transition-colors py-1" href="/create-listing">ثبت وسیله</Link>
              <Link className="text-on-surface-variant hover:text-m3-primary transition-colors py-1" href="/how-it-works">چگونه کار می‌کند؟</Link>
              <Link className="text-on-surface-variant hover:text-m3-primary transition-colors py-1" href="/about">درباره ما</Link>
            </nav>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold shrink-0 mr-4">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>پشتیبانی آنلاین فعال</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        <div className="flex flex-col w-full">
          <div className="relative w-full overflow-hidden py-12 md:py-16">
            <div className="absolute -top-24 right-1/4 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-10 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative max-w-5xl mx-auto flex flex-col items-center text-center px-4">
              {/* Status Badge Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container text-m3-primary shadow-sm mb-6">
                <span className="flex h-2 w-2 rounded-full bg-m3-primary animate-ping"></span>
                <span className="text-label-sm tracking-wide">خطای ۴۰۴ • مورد یافت نشد</span>
              </div>
              {/* Conceptual Visual: 404 */}
              <div className="relative flex items-center justify-center my-4 select-none">
                <span className="text-display-lg text-[7rem] md:text-[11rem] leading-none font-extrabold text-surface-container-high tracking-tighter">
                  ۴
                </span>
                <div className="relative mx-1 md:mx-4 flex items-center justify-center">
                  <div className="w-28 h-28 md:w-44 md:h-44 rounded-full bg-gradient-to-tr from-m3-primary via-primary-container to-secondary-container p-1 shadow-xl flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-surface-container-lowest flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-m3-primary/5"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="material-symbols-outlined text-4xl md:text-6xl text-m3-primary fill">travel_explore</span>
                        <span className="text-[10px] md:text-xs text-on-surface-variant font-bold mt-1">وسیله ناموجود</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-fixed/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 bg-surface-container-lowest shadow-md rounded-full p-2 text-m3-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm md:text-base">photo_camera</span>
                  </div>
                  <div className="absolute -bottom-2 -left-2 bg-surface-container-lowest shadow-md rounded-full p-2 text-m3-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm md:text-base">backpack</span>
                  </div>
                </div>
                <span className="text-display-lg text-[7rem] md:text-[11rem] leading-none font-extrabold text-surface-container-high tracking-tighter">
                  ۴
                </span>
              </div>
              {/* Headline */}
              <h1 className="text-headline-lg text-on-surface mt-2 mb-3 font-bold">
                اوپس! این وسیله یا صفحه را پیدا نکردیم
              </h1>
              <p className="text-body-md text-on-surface-variant max-w-xl mx-auto leading-relaxed mb-8">
                صفحه‌ای که به دنبال آن هستید ممکن است حذف شده باشد، موعد آگهی اجاره آن به پایان رسیده باشد، یا
                پیوند وارد شده اشتباه باشد. نگران نباشید، صدها گزینه مشابه دیگر آماده تحویل به شماست!
              </p>
              {/* Smart Inline Alternative Search Bar */}
              <form
                action="/categories"
                className="w-full max-w-xl bg-surface-container-lowest rounded-full p-1.5 shadow-md flex items-center gap-2 mb-8"
              >
                <div className="pr-4 text-on-surface-variant flex items-center">
                  <span className="material-symbols-outlined text-xl text-m3-primary">search</span>
                </div>
                <input
                  className="flex-1 bg-transparent border-0 text-right text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:ring-0 focus:outline-none"
                  placeholder="جستجوی کالای جایگزین (دوربین سونی، چادر کمپینگ، PS5...)"
                  type="text"
                  name="q"
                />
                <button
                  className="bg-m3-primary hover:bg-primary-container text-on-primary text-label-md px-5 py-2.5 rounded-full transition-all duration-200 active:scale-95 shrink-0 shadow-sm font-semibold"
                  type="submit"
                >
                  بگرد
                </button>
              </form>
              {/* Primary Action Buttons Group */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
                <Link
                  className="inline-flex items-center gap-2 bg-m3-primary hover:bg-primary-container text-on-primary text-label-md px-6 py-3 rounded-full shadow-md transition-all active:scale-[0.98] font-semibold"
                  href="/"
                >
                  <span className="material-symbols-outlined text-lg">home</span>
                  بازگشت به صفحه اصلی
                </Link>
                <Link
                  className="inline-flex items-center gap-2 bg-surface-container text-on-secondary-container hover:bg-surface-container-high text-label-md px-6 py-3 rounded-full transition-all font-semibold"
                  href="/categories"
                >
                  <span className="material-symbols-outlined text-lg">local_fire_department</span>
                  محبوب‌ترین وسایل اجاره‌ای
                </Link>
                <Link
                  className="inline-flex items-center gap-2 bg-surface-container-lowest text-on-surface hover:text-m3-primary text-label-md px-5 py-3 rounded-full shadow-sm transition-colors font-semibold"
                  href="/tos-support-faq"
                >
                  <span className="material-symbols-outlined text-lg text-emerald-600">headset_mic</span>
                  گزارش مشکل به پشتیبانی
                </Link>
              </div>
              {/* Quick Discovery Category Cards */}
              <div className="w-full text-right mt-2">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-m3-primary text-xl">category</span>
                    <h2 className="text-headline-sm text-on-surface font-semibold">
                      دسته‌بندی‌های پرتقاضا برای شروع دوباره
                    </h2>
                  </div>
                  <span className="text-label-sm text-on-surface-variant">بیش از ۵,۰۰۰ تجهیز آماده تحویل</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <Link
                    className="group bg-surface-container-lowest hover:bg-surface-container-low p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-right"
                    href="/categories?tab=cameras"
                  >
                    <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary group-hover:scale-105 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-3xl">photo_camera</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-label-lg text-on-surface font-bold truncate">عکاسی و فیلم‌برداری</p>
                        <span className="material-symbols-outlined text-on-surface-variant text-base group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant truncate mt-0.5">دوربین‌های سونی، لنز، گیمبال و نورپردازی</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-m3-primary text-[11px] font-bold">ضمانت رسمی</span>
                        <span className="text-on-surface-variant text-[11px]">از ۱۲۰ هزار تومان/روز</span>
                      </div>
                    </div>
                  </Link>
                  <Link
                    className="group bg-surface-container-lowest hover:bg-surface-container-low p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-right"
                    href="/categories?tab=camping"
                  >
                    <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary group-hover:scale-105 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-3xl">camping</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-label-lg text-on-surface font-bold truncate">کمپینگ و آفرود</p>
                        <span className="material-symbols-outlined text-on-surface-variant text-base group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant truncate mt-0.5">چادر اتوماتیک، کوله، بخاری سفری و پاوربانک</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-m3-primary text-[11px] font-bold">بیمه مسافرتی</span>
                        <span className="text-on-surface-variant text-[11px]">از ۹۰ هزار تومان/روز</span>
                      </div>
                    </div>
                  </Link>
                  <Link
                    className="group bg-surface-container-lowest hover:bg-surface-container-low p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-right"
                    href="/categories?tab=gaming"
                  >
                    <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary group-hover:scale-105 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-3xl">sports_esports</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-label-lg text-on-surface font-bold truncate">کنسول بازی و VR</p>
                        <span className="material-symbols-outlined text-on-surface-variant text-base group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant truncate mt-0.5">پلی‌استیشن ۵، هدست واقعیت مجازی و دسته‌ها</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-m3-primary text-[11px] font-bold">تحویل فوری</span>
                        <span className="text-on-surface-variant text-[11px]">از ۱۵۰ هزار تومان/روز</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              {/* Trust Reassurance Micro-banner */}
              <div className="w-full mt-10 p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4 text-on-surface-variant">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-surface-container flex items-center justify-center text-m3-primary shrink-0">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <p className="text-body-sm text-right">
                    آیا آگهی وسیله خودتان باز نمی‌شود؟ برای بررسی وضعیت تاییدیه یا تمدید مهلت آگهی به{" "}
                    <Link className="text-m3-primary font-bold hover:underline" href="/host-dashboard">داشبورد میزبان</Link>{" "}
                    مراجعه کنید.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-m3-primary">lock</span> ودیعه در امانت بانک
                  </span>
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-m3-primary">gavel</span> قرارداد حقوقی اورا
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/40 bg-surface-container-lowest mt-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-m3-primary text-white flex items-center justify-center font-black text-sm">O</div>
              <div>
                <p className="text-sm font-bold text-on-surface">سامانه هوشمند اشتراک‌گذاری و اجاره تجهیزات اورا (Overa)</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  تمامی حقوق برای پلتفرم اورا و میزبانان تاییدشده محفوظ است © ۱۴۰۴
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant font-medium">
              <Link className="hover:text-m3-primary transition-colors flex items-center gap-1" href="/tos-support-faq">
                <span className="material-symbols-outlined text-sm">headset_mic</span>
                پشتیبانی ۲۴ ساعته میزبانان (۰۲۱-۸۸۹۹۰۰۱۱)
              </Link>
              <Link className="hover:text-m3-primary transition-colors" href="/wallet">قوانین تضمین و ودیعه اورا</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">شرایط نشان سوپرمیزبان</Link>
              <Link className="hover:text-m3-primary transition-colors" href="/reviews">راهنمای پاسخ‌گویی به نظرات</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
