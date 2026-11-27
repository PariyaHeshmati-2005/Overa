import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export const metadata = {
  title: "درباره ما",
  description: "داستان شکل‌گیری و مأموریت اٌوِرا — وسایل بهتر، زندگی سبک‌تر",
};

const IMPACT_STATS = [
  {
    icon: "group",
    chip: "جامعه کاربری",
    iconCls: "bg-surface-container text-m3-primary",
    chipCls: "bg-surface-container-high text-m3-secondary",
    blobCls: "bg-primary-fixed opacity-40",
    value: "+۵۰,۰۰۰",
    label: "کاربر فعال و معتمد در سراسر کشور",
  },
  {
    icon: "handshake",
    chip: "معاملات امن",
    iconCls: "bg-surface-container text-m3-secondary",
    chipCls: "bg-surface-container-high text-m3-secondary",
    blobCls: "bg-secondary-fixed opacity-40",
    value: "+۱۲,۰۰۰",
    label: "اجاره موفق با رضایت ۹۸.۴ درصدی",
  },
  {
    icon: "savings",
    chip: "صرفه‌جویی",
    iconCls: "bg-surface-container text-m3-primary",
    chipCls: "bg-surface-container-high text-m3-secondary",
    blobCls: "bg-primary-fixed opacity-40",
    value: "۸۵ میلیارد",
    label: "تومان سرمایه حفظ‌شده با عدم خرید بی‌مورد",
  },
  {
    icon: "eco",
    chip: "اثر سبز",
    iconCls: "bg-surface-container text-m3-secondary",
    chipCls: "bg-surface-container-high text-m3-secondary",
    blobCls: "bg-surface-container-high opacity-50",
    value: "-۱۸ تن",
    label: "کاهش تولید زباله و تقویت چرخه پایداری",
  },
];

const VALUES = [
  {
    icon: "verified",
    iconCls: "bg-primary-fixed text-m3-primary",
    title: "اعتماد و شفافیت حداکثری",
    desc: "تمام میزبانان و تحویل‌گیرندگان از فیلتر احراز هویت چندمرحله‌ای عبور کرده و قرارداد رسمی الکترونیکی برای هر تراکنش صادر می‌شود.",
    sub: "قرارداد دیجیتال معتبر",
  },
  {
    icon: "security",
    iconCls: "bg-secondary-fixed text-m3-secondary",
    title: "حفظ امنیت دارایی و پول",
    desc: "استفاده از سیستم حساب امانی (Escrow)؛ وجه تنها پس از تایید سلامت کالا آزاد می‌شود.",
    sub: "تضمین سلامت تجهیزات",
  },
  {
    icon: "recycling",
    iconCls: "bg-surface-container-high text-m3-primary",
    title: "مسئولیت زیست‌محیطی",
    desc: "هر کالایی که اجاره داده می‌شود، نیاز به تولید یک کالای نو را کاهش می‌دهد. ما متعهد به کاهش پسماند الکترونیکی و حفاظت از زمین هستیم.",
    sub: "پایداری و ردپای کربن کمتر",
  },
  {
    icon: "support_agent",
    iconCls: "bg-tertiary-fixed text-m3-tertiary",
    title: "پشتیبانی صمیمانه و همراه",
    desc: "تیم پشتیبانی متخصص ما در ۷ روز هفته آماده رفع کوچک‌ترین پرسش‌ها، هماهنگی‌های اضطراری تحویل و حل مسائل احتمالی است.",
    sub: "همراهی از ابتدا تا تحویل کالا",
  },
];

const TIMELINE = [
  {
    year: "۱۴۰۵",
    circleCls:
      "bg-primary-container text-white border-4 border-surface-container-lowest ring-4 ring-primary-fixed",
    boxCls: "bg-surface-container-high border border-m3-primary/20",
    titleCls: "font-bold text-base text-m3-primary mb-2",
    title: "ایده و شکل‌گیری اولیه",
    desc: "ایده اٌوِرا در پاسخ به گرانی شدید تجهیزات فیلم‌برداری و کوهنوردی شکل گرفت تا دوستان بتوانند وسایلشان را به اشتراک بگذارند.",
  },
  {
    year: "۱۴۰۶",
    circleCls:
      "bg-surface-container-lowest border-4 border-outline-variant text-m3-tertiary",
    boxCls: "bg-surface-container-low border border-surface-container-highest",
    titleCls: "font-bold text-base text-on-surface mb-2",
    title: "نسخه آزمایشی اولیه",
    desc: "ورود به بازار تهران با ۵۰۰ کاربر اولیه و شروع فعالیت اختصاصی برای تجهیزات عکاسی و لوازم دیجیتال.",
  },
  {
    year: "۱۴۰۷",
    circleCls:
      "bg-surface-container-lowest border-4 border-outline-variant text-m3-tertiary",
    boxCls: "bg-surface-container-low border border-surface-container-highest",
    titleCls: "font-bold text-base text-on-surface mb-2",
    title: "گسترش کلان‌شهرها",
    desc: "رسیدن به ۱۲,۰۰۰ معامله موفق در ۶ کلان‌شهر ایران، راه‌اندازی کیف‌پول هوشمند و سیستم ارزیابی کاربری پیشرفته.",
  },
  {
    year: "۱۴۰۸",
    circleCls:
      "bg-surface-container-lowest border-4 border-outline-variant text-m3-tertiary",
    boxCls: "bg-surface-container-low border border-surface-container-highest",
    titleCls: "font-bold text-base text-on-surface mb-2",
    title: "آینده نزدیک و تحویل اکسپرس",
    desc: "گسترش به سراسر ۳۱ استان، فعال‌سازی ارسال اکسپرس زیر ۲ ساعت در مراکز استانی و قابلیت رزرو سازمانی ابزارها.",
  },
];

const TEAM = [
  {
    name: "مهیار رضایی",
    role: "هم‌بنیان‌گذار و مدیرعامل (CEO)",
    roleCls: "text-m3-primary",
    ringCls:
      "bg-gradient-to-tr from-primary-fixed to-surface-container-high border-2 border-primary-container",
    iconCls: "text-m3-primary",
    icon: "person",
    bio: "فارغ‌التحصیل دانشگاه شریف با ۸ سال سابقه مدیریت استارتاپ‌های لجستیکی و پلتفرم‌های توزیع‌شده.",
  },
  {
    name: "سارا محمدی",
    role: "هم‌بنیان‌گذار و مدیر ارشد محصول (CPO)",
    roleCls: "text-m3-secondary",
    ringCls:
      "bg-gradient-to-tr from-secondary-fixed to-surface-container-high border-2 border-m3-secondary",
    iconCls: "text-m3-secondary",
    icon: "person_3",
    bio: "طراح ارشد سیستم‌های تعاملی و متمرکز بر ساخت ساده‌ترین فرآیند ثبت و اجاره اقلام برای کاربران.",
  },
  {
    name: "آرش دادفر",
    role: "مدیر ارشد فنی و زیرساخت (CTO)",
    roleCls: "text-m3-tertiary",
    ringCls:
      "bg-gradient-to-tr from-surface-container to-surface-container-highest border-2 border-m3-tertiary",
    iconCls: "text-m3-tertiary",
    icon: "code",
    bio: "متخصص امنیت داده و معماری توزیع‌شده، طراح سامانه رمزنگاری قراردادها و احراز هویت هوشمند اٌوِرا.",
  },
  {
    name: "نگار کاظمی",
    role: "مدیر تجربه مشتریان (CX Lead)",
    roleCls: "text-m3-primary",
    ringCls:
      "bg-gradient-to-tr from-primary-fixed-dim to-surface-container-high border-2 border-primary-container",
    iconCls: "text-m3-primary",
    icon: "support_agent",
    bio: "متخصص روابط عمومی با تمرکز بر حل تعارضات بین کاربری و نظارت بر خدمات تضمین سلامت کالا در اٌوِرا.",
  },
];

const CERTS = [
  {
    icon: "verified_user",
    iconCls: "text-m3-secondary",
    title: "نماد اعتماد الکترونیکی",
    sub: "مرکز توسعه تجارت الکترونیک",
  },
  {
    icon: "storefront",
    iconCls: "text-m3-primary",
    title: "اتحادیه کسب‌وکار مجازی",
    sub: "مجوز رسمی کشوری",
  },
  {
    icon: "apartment",
    iconCls: "text-m3-secondary",
    title: "نظام صنفی رایانه‌ای",
    sub: "عضو حقوقی نصر تهران",
  },
  {
    icon: "credit_card",
    iconCls: "text-m3-primary",
    title: "درگاه پرداخت شاپرک",
    sub: "تسویه امانی معتبر بانکی",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Page-local styles ported from the source page */}
      <style>{`
        .font-numeric-stat { font-family: "Plus Jakarta Sans", "Vazirmatn", ui-sans-serif, sans-serif; }
      `}</style>
      <SiteHeader />

      {/* Breadcrumb & Hero Header — preserved from source */}
      <div className="max-w-[1240px] w-full mx-auto px-6 lg:px-12 pt-6 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-on-surface-variant mb-4">
          <Link href="/" className="hover:text-m3-primary transition-colors">
            خانه
          </Link>
          <span className="text-m3-outline">/</span>
          <span className="text-m3-primary font-semibold">درباره ما</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-xs font-medium text-m3-secondary mb-4">
          <span className="material-symbols-outlined text-base text-m3-primary">
            auto_awesome
          </span>
          <span>داستان شکل‌گیری و مأموریت اٌوِرا</span>
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-4">
          وسایل بهتر، زندگی سبک‌تر؛ داستانی از دسترسی به جای مالکیت
        </h1>
        <p className="text-base text-on-surface-variant leading-relaxed max-w-3xl">
          اٌوِرا بازاری امن و هوشمند برای اشتراک‌گذاری و اجاره انواع تجهیزات
          دیجیتال، کمپینگ، ابزارآلات و وسایل خانگی است تا هر فردی بتواند بدون
          پرداخت هزینه‌های گزاف خرید، به بهترین ابزارها دسترسی داشته باشد.
        </p>
      </div>

      {/* MAIN EXPANDED CONTENT */}
      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-16">
        {/* 1. IMPACT STATS SECTION */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {IMPACT_STATS.map((s) => (
            <div
              key={s.chip}
              className="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div
                className={`absolute -top-6 -left-6 w-24 h-24 ${s.blobCls} rounded-full blur-xl group-hover:scale-125 transition-transform`}
              ></div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${s.iconCls} flex items-center justify-center`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {s.icon}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.chipCls}`}
                >
                  {s.chip}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-on-surface mb-1 font-numeric-stat tracking-tight">
                {s.value}
              </div>
              <p className="text-sm text-on-surface-variant font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        {/* 2. MISSION & VISION */}
        <section className="flex flex-col gap-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-on-surface">
              آرمان و چشم‌انداز ما در اٌوِرا
            </h2>
            <p className="text-on-surface-variant text-sm mt-2">
              تعریف مجدد رابطه انسان با کالاها از طریق دسترسی هوشمند به جای تملک
              غیرضروری
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-surface-container-highest rounded-2xl p-8 relative flex flex-col justify-between shadow-sm hover:border-secondary-container transition-all">
              <div>
                <div className="w-14 h-14 rounded-xl bg-m3-primary text-white flex items-center justify-center mb-6 shadow-md shadow-m3-primary/20">
                  <span className="material-symbols-outlined text-3xl">
                    rocket_launch
                  </span>
                </div>
                <span className="text-xs font-bold text-m3-primary tracking-wider uppercase bg-primary-fixed px-3 py-1 rounded-md">
                  مأموریت ما
                </span>
                <h3 className="text-xl font-bold text-on-surface mt-3 mb-3">
                  دسترسی دموکراتیک و بدون مرز به بهترین تجهیزات
                </h3>
                <p className="text-on-surface-variant text-base leading-relaxed">
                  ماموریت اٌوِرا برچیدن موانع مالی برای استفاده از تجهیزات
                  پیشرفته است. ما بر این باوریم که هیچ ایده‌ای، هیچ سفر کمپینگی
                  و هیچ پروژه فیلم‌برداری نباید به خاطر نداشتن ابزار گران‌قیمت
                  متوقف شود. ما با ایجاد بستری امن، دسترسی به کیفیت را برای همه
                  میسر می‌سازیم.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center gap-3 text-m3-secondary text-sm font-semibold">
                <span className="material-symbols-outlined text-xl">
                  check_circle
                </span>
                <span>بیش از ۳۵ دسته‌بندی تجهیزات استاندارد و اصالت‌سنجی‌شده</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-surface-container-highest rounded-2xl p-8 relative flex flex-col justify-between shadow-sm hover:border-secondary-container transition-all">
              <div>
                <div className="w-14 h-14 rounded-xl bg-m3-secondary text-white flex items-center justify-center mb-6 shadow-md shadow-m3-secondary/20">
                  <span className="material-symbols-outlined text-3xl">
                    visibility
                  </span>
                </div>
                <span className="text-xs font-bold text-m3-secondary tracking-wider uppercase bg-secondary-fixed px-3 py-1 rounded-md">
                  چشم‌انداز آینده
                </span>
                <h3 className="text-xl font-bold text-on-surface mt-3 mb-3">
                  پیشرو در اقتصاد چرخشی و اشتراک بدون ریسک خاورمیانه
                </h3>
                <p className="text-on-surface-variant text-base leading-relaxed">
                  تبدیل شدن به بزرگ‌ترین و قابل اعتمادترین اکوسیستم اشتراک‌گذاری
                  در منطقه، به شکلی که برای هر فرد جامعه، اجاره کردن کالا اولین،
                  اقتصادی‌ترین و طبیعی‌ترین انتخاب قبل از اقدام به خرید باشد؛
                  همراه با امنیت حقوقی و مالی ۱۰۰ درصدی.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center gap-3 text-m3-secondary text-sm font-semibold">
                <span className="material-symbols-outlined text-xl">
                  verified_user
                </span>
                <span>استانداردگذاری و پوشش سراسری در تمامی استان‌ها</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CORE VALUES */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-m3-primary px-3 py-1 bg-surface-container-high rounded-full">
                اصول سازمانی
              </span>
              <h2 className="text-2xl font-bold text-on-surface mt-2">
                ارزش‌های بنیادین اٌوِرا
              </h2>
            </div>
            <p className="text-on-surface-variant text-sm max-w-md">
              چهار ستون استواری که تجربه شما از اجاره و میزبانی را در امنیت و
              راحتی تضمین می‌کنند.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-6 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl ${v.iconCls} flex items-center justify-center mb-5`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {v.icon}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-on-surface mb-2">
                    {v.title}
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {v.desc}
                  </p>
                </div>
                <div className="mt-6 text-xs text-m3-secondary font-medium flex items-center gap-1">
                  <span>{v.sub}</span>
                  <span className="material-symbols-outlined text-base">
                    arrow_left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. TIMELINE SECTION */}
        <section className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-m3-secondary px-3 py-1 bg-surface-container rounded-full">
              مسیر افتخار
            </span>
            <h2 className="text-2xl font-bold text-on-surface mt-2">
              داستان رشد و گام‌های اٌوِرا
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              از یک ایده دانشگاهی تا پیشرفته‌ترین پلتفرم کرایه در کشور
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-surface-container -translate-y-1/2 z-0"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {TIMELINE.map((t) => (
                <div
                  key={t.year}
                  className="flex flex-col items-center text-center group"
                >
                  <div
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm shadow-md mb-4 group-hover:scale-110 transition-transform ${t.circleCls}`}
                  >
                    {t.year}
                  </div>
                  <div className={`p-5 rounded-xl w-full ${t.boxCls}`}>
                    <h4 className={t.titleCls}>{t.title}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. LEADERSHIP TEAM */}
        <section className="flex flex-col gap-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold text-m3-primary px-3 py-1 bg-surface-container-high rounded-full">
              سرمایه انسانی
            </span>
            <h2 className="text-2xl font-bold text-on-surface mt-2">
              تیم رهبری و متخصصان اٌوِرا
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              ترکیبی از متخصصان فناوری، محصول و تجربه مشتری با هدف بازتعریف
              اقتصاد اشتراکی
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((m) => (
              <div
                key={m.name}
                className="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-6 text-center flex flex-col items-center hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-24 h-24 rounded-full p-1 mb-4 flex items-center justify-center ${m.ringCls}`}
                >
                  <span
                    className={`material-symbols-outlined text-4xl ${m.iconCls}`}
                  >
                    {m.icon}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-on-surface">{m.name}</h4>
                <span className={`text-xs font-semibold mb-3 ${m.roleCls}`}>
                  {m.role}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  {m.bio}
                </p>
                <div className="mt-auto flex items-center justify-center gap-3 text-m3-outline">
                  <button
                    type="button"
                    disabled
                    title="به‌زودی"
                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs cursor-not-allowed"
                  >
                    in
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CERTIFICATIONS & TRUST BADGES */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-on-surface">
              استانداردها، مجوزها و پشتوانه‌های اعتماد
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              تضمین امنیت سرمایه و حقوق شما تحت نظارت مستقیم مراجع رسمی کشور
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CERTS.map((c, i) => (
              <div
                key={c.title}
                className={`bg-surface-container-lowest p-4 rounded-xl border border-surface-container-highest flex flex-col items-center justify-center text-center gap-2 ${
                  i === 4 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <span
                  className={`material-symbols-outlined text-3xl ${c.iconCls}`}
                >
                  {c.icon}
                </span>
                <span className="text-xs font-bold text-on-surface">
                  {c.title}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {c.sub}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FINAL CALL TO ACTION (CTA) */}
        <section className="relative bg-gradient-to-r from-m3-primary via-primary-container to-m3-secondary rounded-3xl p-8 lg:p-14 text-white overflow-hidden shadow-xl mb-12">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm mb-4">
              <span className="material-symbols-outlined text-sm">stars</span>
              همین امروز به جریان اقتصاد چرخشی بپیوندید
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold mb-4 leading-snug">
              شما هم به جمع جامعه پویا و معتمد اٌوِرا بپیوندید
            </h2>
            <p className="text-white/90 text-base leading-relaxed mb-8">
              چه به دنبال استفاده از یک دوربین حرفه‌ای برای چند روز باشید، چه
              بخواهید وسایل بلااستفاده‌تان برای شما درآمدزایی کند، جای شما در
              اٌوِرا خالی است. با خیالی آسوده شروع کنید.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/categories"
                className="bg-white text-m3-primary hover:bg-surface-container font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
              >
                <span>شروع اجاره وسایل</span>
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
              </Link>
              <Link
                href="/create-listing"
                className="bg-transparent hover:bg-white/10 text-white border border-white/40 font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  monetization_on
                </span>
                <span>کسب درآمد از وسایل خانه</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
