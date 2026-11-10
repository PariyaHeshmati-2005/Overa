import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "نقشه راهنمای ارائه — تمام صفحات پروژه" };
export const dynamic = "force-dynamic";

type Card = { href: string; title: string; route: string; desc: string };

export default async function PagesIndex() {
  // dynamic targets: one real listing and one real reservation (for detail routes)
  const [listing, reservation] = await Promise.all([
    db.listing.findFirst({ where: { status: "ACTIVE" }, select: { id: true }, orderBy: { createdAt: "desc" } }),
    db.reservation.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const itemHref = listing ? `/item-details/${listing.id}` : "/categories";
  const lifecycleHref = reservation ? `/rental-lifecycle/${reservation.id}` : "/rentals";

  const section1: Card[] = [
    { href: "/", title: "خانه", route: "(/)", desc: "صفحه اصلی؛ هیرو، دسته‌بندی‌ها، فیلترها و کارت وسایل — کارت‌ها به صفحه جزئیات وصل‌اند." },
    { href: "/categories", title: "دسته‌بندی‌ها و کاوش", route: "(/categories)", desc: "تب‌های دسته‌بندی با فیلتر و جستجوی واقعی متصل به دیتابیس و /api/listings." },
    { href: itemHref, title: "جزئیات وسیله و رزرو", route: "(/item-details/[id])", desc: "گالری، مشخصات، نظرات و کارت رزرو؛ «ثبت درخواست اجاره» وارد جریان اجاره می‌شود." },
    { href: "/how-it-works", title: "چگونه کار می‌کند؟", route: "(/how-it-works)", desc: "راهنمای گام‌به‌گام برای مستأجر و میزبان + سوالات متداول." },
    { href: "/about", title: "درباره ما", route: "(/about)", desc: "معرفی پلتفرم، آمار، تیم و اعتمادسازی." },
    { href: "/tos-support-faq", title: "قوانین، پشتیبانی و FAQ", route: "(/tos-support-faq)", desc: "مرکز قوانین و شفافیت؛ تب‌های FAQ، قوانین، حریم خصوصی و پروتکل حل اختلاف." },
  ];

  const section2: Card[] = [
    { href: "/signin", title: "ورود با رمز عبور", route: "(/signin)", desc: "تبادل با OTP و ثبت‌نام فعال است." },
    { href: "/signin-otp", title: "ورود با کد OTP", route: "(/signin-otp)", desc: "تایید دو مرحله‌ای با شماره موبایل (در حالت توسعه کد نمایش داده می‌شود)." },
    { href: "/signup", title: "ثبت‌نام", route: "(/signup)", desc: "ایجاد حساب جدید؛ پس از ثبت‌نام به تایید OTP می‌رود." },
    { href: "/live-chat", title: "گفتگو و پیام‌ها", route: "(/live-chat)", desc: "صندوق پیام و مذاکره رزرو؛ پیام‌ها هر ۴ ثانیه همگام می‌شوند." },
    { href: lifecycleHref, title: "چرخه اجاره", route: "(/rental-lifecycle/[id])", desc: "قرارداد ← پرداخت و ودیعه ← تحویل و بازرسی ← پروتکل دوطرفه و عودت." },
    { href: "/rentals", title: "اجاره‌های من", route: "(/rentals)", desc: "مدیریت اجاره‌های فعال، تحویل پیک، صندوق امانی و فاکتورها." },
    { href: "/wallet", title: "کیف پول و ودیعه", route: "(/wallet)", desc: "تراکنش‌ها، صندوق امانی (Escrow) و حساب‌های شبا — با برچسب شبیه‌سازی." },
    { href: "/damage-claims", title: "ثبت مغایرت و خسارت", route: "(/damage-claims)", desc: "فرم ادعای خسارت؛ ثبت نهایی پرونده به پنل داوری منتقل می‌شود." },
    { href: "/arbitration-panel", title: "پنل داوری و ودیعه", route: "(/arbitration-panel)", desc: "بررسی ادله، رأی داوری و تسویه از ودیعه (مدیران)." },
  ];

  const section3: Card[] = [
    { href: "/host-dashboard", title: "داشبورد میزبان", route: "(/host-dashboard)", desc: "نمای کلی درآمد، احراز هویت و ضمانت‌نامه‌ها؛ منوی کناری به سایر صفحات پنل وصل است." },
    { href: "/my-items", title: "وسایل من و پیش‌نویس‌ها", route: "(/my-items)", desc: "مدیریت آگهی‌ها؛ «ثبت وسیله جدید» ویزارد ۴ مرحله‌ای را باز می‌کند." },
    { href: "/create-listing", title: "ثبت وسیله (ویزارد ۴ مرحله)", route: "(/create-listing)", desc: "اطلاعات ← عکس‌ها ← قیمت‌گذاری هوشمند ← پیش‌نمایش و انتشار." },
    { href: "/reviews", title: "نظرات و بازخورد", route: "(/reviews)", desc: "مدیریت نظرات مستاجران و پاسخ میزبان." },
    { href: "/account-settings", title: "تنظیمات حساب", route: "(/account-settings)", desc: "پروفایل، ترجیحات میزبانی، حساب بانکی، امنیت و اعلان‌ها." },
    { href: "/admin-dashboard", title: "داشبورد ادمین (Super-Admin)", route: "(/admin-dashboard)", desc: "مرکز نظارت ۳۶۰ درجه: قراردادها، صف تایید، صندوق ودیعه و پرونده‌های داوری." },
    { href: "/promissory-notes", title: "سفته الکترونیک (راهنمای فرآیند)", route: "(/promissory-notes)", desc: "فرآیند صدور سفته دیجیتال؛ در این نسخه شبیه‌سازی نشده و صرفاً راهنماست." },
    { href: "/promissory-notes/registration", title: "ثبت سفته در خزانه‌داری", route: "(/promissory-notes/registration)", desc: "نمونه خروجی فرآیند ثبت سند در خزانه‌داری کل کشور (نمایشی)." },
  ];

  const section4: Card[] = [
    { href: "/404", title: "صفحه ۴۰۴", route: "(/404)", desc: "جستجوی هوشمند و پیشنهاد دسته‌ها." },
    { href: "/500", title: "خطای سرور ۵۰۰", route: "(/500)", desc: "بازیابی، پشتیبانی اضطراری و وضعیت سرویس." },
    { href: "/loading", title: "بارگذاری", route: "(/loading)", desc: "اسپلش بارگذاری؛ پس از ۳.۵ ثانیه به خانه برمی‌گردد." },
    { href: "/pages", title: "این صفحه (نقشه ارائه)", route: "(/pages)", desc: "فهرست کامل برای مرور سریع در جلسه ارائه." },
    { href: "/", title: "موبایل — خانه", route: "(/)", desc: "نسخه موبایل در همان مسیرها با طراحی واکنش‌گرا (۳۹۰px) ارائه می‌شود." },
    { href: "/categories", title: "موبایل — دسته‌ها و کاوش", route: "(/categories)", desc: "کاوش و فیلتر در موبایل با همان مسیر دسکتاپ." },
    { href: itemHref, title: "موبایل — جزئیات و رزرو", route: "(/item-details/[id])", desc: "رزرو و گفتگو در موبایل با همان مسیر دسکتاپ." },
    { href: "/rentals", title: "موبایل — اجاره‌ها و پروفایل", route: "(/rentals)", desc: "داشبورد اجاره، عودت و کیف پول در موبایل." },
    { href: "/live-chat", title: "موبایل — گفتگو", route: "(/live-chat)", desc: "مذاکره رزرو و پرداخت ودیعه در موبایل." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `.page-card{transition:all .25s ease}.page-card:hover{transform:translateY(-3px);box-shadow:0 16px 36px -4px rgba(76,42,158,.15)}`,
        }}
      />
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-neutral-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white shadow-glow">
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <div>
              <p className="font-extrabold text-lg leading-5">
                اورا <span className="text-primary">Overa</span>
              </p>
              <p className="text-[11px] text-neutral-muted">وسایل بهتر، زندگی سبک‌تر</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-base">presentation</span>
              نسخه ارائه فرانت‌اند — دموی لوکال
            </span>
            <Link href="/" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition">
              مشاهده سایت ←
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Intro */}
        <section className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">نقشه راهنمای ارائه — تمام صفحات پروژه</h1>
          <p className="text-neutral-muted leading-8 max-w-3xl">
            این صفحه فهرست کامل صفحات پلتفرم اجاره آنلاین <b className="text-primary">اورا</b> است و برای مرور
            راحت‌تر ارائه ساخته شده است. سایت به‌صورت <b>فول‌استک با دیتابیس واقعی (حالت دمو)</b> اجرا می‌شود
            (فونت‌ها، تصاویر و کتابخانه‌ها داخل پروژه هستند) و همه صفحات از طریق منو، دکمه‌ها و کارت‌ها به هم
            متصل‌اند. برای شروع، صفحه «خانه» را باز کنید؛ مسیرهای پیشنهادی ارائه در پایین همین صفحه آمده است.
          </p>
        </section>

        {/* Public pages */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-extrabold mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-sm">۱</span>
            صفحات عمومی سایت
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section1.map((c) => (
              <Link key={c.title} href={c.href} className="page-card bg-white rounded-2xl border border-purple-100 shadow-card p-5 block">
                <p className="font-bold mb-1">
                  {c.title} <span className="text-[10px] font-mono text-neutral-muted">{c.route}</span>
                </p>
                <p className="text-xs text-neutral-muted leading-6">{c.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Auth & user flow */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-extrabold mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-sm">۲</span>
            ورود و جریان اجاره (کاربر)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section2.map((c) => (
              <Link key={c.title} href={c.href} className="page-card bg-white rounded-2xl border border-purple-100 shadow-card p-5 block">
                <p className="font-bold mb-1">
                  {c.title} <span className="text-[10px] font-mono text-neutral-muted">{c.route}</span>
                </p>
                <p className="text-xs text-neutral-muted leading-6">{c.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Host & admin */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-extrabold mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-sm">۳</span>
            پنل میزبان و مدیریت پلتفرم
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section3.map((c) => (
              <Link key={c.title} href={c.href} className="page-card bg-white rounded-2xl border border-purple-100 shadow-card p-5 block">
                <p className="font-bold mb-1">
                  {c.title} <span className="text-[10px] font-mono text-neutral-muted">{c.route}</span>
                </p>
                <p className="text-xs text-neutral-muted leading-6">{c.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* System & mobile */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-extrabold mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-sm">۴</span>
            صفحات سیستم و نسخه‌های موبایل (۳۹۰px)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {section4.map((c) => (
              <Link key={c.title} href={c.href} className="page-card bg-white rounded-2xl border border-purple-100 shadow-card p-4 block">
                <p className="font-bold text-sm mb-1">
                  {c.title} <span className="text-[10px] font-mono text-neutral-muted">{c.route}</span>
                </p>
                <p className="text-xs text-neutral-muted leading-6">{c.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Suggested demo path */}
        <section className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-sm">۵</span>
            مسیر پیشنهادی ارائه (۵ دقیقه)
          </h2>
          <div className="bg-white rounded-2xl border border-purple-100 shadow-card p-6">
            <ol className="space-y-3 text-sm leading-7">
              <li>
                <b className="text-primary">۱.</b>{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/">خانه</Link> ← کلیک روی
                یکی از کارت‌های وسیله ←{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href={itemHref}>جزئیات وسیله</Link>
              </li>
              <li>
                <b className="text-primary">۲.</b> در جزئیات، «ثبت درخواست اجاره» ←{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href={lifecycleHref}>قرارداد و ضمانت</Link> ←
                پرداخت ← تحویل ← پروتکل دوطرفه
              </li>
              <li>
                <b className="text-primary">۳.</b>{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/rentals">اجاره‌های من</Link> برای
                دیدن وضعیت رزرو و صندوق امانی، و{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/wallet">کیف پول</Link>
              </li>
              <li>
                <b className="text-primary">۴.</b> از منوی «ثبت وسیله» ←{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/create-listing">ویزارد ثبت وسیله</Link> و{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/host-dashboard">داشبورد میزبان</Link>
              </li>
              <li>
                <b className="text-primary">۵.</b> جریان اعتماد:{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/damage-claims">ثبت خسارت</Link> ←{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/arbitration-panel">پنل داوری</Link> ←{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/admin-dashboard">داشبورد ادمین</Link>
              </li>
              <li>
                <b className="text-primary">۶.</b> نسخه موبایل:{" "}
                <Link className="underline decoration-primary/30 hover:decoration-primary" href="/">خانه موبایل</Link> و بقیه صفحات بخش ۴
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-border bg-white/70">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-neutral-muted">
          اورا (Overa) — ارائه فرانت‌اند | طراحی صفحات با Stitch | اجرای کاملاً لوکال و بدون نیاز به اینترنت
        </div>
      </footer>
    </div>
  );
}
