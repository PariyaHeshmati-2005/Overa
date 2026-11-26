"use client";

import { useState } from "react";
import Link from "next/link";

type GuideRole = "renter" | "owner";

const STEPS: Record<
  GuideRole,
  {
    badge: string;
    heading: string;
    steps: { icon: string; title: string; desc: string; sub: string }[];
  }
> = {
  renter: {
    badge: "مسیر ۴ مرحله‌ای برای مستاجران",
    heading: "سفر اجاره کالا در ۴ گام بسیار ساده",
    steps: [
      {
        icon: "search",
        title: "جستجو و انتخاب وسیله",
        desc: "جستجو بین صدها وسیله متنوع در شهر و محله خود، مقایسه قیمت‌ها، مشاهده تصاویر باکیفیت و خواندن نظرات و امتیاز سایر کاربران.",
        sub: "تنوع بیش از ۳۰ دسته‌بندی مختلف",
      },
      {
        icon: "calendar_month",
        title: "ثبت تاریخ و درخواست رزرو",
        desc: "انتخاب روزهای مورد نظر برای اجاره، مشخص کردن بازه زمانی دقیق و گفتگوی آنلاین و سریع با مالک وسیله جهت هماهنگی ساعت و نحوه تحویل.",
        sub: "پاسخ‌گویی سریع مالکین کمتر از ۱ ساعت",
      },
      {
        icon: "security",
        title: "ودیعه امن و تحویل کالا",
        desc: "پرداخت وجه در درگاه امن بانکی و نگهداری امانی ودیعه نزد اٌوِرا؛ بررسی سلامت ظاهری کالا در هنگام تحویل حضوری یا دریافت با پیک معتمد.",
        sub: "حفظ کامل پول در حساب امن امانی",
      },
      {
        icon: "task_alt",
        title: "استفاده و عودت آسان",
        desc: "استفاده با خیالی آسوده تحت پوشش بیمه کامل وسایل، بازگرداندن کالا در پایان مهلت و آزادسازی فوری و کامل ودیعه به حساب بانکی شما.",
        sub: "بازگشت خودکار ودیعه بدون معطلی",
      },
    ],
  },
  owner: {
    badge: "مسیر ۴ مرحله‌ای برای میزبانان و مالکان",
    heading: "کسب درآمد از وسایل اضافی در ۴ مرحله آسان",
    steps: [
      {
        icon: "add_photo_alternate",
        title: "ثبت رایگان آگهی وسیله",
        desc: "عکاسی واضح از وسیله، ثبت اطلاعات و مشخصات کالا در چند دقیقه و تعیین دلخواه نرخ اجاره روزانه و شرایط تحویل.",
        sub: "ثبت کاملاً رایگان بدون کارمزد اولیه",
      },
      {
        icon: "mark_chat_unread",
        title: "دریافت درخواست و بررسی",
        desc: "مشاهده درخواست متقاضی اجاره، بررسی امتیاز و پروفایل مستاجر، گفتگوی مستقیم در چت داخلی و تایید نهایی درخواست رزرو.",
        sub: "حق انتخاب و تایید نهایی با شماست",
      },
      {
        icon: "verified",
        title: "تحویل وسیله با قرارداد امن",
        desc: "صدور خودکار قرارداد رسمی و استاندارد دیجیتال، هماهنگی زمان تحویل و سپردن کالا به مستاجر احراز هویت شده اٌوِرا.",
        sub: "تحویل مطمئن با قرارداد الکترونیک معتبر",
      },
      {
        icon: "payments",
        title: "دریافت اجاره و کسب درآمد",
        desc: "واریز تضمینی و مستقیم کرایه به حساب شما و بهره‌مندی از پشتیبانی و پوشش کامل بیمه حوادث اٌوِرا در تمام مدت اجاره.",
        sub: "واریز منظم کرایه با پوشش بیمه تا ۵۰ م.ت",
      },
    ],
  },
};

const FAQS = [
  {
    q: "چگونه به صاحب وسیله یا مستاجر اعتماد کنم؟",
    a: "تمامی کاربران پلتفرم اٌوِرا احراز هویت شده‌اند و شماره ملی، تلفن و سوابق آنان در سامانه تایید شده است. علاوه بر این، سیستم ثبت امتیاز و نظرات واقعی کاربران قبلی به شما کمک می‌کند تا با افراد خوش‌نام و معتبر معامله کنید. همچنین برای هر سفارش قرارداد معتبر دیجیتال منعقد می‌گردد.",
  },
  {
    q: "مبلغ ودیعه ضمانت چه زمانی و چگونه به حسابم برمی‌گردد؟",
    a: "مبلغ ودیعه مستقیماً به حساب شخصی صاحب کالا داده نمی‌شود؛ بلکه در حساب امانی اٌوِرا مسدود می‌ماند. به محض اینکه وسیله در پایان مهلت اجاره به صاحبش بازگردانده شده و تایید سلامت آن ثبت گردد، ودیعه بلافاصله و در کمتر از یک ساعت بدون هیچ‌گونه کسر وجهی به شماره شبای شما واریز می‌شود.",
  },
  {
    q: "اگر وسیله حین استفاده آسیب ببیند چه اتفاقی می‌افتد؟",
    a: "تمام کالاهای اجاره داده شده در اٌوِرا تحت پوشش بیمه حوادث تا سقف ۵۰ میلیون تومان هستند. در صورت بروز هرگونه خرابی یا اشکال فنی غیرعمدی، موضوع توسط کارشناس بررسی شده و خسارت وارده از محل پوشش بیمه پرداخت خواهد شد تا هیچ ضرری متوجه مالک یا مستاجر نگردد.",
  },
  {
    q: "آیا امکان تحویل با پیک وجود دارد یا فقط حضوری است؟",
    a: "بله، روش تحویل کاملاً بر اساس توافق طرفین قابل انتخاب است. شما می‌توانید با هماهنگی در چت داخلی سایت، وسیله را به صورت حضوری تحویل بگیرید یا از خدمات پیک اختصاصی و مطمئن جهت جابه‌جایی سریع و ایمن استفاده فرمایید.",
  },
  {
    q: "کارمزد سایت اٌوِرا چقدر است؟",
    a: "ثبت آگهی کالا در اٌوِرا کاملاً رایگان است. پس از انجام موفقیت‌آمیز یک رزرو، تنها درصد اندکی به عنوان کارمزد خدمات پلتفرم، پوشش بیمه کالا و پشتیبانی ۲۴ ساعته از مبلغ نهایی کسر شده و باقی مبلغ مستقیماً به حساب مالک واریز می‌گردد.",
  },
];

const SECURITY_ITEMS = [
  {
    icon: "badge",
    iconCls: "bg-primary-soft text-primary",
    title: "احراز هویت معتبر کاربران",
    desc: "بررسی دقیق مدارک شناسایی، شماره شبا بانکی و تایید هویت تمام افراد؛ هیچ کاربر ناشناسی در اٌوِرا امکان ثبت یا رزرو کالا ندارد.",
  },
  {
    icon: "description",
    iconCls: "bg-primary-soft text-primary",
    title: "قرارداد رسمی دیجیتال",
    desc: "تنظیم خودکار قرارداد شفاف و الزام‌آور برای هر نوبت اجاره با قید تاریخ دقیق، سلامت کالا و تعهدات رسمی طرفین مطابق قوانین کشور.",
  },
  {
    icon: "shield",
    iconCls: "bg-emerald-50 text-accent-emerald",
    title: "بیمه کامل وسایل تا سقف ۵۰ میلیون",
    desc: "پوشش بیمه‌ای معتبر در تمام طول مدت اجاره برای جبران خسارت‌های احتمالی و آسیب‌های ناخواسته بدون ایجاد اختلاف میان کاربران.",
  },
  {
    icon: "account_balance_wallet",
    iconCls: "bg-primary-soft text-primary",
    title: "حساب امانی و پرداخت امن",
    desc: "مبلغ ودیعه و هزینه اجاره تا زمان تحویل کامل وسیله و رضایت دوطرفه نزد حساب واسط امن اٌوِرا نگهداری شده و مسدود می‌ماند.",
  },
  {
    icon: "support_agent",
    iconCls: "bg-primary-soft text-primary",
    title: "پشتیبانی ۲۴ ساعته در ۷ روز هفته",
    desc: "تیم پشتیبانی اختصاصی اٌوِرا همیشه همراه شماست تا به هر پرسش، هماهنگی یا رفع ابهامی در سریع‌ترین زمان پاسخ دهد.",
  },
  {
    icon: "local_shipping",
    iconCls: "bg-primary-soft text-primary",
    title: "امکان تحویل اکسپرس یا حضوری",
    desc: "انتخاب آزادانه نحوه تحویل بین مستاجر و میزبان؛ تحویل حضوری در مکان توافقی یا ارسال سریع با پیک‌های مطمئن اٌوِرا.",
  },
];

export default function HowItWorksContent() {
  const [role, setRole] = useState<GuideRole>("renter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const guide = STEPS[role];

  return (
    <main
      className="w-full flex flex-col gap-8"
      data-purpose="how-it-works-container"
    >
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="مسیر صفحه"
        className="flex items-center gap-2 text-neutral-muted text-xs font-medium"
      >
        <Link
          className="hover:text-primary transition-colors flex items-center gap-1"
          href="/"
        >
          <span className="material-symbols-outlined text-base">home</span>
          <span>خانه</span>
        </Link>
        <span className="text-purple-300 font-bold">/</span>
        <span className="text-primary font-bold">
          راهنمای استفاده و چگونه کار می‌کند
        </span>
      </nav>

      {/* 1. Header Hero Section */}
      <section
        className="relative overflow-hidden rounded-3xl bg-white border border-purple-100 p-8 md:p-12 shadow-card"
        data-purpose="guide-header-hero"
      >
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary-soft/50 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-purple-100/60 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-bold mb-4 border border-purple-200">
            <span className="material-symbols-outlined text-sm">lightbulb</span>
            <span>راهنمای جامع پلتفرم اٌوِرا (Overa)</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-neutral-text tracking-tight leading-snug mb-4">
            چگونه در اٌوِرا وسایل را اجاره کنیم یا کسب درآمد داشته باشیم؟
          </h1>
          <p className="text-sm md:text-base text-neutral-muted leading-relaxed mb-8 max-w-2xl font-normal">
            راهنمای گام‌به‌گام و سریع برای استفاده از پلتفرم اٌوِرا؛ از پیدا
            کردن وسیله تا تحویل و بازگشت، کاملاً امن و بی‌دردسر.
          </p>
          {/* Dual Audience Toggle Switch */}
          <div
            className="inline-flex items-center p-1.5 bg-neutral-bg border border-purple-100 rounded-2xl shadow-inner gap-1.5 w-full max-w-md"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === "renter"}
              onClick={() => setRole("renter")}
              className={
                role === "renter"
                  ? "flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-md active:scale-95"
                  : "flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 text-neutral-muted hover:text-primary active:scale-95"
              }
            >
              <span className="material-symbols-outlined text-base">
                shopping_bag
              </span>
              <span>راهنمای اجاره‌کنندگان (مستاجران)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "owner"}
              onClick={() => setRole("owner")}
              className={
                role === "owner"
                  ? "flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-md active:scale-95"
                  : "flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 text-neutral-muted hover:text-primary active:scale-95"
              }
            >
              <span className="material-symbols-outlined text-base">
                monetization_on
              </span>
              <span>راهنمای مالکان وسایل (میزبانان)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2 & 3. 4-Step Visual Path Container */}
      <section
        className="flex flex-col gap-6"
        data-purpose="step-by-step-guide"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span>{guide.badge}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-neutral-text">
              {guide.heading}
            </h2>
          </div>
          <span className="text-xs text-neutral-muted bg-white px-3.5 py-1.5 rounded-full border border-purple-100 shadow-sm self-start md:self-auto flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-sm">
              verified_user
            </span>
            <span>تمامی معاملات تحت پوشش ضمانت و امانت‌داری اٌوِرا هستند</span>
          </span>
        </div>

        {/* STEP CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {guide.steps.map((s, i) => (
            <div
              key={`${role}-${i}`}
              className="bg-white p-6 rounded-3xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-md shadow-primary/20">
                    {["۱", "۲", "۳", "۴"][i]}
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">
                      {s.icon}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-neutral-text mb-2.5 group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-neutral-muted leading-relaxed mb-4">
                  {s.desc}
                </p>
              </div>
              <div className="pt-3 border-t border-purple-100/70 flex items-center gap-2 text-[11px] font-medium text-primary">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                <span>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Sandbox notice (mandatory labelling) */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-muted bg-white border border-purple-100 rounded-xl px-4 py-2.5">
          <span className="material-symbols-outlined text-base text-primary">
            science
          </span>
          <span>
            فرآیندهای پرداخت، ودیعه و تسویه در این نسخه نمایشی (Sandbox) هستند —
            هیچ پول واقعی جابه‌جا نمی‌شود.
          </span>
        </div>
      </section>

      {/* 4. Guarantees and Platform Safety Section */}
      <section
        className="bg-white rounded-3xl p-8 md:p-10 border border-purple-100 shadow-card"
        data-purpose="safety-and-trust-section"
      >
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-accent-emerald text-xs font-bold mb-2.5 border border-emerald-100">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>تجربه مطمئن و بی‌دغدغه</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-text mb-2">
            ضمانت‌ها و امنیت معامله در اٌوِرا
          </h2>
          <p className="text-xs md:text-sm text-neutral-muted leading-relaxed">
            تمامی مراحل اجاره کالا با تدابیر دقیق قانونی، مالی و بیمه‌ای محافظت
            شده است تا طرفین با آسودگی خاطر معامله کنند.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECURITY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="bg-neutral-bg p-5 rounded-2xl border border-purple-100/80 flex flex-col gap-3 hover:bg-white hover:shadow-card transition-all"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${item.iconCls} flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {item.icon}
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-text">
                {item.title}
              </h3>
              <p className="text-xs text-neutral-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. User FAQ Accordion Section */}
      <section
        className="max-w-4xl mx-auto w-full my-2"
        data-purpose="customer-faq-section"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-sm">quiz</span>
            <span>پاسخ به سوالات پرتکرار</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-text mb-2">
            پرسش‌های متداول مشتریان و کاربران
          </h2>
          <p className="text-xs md:text-sm text-neutral-muted">
            پاسخ به مهم‌ترین دغدغه‌ها پیرامون امانت‌داری، ودیعه، بیمه و فرآیند
            تحویل.
          </p>
        </div>
        <div className="flex flex-col gap-3.5">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="w-full p-4 md:p-5 text-right flex items-center justify-between gap-4 text-sm md:text-base font-bold text-neutral-text hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>{f.q}</span>
                  </span>
                  <span
                    className={`material-symbols-outlined transition-transform duration-200 text-primary text-xl ${
                      open ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {open ? (
                  <div className="px-5 pb-5 text-xs md:text-sm text-neutral-muted leading-relaxed border-t border-purple-50 pt-3">
                    {f.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Bottom Dual CTA Box */}
      <section
        className="rounded-3xl bg-gradient-to-r from-primary to-primary-dark text-white p-8 md:p-12 text-center relative overflow-hidden shadow-card-hover"
        data-purpose="final-cta-section"
      >
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-primary-light/20 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-3xl">
              handshake
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
            آماده‌اید وسایل مورد نیازتان را اجاره کنید؟
          </h2>
          <p className="text-purple-100 text-xs md:text-sm max-w-md mb-4 leading-relaxed font-normal">
            همین حالا به جمع هزاران کاربر اٌوِرا بپیوندید؛ کالای مورد علاقه‌تان
            را اجاره کنید یا با وسایل بی‌مصرف خانه به درآمدزایی برسید.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <Link
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-primary font-bold text-sm shadow-md hover:bg-purple-50 hover:shadow-lg transition-all text-center"
              href="/categories"
            >
              مشاهده و اجاره وسایل
            </Link>
            <Link
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all text-center"
              href="/create-listing"
            >
              ثبت وسیله و کسب درآمد
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
