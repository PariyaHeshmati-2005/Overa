import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import CouponValidator from "./CouponValidator";
import CouponsGrid, { type Coupon } from "./CouponsGrid";
import HostCouponActions from "./HostCouponActions";

export const metadata = {
  title: "تخفیف‌ها",
  description: "مرکز کوپن‌ها و کدهای تخفیف اورا (کوپن‌های نمایشی)",
  robots: { index: false },
};

const COUPONS: Coupon[] = [
  {
    code: "OVR-WELCOME",
    group: "welcome",
    badgeIcon: "redeem",
    badge: "هدیه عضویت و ثبت‌نام",
    badgeCls: "bg-purple-100 text-m3-primary",
    status: "فعال و آماده",
    statusCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    from: "از طرف پلتفرم اورا (ادمین)",
    title: "۳۰٪ تخفیف اولین سفارش اجاره",
    highlight: "تا سقف ۵۰۰,۰۰۰ تومان تخفیف روی کل فاکتور",
    category: "عمومی و تمام کالاها",
    minOrderLabel: "حداقل سفارش",
    minOrderValue: "بدون محدودیت حداقل",
    expiry: "تا پایان خرداد ۱۴۰۳ (۷ روز مانده)",
    expiryCls: "text-amber-700",
    featured: true,
  },
  {
    code: "OVR-SPRING20",
    group: "platform",
    badgeIcon: "campaign",
    badge: "جشنواره سراسری اورا",
    badgeCls: "bg-amber-100 text-amber-700",
    status: "فعال",
    statusCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    from: "سراسری پلتفرم (کمپین بهاره)",
    title: "۲۰٪ تخفیف اجاره تجهیزات سفر و کمپینگ",
    highlight: "تا سقف ۷۰۰,۰۰۰ تومان ویژه آخرهفته",
    category: "کمپینگ، چادر و کوهنوردی",
    minOrderLabel: "حداقل سفارش",
    minOrderValue: "۶۰۰,۰۰۰ تومان",
    expiry: "تا ۱۰ تیر ۱۴۰۳ (۱۶ روز مانده)",
    expiryCls: "text-amber-700",
  },
  {
    code: "SONY-HOST15",
    group: "host",
    badgeIcon: "verified",
    badge: "میزبان برتر (استودیو نور)",
    badgeCls: "bg-indigo-100 text-m3-secondary",
    status: "فعال",
    statusCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    from: "تخفیف ویژه میزبان برای مستاجران",
    title: "۱۵٪ تخفیف پکیج‌های فیلم‌برداری سونی",
    highlight: "بدون سقف تخفیف (کسر مستقیم از فاکتور)",
    category: "عکاسی و فیلم‌برداری سینمایی",
    minOrderLabel: "حداقل مدت",
    minOrderValue: "حداقل ۲ روز اجاره",
    expiry: "تا ۲۵ خرداد ۱۴۰۳ (۳ روز مانده)",
    expiryCls: "text-amber-700",
  },
  {
    code: "GAME-WEEKEND",
    group: "host",
    badgeIcon: "sports_esports",
    badge: "میزبان تخصصی گیمینگ",
    badgeCls: "bg-indigo-100 text-m3-secondary",
    status: "فعال",
    statusCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    from: "از طرف میزبان (آریا گیم)",
    title: "۲۵٪ تخفیف اجاره کنسول PS5 و بازی‌ها",
    highlight: "تا سقف ۳۵۰,۰۰۰ تومان",
    category: "کنسول، VR و تجهیزات بازی",
    minOrderLabel: "حداقل سفارش",
    minOrderValue: "۴۰۰,۰۰۰ تومان",
    expiry: "تا ۱۵ تیر ۱۴۰۳ (۲۰ روز مانده)",
    expiryCls: "text-on-surface-variant",
  },
  {
    code: "FRIEND-100K",
    group: "reward",
    badgeIcon: "group_add",
    badge: "پاداش دعوت از دوستان",
    badgeCls: "bg-purple-100 text-m3-primary",
    status: "دائمی",
    statusCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    from: "باشگاه وفاداری کاربران اورا",
    title: "۱۰۰ هزار تومان تخفیف نقدی مستقیم",
    highlight: "به ازای هر دوست دعوت‌شده که اولین رزرو را ثبت کند",
    category: "عمومی و بدون محدودیت",
    minOrderLabel: "حداقل سفارش",
    minOrderValue: "۳۰۰,۰۰۰ تومان",
    expiry: "اعتبار نامحدود (دائمی)",
    expiryCls: "text-emerald-600",
  },
  {
    code: "VIP-RENT35",
    group: "reward",
    badgeIcon: "workspace_premium",
    badge: "مشتریان وفادار VIP",
    badgeCls: "bg-violet-100 text-m3-primary",
    status: "فعال",
    statusCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    from: "ویژه رزرو دوم به بعد",
    title: "۳۵٪ تخفیف اجاره‌های بالای ۳ روز",
    highlight: "تا سقف ۱,۲۰۰,۰۰۰ تومان تخفیف ویژه",
    category: "انواع دوربین و تجهیزات نور",
    minOrderLabel: "حداقل مدت",
    minOrderValue: "۳ روز و بیشتر",
    expiry: "تا ۲۰ تیر ۱۴۰۳ (۲۵ روز مانده)",
    expiryCls: "text-amber-700",
  },
];

export default async function DiscountsPage() {
  // Members-only area: server-side session check (not CSS hiding). Guests —
  // including direct URL access — are redirected to sign-in and sent back
  // here after a successful login.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin-otp?next=" + encodeURIComponent("/discounts"));
  }

  return (
    <>
      <SiteHeader />
      <div className="flex-1 bg-m3-surface text-on-surface antialiased w-full">
        <div className="w-full max-w-[1240px] mx-auto px-6 lg:px-10 py-5 flex flex-col">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-2 py-4 text-xs sm:text-sm">
            <Link className="text-black hover:underline font-medium" href="/">
              خانه
            </Link>
            <span className="text-[#694d99]/50">/</span>
            <Link className="text-black hover:underline font-medium" href="/categories">
              دسته‌بندی‌ها
            </Link>
            <span className="text-[#694d99]/50">/</span>
            <span className="text-[#130e1b] font-bold">تخفیف ها</span>
          </div>

          {/* Section 1: Top Welcome & Action Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-m3-primary via-[#801E76] to-[#4c16a6] p-6 sm:p-8 text-on-primary shadow-lg shadow-m3-primary/15 mb-6">
            <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-secondary-container/20 blur-xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
                  <span className="material-symbols-outlined text-[16px] text-amber-300">confirmation_number</span>
                  <span>مرکز رسمی کوپن‌ها و تخفیف‌های ویژه اورا</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                  کدهای تخفیف و بن‌های اجاره فعال
                </h1>
                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                  از تخفیف‌های خوش‌آمدگویی، پروموشن‌های سراسری پلتفرم و کوپن‌های اختصاصی برترین میزبانان برای اجاره دوربین، گیمینگ و تجهیزات سفر با کمترین هزینه استفاده کنید.
                </p>
              </div>
              <CouponValidator />
            </div>
          </div>

          {/* Section 2: Key KPI Metric Cards */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-[#ece7f3] flex items-center gap-3">
                <div className="size-9 rounded-lg bg-purple-100 text-m3-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">percent</span>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">کدهای فعال امروز</div>
                  <div className="text-base font-extrabold text-[#130e1b]">۱۲ کد تخفیف</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-[#ece7f3] flex items-center gap-3">
                <div className="size-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">savings</span>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">بیشترین درصد</div>
                  <div className="text-base font-extrabold text-[#130e1b]">تا ۴۰٪ تخفیف</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-[#ece7f3] flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">redeem</span>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">هدیه عضویت جدید</div>
                  <div className="text-base font-extrabold text-[#130e1b]">۳۰٪ بدون قید</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-[#ece7f3] flex items-center gap-3">
                <div className="size-9 rounded-lg bg-indigo-100 text-m3-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-medium">کدهای اختصاصی میزبان</div>
                  <div className="text-base font-extrabold text-[#130e1b]">۶ بن فعال</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Coupons grid with working filter tabs + copy buttons */}
          <CouponsGrid coupons={COUPONS} />

          {/* Section 4: Active Coupons & Campaigns — Host Creation Panel */}
          <div className="bg-surface-container-lowest rounded-2xl border border-[#ece7f3] shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-[#ece7f3] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-m3-primary mb-1">
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                  <span>بخش اختصاصی میزبانان اورا</span>
                </div>
                <h2 className="text-lg font-extrabold text-[#130e1b]">ایجاد و صدور کد تخفیف جدید توسط میزبان</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  میزبان گرامی، می‌توانید برای افزایش رزرو تجهیزات کم‌تردد یا جذب مشتریان همیشگی، کد تخفیف با شرایط دلخواه صادر کنید.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">
                  کدهای فعال شما: <strong className="text-[#130e1b]">۲ کد</strong>
                </span>
                <span className="text-outline-variant">|</span>
                <span className="text-xs text-emerald-600 font-bold">نرخ موفقیت رزرو: +۲۸٪</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-[#130e1b] mb-1.5" htmlFor="coupon-code">
                  عنوان کمپین / کد پیشنهادی
                </label>
                <input
                  id="coupon-code"
                  className="w-full text-xs font-mono uppercase px-3 py-2.5 rounded-xl border border-[#ece7f3] bg-[#f9f8fc] focus:outline-none focus:ring-2 focus:ring-m3-primary/20 text-[#130e1b]"
                  placeholder="مثلاً SONY-SUMMER"
                  type="text"
                  defaultValue="OVR-HOST2024"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#130e1b] mb-1.5" htmlFor="coupon-percent">
                  درصد تخفیف (٪)
                </label>
                <select
                  id="coupon-percent"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#ece7f3] bg-[#f9f8fc] focus:outline-none focus:ring-2 focus:ring-m3-primary/20 text-[#130e1b]"
                  defaultValue="15"
                >
                  <option value="10">۱۰٪ تخفیف</option>
                  <option value="15">۱۵٪ تخفیف (پیشنهاد هوش مصنوعی)</option>
                  <option value="20">۲۰٪ تخفیف</option>
                  <option value="25">۲۵٪ تخفیف</option>
                  <option value="30">۳۰٪ تخفیف</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#130e1b] mb-1.5" htmlFor="coupon-items">
                  تجهیزات و کالاهای مشمول
                </label>
                <select
                  id="coupon-items"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#ece7f3] bg-[#f9f8fc] focus:outline-none focus:ring-2 focus:ring-m3-primary/20 text-[#130e1b]"
                  defaultValue="a74iv"
                >
                  <option value="all">تمام وسایل و آگهی‌های من</option>
                  <option value="a74iv">دوربین سونی Alpha 7 IV + لنز ۲۴-۷۰</option>
                  <option value="ps5">کنسول پلی‌استیشن ۵ با دو دسته</option>
                  <option value="tent">چادر کلمبوس ۴ نفره و تجهیزات سفر</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#130e1b] mb-1.5" htmlFor="coupon-expiry">
                  مهلت اعتبار و انقضا
                </label>
                <input
                  id="coupon-expiry"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#ece7f3] bg-[#f9f8fc] focus:outline-none focus:ring-2 focus:ring-m3-primary/20 text-[#130e1b]"
                  placeholder="مثلاً تا ۳۰ تیر ۱۴۰۳"
                  type="text"
                  defaultValue="تا ۳۰ تیر ۱۴۰۳ (یک‌ماهه)"
                  readOnly
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#ece7f3]">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input defaultChecked className="rounded accent-m3-primary" type="checkbox" readOnly />
                  <span className="font-medium text-[#130e1b]">
                    نمایش در صفحه عمومی آگهی‌ها به عنوان پیشنهاد ویژه
                  </span>
                </label>
              </div>
              <HostCouponActions />
            </div>
          </div>

          {/* Bottom Footer Info */}
          <footer className="mt-auto py-6 border-t border-[#ece7f3] text-center text-xs text-on-surface-variant/80">
            <p>© ۱۴۰۳ تمام حقوق برای سامانه اشتراک‌گذاری و اجاره تجهیزات اورا (Overa) محفوظ است.</p>
          </footer>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
