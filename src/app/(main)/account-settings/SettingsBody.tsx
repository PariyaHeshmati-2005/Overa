"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { faToman, toPersianDigits } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type SettingsUser = {
  name: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  kycStatus: string;
  isHost: boolean;
};

const KYC_LABELS: Record<string, string> = {
  UNVERIFIED: "تایید نشده",
  PENDING: "در انتظار بررسی",
  VERIFIED: "تایید شده",
  REJECTED: "رد شده",
};

const KYC_STYLES: Record<string, string> = {
  UNVERIFIED: "bg-amber-100 text-amber-800 border border-amber-200",
  PENDING: "bg-sky-100 text-sky-800 border border-sky-200",
  VERIFIED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border border-rose-200",
};

const KYC_ICONS: Record<string, string> = {
  UNVERIFIED: "hourglass_empty",
  PENDING: "pending_actions",
  VERIFIED: "verified",
  REJECTED: "gpp_bad",
};

/** Mask the middle of the phone like the source (۰۹۱۲***۶۷۸۹). */
function maskPhone(phone: string): string {
  if (phone.length !== 11) return toPersianDigits(phone);
  return toPersianDigits(`${phone.slice(0, 4)}***${phone.slice(7)}`);
}

/**
 * Interactive sections of account-settings — profile edit (PATCH
 * /api/auth/profile), hosting preferences, payout (sandbox), security,
 * notifications channel prefs + live list (children), and danger zone with
 * real sign-out.
 */
export default function SettingsBody({
  user,
  joinedFaDate,
  completedRentals,
  children,
}: {
  user: SettingsUser;
  joinedFaDate: string;
  completedRentals: number;
  children?: ReactNode;
}) {
  const router = useRouter();

  /* ------------------------------- profile ------------------------------- */
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(user.city ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const dirty =
    name !== user.name || city !== (user.city ?? "") || bio !== (user.bio ?? "");

  async function saveProfile() {
    setProfileError("");
    if (name.trim().length < 2) {
      setProfileError("نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), city: city.trim(), bio: bio.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(data.error ?? "خطایی در ذخیره تغییرات رخ داد.");
        toast.error(data.error ?? "ذخیره تغییرات ناموفق بود.");
        return;
      }
      toast.success("تغییرات ذخیره شد");
      router.refresh();
    } catch {
      setProfileError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setName(user.name);
    setCity(user.city ?? "");
    setBio(user.bio ?? "");
    setPrefs({
      pickupInPerson: true,
      deliveryCourier: true,
      selfDelivery: false,
      cancelPolicy: "flexible",
      inspectionWindow: "2h",
      minDays: 1,
      maxDays: 30,
      smsNewReservation: true,
      smsNewMessage: true,
      smsPayout: true,
      emailWeeklyReport: true,
      emailInvoice: true,
      emailCampaigns: false,
    });
    setProfileError("");
    toast.info("تغییرات بازنشانی شد.");
  }

  /* ---------------------------- host preferences -------------------------- */
  const [prefs, setPrefs] = useState({
    pickupInPerson: true,
    deliveryCourier: true,
    selfDelivery: false,
    cancelPolicy: "flexible",
    inspectionWindow: "2h",
    minDays: 1,
    maxDays: 30,
    smsNewReservation: true,
    smsNewMessage: true,
    smsPayout: true,
    emailWeeklyReport: true,
    emailInvoice: true,
    emailCampaigns: false,
  });
  function setPref<K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  /* ------------------------------ danger zone ----------------------------- */
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const kycLabel = KYC_LABELS[user.kycStatus] ?? user.kycStatus;
  const kycStyle = KYC_STYLES[user.kycStatus] ?? "bg-surface-container text-on-surface";
  const kycIcon = KYC_ICONS[user.kycStatus] ?? "badge";
  const initial = user.name?.trim()?.[0] ?? "ک";

  return (
    <>
      {/* سکشن ۱: اطلاعات پروفایل و هویت فردی */}
      <section
        className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 border border-surface-container-high shadow-sm space-y-6"
        id="profile"
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                person
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                اطلاعات پروفایل و اعتبار سنجی هویت
              </h3>
              <p className="text-xs text-on-surface-variant">
                اطلاعات هویتی فقط برای نمایش عمومی پروفایل استفاده می‌شود
              </p>
            </div>
          </div>
        </div>
        {/* کارت آواتار و مشخصات اجمالی */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-surface-container-low border border-surface-container-high">
          <div className="relative">
            {user.avatarUrl ? (
              <div
                className="size-28 rounded-2xl bg-cover bg-center border-4 border-surface-container-lowest shadow-md"
                style={{ backgroundImage: `url("${user.avatarUrl}")` }}
              />
            ) : (
              <div className="size-28 rounded-2xl bg-m3-primary/10 border-4 border-surface-container-lowest shadow-md flex items-center justify-center text-4xl font-black text-m3-primary">
                {initial}
              </div>
            )}
            <button
              className="absolute -bottom-2 -left-2 size-9 bg-m3-primary text-white rounded-xl shadow-lg hover:bg-m3-primary/90 flex items-center justify-center transition-transform hover:scale-105"
              disabled
              title="تغییر عکس نمایه — به‌زودی"
              type="button"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
            </button>
          </div>
          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="text-xl font-black text-on-surface">{user.name}</h4>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${kycStyle}`}>
                <span className="material-symbols-outlined text-sm">{kycIcon}</span>
                احراز هویت: {kycLabel}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              عضویت از {joinedFaDate} • {toPersianDigits(completedRentals)} رزرو
              موفق • {user.isHost ? "میزبان اورا" : "کاربر اورا"}
            </p>
          </div>
          <div className="sm:self-center">
            <button
              className="px-4 py-2 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              disabled
              title="به‌زودی"
              type="button"
            >
              <span className="material-symbols-outlined text-base">cloud_upload</span>
              <span className="">بارگذاری تصویر جدید</span>
            </button>
          </div>
        </div>
        {/* کارت وضعیت KYC — real kycStatus from the session user */}
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-m3-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">identity_platform</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-on-surface">
                وضعیت احراز هویت (KYC): {kycLabel}
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                بارگذاری و بررسی مدارک هویتی توسط اپراتورهای اورا انجام می‌شود؛
                این فرآیند خودکار نیست. در نسخه آزمایشی، احراز هویت صرفاً شبیه‌سازی
                شده است.
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold self-start sm:self-center inline-flex items-center gap-1 ${kycStyle}`}>
            <span className="material-symbols-outlined text-sm">{kycIcon}</span>
            {kycLabel}
          </span>
        </div>
        {/* فرم دو ستونه مشخصات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* نام و نام خانوادگی (editable) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1" htmlFor="profile-name">
              <span className="">نام و نام خانوادگی</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                className="w-full h-11 px-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-m3-primary focus:border-transparent text-on-surface"
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-m3-secondary text-lg">
                person
              </span>
            </div>
          </div>
          {/* کد ملی (locked — honest demo labelling) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">کد ملی (تایید هویت)</label>
            </div>
            <div className="relative">
              <input
                className="w-full h-11 px-3.5 bg-surface-container border border-dashed border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface-variant cursor-not-allowed"
                disabled
                placeholder="در نسخه آزمایشی ثبت نشده است"
                title="کد ملی در نسخه آزمایشی جمع‌آوری نمی‌شود"
                type="text"
                value=""
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                lock
              </span>
            </div>
          </div>
          {/* شماره همراه (locked) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">
                شماره تلفن همراه (سامانه احراز هویت)
              </label>
              <span className="text-[11px] text-m3-secondary font-semibold cursor-not-allowed" title="به‌زودی">
                درخواست تغییر خط
              </span>
            </div>
            <div className="relative">
              <input
                className="w-full h-11 px-3.5 bg-surface-container border border-dashed border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface-variant text-left font-mono cursor-not-allowed"
                disabled
                type="text"
                value={toPersianDigits(user.phone)}
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-emerald-600 text-lg">
                check_circle
              </span>
            </div>
          </div>
          {/* شهر (editable — saved with profile) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface" htmlFor="profile-city">
              شهر (محل پیش‌فرض تحویل وسایل)
            </label>
            <div className="relative">
              <input
                className="w-full h-11 px-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-m3-primary focus:border-transparent text-on-surface"
                id="profile-city"
                placeholder="مثال: تهران"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-m3-secondary text-lg">
                location_on
              </span>
            </div>
          </div>
          {/* ایمیل (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface">نشانی پست الکترونیک</label>
            <div className="relative">
              <input
                className="w-full h-11 px-3.5 bg-surface-container border border-dashed border-outline-variant/60 rounded-xl text-sm font-medium text-on-surface-variant text-left font-sans cursor-not-allowed"
                disabled
                placeholder="در نسخه آزمایشی ثبت نشده است"
                title="ویرایش ایمیل به‌زودی فعال می‌شود"
                type="email"
                value={user.email ?? ""}
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-m3-secondary text-lg">
                mail
              </span>
            </div>
          </div>
          {/* بیوگرافی و معرفی عمومی (editable) */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-on-surface" htmlFor="profile-bio">
              بیوگرافی و معرفی کوتاه در پروفایل عمومی
            </label>
            <textarea
              className="w-full p-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm font-normal focus:ring-2 focus:ring-m3-primary focus:border-transparent text-on-surface leading-relaxed"
              id="profile-bio"
              maxLength={500}
              placeholder="خودتان را در چند خط معرفی کنید؛ مثلاً نوع وسایلی که اجاره می‌دهید و شرایط تحویل."
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="text-[11px] text-on-surface-variant text-left">
              {toPersianDigits(bio.length)} / ۵۰۰ کاراکتر
            </p>
          </div>
        </div>
        {profileError ? (
          <div className="rounded-xl bg-m3-error-container text-m3-on-error-container px-4 py-3 text-xs font-bold" role="alert">
            {profileError}
          </div>
        ) : null}
      </section>

      {/* سکشن ۲: ترجیحات میزبانی و رزرو آنلاین وسایل */}
      <section
        className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 border border-surface-container-high shadow-sm space-y-6"
        id="preferences"
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-m3-secondary/10 text-m3-secondary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                tune
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                ترجیحات میزبانی و فرآیند رزرو (Host Preferences)
              </h3>
              <p className="text-xs text-on-surface-variant">
                قوانین پذیرش سفارشات، شیوه‌های ارسال کالا و زمان‌بندی عودت
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-surface-container text-m3-secondary text-xs font-bold">
            بخش فعال
          </span>
        </div>
        {/* گزینه‌های تحویل و لجستیک */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-on-surface block">
            شیوه‌های مجاز تحویل و عودت کالا به مشتری:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                prefs.pickupInPerson
                  ? "border-2 border-m3-primary bg-m3-primary/5"
                  : "border border-outline-variant/50 hover:border-m3-outline bg-surface-container-low"
              }`}
            >
              <input
                checked={prefs.pickupInPerson}
                className="mt-1 size-4 rounded text-m3-primary focus:ring-m3-primary border-outline-variant"
                type="checkbox"
                onChange={(e) => setPref("pickupInPerson", e.target.checked)}
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-on-surface">
                  <span className="material-symbols-outlined text-m3-primary text-base">storefront</span>
                  <span className="">تحویل حضوری در محل میزبان</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  مستاجر شخصاً به نشانی تعیین‌شده شما مراجعه می‌کند.
                </p>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                prefs.deliveryCourier
                  ? "border-2 border-m3-primary bg-m3-primary/5"
                  : "border border-outline-variant/50 hover:border-m3-outline bg-surface-container-low"
              }`}
            >
              <input
                checked={prefs.deliveryCourier}
                className="mt-1 size-4 rounded text-m3-primary focus:ring-m3-primary border-outline-variant"
                type="checkbox"
                onChange={(e) => setPref("deliveryCourier", e.target.checked)}
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-on-surface">
                  <span className="material-symbols-outlined text-m3-primary text-base">electric_moped</span>
                  <span className="">پیک اکسپرس و سفیر اورا</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  ارسال امن با بیمه ترانزیت کالا توسط ناوگان اختصاصی اورا اکسپرس.
                </p>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                prefs.selfDelivery
                  ? "border-2 border-m3-primary bg-m3-primary/5"
                  : "border border-outline-variant/50 hover:border-m3-outline bg-surface-container-low"
              }`}
            >
              <input
                checked={prefs.selfDelivery}
                className="mt-1 size-4 rounded text-m3-primary focus:ring-m3-primary border-outline-variant"
                type="checkbox"
                onChange={(e) => setPref("selfDelivery", e.target.checked)}
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-on-surface">
                  <span className="material-symbols-outlined text-m3-secondary text-base">local_shipping</span>
                  <span className="">تحویل اختصاصی توسط خود میزبان</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  میزبان خودش با دریافت هزینه ایاب‌وذهاب کالا را به مقصد می‌برد.
                </p>
              </div>
            </label>
          </div>
        </div>
        {/* فیلدهای تخصصی قوانین */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* سیاست کنسلی */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface" htmlFor="pref-cancel">
              سیاست پیش‌فرض کنسلی رزرو
            </label>
            <select
              className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs lg:text-sm font-medium focus:ring-2 focus:ring-m3-primary text-on-surface"
              id="pref-cancel"
              value={prefs.cancelPolicy}
              onChange={(e) => setPref("cancelPolicy", e.target.value)}
            >
              <option value="flexible">انعطاف‌پذیر (استرداد ۱۰۰٪ تا ۲۴ ساعت قبل)</option>
              <option value="semi">نیمه‌منعطف (استرداد ۵۰٪ تا ۴۸ ساعت قبل)</option>
              <option value="strict">سخت‌گیرانه (عدم استرداد در صورت کنسلی زیر ۷۲ ساعت)</option>
            </select>
          </div>
          {/* مهلت بازرسی سلامت کالا */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface" htmlFor="pref-inspection">
              مهلت زمان تحویل و بازرسی فنی کالا
            </label>
            <select
              className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs lg:text-sm font-medium focus:ring-2 focus:ring-m3-primary text-on-surface"
              id="pref-inspection"
              value={prefs.inspectionWindow}
              onChange={(e) => setPref("inspectionWindow", e.target.value)}
            >
              <option value="1h">۱ ساعت پس از تحویل</option>
              <option value="2h">۲ ساعت پس از تحویل (استاندارد اورا)</option>
              <option value="4h">۴ ساعت جهت تجهیزات فیلم‌برداری تخصصی</option>
            </select>
          </div>
          {/* بازه مدت زمان اجاره */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface">
              حداقل و حداکثر مدت اجاره هر سفارش
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-medium text-center"
                  max={90}
                  min={1}
                  type="number"
                  value={prefs.minDays}
                  onChange={(e) => setPref("minDays", Number(e.target.value) || 1)}
                />
                <span className="absolute left-2 top-3 text-[11px] text-on-surface-variant">روز</span>
              </div>
              <span className="text-on-surface-variant text-xs">تا</span>
              <div className="relative flex-1">
                <input
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-medium text-center"
                  max={365}
                  min={1}
                  type="number"
                  value={prefs.maxDays}
                  onChange={(e) => setPref("maxDays", Number(e.target.value) || 1)}
                />
                <span className="absolute left-2 top-3 text-[11px] text-on-surface-variant">روز</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant bg-surface-container rounded-xl p-3">
          در نسخه آزمایشی، ترجیحات میزبانی روی همین صفحه اعمال می‌شوند و با حساب
          شما ذخیره دائمی نمی‌شوند.
        </p>
      </section>

      {/* سکشن ۳: حساب‌های بانکی و تسویه خودکار */}
      <section
        className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 border border-surface-container-high shadow-sm space-y-6"
        id="payout"
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                account_balance_wallet
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                حساب‌های بانکی و چرخه تسویه خودکار (Payout &amp; Banking)
              </h3>
              <p className="text-xs text-on-surface-variant">
                واریز مستقیم وجوه اجاره به حساب شبای شتابی تایید شده میزبان
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-xl bg-m3-primary text-white font-bold text-xs hover:bg-m3-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
            disabled
            title="به‌زودی"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="">افزودن شماره شبا جدید</span>
          </button>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-[11px] font-bold text-amber-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">science</span>
          شبیه‌سازی: اطلاعات بانکی زیر نمونه نمایشی است و هیچ تسویه واقعی انجام
          نمی‌شود.
        </div>
        {/* کارت‌های شبای موجود */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* کارت شبا فعال اصلی (نمونه نمایشی) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1d162a] to-[#2e2343] text-white relative overflow-hidden shadow-lg border border-[#473864]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center font-bold text-xs text-rose-300">
                  ملت
                </div>
                <div>
                  <h4 className="font-bold text-sm">بانک ملت ایران</h4>
                  <p className="text-[11px] text-[#cebdff]/70">حساب جاری متمرکز جام</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                حساب پیش‌فرض تسویه
              </span>
            </div>
            <div className="my-6">
              <div className="text-[11px] text-[#cebdff]/60 mb-1">شماره شبا (IBAN):</div>
              <div className="font-mono text-base lg:text-lg font-bold tracking-widest text-[#ece4ff] text-left">
                IR58 0120 0000 0000 0048 2144 01
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#41335b] text-xs">
              <span className="text-[#cebdff]/80">
                صاحب حساب: <strong className="text-white">{user.name}</strong>
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                پایا / ساتنا فعال
              </span>
            </div>
          </div>
          {/* تنظیمات تسویه و زمان‌بندی */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-base">schedule</span>
                قوانین و چرخه خودکار انتقال وجه
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                مبالغ اجاره به طور پیش‌فرض{" "}
                <strong>۲۴ ساعت پس از پایان موفق دوره اجاره</strong> و پس از ثبت
                تاییدیه عدم خسارت توسط طرفین، به صورت خودکار به شماره شبای فعال
                فوق واریز می‌گردد. (در نسخه آزمایشی، تسویه شبیه‌سازی می‌شود.)
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40">
                  <span className="text-[11px] text-on-surface-variant block">
                    حداقل مبلغ تسویه خودکار:
                  </span>
                  <span className="text-sm font-bold text-m3-primary">
                    {faToman(500000)} تومان
                  </span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40">
                  <span className="text-[11px] text-on-surface-variant block">
                    کارمزد پلتفرم اورا:
                  </span>
                  <span className="text-sm font-bold text-emerald-600">۸٪ (سطح طلایی)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-surface-container text-xs">
              <span className="text-on-surface-variant">
                آخرین تسویه: ۳ روز پیش ({faToman(4850000)} تومان)
              </span>
              <Link className="text-m3-primary font-bold hover:underline" href="/wallet">
                مشاهده تاریخچه تراکنش‌ها
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* سکشن ۴: امنیت، ورود دو مرحله‌ای و نشست‌های فعال */}
      <section
        className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 border border-surface-container-high shadow-sm space-y-6"
        id="security"
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-m3-secondary/10 text-m3-secondary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                security
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                امنیت حساب و نشست‌های فعال (Security &amp; Sessions)
              </h3>
              <p className="text-xs text-on-surface-variant">
                تنظیمات ورود دومرحله‌ای، تغییر گذرواژه و مدیریت دستگاه‌های متصل
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">shield</span>
            امنیت فوق‌العاده بالا
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ورود دومرحله‌ای و تغییر پسورد */}
          <div className="space-y-4">
            {/* وضعیت ۲FA */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">
                    phonelink_lock
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    احراز هویت دو مرحله‌ای (SMS / OTP)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  ارسال کد امنیتی پیامکی به {maskPhone(user.phone)} در هر بار ورود
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                فعال است
              </span>
            </div>
            {/* تغییر رمز عبور (به‌زودی) */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-base">password</span>
                تغییر رمز عبور حساب
              </h4>
              <div className="space-y-2.5" title="تغییر رمز عبور در نسخه آزمایشی فعال نیست">
                <input
                  className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs focus:ring-1 focus:ring-m3-primary disabled:opacity-60"
                  disabled
                  placeholder="رمز عبور فعلی"
                  type="password"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs focus:ring-1 focus:ring-m3-primary disabled:opacity-60"
                    disabled
                    placeholder="رمز عبور جدید"
                    type="password"
                  />
                  <input
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs focus:ring-1 focus:ring-m3-primary disabled:opacity-60"
                    disabled
                    placeholder="تکرار رمز جدید"
                    type="password"
                  />
                </div>
                <button
                  className="w-full h-10 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled
                  title="به‌زودی"
                  type="button"
                >
                  به‌روزرسانی رمز عبور
                </button>
                <p className="text-[10px] text-on-surface-variant">
                  تغییر رمز عبور در نسخه آزمایشی فعال نیست؛ برای ورود از OTP
                  استفاده کنید.
                </p>
              </div>
            </div>
          </div>
          {/* لیست نشست‌های فعال */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-secondary text-base">devices</span>
                دستگاه‌ها و نشست‌های مجاز (Active Sessions)
              </h4>
              <button
                className="text-xs text-rose-600 font-bold hover:underline disabled:opacity-60"
                disabled
                title="به‌زودی"
                type="button"
              >
                خروج از سایر دستگاه‌ها
              </button>
            </div>
            <div className="space-y-2.5">
              {/* نشست ۱ (فعلی) */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border-2 border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">laptop_windows</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface">
                        مرورگر فعلی شما
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold">
                        این دستگاه (جاری)
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">
                      نشست جاری وارد‌شده به حساب اورا
                    </span>
                  </div>
                </div>
                <span className="size-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              </div>
              {/* نشست ۲ */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">smartphone</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      اپلیکیشن اورا • iPhone 13 Pro (iOS 17.4)
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      آخرین فعالیت: ۲ ساعت پیش • تهران
                    </span>
                  </div>
                </div>
                <button
                  className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold disabled:opacity-60"
                  disabled
                  title="به‌زودی"
                  type="button"
                >
                  خروج
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant">
                فهرست دستگاه‌ها در نسخه آزمایشی صرفاً نمایشی است.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* سکشن ۵: اعلان‌ها و اطلاع‌رسانی‌ها */}
      <section
        className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 border border-surface-container-high shadow-sm space-y-6"
        id="notifications"
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                notifications_active
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                اعلان‌ها و کانال‌های اطلاع‌رسانی هوشمند
              </h3>
              <p className="text-xs text-on-surface-variant">
                شخصی‌سازی شیوه دریافت رویدادها، تایید رزروها و تراکنش‌های مالی
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-m3-secondary">پیامک و ایمیل</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* رویدادهای پیامک فوری */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary text-base">sms</span>
              پیامک‌های فوق‌العاده حیاتی (SMS آنی)
            </h4>
            <div className="space-y-2.5 pt-1">
              {(
                [
                  ["smsNewReservation", "ثبت درخواست رزرو جدید یا رزرو فوری"],
                  ["smsNewMessage", "پیام جدید مستاجر در گفتگوی رزرو جاری"],
                  ["smsPayout", "واریز وجه تسویه حساب به شماره شبا"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <span className="text-xs font-semibold text-on-surface">{label}</span>
                  <input
                    checked={prefs[key]}
                    className="size-4 rounded text-m3-primary focus:ring-m3-primary border-outline-variant"
                    type="checkbox"
                    onChange={(e) => setPref(key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          </div>
          {/* اعلان‌های ایمیل و Push */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-secondary text-base">
                forward_to_inbox
              </span>
              ایمیل، نوتیفیکیشن و بولتن تحلیلی
            </h4>
            <div className="space-y-2.5 pt-1">
              {(
                [
                  ["emailWeeklyReport", "گزارش هفتگی درآمد و تقاضای کالاها در منطقه شما"],
                  ["emailInvoice", "صدور فاکتور و صورت‌حساب رسمی مالیاتی ماهانه"],
                  ["emailCampaigns", "اخبار کمپین‌های تخفیفی و مشوق‌های فصلی اورا"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <span className="text-xs font-semibold text-on-surface">{label}</span>
                  <input
                    checked={prefs[key]}
                    className="size-4 rounded text-m3-primary focus:ring-m3-primary border-outline-variant"
                    type="checkbox"
                    onChange={(e) => setPref(key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* اعلان‌های واقعی کاربر — GET/POST /api/notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <span className="material-symbols-outlined text-m3-primary text-lg">notifications</span>
            اعلان‌های اخیر حساب شما
          </div>
          {children}
        </div>
      </section>

      {/* سکشن ۶: ناحیه خطر و تعلیق موقت حساب */}
      <section className="bg-rose-50/70 rounded-3xl p-6 lg:p-8 border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-950">
              ناحیه مدیریت حساس و تعلیق میزبانی (Danger Zone)
            </h3>
            <p className="text-xs text-rose-800">
              حالت مسافرت یا عدم امکان ارائه خدمات به مدت معین
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-rose-200">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-on-surface">
              حالت مرخصی میزبان (تعلیق موقت نمایش در جستجو)
            </h4>
            <p className="text-xs text-on-surface-variant">
              تمام آگهی‌های شما موقتاً مخفی می‌شوند بدون اینکه امتیازات، رتبه یا
              نظرات طلایی شما مخدوش شود.
            </p>
          </div>
          <button
            className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs transition-colors whitespace-nowrap self-start sm:self-center disabled:opacity-60"
            disabled
            title="به‌زودی"
            type="button"
          >
            فعال‌سازی حالت مرخصی
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-rose-200">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-on-surface">خروج از حساب کاربری</h4>
            <p className="text-xs text-on-surface-variant">
              با خروج، نشست فعلی در همه صفحات به حالت مهمان بازمی‌گردد.
            </p>
          </div>
          <button
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors whitespace-nowrap self-start sm:self-center disabled:opacity-60 flex items-center gap-1.5"
            disabled={signingOut}
            onClick={signOut}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            {signingOut ? "در حال خروج…" : "خروج از حساب"}
          </button>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs text-rose-700">
          <span className="">
            جهت حذف دائم حساب کاربری یا خاتمه کامل قرارداد میزبانی، با واحد حقوقی
            اورا در ارتباط باشید.
          </span>
          <Link className="font-bold underline hover:text-rose-950" href="/damage-claims">
            ارسال تیکت به واحد حقوقی
          </Link>
        </div>
      </section>

      {/* دکمه شناور نهایی ذخیره تغییرات در پایین صفحه */}
      <div className="p-4 bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
        <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-emerald-600 text-lg">
            {dirty ? "edit_note" : "check_circle"}
          </span>
          <span className="">
            {dirty
              ? "تغییرات پروفایل ذخیره‌نشده دارید؛ برای ثبت، «ذخیره نهایی تنظیمات» را بزنید."
              : "تمام تغییرات به صورت رمزنگاری‌شده در سرورهای ابری اورا ثبت خواهند شد."}
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
            onClick={resetAll}
            type="button"
          >
            انصراف و بازنشانی
          </button>
          <button
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-m3-primary text-white font-bold text-xs shadow-md shadow-m3-primary/30 hover:bg-m3-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={saving}
            onClick={saveProfile}
            type="button"
          >
            {saving ? (
              <>
                <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                در حال ذخیره…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span className="">ذخیره نهایی تنظیمات</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Toaster position="top-center" richColors dir="rtl" />
    </>
  );
}
