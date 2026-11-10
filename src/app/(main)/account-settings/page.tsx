import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import UserMenu from "@/components/layout/UserMenu";
import { faDate, toPersianDigits } from "@/lib/format";
import SettingsBody from "./SettingsBody";
import NotificationsPanel from "./NotificationsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تنظیمات حساب کاربری",
};

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=%2Faccount-settings");

  // Full record (bio/city/createdAt are not part of the session payload).
  const me = await db.user.findUnique({ where: { id: user.id } });
  if (!me) redirect("/signin-otp?next=%2Faccount-settings");

  const [unreadCount, completedRentals] = await Promise.all([
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.reservation.count({
      where: {
        status: "COMPLETED",
        OR: [{ renterId: user.id }, { hostId: user.id }],
      },
    }),
  ]);

  const NAV_ITEMS = [
    { href: "/host-dashboard", icon: "home", label: "داشبورد" },
    { href: "/my-items", icon: "shopping_bag", label: "وسایل من" },
    { href: "/rentals", icon: "calendar_today", label: "اجاره‌ها" },
    { href: "/wallet", icon: "monetization_on", label: "درآمد و تسویه حساب" },
    { href: "/reviews", icon: "star_outline", label: "نظرات کاربران" },
    { href: "/discounts", icon: "description", label: "تخفیف ها" },
  ];

  return (
    <div className="bg-m3-background text-on-surface antialiased">
      {/* Page-local helper (source used .no-scrollbar on the tab strip) */}
      <style href="no-scrollbar" precedence="default">
        {".no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}"}
      </style>
      <div className="flex min-h-screen w-full bg-[#f9f8fc]">
        {/* Desktop Right Sidebar (Persistent Navigation for Host Portal) */}
        <aside
          className="w-72 shrink-0 border-l border-[#2e175b]/60 flex-col justify-between p-4 min-h-screen hidden lg:flex sticky top-0 h-screen overflow-y-auto items-stretch z-30"
          style={{ background: "rgb(19, 8, 39)", minHeight: "100vh", height: "100vh" }}
        >
          <div className="flex flex-col gap-6">
            {/* Navigation List exactly matching the source */}
            <nav aria-label="منوی پنل کاربری" className="flex flex-col gap-1.5 pt-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#d4c5f9] hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
                  href={item.href}
                >
                  <span className="material-symbols-outlined text-[19px] text-[#b39ddb]">
                    {item.icon}
                  </span>
                  <span className="">{item.label}</span>
                </Link>
              ))}
              {/* Active Item: تنظیمات */}
              <Link
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white font-bold text-sm shadow-md shadow-purple-900/40 transition-all"
                href="/account-settings"
                style={{ background: "#7312d8" }}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span className="text-[14px]">تنظیمات</span>
              </Link>
            </nav>
          </div>

          {/* Bottom section matching the source */}
          <div className="flex flex-col gap-3 pt-4 pb-2">
            {/* 24/7 Support Card */}
            <div
              className="rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-[#431f7a]/40 shadow-inner"
              style={{ background: "rgba(36, 12, 69, 0.65)", backdropFilter: "blur(8px)" }}
            >
              <div className="size-10 rounded-full flex items-center justify-center bg-[#4c1d95]/40 text-[#c4b5fd] border border-[#7c3aed]/30 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <span className="font-bold text-white text-xs tracking-tight">
                  پشتیبانی ۲۴ ساعته
                </span>
                <span className="text-[11px] text-[#bca7e8]">
                  در هر زمان کنار شما هستیم
                </span>
              </div>
              <Link
                className="w-full mt-2 py-2 px-3 rounded-xl border border-[#7c3aed]/50 text-white font-medium text-xs hover:bg-[#7c3aed]/20 transition-all active:scale-[0.98]"
                href="/tos-support-faq"
                style={{ background: "rgba(43, 14, 82, 0.6)" }}
              >
                تماس با پشتیبانی
              </Link>
            </div>

            {/* Bottom slogan */}
            <div className="text-center text-[10px] text-[#8e76be] py-1 font-medium">
              با ما، اجاره دادن ساده‌تر از همیشه است ✨
            </div>
          </div>
        </aside>

        {/* ستون محتوای اصلی */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8fc]">
          {/* نوار هدر بار بالا */}
          <header className="w-full bg-white border-b border-outline-variant/40 sticky top-0 z-30 shadow-sm">
            <div
              className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 flex flex-col gap-3"
              dir="rtl"
            >
              <div className="flex items-center justify-between gap-4">
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
                {/* Header search — wired to /categories?q= */}
                <div className="flex-1 max-w-xl mx-2 hidden md:block">
                  <form action="/categories" method="get">
                    <div className="relative flex items-center w-full bg-surface-container-low border border-outline-variant/50 rounded-full h-11 px-2 hover:border-m3-outline transition-all focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary">
                      <button
                        className="size-8 rounded-full bg-m3-primary text-white flex items-center justify-center shrink-0 shadow-sm hover:bg-m3-primary/90 transition-colors mr-1"
                        type="submit"
                      >
                        <span className="material-symbols-outlined text-base">search</span>
                      </button>
                      <input
                        className="w-full bg-transparent border-0 focus:ring-0 text-xs text-on-surface placeholder:text-on-surface-variant/70 text-right pr-3 pl-2 focus:outline-none"
                        name="q"
                        placeholder="جستجو در بین هزاران وسیله..."
                        type="text"
                      />
                    </div>
                  </form>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Link
                      className="relative size-9 rounded-full border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
                      href="#notifications"
                      title="اعلان‌ها"
                    >
                      <span className="material-symbols-outlined text-lg">notifications</span>
                      {unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 size-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
                          {toPersianDigits(unreadCount)}
                        </span>
                      ) : null}
                    </Link>
                    <button
                      className="size-9 rounded-full border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
                      disabled
                      title="علاقه‌مندی‌ها — به‌زودی"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">favorite</span>
                    </button>
                    <Link
                      className="size-9 rounded-full border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
                      href="/live-chat"
                      title="گفتگوها"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </Link>
                  </div>
                  <div className="h-6 w-px bg-outline-variant/40 mx-0.5"></div>
                  {/* Session-aware user chip (guest-state rule) */}
                  {user ? (
                    <UserMenu
                      user={{
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        isHost: user.isHost,
                        isAdmin: user.isAdmin,
                      }}
                    />
                  ) : (
                    <Link
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant/50 hover:bg-surface-container-low transition-colors text-xs font-bold text-m3-primary"
                      href="/signin-otp?next=%2Faccount-settings"
                    >
                      <span className="material-symbols-outlined text-base">person</span>
                      ورود | ثبت‌نام
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                <div className="overflow-x-auto no-scrollbar max-w-full">
                  <nav className="flex items-center gap-4 sm:gap-6 text-xs lg:text-sm font-semibold text-on-surface-variant min-w-max">
                    <Link className="text-m3-primary font-bold border-b-2 border-m3-primary transition-colors" href="/">
                      خانه
                    </Link>
                    <Link className="hover:text-m3-primary transition-colors py-1" href="/categories">
                      دسته‌بندی‌ها
                    </Link>
                    <Link className="hover:text-m3-primary transition-colors py-1" href="/categories">
                      اجاره وسایل
                    </Link>
                    <Link className="hover:text-m3-primary transition-colors py-1" href="/create-listing">
                      ثبت وسیله
                    </Link>
                    <Link className="hover:text-m3-primary transition-colors py-1" href="/how-it-works">
                      چگونه کار می‌کند؟
                    </Link>
                    <Link className="hover:text-m3-primary transition-colors py-1" href="/about">
                      درباره ما
                    </Link>
                  </nav>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-medium shrink-0">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-emerald-700 font-bold">پشتیبانی آنلاین فعال</span>
                </div>
              </div>
            </div>
          </header>

          {/* کانتینر اسکرول‌شونده محتوا */}
          <main className="flex-1 px-4 lg:px-10 py-8 max-w-7xl mx-auto w-full space-y-8">
            {/* عنوان بخش و توضیحات هدینگ اصلی */}
            <div className="bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low rounded-3xl p-6 lg:p-8 border border-surface-container-high shadow-sm relative overflow-hidden">
              <div className="absolute -left-12 -top-12 size-48 bg-m3-primary/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <h2 className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                    تنظیمات حساب کاربری و ترجیحات میزبانی
                  </h2>
                  <p className="text-sm lg:text-base text-on-surface-variant leading-relaxed max-w-3xl">
                    مدیریت اطلاعات فردی، ترجیحات رزرو، شیوه دریافت و تسویه، امنیت
                    و اعلان‌های هوشمند جهت اجاره مطمئن تجهیزات و وسایل در سراسر
                    کشور.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-xs lg:text-sm hover:bg-surface-container-high transition-all flex items-center gap-1.5 border border-outline-variant/40"
                    disabled
                    title="به‌زودی"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    <span className="">مشاهده پروفایل عمومی من</span>
                  </button>
                </div>
              </div>
              {/* تب‌های ناوبری داخلی صفحه تنظیمات */}
              <div className="mt-8 border-t border-surface-container-high pt-3 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  <a
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-m3-primary text-white text-xs lg:text-sm font-bold shadow-sm shadow-m3-primary/20"
                    href="#profile"
                  >
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      badge
                    </span>
                    <span className="">اطلاعات پروفایل و هویت</span>
                  </a>
                  <a
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs lg:text-sm font-semibold transition-all"
                    href="#preferences"
                  >
                    <span className="material-symbols-outlined text-base">event_available</span>
                    <span className="">ترجیحات میزبانی و قوانین</span>
                  </a>
                  <a
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs lg:text-sm font-semibold transition-all"
                    href="#payout"
                  >
                    <span className="material-symbols-outlined text-base">account_balance</span>
                    <span className="">حساب‌های بانکی و تسویه</span>
                  </a>
                  <a
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs lg:text-sm font-semibold transition-all"
                    href="#security"
                  >
                    <span className="material-symbols-outlined text-base">shield_person</span>
                    <span className="">امنیت و نشست‌ها</span>
                  </a>
                  <a
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs lg:text-sm font-semibold transition-all"
                    href="#notifications"
                  >
                    <span className="material-symbols-outlined text-base">notifications_active</span>
                    <span className="">اعلان‌ها و پیامک‌ها</span>
                  </a>
                </div>
              </div>
            </div>

            {/* All interactive sections (client) */}
            <SettingsBody
              completedRentals={completedRentals}
              joinedFaDate={faDate(me.createdAt)}
              user={{
                name: me.name,
                phone: me.phone,
                email: me.email,
                avatarUrl: me.avatarUrl,
                bio: me.bio,
                city: me.city,
                kycStatus: me.kycStatus,
                isHost: me.isHost,
              }}
            >
              {/* Notifications live list (GET/POST /api/notifications) */}
              <NotificationsPanel />
            </SettingsBody>

            {/* فوتر پنل */}
            <footer className="mt-12 py-6 px-4 sm:px-10 border-t border-surface-container text-center text-xs text-on-surface-variant flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="">
                تمامی حقوق مادی و معنوی متعلق به پلتفرم اجاره وسایل اورا (Overa
                Host) است © ۱۴۰۳
              </span>
              <div className="flex items-center gap-4 text-xs text-m3-secondary font-medium">
                <Link className="hover:underline" href="/how-it-works">
                  راهنمای میزبانان برتر
                </Link>
                <Link className="hover:underline" href="/tos-support-faq">
                  شرایط بیمه کالاها
                </Link>
                <Link className="hover:underline" href="/tos-support-faq">
                  سیاست حریم خصوصی
                </Link>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
