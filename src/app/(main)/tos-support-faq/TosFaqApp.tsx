"use client";

import { useState } from "react";
import Link from "next/link";
import { Toaster, toast } from "sonner";

const NAV_ITEMS = [
  {
    id: "item-1",
    icon: "account_balance_wallet",
    label: "ودیعه و مسائل مالی",
    count: "۴",
    iconCls: "text-m3-primary",
    countCls: "bg-m3-primary/10 text-m3-primary font-bold",
  },
  {
    id: "item-2",
    icon: "verified_user",
    label: "گارانتی، سلامت کالا و حوادث",
    count: "۵",
    iconCls: "text-m3-outline",
    countCls: "bg-surface-variant text-m3-tertiary",
  },
  {
    id: "item-3",
    icon: "event_busy",
    label: "لغو رزرو و استرداد وجه",
    count: "۳",
    iconCls: "text-m3-outline",
    countCls: "bg-surface-variant text-m3-tertiary",
  },
  {
    id: "item-4",
    icon: "swap_horiz",
    label: "فرآیند تحویل و تست کالا",
    count: "۶",
    iconCls: "text-m3-outline",
    countCls: "bg-surface-variant text-m3-tertiary",
  },
  {
    id: "item-5",
    icon: "badge",
    label: "احراز هویت و امنیت حساب",
    count: "۳",
    iconCls: "text-m3-outline",
    countCls: "bg-surface-variant text-m3-tertiary",
  },
  {
    id: "item-6",
    icon: "inventory_2",
    label: "ثبت آگهی و درآمدزایی مالکان",
    count: "۴",
    iconCls: "text-m3-outline",
    countCls: "bg-surface-variant text-m3-tertiary",
  },
];

const SECTION_TABS = [
  { key: "faq", label: "پرسش‌های متداول (FAQ)", target: "faq-section" },
  {
    key: "terms",
    label: "قوانین و شرایط استفاده (Terms)",
    target: "legal-clauses",
  },
  {
    key: "privacy",
    label: "حریم خصوصی و امنیت داده‌ها",
    target: "legal-clauses",
  },
  {
    key: "dispute",
    label: "پروتکل حل اختلاف و پشتیبانی",
    target: "support-banner",
  },
];

function ItemShell({
  id,
  num,
  question,
  open,
  onToggle,
  children,
}: {
  id: string;
  num: string;
  question: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={open}
      onToggle={(e) => onToggle((e.target as HTMLDetailsElement).open)}
      className="group bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden transition-all duration-200 open:border-m3-primary/50 open:shadow-sm scroll-mt-28"
    >
      <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-surface-container-lowest group-open:bg-surface-container-low/40">
        <div className="flex items-center gap-3.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container text-m3-primary font-bold text-sm shrink-0">
            {num}
          </span>
          <span className="font-bold text-on-surface text-base group-hover:text-m3-primary transition-colors">
            {question}
          </span>
        </div>
        <span className="material-symbols-outlined text-m3-outline transition-transform duration-300 group-open:-rotate-180 group-open:text-m3-primary shrink-0 mr-3">
          expand_more
        </span>
      </summary>
      <div className="p-5 pt-2 text-sm leading-relaxed text-on-surface-variant border-t border-surface-container flex flex-col gap-3.5">
        {children}
      </div>
    </details>
  );
}

export default function TosFaqApp() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(["item-1", "item-3"]),
  );

  const q = query.trim().toLowerCase();
  const matches = (text: string) => !q || text.toLowerCase().includes(q);

  function toggle(id: string, open: boolean) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function gotoSection(key: string, target: string) {
    setActiveTab(key);
    document
      .getElementById(target)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const faqData = [
    {
      id: "item-1",
      num: "۰۱",
      question:
        "فرآیند بلوکه شدن و زمان آزادسازی ودیعه امانی (Deposit) چگونه است؟",
      search: "ودیعه امانی بلوکه شاپرک بازپرداخت پایا ساتنا شبا آزادسازی",
      body: (
        <>
          <p>
            ودیعه امانی به عنوان پشتوانه حفظ سلامت کالا، در هنگام نهایی‌سازی
            سفارش در درگاه امن شاپرک اٌوِرا به صورت امانی مسدود می‌گردد. این
            مبلغ تا انتهای دوره اجاره نزد پلتفرم باقی می‌ماند و در دسترس هیچ‌یک
            از طرفین نیست.
          </p>
          <div className="bg-surface-container-high/60 border border-secondary-container/50 rounded-xl p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-m3-primary text-xl shrink-0 mt-0.5">
              schedule
            </span>
            <div className="text-xs leading-5">
              <strong className="text-m3-primary font-bold block mb-0.5">
                مدت‌زمان بازپرداخت به حساب مستاجر:
              </strong>
              پس از تحویل دادن کالا به مالک و فشردن کلید «تایید سلامت فیزیکی و
              پایان اجاره» توسط مالک در اپلیکیشن یا وب‌سایت، مبلغ ودیعه فوراً از
              حالت مسدودی خارج شده و از طریق پایا/ساتنا حداکثر ظرف{" "}
              <strong>۲ الی ۶ ساعت کاری</strong> (تابع سیکل بانکی) مستقیماً به
              شبای مستاجر واریز خواهد شد.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-m3-outline">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>
              در صورت اعلام مغایرت یا آسیب‌دیدگی توسط مالک، ودیعه تا زمان بررسی
              کارشناس حقوقی اٌوِرا مسدود می‌ماند.
            </span>
          </div>
        </>
      ),
    },
    {
      id: "item-2",
      num: "۰۲",
      question:
        "سلامت کالا و جبران خسارت‌های احتمالی حین اجاره چگونه تضمین می‌شود؟",
      search: "گارانتی سلامت کالا خسارت ودیعه داوری بازرسی",
      body: (
        <>
          <p>
            کلیه کالاهایی که با برچسب{" "}
            <strong>«تضمین سلامت کالا»</strong> ثبت می‌شوند، در ابتدای اجاره
            به‌صورت مشترک بازرسی و صورت‌جلسه سلامت کالا ثبت می‌شود؛ در صورت
            بروز خسارت، جبران آن طبق پروتکل اعلام خسارت و داوری اٌوِرا از محل
            ودیعهٔ مسدودشده انجام می‌گیرد.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-2">
              <span className="material-symbols-outlined text-m3-secondary text-base shrink-0 mt-0.5">
                check_circle
              </span>
              <span>
                <strong>موارد تحت پوشش:</strong> سوختگی برد الکترونیکی ناشی از
                نوسان، آسیب‌های فیزیکی غیرعمدی، سرقت به عنف (با گزارش کلانتری و
                مستندات قضایی).
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-2">
              <span className="material-symbols-outlined text-m3-error text-base shrink-0 mt-0.5">
                cancel
              </span>
              <span>
                <strong>استثنائات:</strong> سقوط عمدی، آب‌خوردگی خارج از مشخصات
                ضدآب دستگاه، استفاده از وسیله برای مقاصد غیرمجاز و فرانشیز ۱۵٪
                در خسارت‌های جزئی.
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "item-3",
      num: "۰۳",
      question: "قوانین و جدول جریمه لغو رزرو از سوی طرفین (مستاجر یا مالک)",
      search: "لغو رزرو کنسلی استرداد وجه جریمه غرامت ۴۸ ساعت ۲۴ ساعت",
      body: (
        <>
          <p>
            به منظور جلوگیری از اتلاف زمان و برنامه‌ریزی کاری مالکان و
            اجاره‌کنندگان، سیاست کنسلی طبق جدول زمان‌بندی شفاف زیر اعمال
            می‌گردد:
          </p>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-surface-container text-on-surface font-bold">
                <tr>
                  <th className="p-3 border-b border-outline-variant/30">
                    زمان اعلام لغو توسط مستاجر
                  </th>
                  <th className="p-3 border-b border-outline-variant/30">
                    میزان استرداد هزینه اجاره
                  </th>
                  <th className="p-3 border-b border-outline-variant/30">
                    وضعیت ودیعه امانی
                  </th>
                  <th className="p-3 border-b border-outline-variant/30">
                    اقدام پلتفرم
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest">
                <tr>
                  <td className="p-3 font-semibold text-m3-primary">
                    بیش از ۴۸ ساعت مانده به تحویل
                  </td>
                  <td className="p-3 text-m3-secondary font-bold">
                    ۱۰۰٪ عودت بدون کسر کارمزد
                  </td>
                  <td className="p-3 text-on-surface">آزادسازی آنی</td>
                  <td className="p-3 text-m3-outline">بدون نمره منفی</td>
                </tr>
                <tr className="bg-surface-container-low/30">
                  <td className="p-3 font-semibold">
                    بین ۲۴ الی ۴۸ ساعت مانده به تحویل
                  </td>
                  <td className="p-3">
                    ۸۰٪ عودت (۲۰٪ پرداخت به مالک به عنوان غرامت رزرو)
                  </td>
                  <td className="p-3 text-on-surface">آزادسازی کامل</td>
                  <td className="p-3 text-m3-outline">ثبت در سوابق کاربری</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-m3-error">
                    کمتر از ۲۴ ساعت مانده به تحویل
                  </td>
                  <td className="p-3 text-m3-error font-bold">
                    ۵۰٪ عودت (۵۰٪ پرداخت به مالک)
                  </td>
                  <td className="p-3 text-on-surface">آزادسازی کامل</td>
                  <td className="p-3 text-m3-outline">هشدار رفتاری</td>
                </tr>
                <tr className="bg-m3-error-container/20">
                  <td className="p-3 font-semibold text-m3-error">
                    لغو غیرموجه توسط «مالک کالا»
                  </td>
                  <td className="p-3 font-bold text-on-surface">
                    ۱۰۰٪ عودت به مستاجر + ۲۰٪ کد تخفیف جبرانی
                  </td>
                  <td className="p-3 text-on-surface">-</td>
                  <td className="p-3 text-m3-error">
                    کسر امتیاز مالک و جریمه نقدی
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "item-4",
      num: "۰۴",
      question:
        "در صورت آسیب‌دیدگی وسیله در زمان بازگشت، رسیدگی کارشناسی چگونه است؟",
      search: "آسیب دیدگی بازگشت کارشناس تست عکس ۳۶۰ درجه جبران خسارت",
      body: (
        <>
          <p>
            در لحظه تحویل اولیه، فرم هوشمند تست و عکس‌برداری ۳۶۰ درجه در
            اپلیکیشن تکمیل می‌گردد که مستند اصلی وضعیت فنی کالا است. چنانچه حین
            بازگشت ایراد ظاهری یا عملکردی جدیدی مشاهده گردد:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-on-surface-variant pr-2">
            <li>
              مالک ظرف مدت ۲ ساعت در اپلیکیشن دکمه «گزارش آسیب‌دیدگی» را انتخاب
              نموده و عکس‌های نقص را بارگذاری می‌کند.
            </li>
            <li>
              کارشناس فنی حوزه تخصصی اٌوِرا ظرف حداکثر ۱۲ ساعت کاری مستندات
              تحویل و بازگشت را مقایسه می‌کند.
            </li>
            <li>
              در صورت تایید قصور مستاجر، هزینه تعمیرات یا افت قیمت کارشناسی از
              محل ودیعه کسر شده و مابقی آزاد می‌شود. در صورت هزینه‌های بالاتر،
              پرونده به کارشناسان داوری اٌوِرا ارجاع داده خواهد شد.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "item-5",
      num: "۰۵",
      question:
        "مدارک هویتی و اعتبارسنجی مورد نیاز برای اجاره تجهیزات گران‌قیمت چیست؟",
      search: "احراز هویت مدارک لایونس شبا ودیعه کدملی اعتبارسنجی",
      body: (
        <p>
          برای کالاهای رده Pro (دوربین‌های سینمایی، لنزهای پرچمدار، کوادکوپترها
          و لپ‌تاپ‌های تخصصی) علاوه بر احراز هویت پیامکی، تایید تصویری زنده
          (Liveness Detection) و تطبیق کدملی با شماره شبا الزامی است. در تجهیزات
          بسیار حساس، ودیعه امانی (Escrow) با مبلغ بیشتر بلوکه می‌شود که پس از
          بازگشت سالم کالا به‌صورت خودکار آزاد می‌گردد.
        </p>
      ),
    },
    {
      id: "item-6",
      num: "۰۶",
      question:
        "آیا شماره تماس کاربران مستقیماً در چت به اشتراک گذاشته می‌شود؟",
      search: "شماره تماس چت حریم خصوصی مخفی امنیت",
      body: (
        <p>
          <strong>خیر.</strong> جهت حفاظت از حریم شخصی و امنیت دادوستد،
          شماره‌های تماس تا زمان تایید نهایی سفارش و پرداخت ودیعه مخفی خواهند
          ماند. کلیه هماهنگی‌های اولیه از طریق چت اختصاصی اٌوِرا صورت می‌گیرد و
          تبادل هرگونه شماره تماس خارج از بستر پلتفرم قبل از ثبت رزرو، مطابق
          قوانین مندرج در بند ۶ تخلف از مقررات پلتفرم محسوب می‌شود.
        </p>
      ),
    },
  ];

  const LEGAL_CARDS = [
    {
      clause: "ماده ۱",
      icon: "fact_check",
      title: "اصالت و تطابق فنی وسیله",
      text: "مالک موظف است کالا را دقیقاً مطابق با مشخصات فنی، خط‌وخش‌ها، باتری سالم و سلامت اعلام‌شده در پروفایل آگهی تحویل دهد. در صورت عدم تطابق، مستاجر حق فسخ آنی با عودت ۱۰۰٪ وجه را دارد.",
      ref: "بند ۱-۲ شرایط عمومی",
    },
    {
      clause: "ماده ۲",
      icon: "handshake",
      title: "امانت‌داری و استفاده متعارف",
      text: "مستاجر امین کالا شناخته می‌شود و مکلف است در نگهداری دستگاه کمال عرفی را رعایت کند. هرگونه اجاره دادن مجدد، باز کردن قطعات یا تغییرات سخت‌افزاری پیگرد حقوقی دارد.",
      ref: "بند ۲-۴ شرایط امانی",
    },
    {
      clause: "ماده ۳",
      icon: "history_edu",
      title: "قرارداد الکترونیک لازم‌الاجرا",
      text: "توافقات حاصل در بستر اٌوِرا طبق قانون تجارت الکترونیک جمهوری اسلامی ایران سند معتبر رسمی تلقی شده و در تمامی مراجع قضایی و انتظامی دارای وجاهت قانونی است.",
      ref: "ماده ۱۰ قانون مدنی",
    },
    {
      clause: "ماده ۴",
      icon: "block",
      title: "ممنوعیت انتقال به شخص ثالث",
      text: "تنها شخصی که احراز هویت او در سامانه تایید گردیده مجاز به تحویل‌گیری و کاربری کالا است؛ تحویل کالا به اشخاص ثالث بدون هماهنگی، تخلف از قوانین پلتفرم محسوب می‌شود.",
      ref: "بند ۴-۱ مسئولیت انحصاری",
    },
  ];

  const visibleItems = faqData.filter((f) =>
    matches(`${f.question} ${f.search}`),
  );

  return (
    <>
      <Toaster position="bottom-left" dir="rtl" />
      {/* Page heading */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex w-full sm:min-w-72 flex-col gap-3">
          <p className="text-[#130e1b] text-4xl font-black leading-tight tracking-[-0.033em]">
            مرکز شفافیت، قوانین و سوالات متداول اٌوِرا
          </p>
          <p className="text-[#694d99] text-base font-normal leading-normal">
            همه چیز درباره حقوق کاربران، ضمانت سلامت وسایل، ودیعه امانی و
            پاسخ به پرسش‌های شما
          </p>
        </div>
      </div>

      {/* Search (filters the FAQ live) */}
      <div className="px-4 py-3">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#130e1b] focus:outline-0 focus:ring-0 border-none bg-[#ece7f3] focus:border-none h-full placeholder:text-[#694d99] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              placeholder="جستجو در قوانین، ودیعه امانی، لغو رزرو یا جبران خسارت..."
            />
            <div className="text-[#694d99] flex border-none bg-[#ece7f3] items-center justify-center pl-4 rounded-l-lg border-r-0">
              <button type="button" aria-label="جستجو">
                <svg
                  fill="currentColor"
                  height="24px"
                  viewBox="0 0 256 256"
                  width="24px"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </button>
            </div>
          </div>
        </label>
      </div>

      {/* Hashtag chips */}
      <div className="flex gap-3 p-3 overflow-x-auto no-scrollbar">
        {[
          "#ودیعه_امانی",
          "#شرایط_لغو_رزرو",
          "#نحوه_تحویل_و_تست",
          "#احراز_هویت_هوشمند",
        ].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setQuery(tag.replace("#", "").replace(/_/g, " "))}
            className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#ece7f3] pl-4 pr-4 hover:bg-surface-variant transition-colors"
          >
            <p className="text-[#130e1b] text-sm font-medium leading-normal">
              {tag}
            </p>
          </button>
        ))}
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-m3-primary/10 text-m3-primary pl-4 pr-4"
          >
            <p className="text-sm font-bold">حذف جستجو ✕</p>
          </button>
        ) : null}
      </div>

      {/* Section tabs (anchors to page sections) */}
      <div className="pb-3">
        <div className="flex border-b border-[#d8d0e7] px-4 gap-8 overflow-x-auto no-scrollbar">
          {SECTION_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => gotoSection(t.key, t.target)}
              className={`flex flex-col items-center justify-center border-b-[3px] gap-1 pb-[7px] pt-2.5 shrink-0 ${
                activeTab === t.key
                  ? "border-b-[#7b3aed] text-[#130e1b]"
                  : "border-b-transparent text-[#694d99]"
              }`}
            >
              <p
                className={`text-sm font-bold leading-normal tracking-[0.015em] ${activeTab === t.key ? "text-[#130e1b]" : "text-[#694d99]"}`}
              >
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main body */}
      <main className="w-full py-8 flex flex-col gap-12">
        {/* FAQ: sidebar + accordion */}
        <section
          id="faq-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24"
        >
          <aside className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-container">
              <span className="material-symbols-outlined text-m3-primary text-xl">
                tune
              </span>
              <h3 className="text-on-surface font-bold text-base">
                دسته‌بندی پرسش‌ها
              </h3>
            </div>
            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(n.id);
                    setOpenIds((prev) => new Set(prev).add(n.id));
                    document
                      .getElementById(n.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl font-semibold text-sm transition-all duration-200 text-right ${
                    activeNav === n.id
                      ? "bg-surface-container text-m3-primary"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-lg ${activeNav === n.id ? "text-m3-primary" : n.iconCls}`}
                    >
                      {n.icon}
                    </span>
                    <span>{n.label}</span>
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${activeNav === n.id ? n.countCls : n.countCls}`}
                  >
                    {n.count}
                  </span>
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-5 border-t border-surface-container flex flex-col gap-3 bg-surface-container-low/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-m3-primary font-semibold">
                <span className="material-symbols-outlined text-base">
                  verified
                </span>
                <span>ضمانت بازگشت ودیعه تا حداکثر ۲۴ ساعت</span>
              </div>
              <p className="text-xs text-m3-outline leading-relaxed">
                تمام مبادلات مالی در حساب امانی شاپرکی پلتفرم اٌوِرا نگهداری شده
                و تا تایید دوطرفه سلامت تجهیزات، به مالک تسویه نخواهد شد.
              </p>
            </div>
          </aside>

          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-m3-primary inline-block"></span>
                <h2 className="text-lg font-bold text-on-surface">
                  پرسش‌های پرتکرار کاربران و قوانین مرتبط
                </h2>
              </div>
              <span className="text-xs text-m3-outline">
                بروزرسانی رسمی: فروردین ۱۴۰۵
              </span>
            </div>

            {visibleItems.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                <span className="w-14 h-14 rounded-2xl bg-surface-container text-m3-outline flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">
                    search_off
                  </span>
                </span>
                <p className="text-base font-bold text-on-surface">
                  موردی یافت نشد
                </p>
                <p className="text-xs text-on-surface-variant">
                  عبارت دیگری را جستجو کنید.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-1 px-5 py-2 rounded-full bg-m3-primary text-on-primary text-xs font-bold"
                >
                  حذف جستجو
                </button>
              </div>
            ) : (
              visibleItems.map((f) => (
                <ItemShell
                  key={f.id}
                  id={f.id}
                  num={f.num}
                  question={f.question}
                  open={openIds.has(f.id) || q !== ""}
                  onToggle={(open) => toggle(f.id, open)}
                >
                  {f.body}
                </ItemShell>
              ))
            )}
          </div>
        </section>

        {/* Legal clauses */}
        <section
          id="legal-clauses"
          className="flex flex-col gap-6 pt-6 border-t border-outline-variant/30 scroll-mt-24"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-m3-primary font-bold text-xs mb-1.5">
                <span className="material-symbols-outlined text-base">
                  gavel
                </span>
                <span>چهارچوب رسمی و تعهدات قراردادی</span>
              </div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">
                خلاصه مواد کلیدی منشور حقوقی پلتفرم اٌوِرا
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEGAL_CARDS.map((c) => (
              <div
                key={c.clause}
                className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-surface-container text-m3-primary flex items-center justify-center font-bold text-xs">
                      {c.clause}
                    </span>
                    <span className="material-symbols-outlined text-m3-tertiary text-xl">
                      {c.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-on-surface text-sm mb-2">
                    {c.title}
                  </h4>
                  <p className="text-xs text-m3-outline leading-relaxed">
                    {c.text}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-container-low text-[11px] text-m3-primary font-semibold flex items-center gap-1">
                  <span>{c.ref}</span>
                  <span className="material-symbols-outlined text-xs">
                    arrow_left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Support banner */}
        <section
          id="support-banner"
          className="bg-gradient-to-l from-surface-container-highest via-surface-container to-surface-container-low border border-outline-variant/40 rounded-3xl p-6 md:p-8 relative overflow-hidden scroll-mt-24"
        >
          <div className="max-w-2xl relative z-10 flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 bg-m3-primary/10 text-m3-primary px-3 py-1 rounded-full text-xs font-bold w-fit">
              <span className="material-symbols-outlined text-sm">
                support_agent
              </span>
              <span>مرکز داوری و حل اختلاف پلتفرم اٌوِرا</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-on-surface">
              پاسخ سوال خود را نیافتید یا در معامله جاری نیاز به داوری دارید؟
            </h3>
            <p className="text-xs md:text-sm text-m3-outline leading-relaxed">
              تیم حقوقی و کارشناسان فنی اٌوِرا در کنار
              شما هستند تا هرگونه ابهام درباره تسویه حساب، پیگیری وضعیت سلامت
              تجهیزات، یا حل اختلافات ملکی را بررسی نمایند.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "گفتگوی آنلاین پس از ورود به حساب کاربری در دسترس است.",
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-m3-primary text-on-primary font-bold text-xs flex items-center gap-2 hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">
                  chat
                </span>
                <span>گفتگوی آنلاین با پشتیبانی</span>
              </button>
              <Link
                href="/account-settings"
                className="px-5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-xs flex items-center gap-2 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  balance
                </span>
                <span>پیگیری درخواست‌های حقوقی</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs font-bold text-m3-primary mr-auto">
                <span className="material-symbols-outlined text-base">
                  phone_in_talk
                </span>
                <span dir="ltr">۰۲۱ - ۹۱۰۰ ۰۴۱۴</span>
              </div>
            </div>
          </div>
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-m3-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-lowest py-8 text-center text-xs text-m3-outline">
        <div className="max-w-[960px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-3.5 bg-m3-primary rounded-full"></div>
            <span className="font-bold text-on-surface">
              پلتفرم به اشتراک‌گذاری و اجاره تجهیزات اٌوِرا (Overa)
            </span>
            <span>- کلیه حقوق محفوظ است © ۱۴۰۵</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              قوانین و مقررات
            </Link>
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/tos-support-faq"
            >
              حریم خصوصی
            </Link>
            <button
              type="button"
              disabled
              title="به‌زودی"
              className="cursor-not-allowed"
            >
              سامانه نماد اعتماد الکترونیکی
            </button>
            <Link
              className="hover:text-m3-primary transition-colors"
              href="/about"
            >
              درباره ما
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
