"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import { faNumber, faToman } from "@/lib/format";

export type CategoryTabListing = {
  id: string;
  title: string;
  brand: string | null;
  description: string;
  specs: string | null;
  categorySlug: string;
  categoryName: string;
  dailyPrice: number;
  weeklyPrice: number | null;
  deposit: number;
  city: string;
  area: string | null;
  instantBook: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  ownerName: string;
  imageUrl: string;
};

const TABS = [
  { key: "all", label: "دسته‌بندی‌ها" },
  { key: "camping", label: "کمپینگ و آفرود" },
  { key: "cameras", label: "تجهیزات فیلم‌برداری" },
  { key: "gaming", label: "کنسول و VR" },
  { key: "digital", label: "لپ‌تاپ و دیجیتال" },
  { key: "audio", label: "صوتی و استیج" },
  { key: "tools", label: "ابزار صنعتی" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SORTS = [
  { key: "new", label: "جدیدترین" },
  { key: "popular", label: "محبوب‌ترین" },
  { key: "cheap", label: "ارزان‌ترین" },
  { key: "expensive", label: "گران‌ترین" },
] as const;

const PRICE_CHIPS = [
  { key: "all", label: "همه قیمت‌ها" },
  { key: "lt300", label: "تا ۳۰۰ هزار" },
  { key: "300to800", label: "۳۰۰ تا ۸۰۰ هزار" },
  { key: "gt800", label: "بالای ۸۰۰ هزار" },
] as const;

const CAMERA_RE = /(دوربین|لنز|گیمبال|استابلایزر|GoPro|Ronin)/i;
const GAMING_RE =
  /(کنسول|PS5|ایکس باکس|Xbox|Quest|واقعیت مجازی|فرمان|دسته بازی|VR)/i;
const AUDIO_RE =
  /(اسپیکر|میکروفون|میکسر|دی‌جی|دودساز|رقص نور|صوتی|استیج|پارتی‌باکس|PartyBox)/i;

function matchesTab(item: CategoryTabListing, tab: TabKey): boolean {
  switch (tab) {
    case "all":
      return true;
    case "camping":
      return item.categorySlug === "camping";
    case "tools":
      return item.categorySlug === "tools";
    case "cameras":
      return item.categorySlug === "digital" && CAMERA_RE.test(item.title);
    case "gaming":
      return GAMING_RE.test(item.title);
    case "audio":
      return AUDIO_RE.test(item.title) || AUDIO_RE.test(item.brand ?? "");
    case "digital":
      return (
        item.categorySlug === "digital" &&
        !CAMERA_RE.test(item.title) &&
        !GAMING_RE.test(item.title)
      );
  }
}

function capacityOf(item: CategoryTabListing): number | null {
  const m = item.title.match(/(\d+)\s*نفر/);
  return m ? Number(m[1]) : null;
}

/* ---------------------------------- shared bits ---------------------------------- */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full bg-surface-container-lowest rounded-2xl border border-surface-container-high px-6 py-14 text-center flex flex-col items-center gap-3">
      <span className="w-14 h-14 rounded-2xl bg-surface-container text-m3-outline flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl">search_off</span>
      </span>
      <p className="text-base font-bold text-on-surface">موردی یافت نشد</p>
      <p className="text-xs text-on-surface-variant">
        فیلترها یا عبارت جستجو را تغییر دهید و دوباره تلاش کنید.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 px-5 py-2 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-colors"
      >
        حذف فیلترها
      </button>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high overflow-hidden">
      <div className="h-44 bg-surface-container animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-surface-container animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-surface-container animate-pulse" />
        <div className="h-8 w-full rounded-lg bg-surface-container animate-pulse" />
      </div>
    </div>
  );
}

function Toolbar({
  searchDraft,
  setSearchDraft,
  onSearch,
  sort,
  onSort,
  price,
  onPrice,
  instant,
  onInstant,
  resultCount,
}: {
  searchDraft: string;
  setSearchDraft: (v: string) => void;
  onSearch: () => void;
  sort: string;
  onSort: (v: string) => void;
  price: string;
  onPrice: (v: string) => void;
  instant: boolean;
  onInstant: (v: boolean) => void;
  resultCount: number;
}) {
  return (
    <section className="bg-surface-container-lowest p-3 md:p-4 rounded-2xl border border-surface-container-high shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex items-center flex-1">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder="جستجو در عنوان، برند و توضیحات..."
            className="w-full h-10 pr-10 pl-24 text-xs bg-surface-container-low border border-surface-container-high rounded-full focus:bg-surface-container-lowest focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-all text-on-surface placeholder:text-m3-outline"
            type="text"
          />
          <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-[20px] pointer-events-none">
            search
          </span>
          <button
            type="button"
            onClick={onSearch}
            aria-label="جستجو"
            className="absolute left-1.5 w-8 h-8 rounded-full bg-m3-primary hover:bg-primary-container text-on-primary flex items-center justify-center shadow-sm transition-colors duration-150"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-on-surface-variant whitespace-nowrap">
            {faNumber(resultCount)} کالا
          </span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            aria-label="مرتب‌سازی"
            className="h-10 px-3 text-xs font-semibold bg-surface-container-low border border-surface-container-high rounded-full text-on-surface focus:border-m3-primary focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {PRICE_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onPrice(c.key)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
              price === c.key
                ? "bg-m3-primary text-on-primary shadow-sm"
                : "bg-surface-container text-on-surface hover:bg-surface-variant"
            }`}
          >
            {c.label}
          </button>
        ))}
        <label className="mr-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high shrink-0 cursor-pointer">
          <span className="text-[11px] font-bold text-on-surface whitespace-nowrap">
            تحویل فوری
          </span>
          <input
            type="checkbox"
            checked={instant}
            onChange={(e) => onInstant(e.target.checked)}
            className="w-4 h-4 accent-m3-primary rounded cursor-pointer"
          />
        </label>
      </div>
    </section>
  );
}

/* ------------------------------- SCREEN: ALL ------------------------------- */

const MEGA_CATEGORIES = [
  {
    id: "cameras",
    title: "تجهیزات فیلم‌برداری و عکاسی",
    count: "۴,۳۲۰ کالا",
    desc: "انواع دوربین‌های Sony Alpha، لنزهای پرایم و تله، گیمبال DJI Ronin، بوم‌صدا و نورهای Nanlite.",
    tags: ["دوربین سونی", "لنز پرایم", "نور استودیو"],
    price: "۱۵۰,۰۰۰ تومان",
    img: "/assets/img/880e17bac769.jpg",
    badge: "بومی‌سازی استودیوها",
    icon: "photo_camera",
  },
  {
    id: "camping",
    title: "سفر، آفرود و کمپینگ",
    count: "۲,۹۴۰ کالا",
    desc: "چادرهای ضدآب کلمبوس، کیسه خواب پر، کوله‌پشتی کوهنوردی، ساج و پلوپز مسافرتی، باتوم و جی‌پی‌اس.",
    tags: ["چادر ۴ نفره", "کیسه خواب", "یخچال خودرویی"],
    price: "۸۰,۰۰۰ تومان",
    img: "/assets/img/9ea4705013cf.jpg",
    badge: "بیمه طبیعت‌گردی",
    icon: "camping",
  },
  {
    id: "gaming",
    title: "کنسول بازی و واقعیت مجازی",
    count: "۱,۹۰۰ کالا",
    desc: "پلی‌استیشن ۵، ایکس‌باکس سری ایکس، هدست متا کوئست ۳، فرمان بازی لاجیتک و عینک‌های واقعیت افزوده.",
    tags: ["PS5 Slim", "Meta Quest 3", "فرمان G29"],
    price: "۲۲۰,۰۰۰ تومان",
    img: "/assets/img/aea7ddf3b9e2.jpg",
    badge: "بسته‌های فول‌گیم",
    icon: "sports_esports",
  },
  {
    id: "tools",
    title: "ابزارآلات و تجهیزات فنی صنعتی",
    count: "۲,۱۴۰ کالا",
    desc: "دریل بتن‌کن، تراز لیزری ۳۶۰، موتور برق بی‌صدا، کارواش دینامی، دستگاه جوش اینورتر و اره موتوری.",
    tags: ["دریل شارژی", "تراز ۳۶۰", "موتور برق"],
    price: "۹۰,۰۰۰ تومان",
    img: "/assets/img/d652179e170d.jpg",
    badge: "تست فنی قبل از تحویل",
    icon: "home_repair_service",
  },
  {
    id: "digital",
    title: "لپ‌تاپ، تبلت و دیجیتال",
    count: "۱,۵۲۰ کالا",
    desc: "مک‌بوک‌های سری M، تبلت آیپد پرو با قلم، پروژکتورهای هوشمند قابل حمل و مانیتورهای کالیبره تدوین.",
    tags: ["MacBook Pro M3", "iPad Pro M2", "ویدئو پروژکتور"],
    price: "۳۰۰,۰۰۰ تومان",
    img: "/assets/img/246d69b67ee6.jpg",
    badge: "بیمه ضد سرقت",
    icon: "laptop_mac",
  },
  {
    id: "audio",
    title: "سیستم صوتی و رویداد",
    count: "۸۵۰ کالا",
    desc: "اسپیکرهای پرقدرت JBL Partybox، میکروفون بیسیم سنهایزر، رقص نور، دستگاه دودساز و میکسر صوتی.",
    tags: ["JBL PartyBox 710", "میکروفون بیسیم", "رقص نور لیزری"],
    price: "۱۸۰,۰۰۰ تومان",
    img: "/assets/img/22e0414a31b4.jpg",
    badge: "باند و میکروفون تست‌شده",
    icon: "speaker_group",
  },
] as const;

function AllScreen({ goTab }: { goTab: (t: TabKey) => void }) {
  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav
          aria-label="راهنمای مسیر"
          className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm"
        >
          <Link
            href="/"
            className="hover:text-m3-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>خانه</span>
          </Link>
          <span className="material-symbols-outlined text-[16px] text-outline-variant">
            chevron_left
          </span>
          <span className="text-m3-primary font-bold">دسته‌بندی‌های کالا</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-10">
        {/* Category Hero Banner */}
        <section className="relative rounded-2xl bg-surface-container-lowest shadow-xl p-6 md:p-10 overflow-hidden border border-surface-container-high/60">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-m3-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-m3-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-surface-container text-m3-primary text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">
                  category
                </span>
                <span>بزرگ‌ترین بازار اشتراک هوشمند تجهیزات ایران</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                کاوش و اجاره در میان{" "}
                <span className="text-m3-primary underline decoration-primary-fixed decoration-4 underline-offset-8">
                  هزاران تجهیزات
                </span>{" "}
                تخصصی
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                بدون نیاز به خرید سنگین و هزینه‌بر، به بهترین تجهیزات استودیویی،
                کمپی، سرگرمی و صنعتی دسترسی پیدا کنید؛ با بیمه کامل و ضمانت
                اصالت کالا.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => goTab("cameras")}
                  className="px-6 py-3 rounded-full bg-m3-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    explore
                  </span>
                  <span>مشاهده همه بخش‌ها</span>
                </button>
                <Link
                  href="/create-listing"
                  className="px-6 py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-m3-primary font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  <span>کسب درآمد از اجاره کالا</span>
                </Link>
              </div>
            </div>

            {/* Trust Stats Bento Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 w-full lg:w-72 shrink-0">
              <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 shadow-sm border border-surface-container-high">
                <div className="w-12 h-12 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">
                    dashboard_customize
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-on-surface font-numeric-stat">
                    +۳۵ دسته‌بندی
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    تخصصی و استاندارد شده
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 shadow-sm border border-surface-container-high">
                <div className="w-12 h-12 rounded-xl bg-m3-secondary/15 text-m3-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">
                    inventory_2
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-on-surface font-numeric-stat">
                    +۱۲,۰۰۰ وسیله
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    آماده رزرو و تحویل آنی
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 shadow-sm border border-surface-container-high">
                <div className="w-12 h-12 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">
                    verified_user
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-on-surface font-numeric-stat">
                    ۱۰۰٪ بیمه کالا
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    پوشش طلایی اٌوِراگارد
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-m3-primary text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-[18px]">
                apps
              </span>
              <span>دسته‌های اصلی تجهیزات</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface">
              انتخاب دسته‌بندی بر اساس نیاز کاری و تفریحی
            </h2>
          </div>
          <span className="text-on-surface-variant text-xs">
            برای ورود به هر بخش تخصصی، روی کارت مربوطه کلیک کنید
          </span>
        </div>

        {/* Featured Mega Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEGA_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => goTab(cat.id as TabKey)}
              className="group rounded-2xl bg-surface-container-lowest p-4 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between border border-surface-container-high cursor-pointer overflow-hidden"
            >
              <div>
                <div className="relative h-48 rounded-xl overflow-hidden mb-3 bg-surface-container">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-transparent to-transparent"></div>
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-xs text-m3-primary font-bold shadow-sm">
                    {cat.count}
                  </div>
                  <div className="absolute bottom-2.5 right-3 text-surface-container-lowest text-xs flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed">
                      {cat.icon}
                    </span>
                    <span>{cat.badge}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-on-surface group-hover:text-m3-primary transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 my-3">
                  {cat.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-on-surface-variant"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-variant/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-on-surface-variant block">
                    شروع تعرفه از:
                  </span>
                  <span className="text-sm font-bold text-m3-primary font-numeric-stat">
                    {cat.price}{" "}
                    <span className="text-[10px] font-normal text-on-surface-variant">
                      / روز
                    </span>
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-surface-container group-hover:bg-m3-primary group-hover:text-on-primary text-m3-primary flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sub-Category Browser & Interactive Quick Chips */}
        <section className="rounded-2xl bg-surface-container-low p-6 md:p-8 border border-surface-container-high">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-m3-primary text-xs font-bold flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-[18px]">
                  filter_list
                </span>
                <span>زیردسته‌های محبوب و پرتقاضا</span>
              </span>
              <h3 className="text-lg font-bold text-on-surface">
                دسترسی مستقیم به زیردسته‌های تخصصی
              </h3>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => goTab("all")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-m3-primary text-on-primary shadow-sm whitespace-nowrap"
              >
                همه دسته‌ها
              </button>
              <button
                type="button"
                onClick={() => goTab("cameras")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-variant whitespace-nowrap"
              >
                تجهیزات عکاسی
              </button>
              <button
                type="button"
                onClick={() => goTab("camping")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-variant whitespace-nowrap"
              >
                کمپینگ و سفر
              </button>
              <button
                type="button"
                onClick={() => goTab("gaming")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-variant whitespace-nowrap"
              >
                بازی و VR
              </button>
            </div>
          </div>

          {/* Sub-category Quick Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              {
                tab: "cameras",
                icon: "lens",
                title: "لنزهای تله‌فوتو",
                sub: "۸۲۰ مورد فعال",
              },
              {
                tab: "cameras",
                icon: "flight",
                title: "پهپاد و هلی‌شات",
                sub: "۳۱۰ مورد فعال",
              },
              {
                tab: "audio",
                icon: "mic",
                title: "میکروفون یقه‌ای",
                sub: "۶۴۰ مورد فعال",
              },
              {
                tab: "camping",
                icon: "solar_power",
                title: "پاوربانک خورشیدی",
                sub: "۲۹۰ مورد فعال",
              },
              {
                tab: "gaming",
                icon: "videogame_asset",
                title: "دسته و کنترلر بازی",
                sub: "۵۷۰ مورد فعال",
              },
              {
                tab: "tools",
                icon: "straighten",
                title: "تراز و متر لیزری",
                sub: "۴۱۵ مورد فعال",
              },
            ].map((q) => (
              <button
                key={q.title}
                type="button"
                onClick={() => goTab(q.tab as TabKey)}
                className="p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-bright flex flex-col items-center text-center gap-2 shadow-sm hover:-translate-y-1 transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-m3-primary/10 text-m3-primary flex items-center justify-center group-hover:bg-m3-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[22px]">
                    {q.icon}
                  </span>
                </div>
                <span className="text-xs font-bold text-on-surface group-hover:text-m3-primary">
                  {q.title}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {q.sub}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 4 Pillars of Overa Guarantee */}
        <section className="rounded-2xl bg-surface-container-lowest p-6 md:p-8 shadow-sm border border-surface-container-high text-center">
          <span className="text-xs font-bold text-m3-primary">
            استانداردهای ایمنی کالا در تمام دسته‌بندی‌ها
          </span>
          <h3 className="text-lg md:text-2xl font-bold text-on-surface mt-1 mb-8">
            چرا با خیال آسوده از دسته‌های اٌوِرا اجاره می‌کنید؟
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-container-low">
              <div className="w-12 h-12 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[26px]">
                  fact_check
                </span>
              </div>
              <h4 className="text-sm font-bold text-on-surface mb-1">
                تست سلامت پیش از تحویل
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                تمامی تجهیزات حساس با چک‌لیست تصویری و ثبت وضعیت در حضور طرفین
                تحویل می‌شوند.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-container-low">
              <div className="w-12 h-12 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[26px]">
                  shield_with_heart
                </span>
              </div>
              <h4 className="text-sm font-bold text-on-surface mb-1">
                بیمه جامع اٌوِراگارد
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                پوشش خسارت‌های ناخواسته، ضربه و حوادث تا سقف ۱۰۰ میلیون تومان با
                همکاری بیمه سامان.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-container-low">
              <div className="w-12 h-12 rounded-xl bg-m3-secondary/15 text-m3-secondary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[26px]">
                  account_balance_wallet
                </span>
              </div>
              <h4 className="text-sm font-bold text-on-surface mb-1">
                ودیعه امن امانی (Escrow)
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                ودیعه فقط در حساب امن شاپرک مسدود شده و پس از بازگشت کالا
                بلافاصله آزاد می‌گردد.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-container-low">
              <div className="w-12 h-12 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[26px]">
                  local_shipping
                </span>
              </div>
              <h4 className="text-sm font-bold text-on-surface mb-1">
                تحویل اکسپرس در محل
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                امکان ارسال سریع با ناوگان اختصاصی بیمه‌شده اٌوِرا در کمتر از ۲
                ساعت در سراسر تهران.
              </p>
            </div>
          </div>
        </section>

        {/* Lender CTA Banner */}
        <section className="relative rounded-2xl bg-gradient-to-r from-m3-primary via-primary-container to-m3-secondary text-on-primary p-6 md:p-10 shadow-xl overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold w-fit">
                <span className="material-symbols-outlined text-[16px]">
                  monetization_on
                </span>
                <span>درآمد غیرفعال از وسایل بدون استفاده</span>
              </div>
              <h3 className="text-xl md:text-3xl font-extrabold text-white">
                وسیله‌ای در این دسته‌بندی‌ها دارید که خاک می‌خورد؟
              </h3>
              <p className="text-xs md:text-sm text-on-primary-container leading-relaxed">
                در کمتر از ۳ دقیقه کالا را ثبت کنید، قیمت دلخواه بگذارید و
                ماهانه تا{" "}
                <strong className="text-white font-black">
                  ۳۵ میلیون تومان
                </strong>{" "}
                درآمد پایدار کسب کنید.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/create-listing"
                className="px-6 py-3 rounded-full bg-surface-container-lowest text-m3-primary font-bold text-sm shadow-md hover:bg-surface-bright transition-all"
              >
                ثبت وسیله و کسب درآمد
              </Link>
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "ماشین‌حساب درآمد: میانگین بازده سالیانه تجهیزات حرفه‌ای برابر ۴۵٪ از ارزش خرید است.",
                  )
                }
                className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
              >
                ماشین‌حساب درآمد
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------ SCREEN: CAMPING ------------------------------ */

function CampingScreen({
  items,
  instant,
  onInstant,
  onReset,
}: {
  items: CategoryTabListing[];
  instant: boolean;
  onInstant: (v: boolean) => void;
  onReset: () => void;
}) {
  const router = useRouter();
  const [capacity, setCapacity] = useState<string>("all");

  const filtered = useMemo(() => {
    if (capacity === "all") return items;
    return items.filter((it) => {
      const cap = capacityOf(it);
      if (cap === null) return false;
      if (capacity === "12") return cap <= 2;
      if (capacity === "34") return cap >= 3 && cap <= 4;
      return cap >= 5;
    });
  }, [items, capacity]);

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="w-full bg-surface-container-low/70 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Link
              href="/"
              className="hover:text-m3-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                home
              </span>
              <span>خانه</span>
            </Link>
            <span className="material-symbols-outlined text-[14px]">
              chevron_left
            </span>
            <Link href="/categories" className="hover:text-m3-primary">
              دسته‌بندی‌ها
            </Link>
            <span className="material-symbols-outlined text-[14px]">
              chevron_left
            </span>
            <span className="text-m3-primary font-bold">
              تجهیزات سفر، آفرود و کمپینگ
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
        {/* Hero Camping Banner */}
        <section className="relative w-full rounded-2xl overflow-hidden shadow-md bg-on-surface text-on-primary min-h-[380px] flex flex-col justify-end p-6 md:p-10">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/img/9ea4705013cf.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-on-surface/95 via-on-surface/80 to-m3-primary/80 mix-blend-multiply"></div>

          <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-m3-primary/40 backdrop-blur-md text-primary-fixed text-xs font-semibold w-fit border border-m3-primary/20">
              <span className="material-symbols-outlined text-[16px]">
                verified_user
              </span>
              <span>پوشش طلایی اٌوِراگارد کمپینگ</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              اجاره تجهیزات سفر، کمپینگ و آفرود
            </h1>
            <p className="text-xs md:text-sm text-primary-fixed/90 leading-relaxed">
              با بیش از ۲,۹۴۰ وسیله آماده تحویل با ضمانت اصالت، تست سلامت درزها
              و کارکرد فنی. بدون نیاز به چک و ضمانت‌نامه بانکی و با ارسال
              اکسپرس به لوکیشن سفر.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-6">
            {[
              { icon: "security", text: "بیمه اٌوِراگارد تا ۱۰۰ م.ت" },
              { icon: "verified", text: "تست درزها و زیپ‌ها قبل تحویل" },
              { icon: "bolt", text: "تحویل فوری ۲ ساعته" },
              { icon: "lock", text: "ودیعه امن بانکی" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 bg-surface-container-lowest/15 backdrop-blur-md px-3 py-2 rounded-xl text-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                  {f.icon}
                </span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <span className="font-bold text-sm text-m3-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    filter_alt
                  </span>
                  <span>فیلترهای سفر</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onInstant(false);
                    setCapacity("all");
                  }}
                  className="text-[11px] text-m3-outline hover:text-m3-primary"
                >
                  حذف همه
                </button>
              </div>

              {/* Instant Delivery Switch */}
              <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">
                  تحویل زیر ۲ ساعت
                </span>
                <input
                  type="checkbox"
                  checked={instant}
                  onChange={(e) => onInstant(e.target.checked)}
                  className="w-4 h-4 accent-m3-primary rounded cursor-pointer"
                />
              </div>

              {/* Capacity Options */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-on-surface">
                  ظرفیت نفرات
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { key: "12", label: "۱-۲ نفر" },
                    { key: "34", label: "۳-۴ نفر" },
                    { key: "5p", label: "۵+ نفر" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCapacity(opt.key)}
                      className={`py-1.5 text-center rounded-lg transition-all ${
                        capacity === opt.key
                          ? "bg-m3-primary text-on-primary font-bold"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guaranteed Sanitization */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-emerald-900">
                <span className="material-symbols-outlined text-[18px] text-emerald-700 mt-0.5">
                  clean_hands
                </span>
                <div className="text-xs">
                  <span className="font-bold block">ضدعفونی با اشعه UV</span>
                  <span className="text-[11px] opacity-80 leading-normal">
                    کلیه کیسه‌های خواب و ظروف با اشعه پلمپ بهداشتی می‌شوند.
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="bg-surface-container-lowest py-3 px-5 rounded-xl shadow-sm border border-surface-container-high flex items-center justify-between">
              <span className="text-xs md:text-sm font-bold text-on-surface">
                نمایش تجهیزات آماده تحویل ({faNumber(filtered.length)} کالا)
              </span>
              <span className="text-xs text-on-surface-variant">
                مرتب‌سازی: بر اساس فیلترهای انتخابی
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/item-details/${item.id}`)}
                  className="group bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden border border-surface-container-high cursor-pointer"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-m3-primary">
                      {item.brand ?? item.categoryName}
                    </span>
                    <div className="absolute bottom-2 right-2 bg-on-surface/80 backdrop-blur-md text-on-primary px-2 py-0.5 rounded text-[10px]">
                      {item.area ? `${item.city}، ${item.area}` : item.city}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold">
                          {item.instantBook
                            ? "تحویل فوری ۲ ساعته"
                            : "هماهنگی تحویل"}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                          <span className="material-symbols-outlined text-amber-500 text-[14px]">
                            star
                          </span>
                          <span>{faNumber(item.rating.toFixed(1))}</span>
                          <span className="text-[10px] text-m3-outline font-normal">
                            ({faNumber(item.reviewsCount)})
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-m3-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-on-surface-variant">
                          اجاره روزانه:
                        </span>
                        <span className="text-sm font-bold text-m3-primary font-numeric-stat">
                          {faToman(item.dailyPrice)} تومان
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-m3-outline pt-1 border-t border-surface-container">
                        <span>ودیعه امن امانی:</span>
                        <span className="font-semibold text-on-surface">
                          {faToman(item.deposit)} تومان
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/item-details/${item.id}`);
                        }}
                        className="bg-m3-primary hover:bg-primary-container text-on-primary py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        رزرو فوری
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/item-details/${item.id}`);
                        }}
                        className="bg-surface-container-low hover:bg-surface-container text-on-surface py-2 rounded-lg text-xs font-semibold"
                      >
                        مشاهده تقویم
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 ? (
                <EmptyStateColspan onReset={onReset} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyStateColspan({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full">
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high px-6 py-12 text-center flex flex-col items-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-surface-container text-m3-outline flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">search_off</span>
        </span>
        <p className="text-base font-bold text-on-surface">موردی یافت نشد</p>
        <p className="text-xs text-on-surface-variant">
          فیلترها یا عبارت جستجو را تغییر دهید و دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-1 px-5 py-2 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-colors"
        >
          حذف فیلترها
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ SCREEN: CAMERAS ------------------------------ */

function CamerasScreen({
  items,
  onReset,
}: {
  items: CategoryTabListing[];
  onReset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link
            href="/"
            className="hover:text-m3-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>خانه</span>
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_left
          </span>
          <Link href="/categories" className="hover:text-m3-primary">
            دسته‌بندی‌ها
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_left
          </span>
          <span className="text-m3-primary font-bold">
            تجهیزات فیلم‌برداری و عکاسی
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
        {/* Dark Cinematic Hero */}
        <div className="relative rounded-2xl bg-[#0f0c1b] border border-white/10 p-6 md:p-10 overflow-hidden shadow-2xl text-white">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-m3-primary/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-28 -left-20 w-80 h-80 bg-[#7c3aed]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-m3-primary text-white text-xs font-bold">
                  تضمین سلامت تجهیزات
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  بیمه تا ۵۰۰ میلیون تومان
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                اجاره تجهیزات فیلم‌برداری و عکاسی حرفه‌ای
              </h1>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                دسته‌بندی مرجع برای کرایه بدنه دوربین‌های سینمایی و فول‌فریم،
                لنزهای پرایم مستر، استابلایزرها، صدابرداری پروداکشن و کیت‌های
                نورپردازی Nanlite و Aputure.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 w-full lg:w-72">
              <span className="text-xs text-slate-300 font-semibold block mb-1">
                شاخص رضایت فیلمسازان:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-numeric-stat">
                  ۴.۹۴
                </span>
                <span className="text-xs text-amber-400">★★★★★</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-2 block">
                ۹۸.۶٪ تطابق بدون مغایرت فنی
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((cam) => {
            const specs = (cam.specs ?? "")
              .split("•")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div
                key={cam.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container-high group"
              >
                <div>
                  <div className="relative w-full h-56 overflow-hidden bg-surface-container-low">
                    <img
                      src={cam.imageUrl}
                      alt={cam.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-m3-primary text-xs font-bold shadow-sm">
                      {cam.instantBook
                        ? "تحویل فوری"
                        : `${cam.city}، ${cam.area ?? ""}`}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-m3-outline">
                      <span>{cam.categoryName}</span>
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        <span>{faNumber(cam.rating.toFixed(1))}</span>
                        <span className="material-symbols-outlined text-[14px]">
                          star
                        </span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface group-hover:text-m3-primary transition-colors">
                      {cam.title}
                    </h3>
                    <span className="text-xs text-on-surface-variant font-medium">
                      میزبان: {cam.ownerName}
                    </span>

                    <div className="grid grid-cols-2 gap-2 mt-2 bg-surface-container-low p-2 rounded-xl text-xs text-on-surface-variant">
                      {specs.length > 0 ? (
                        specs.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-m3-primary">
                              check_circle
                            </span>
                            <span>{s}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-m3-primary">
                            check_circle
                          </span>
                          <span className="line-clamp-1">
                            {cam.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between pt-3 border-t border-surface-container">
                    <div>
                      <span className="text-lg font-black text-m3-primary font-numeric-stat">
                        {faToman(cam.dailyPrice)}{" "}
                        <span className="text-xs font-normal text-on-surface-variant">
                          تومان/روز
                        </span>
                      </span>
                      <span className="text-[11px] text-m3-outline block">
                        ودیعه: {faToman(cam.deposit)} تومان
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/item-details/${cam.id}`)}
                      className="px-5 py-2.5 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm transition-all"
                    >
                      رزرو سریع
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 ? <EmptyStateColspan onReset={onReset} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ SCREEN: GAMING ------------------------------ */

function GamingScreen({
  items,
  onReset,
}: {
  items: CategoryTabListing[];
  onReset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link href="/" className="hover:text-m3-primary">
            خانه
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_left
          </span>
          <span className="text-m3-primary font-bold">
            کنسول بازی و واقعیت مجازی
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
        {/* Gaming Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-[#180b33] via-[#0d0722] to-[#251052] p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-m3-primary/30">
          <div className="max-w-xl flex flex-col gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-m3-inverse-primary w-fit">
              تحویل اکسپرس ۲ ساعته
            </span>
            <h1 className="text-2xl md:text-3xl font-black">
              اجاره کنسول‌های نسل نهم و هدست واقعیت مجازی
            </h1>
            <p className="text-xs md:text-sm text-surface-variant/90 leading-relaxed">
              تجربه بدون مرز بازی‌ها با نصب رایگان عناوین روز (FC 24, Spider-Man
              2, GTA V). تضمین ۱۰۰٪ سلامت دکمه‌ها و دسته‌ها.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/10 shrink-0">
            <span className="material-symbols-outlined text-[36px] text-primary-fixed">
              sports_esports
            </span>
            <div>
              <span className="text-lg font-black block font-numeric-stat">
                ۶۲ پکیج آماده
              </span>
              <span className="text-xs text-slate-300">
                تست کامل دریفت آنالوگ
              </span>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col border border-surface-container-high"
            >
              <div className="relative h-52 overflow-hidden bg-surface-container">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm">
                  {item.instantBook
                    ? "تحویل ۲ ساعته"
                    : `${item.city}، ${item.area ?? ""}`}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1 font-bold text-on-surface">
                      <span className="material-symbols-outlined text-amber-500 text-[14px]">
                        star
                      </span>
                      <span>{faNumber(item.rating.toFixed(1))}</span>
                      <span className="font-normal text-m3-outline">
                        ({faNumber(item.reviewsCount)} رزرو)
                      </span>
                    </span>
                    <span className="text-m3-primary font-semibold">
                      {item.area ? `${item.city}، ${item.area}` : item.city}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-container flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-m3-primary font-numeric-stat">
                      {faToman(item.dailyPrice)} تومان
                    </span>
                    <span className="text-[10px] text-m3-outline block">
                      میزبان: {item.ownerName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/item-details/${item.id}`)}
                    className="px-4 py-2 rounded-lg bg-m3-primary hover:bg-primary-container text-on-primary text-xs font-bold"
                  >
                    رزرو سریع
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? <EmptyStateColspan onReset={onReset} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ SCREEN: DIGITAL ------------------------------ */

function DigitalScreen({
  items,
  onReset,
}: {
  items: CategoryTabListing[];
  onReset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link href="/" className="hover:text-m3-primary">
            خانه
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_left
          </span>
          <span className="text-m3-primary font-bold">
            لپ‌تاپ، تبلت و تجهیزات دیجیتال
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
        <section className="rounded-2xl bg-surface-container-low p-6 md:p-8 border border-surface-container-high">
          <span className="px-3 py-1 rounded-full bg-primary-fixed text-m3-primary text-xs font-bold">
            پوشش بیمه اٌوِراگارد تا ۸۰ م.ت
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-2">
            اجاره لپ‌تاپ، مک‌بوک و تجهیزات دیجیتال
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
            بیش از ۱,۵۰۰ دستگاه قدرتمند برای پروژه‌های برنامه‌نویسی، طراحی
            سه‌بعدی، رندرینگ سنگین و رویدادهای کاری.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((lap) => {
            const specs = (lap.specs ?? "")
              .split("•")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div
                key={lap.id}
                className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container-high"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-surface-container">
                    <img
                      src={lap.imageUrl}
                      alt={lap.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-on-surface">
                      {lap.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {lap.description}
                    </p>

                    <div className="grid grid-cols-3 gap-1.5 py-2">
                      {specs.slice(0, 3).map((sp, idx) => (
                        <div
                          key={idx}
                          className="bg-surface-container-low p-1.5 rounded text-center text-xs font-bold text-on-surface"
                        >
                          {sp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between pt-3 border-t border-surface-container">
                    <div>
                      <span className="text-base font-bold text-m3-primary font-numeric-stat">
                        {faToman(lap.dailyPrice)} تومان/روز
                      </span>
                      <span className="text-[10px] text-m3-outline block">
                        ودیعه: {faToman(lap.deposit)} تومان
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/item-details/${lap.id}`)}
                      className="px-4 py-2 rounded-lg bg-m3-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm"
                    >
                      رزرو آنلاین
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 ? <EmptyStateColspan onReset={onReset} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- SCREEN: AUDIO ------------------------------- */

function AudioScreen({
  items,
  onReset,
}: {
  items: CategoryTabListing[];
  onReset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link href="/" className="hover:text-m3-primary">
            خانه
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_left
          </span>
          <span className="text-m3-primary font-bold">
            سیستم‌های صوتی و رویداد
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
        <div className="rounded-2xl bg-surface-container-lowest p-6 md:p-8 shadow-sm border border-surface-container-high">
          <div className="flex items-center gap-2 text-m3-primary font-bold text-xs mb-1">
            <span className="material-symbols-outlined text-[18px]">
              graphic_eq
            </span>
            <span>بخش تخصصی ایونت و صدا</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface">
            اجاره سیستم‌های صوتی، نورپردازی و تجهیزات جشن
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            بیش از ۸۰۰ پکیج کامل صدا، اسپیکرهای پرقدرت، رقص نور، میکروفون بی‌سیم
            و تجهیزات جشن و همایش.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container-high"
            >
              <div>
                <div className="relative h-52 overflow-hidden bg-surface-container">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-m3-primary text-on-primary text-xs font-bold">
                    {item.brand ?? item.categoryName}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="text-sm font-bold text-on-surface">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-surface-container">
                  <span className="text-base font-bold text-m3-primary font-numeric-stat">
                    {faToman(item.dailyPrice)} تومان/روز
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(`/item-details/${item.id}`)}
                    className="px-4 py-2 rounded-lg bg-m3-primary hover:bg-primary-container text-on-primary text-xs font-bold"
                  >
                    رزرو آنلاین
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? <EmptyStateColspan onReset={onReset} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- SCREEN: TOOLS ------------------------------- */

function ToolsScreen({
  items,
  onReset,
}: {
  items: CategoryTabListing[];
  onReset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link href="/" className="hover:text-m3-primary">
            خانه
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_left
          </span>
          <span className="text-m3-primary font-bold">
            ابزارآلات و تجهیزات فنی صنعتی
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
        <div className="rounded-2xl bg-surface-container-low p-6 md:p-8 border border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary text-xs font-bold">
              تضمین فوری اٌوِراگارد صنعتی
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-2">
              اجاره ابزارآلات و تجهیزات کارگاهی
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-xl leading-relaxed">
              دسترسی موقت و اقتصادی به بیش از ۲,۱۰۰ ابزار برقی، شارژی و ساختمانی
              بدون خواب سرمایه.
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container-high text-xs text-on-surface font-semibold shrink-0">
            <span>تست سلامت موتور قبل از تحویل + بیمه سوختگی</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((tool) => {
            const specs = (tool.specs ?? "")
              .split("•")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div
                key={tool.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container-high"
              >
                <div>
                  <div className="relative h-48 w-full rounded-xl overflow-hidden bg-surface-container mb-3">
                    <img
                      src={tool.imageUrl}
                      alt={tool.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded-full text-xs font-bold text-on-surface">
                      ★ {faNumber(tool.rating.toFixed(1))}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-m3-primary">
                    {tool.brand ?? tool.categoryName}
                  </span>
                  <h3 className="text-sm font-bold text-on-surface mt-0.5">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-surface-container-low text-center my-3 text-xs">
                    {specs.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="font-bold text-on-surface">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-container flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-m3-primary font-numeric-stat">
                      {faToman(tool.dailyPrice)} تومان/روز
                    </span>
                    <span className="text-[10px] text-m3-outline block">
                      ودیعه: {faToman(tool.deposit)} تومان
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/item-details/${tool.id}`)}
                    className="px-4 py-2 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm"
                  >
                    رزرو آنلاین
                  </button>
                </div>
              </div>
            );
          })}
          {items.length === 0 ? <EmptyStateColspan onReset={onReset} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- ROOT APP ---------------------------------- */

export default function CategoriesApp({
  listings,
}: {
  listings: CategoryTabListing[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tabParam = params.get("tab") ?? "all";
  const tab: TabKey = (TABS.find((t) => t.key === tabParam)?.key ??
    "all") as TabKey;
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "new";
  const price = params.get("price") ?? "all";
  const instant = params.get("instant") === "1";
  // Optional DB category slug (e.g. ?category=home from the hero carousel —
  // covers categories that have no dedicated tab like «لوازم خانگی»). Applied
  // before tab matching so both filters compose.
  const categoryParam = params.get("category") ?? "";

  const [searchDraft, setSearchDraft] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  // Sync the draft input when the q param changes externally (render-phase adjustment).
  if (q !== lastQ) {
    setLastQ(q);
    setSearchDraft(q);
  }

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    startTransition(() =>
      router.replace(qs ? `/categories?${qs}` : "/categories", {
        scroll: false,
      }),
    );
  }

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of TABS) {
      counts[t.key] = listings.filter((l) =>
        matchesTab(l, t.key as TabKey),
      ).length;
    }
    return counts;
  }, [listings]);

  const tabItems = useMemo(
    () =>
      listings
        .filter((l) =>
          categoryParam ? l.categorySlug === categoryParam : true,
        )
        .filter((l) => matchesTab(l, tab)),
    [listings, tab, categoryParam],
  );

  const filtered = useMemo(() => {
    let out = [...tabItems];
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter((l) =>
        `${l.title} ${l.brand ?? ""} ${l.description}`
          .toLowerCase()
          .includes(needle),
      );
    }
    if (price === "lt300") out = out.filter((l) => l.dailyPrice < 300000);
    else if (price === "300to800")
      out = out.filter((l) => l.dailyPrice >= 300000 && l.dailyPrice <= 800000);
    else if (price === "gt800") out = out.filter((l) => l.dailyPrice > 800000);
    if (instant) out = out.filter((l) => l.instantBook);
    switch (sort) {
      case "popular":
        out.sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      case "cheap":
        out.sort((a, b) => a.dailyPrice - b.dailyPrice);
        break;
      case "expensive":
        out.sort((a, b) => b.dailyPrice - a.dailyPrice);
        break;
      default:
        out.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
    return out;
  }, [tabItems, q, price, instant, sort]);

  function resetFilters() {
    setSearchDraft("");
    update({ q: null, price: null, instant: null, sort: null });
  }

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <Toaster position="bottom-left" dir="rtl" />
      {/* Tab navigation (source sub-navigation bar) */}
      <nav className="bg-surface-container-lowest border-b border-surface-container-high sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-4 md:gap-6 whitespace-nowrap overflow-x-auto no-scrollbar text-xs md:text-sm font-medium pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => update({ tab: t.key === "all" ? null : t.key })}
              className={`pb-2 -mb-px transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? "text-m3-primary font-bold border-b-2 border-m3-primary"
                  : "text-on-surface-variant hover:text-m3-primary"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.key
                    ? "bg-m3-primary/10 text-m3-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {faNumber(tabCounts[t.key] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {tab === "all" ? (
        <AllScreen goTab={(t) => update({ tab: t === "all" ? null : t })} />
      ) : (
        <>
          <div className="bg-surface-container-low/60 border-b border-surface-container-high">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
              <Toolbar
                searchDraft={searchDraft}
                setSearchDraft={setSearchDraft}
                onSearch={() => update({ q: searchDraft })}
                sort={sort}
                onSort={(v) => update({ sort: v })}
                price={price}
                onPrice={(v) => update({ price: v === "all" ? null : v })}
                instant={instant}
                onInstant={(v) => update({ instant: v ? "1" : null })}
                resultCount={filtered.length}
              />
            </div>
          </div>
          {pending ? (
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : tab === "camping" ? (
            <CampingScreen
              items={filtered}
              instant={instant}
              onInstant={(v) => update({ instant: v ? "1" : null })}
              onReset={resetFilters}
            />
          ) : tab === "cameras" ? (
            <CamerasScreen items={filtered} onReset={resetFilters} />
          ) : tab === "gaming" ? (
            <GamingScreen items={filtered} onReset={resetFilters} />
          ) : tab === "digital" ? (
            <DigitalScreen items={filtered} onReset={resetFilters} />
          ) : tab === "audio" ? (
            <AudioScreen items={filtered} onReset={resetFilters} />
          ) : (
            <ToolsScreen items={filtered} onReset={resetFilters} />
          )}
        </>
      )}
    </main>
  );
}
