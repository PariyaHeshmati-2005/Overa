"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { faNumber } from "@/lib/format";
import JalaliCalendar from "@/components/overa/JalaliCalendar";
import {
  formatJalaliIso,
  rangeHitsBooked,
  rentalDaysIso,
  type DateRange,
} from "@/lib/jalali";

type CategoryDTO = { id: string; name: string; icon: string | null };

export type WizardInitial = {
  id: string;
  status: string;
  categoryId: string;
  title: string;
  description: string;
  brand: string | null;
  specs: string | null;
  dailyPrice: number;
  weeklyPrice: number | null;
  deposit: number;
  city: string;
  area: string | null;
  rules: string | null;
  minDays: number;
  maxDays: number;
  instantBook: boolean;
  pickupInPerson: boolean;
  deliveryCourier: boolean;
  images: string[];
  /** Owner-blocked ranges already stored on the listing (edit mode). */
  blockedRanges: DateRange[];
  /** Inclusive ISO ranges of this listing's non-cancelled reservations. */
  reservedRanges: DateRange[];
} | null;

type Props = {
  categories: CategoryDTO[];
  sampleImages: string[];
  initial: WizardInitial;
  userName: string;
  categoryAvgPrice: Record<string, number>;
};

type FormData = {
  categoryId: string;
  title: string;
  brand: string;
  model: string;
  buildYear: string;
  province: string;
  city: string;
  area: string;
  pickupInPerson: boolean;
  deliveryCourier: boolean;
  biometricAuth: boolean;
  condition: string;
  serialNumber: string;
  specs: string;
  description: string;
  accessories: string[];
  images: string[];
  dailyPrice: string;
  weeklyPrice: string;
  deposit: string;
  minDays: string;
  maxDays: string;
  /** Owner-blocked availability picked on the Jalali calendar (step 3). */
  blockedRanges: DateRange[];
  discountPercent: number;
  acceptPromissoryNote: boolean;
  bufferHours: string;
  instantBook: boolean;
  cancellationPolicy: string;
  customRules: string;
  agreeTerms1: boolean;
  agreeTerms2: boolean;
};

const DEFAULT_FORM: FormData = {
  categoryId: "",
  title: "",
  brand: "",
  model: "",
  buildYear: "۱۴۰۲ (۲۰۲۳ - ۲۰۲۴)",
  province: "تهران",
  city: "تهران",
  area: "",
  pickupInPerson: true,
  deliveryCourier: false,
  biometricAuth: true,
  condition: "like_new",
  serialNumber: "",
  specs: "",
  description: "",
  accessories: [],
  images: [],
  dailyPrice: "",
  weeklyPrice: "",
  deposit: "",
  minDays: "1",
  maxDays: "30",
  blockedRanges: [],
  discountPercent: 15,
  acceptPromissoryNote: true,
  bufferHours: "24",
  instantBook: false,
  cancellationPolicy: "flexible",
  customRules: "",
  agreeTerms1: false,
  agreeTerms2: false,
};

const STEPS: { num: 1 | 2 | 3 | 4; title: string }[] = [
  { num: 1, title: "اطلاعات پایه و دسته‌بندی" },
  { num: 2, title: "تصاویر و مشخصات فنی" },
  { num: 3, title: "قیمت‌گذاری و تقویم" },
  { num: 4, title: "قوانین تحویل و تایید نهایی" },
];

const PERCENTS = ["۲۵٪", "۵۰٪", "۷۵٪", "۱۰۰٪"];
const WIDTHS = ["25%", "50%", "75%", "100%"];

const PROVINCES = ["تهران", "البرز", "اصفهان", "فارس", "خراسان رضوی"];
const PROVINCE_CITIES: Record<string, string[]> = {
  "تهران": ["تهران", "شمیرانات", "ری", "پردیس"],
  "البرز": ["کرج", "مهرشهر"],
  "اصفهان": ["اصفهان", "کاشان"],
  "فارس": ["شیراز"],
  "خراسان رضوی": ["مشهد", "نیشابور"],
};

const CONDITIONS = [
  { val: "like_new", label: "در حد نو / بدون خط و خش", desc: "مشابه وسیله نو، بدون عیب ظاهری یا سنسوری" },
  { val: "very_clean", label: "بسیار تمیز با کارکرد جزئی", desc: "دارای رد کارکرد مختصر، کاملاً تست‌شده و سالم" },
  { val: "used_good", label: "کارکرده و کاملاً سالم", desc: "دارای خط و خش یا ساییدگی اما عملکرد فنی بی‌نقص" },
];

const CANCELLATION_POLICIES = [
  { id: "flexible", title: "انعطاف‌پذیر (پیشنهادی)", desc: "استرداد ۱۰۰٪ وجه تا ۲۴ ساعت قبل از شروع رزرو، کسر ۱۰٪ در صورت لغو در روز تحویل." },
  { id: "moderate", title: "نیمه‌سخت‌گیرانه", desc: "استرداد کامل تا ۳ روز قبل؛ بازگشت ۵۰٪ وجه در صورت لغو در کمتر از ۷۲ ساعت مانده به اجاره." },
  { id: "strict", title: "سخت‌گیرانه", desc: "استرداد ۷۰٪ وجه فقط تا ۵ روز قبل؛ در صورت کنسلی بعد از آن مبلغی مسترد نمی‌شود." },
];

const TOP_BRANDS = ["Sony", "Canon", "DJI", "Blackmagic"];

function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/,/g, "")
    .trim();
}

function parseNum(s: string): number {
  const n = Number(normalizeDigits(s));
  return Number.isFinite(n) ? n : NaN;
}

function priceDisplay(s: string): string {
  const n = parseNum(s);
  return Number.isFinite(n) && n > 0 ? faNumber(n) : s;
}

export default function CreateListingWizard({ categories, sampleImages, initial, userName, categoryAvgPrice }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [published, setPublished] = useState<{ id: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);
  const [rentalDaysEst, setRentalDaysEst] = useState(10);
  const [newAccessory, setNewAccessory] = useState("");
  // In-progress Jalali block-range selection (first click = start, second = end).
  const [blockStart, setBlockStart] = useState<string | null>(null);
  const [blockEnd, setBlockEnd] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(() => {
    if (!initial) return { ...DEFAULT_FORM };
    const province =
      PROVINCES.find((p) => PROVINCE_CITIES[p]?.includes(initial.city)) ?? "تهران";
    return {
      ...DEFAULT_FORM,
      categoryId: initial.categoryId,
      title: initial.title,
      description: initial.description,
      brand: initial.brand ?? "",
      specs: initial.specs ?? "",
      dailyPrice: initial.dailyPrice ? String(initial.dailyPrice) : "",
      weeklyPrice: initial.weeklyPrice ? String(initial.weeklyPrice) : "",
      deposit: String(initial.deposit ?? ""),
      city: initial.city,
      province,
      area: initial.area ?? "",
      pickupInPerson: initial.pickupInPerson,
      deliveryCourier: initial.deliveryCourier,
      instantBook: initial.instantBook,
      minDays: String(initial.minDays ?? 1),
      maxDays: String(initial.maxDays ?? 30),
      blockedRanges: initial.blockedRanges,
      customRules: initial.rules ?? "",
      images: initial.images,
    };
  });

  const update = (fields: Partial<FormData>) => setForm((prev) => ({ ...prev, ...fields }));

  const dailyNum = parseNum(form.dailyPrice);
  const depositNum = parseNum(form.deposit);

  const cityOptions = useMemo(() => {
    const base = PROVINCE_CITIES[form.province] ?? [];
    if (form.city && !base.includes(form.city)) return [form.city, ...base];
    return base;
  }, [form.province, form.city]);

  const poolImages = showAllImages ? sampleImages : sampleImages.slice(0, 18);

  function toggleImage(url: string) {
    if (form.images.includes(url)) {
      update({ images: form.images.filter((u) => u !== url) });
      return;
    }
    if (form.images.length >= 8) {
      toast.error("حداکثر ۸ تصویر می‌توانید انتخاب کنید.");
      return;
    }
    update({ images: [...form.images, url] });
  }

  function addAccessory() {
    const v = newAccessory.trim();
    if (!v) return;
    update({ accessories: [...form.accessories, v] });
    setNewAccessory("");
  }

  // Non-cancelled reservations of the edited listing (empty for new listings);
  // the host calendar renders them as locked days that cannot be blocked.
  const reservedRanges = initial?.reservedRanges ?? [];

  /** Completed Jalali block-range → append to the form (overlap-guarded). */
  function handleBlockPick(s: string | null, e: string | null) {
    setBlockStart(s);
    setBlockEnd(e);
    if (!s || !e) return;
    if (rangeHitsBooked(s, e, reservedRanges)) {
      toast.error("این بازه با اجاره‌های فعلی هم‌پوشانی دارد و قابل مسدودسازی نیست.");
    } else if (rangeHitsBooked(s, e, form.blockedRanges)) {
      toast.error("این روزها قبلاً مسدود شده‌اند.");
    } else {
      update({
        blockedRanges: [...form.blockedRanges, { start: s, end: e }].sort((a, b) =>
          a.start < b.start ? -1 : 1,
        ),
      });
    }
    setBlockStart(null);
    setBlockEnd(null);
  }

  function removeBlockedRange(start: string, end: string) {
    update({
      blockedRanges: form.blockedRanges.filter((r) => r.start !== start || r.end !== end),
    });
  }

  function clearBlockedRanges() {
    update({ blockedRanges: [] });
    setBlockStart(null);
    setBlockEnd(null);
  }

  function validateStep(n: 1 | 2 | 3 | 4): boolean {
    const errs: Record<string, string> = {};
    if (n === 1) {
      if (!form.categoryId) errs.categoryId = "دسته‌بندی را انتخاب کنید.";
      if (form.title.trim().length < 15)
        errs.title = "عنوان آگهی باید حداقل ۱۵ کاراکتر باشد.";
    }
    if (n === 2) {
      if (form.description.trim().length < 20)
        errs.description = "توضیحات باید حداقل ۲۰ کاراکتر باشد.";
      if (form.images.length < 1)
        errs.images = "حداقل یک تصویر از نمونه‌ها انتخاب کنید.";
    }
    if (n === 3) {
      if (!Number.isFinite(dailyNum) || dailyNum < 1000)
        errs.dailyPrice = "قیمت روزانه معتبر نیست (حداقل ۱,۰۰۰ تومان).";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  function goStep(n: 1 | 2 | 3 | 4) {
    if (n > step && !validateStep(step)) return;
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildBody(submit: boolean) {
    const specs = [
      form.specs.trim(),
      form.model.trim() ? `مدل: ${form.model.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
    const weekly = parseNum(form.weeklyPrice);
    return {
      categoryId: form.categoryId,
      title: form.title.trim(),
      description: form.description.trim(),
      brand: form.brand.trim() || undefined,
      specs: specs || undefined,
      dailyPrice: Math.floor(dailyNum),
      weeklyPrice: Number.isFinite(weekly) && weekly > 0 ? Math.floor(weekly) : undefined,
      deposit: Number.isFinite(depositNum) && depositNum > 0 ? Math.floor(depositNum) : 0,
      city: form.city,
      area: form.area.trim() || undefined,
      rules: form.customRules.trim() || undefined,
      minDays: Number(form.minDays) || 1,
      maxDays: Number(form.maxDays) || 30,
      blockedRanges: form.blockedRanges,
      instantBook: form.instantBook,
      deliveryCourier: form.deliveryCourier,
      pickupInPerson: form.pickupInPerson,
      images: form.images,
      submit,
    };
  }

  async function saveDraft() {
    // Server-side minimums for a draft: category + title(5) + description(20)
    if (!form.categoryId) {
      toast.error("دسته‌بندی را انتخاب کنید.");
      setStep(1);
      return;
    }
    if (form.title.trim().length < 5) {
      toast.error("عنوان وسیله باید حداقل ۵ کاراکتر باشد.");
      setStep(1);
      return;
    }
    if (form.description.trim().length < 20) {
      toast.error("توضیحات باید حداقل ۲۰ کاراکتر باشد.");
      setStep(2);
      return;
    }
    setSavingDraft(true);
    try {
      const editing = Boolean(initial);
      const res = await fetch(editing ? `/api/listings/${initial!.id}` : "/api/listings", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(false)),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "ذخیره پیش‌نویس ممکن نشد.");
        return;
      }
      const now = new Date();
      setDraftTime(
        `${toFa(now.getHours())}:${toFa(now.getMinutes())}`,
      );
      toast.success("پیش‌نویس شما با موفقیت ذخیره شد.");
      router.push("/my-items");
    } catch {
      toast.error("خطای شبکه — دوباره تلاش کنید.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function finalSubmit() {
    for (const n of [1, 2, 3] as const) {
      if (!validateStep(n)) {
        setStep(n);
        return;
      }
    }
    setSubmitting(true);
    try {
      const editing = Boolean(initial);
      const body: Record<string, unknown> = { ...buildBody(true) };
      if (editing && (initial!.status === "DRAFT" || initial!.status === "REJECTED")) {
        body.status = "PENDING";
      }
      const res = await fetch(editing ? `/api/listings/${initial!.id}` : "/api/listings", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "ثبت نهایی آگهی ممکن نشد.");
        return;
      }
      const id = editing ? initial!.id : (data.listing?.id as string | undefined);
      setPublished({ id: id ?? "—" });
      toast.success("آگهی شما با موفقیت ثبت شد و در صف تایید کارشناسان قرار گرفت!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("خطای شبکه — دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetWizard() {
    setForm({ ...DEFAULT_FORM });
    setErrors({});
    setPublished(null);
    setStep(1);
    window.scrollTo({ top: 0 });
  }

  const previewImage = form.images[0] ?? null;
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const avgPrice = form.categoryId ? categoryAvgPrice[form.categoryId] : undefined;

  /* ------------------------------ header/stepper --------------------------- */
  const header = (
    <div className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40 px-6 lg:px-12 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-on-surface-variant">
          {draftTime || initial ? (
            <span className="inline-flex items-center gap-1 text-m3-primary font-medium bg-surface-container-high px-2.5 py-1 rounded-full">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                edit_document
              </span>
              {draftTime
                ? `پیش‌نویس ذخیره‌شده: ${draftTime}`
                : "ویرایش پیش‌نویس ذخیره‌شده"}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 mr-auto">
          <button
            onClick={saveDraft}
            disabled={savingDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-m3-secondary hover:bg-surface-container rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{savingDraft ? "در حال ذخیره…" : "ذخیره موقت"}</span>
          </button>
          <Link
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:text-m3-error hover:bg-m3-error-container/20 rounded-lg transition-colors"
            href="/my-items"
          >
            <span>خروج از ثبت</span>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </Link>
        </div>
      </div>
    </div>
  );

  const stepper = (
    <section className="w-full bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-sm mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {STEPS.map((st) => {
          const isPast = st.num < step;
          const isCurrent = st.num === step;
          if (isPast) {
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => goStep(st.num)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-m3-primary/50 transition-all shadow-sm text-right"
              >
                <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="text-[11px] font-medium text-on-surface-variant truncate">
                    مرحله {st.num === 1 ? "اول" : st.num === 2 ? "دوم" : "سوم"} (تکمیل شد)
                  </span>
                  <span className="text-[13px] font-bold text-on-surface truncate">{st.title}</span>
                </div>
              </button>
            );
          }
          if (isCurrent) {
            return (
              <div
                key={st.num}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-m3-primary text-on-primary ring-2 ring-m3-primary/30 shadow-md transition-all"
              >
                <div className="size-8 rounded-full bg-on-primary text-m3-primary font-black flex items-center justify-center shrink-0 text-sm">
                  {faNumber(st.num)}
                </div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="text-[11px] text-on-primary-container font-medium truncate">
                    {st.num === 4 ? "مرحله نهایی (در حال انجام)" : "مرحله در حال انجام"}
                  </span>
                  <span className="text-[13px] font-extrabold text-on-primary truncate">
                    {st.title}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div
              key={st.num}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/40 border border-dashed border-outline-variant/50 opacity-75"
            >
              <div className="size-8 rounded-full bg-surface-variant text-m3-tertiary font-bold flex items-center justify-center shrink-0 text-sm">
                {faNumber(st.num)}
              </div>
              <div className="flex flex-col text-right min-w-0">
                <span className="text-[11px] text-m3-tertiary">
                  {st.num === 4 ? "پایان فرایند" : "مرحله بعدی"}
                </span>
                <span className="text-[13px] font-semibold text-m3-tertiary truncate">
                  {st.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-m3-tertiary font-medium">
          پیشرفت کلی ثبت آگهی: مرحله {faNumber(step)} از ۴
        </span>
        <div className="flex-1 max-w-md w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="bg-m3-primary h-full rounded-full transition-all duration-500"
            style={{ width: WIDTHS[step - 1] }}
          ></div>
        </div>
        <span className="font-bold text-m3-primary">{PERCENTS[step - 1]} تکمیل شده</span>
      </div>
    </section>
  );

  const heroHeader = (
    <section className="space-y-4 mb-6">
      <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs font-medium text-m3-tertiary">
        <Link className="hover:text-m3-primary transition-colors flex items-center gap-1" href="/">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>خانه</span>
        </Link>
        <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_left</span>
        <span className="text-m3-tertiary">اجاره‌های من</span>
        <span className="material-symbols-outlined text-[14px] text-outline-variant">chevron_left</span>
        <span className="text-on-surface font-bold">
          {initial ? "ویرایش وسیله" : "ثبت وسیله جدید"}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
            {initial ? "ویرایش و تکمیل وسیله" : "ثبت و اجاره دادن وسیله جدید"}
          </h1>
          <p className="text-sm text-m3-tertiary max-w-2xl leading-relaxed">
            وسیله‌های کم‌استفاده خود را به جریان بیندازید و به سادگی کسب درآمد کنید.
            پس از ثبت، آگهی شما برای تایید کارشناس اورا ارسال می‌شود.
          </p>
        </div>
        {initial && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-m3-primary bg-primary-fixed/60 px-3 py-1.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-[15px]">edit</span>
            حالت ویرایش
          </span>
        )}
      </div>
    </section>
  );

  const footer = (
    <footer className="mt-16 border-t border-outline-variant/30 bg-surface-container-lowest py-6 text-center text-xs text-m3-tertiary">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>
          تمامی حقوق مادی و معنوی متعلق به پلتفرم اجاره کالای «اورا» (Overa) می‌باشد © ۱۴۰۳
        </span>
        <div className="flex items-center gap-4">
          <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
            قوانین و مقررات میزبانی
          </Link>
          <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
            حریم خصوصی
          </Link>
          <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
            پوشش بیمه اوراگارد
          </Link>
        </div>
      </div>
    </footer>
  );

  /* --------------------------------- step 1 -------------------------------- */
  const step1 = (
    <div className="flex flex-col w-full">
      {heroHeader}
      {stepper}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-primary-fixed flex items-center justify-center text-m3-primary">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </span>
                <h2 className="text-on-surface font-bold">دسته‌بندی اصلی کالا</h2>
              </div>
              <span className="text-m3-tertiary text-sm">انتخاب الزامی</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.length === 0 ? (
                <div className="col-span-2 sm:col-span-3 rounded-xl border border-m3-error/30 bg-m3-error-container/20 p-4 text-center flex flex-col gap-1.5">
                  <p className="text-sm font-bold text-m3-error">
                    دسته‌بندی‌ها هنوز در پایگاه داده ثبت نشده‌اند
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    پایگاه داده متصل خالی است. برای مقداردهی اولیه دسته‌بندی‌ها یک‌بار دستور{" "}
                    <code className="font-mono" dir="ltr">bun run db:seed:categories</code> را اجرا کنید و
                    سپس این صفحه را دوباره باز کنید. راهنمای کامل در فایل docs/NEON-MIGRATION.md آمده است.
                  </p>
                </div>
              ) : (
              categories.map((cat) => {
                const isSelected = form.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => update({ categoryId: cat.id })}
                    className={`group relative flex flex-col items-center justify-center p-4 rounded-xl text-right transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-m3-primary/10 border-2 border-m3-primary shadow-sm"
                        : "bg-surface-container-low hover:bg-surface-container border-2 border-transparent"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 left-2.5 size-5 rounded-full bg-m3-primary text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                    <div
                      className={`size-12 rounded-full flex items-center justify-center mb-2 shadow-sm ${
                        isSelected ? "bg-m3-primary text-on-primary" : "bg-surface-container-high text-m3-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">{cat.icon ?? "category"}</span>
                    </div>
                    <span
                      className={`text-sm text-center ${isSelected ? "text-m3-primary font-bold" : "text-on-surface"}`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })
              )}
            </div>
            {errors.categoryId && (
              <p className="text-[11px] text-m3-error font-semibold">{errors.categoryId}</p>
            )}
          </section>

          <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-primary-fixed flex items-center justify-center text-m3-primary">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </span>
              <h2 className="text-on-surface font-bold">مشخصات اصلی و هویت وسیله</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-on-surface font-semibold text-sm" htmlFor="itemTitle">
                  عنوان آگهی اجاره
                </label>
                <span className="text-m3-tertiary text-sm">حداقل ۱۵ کاراکتر</span>
              </div>
              <input
                id="itemTitle"
                type="text"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                className="h-12 w-full px-4 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary placeholder:text-m3-tertiary outline-none"
                placeholder="مثال: دوربین سونی Alpha 7 IV به همراه کیف و دو عدد باتری اورجینال"
              />
              {errors.title ? (
                <p className="text-[12px] text-m3-error font-semibold">{errors.title}</p>
              ) : (
                <p className="text-[12px] text-m3-tertiary">
                  عنوانی واضح شامل برند، مدل دقیق و متعلقات همراه بنویسید تا جستجوی کاربران افزایش یابد.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface font-semibold text-sm">برند سازنده</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => update({ brand: e.target.value })}
                    className="h-12 w-full px-4 pl-10 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary outline-none"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">
                    search
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-m3-tertiary">برندهای برتر:</span>
                  {TOP_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => update({ brand: b })}
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        form.brand.toLowerCase().includes(b.toLowerCase())
                          ? "bg-m3-primary/10 text-m3-primary font-bold"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface font-semibold text-sm" htmlFor="modelExact">
                  مدل دقیق کالا (Model)
                </label>
                <input
                  id="modelExact"
                  type="text"
                  value={form.model}
                  onChange={(e) => update({ model: e.target.value })}
                  className="h-12 w-full px-4 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary outline-none"
                  placeholder="Alpha 7 IV (ILCE-7M4)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface font-semibold text-sm">سال ساخت / خرید</label>
                <select
                  value={form.buildYear}
                  onChange={(e) => update({ buildYear: e.target.value })}
                  className="w-full h-12 bg-surface-container-lowest text-on-surface rounded-lg px-8 appearance-none cursor-pointer border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary"
                >
                  <option>۱۴۰۲ (۲۰۲۳ - ۲۰۲۴)</option>
                  <option>۱۴۰۱ (۲۰۲۲)</option>
                  <option>۱۴۰۰ (۲۰۲۱)</option>
                  <option>۱۳۹۹ یا قبل‌تر</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-primary-fixed flex items-center justify-center text-m3-primary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </span>
                <h2 className="text-on-surface font-bold">موقعیت استقرار و محدوده تحویل کالا</h2>
              </div>
              <span className="text-m3-tertiary text-sm hidden md:block">
                حفظ حریم خصوصی: آدرس دقیق پس از رزرو نمایش داده می‌شود
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface font-semibold text-sm">استان</label>
                <select
                  value={form.province}
                  onChange={(e) => {
                    const p = e.target.value;
                    update({ province: p, city: PROVINCE_CITIES[p]?.[0] ?? "تهران" });
                  }}
                  className="w-full h-12 bg-surface-container-lowest text-on-surface rounded-lg px-8 border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary"
                >
                  {PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface font-semibold text-sm">شهر</label>
                <select
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  className="w-full h-12 bg-surface-container-lowest text-on-surface rounded-lg px-8 border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary"
                >
                  {cityOptions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface font-semibold text-sm">محله یا محدوده</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => update({ area: e.target.value })}
                  className="h-12 w-full px-4 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-on-surface font-semibold text-sm">گزینه‌های دریافت و تحویل:</span>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container cursor-pointer text-on-surface text-sm">
                <input
                  type="checkbox"
                  checked={form.pickupInPerson}
                  onChange={(e) => update({ pickupInPerson: e.target.checked })}
                  className="rounded text-m3-primary focus:ring-m3-primary"
                />
                <span>تحویل حضوری در محل میزبان</span>
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container cursor-pointer text-on-surface text-sm">
                <input
                  type="checkbox"
                  checked={form.deliveryCourier}
                  onChange={(e) => update({ deliveryCourier: e.target.checked })}
                  className="rounded text-m3-primary focus:ring-m3-primary"
                />
                <span>ارسال با پیک اکسپرس اورا (هزینه به عهده مستاجر)</span>
              </label>
            </div>

            <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-inner mt-2">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: "url('/assets/img/ee288b739678.jpg')" }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-m3-inverse-surface/60 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                <span className="material-symbols-outlined text-m3-primary text-[18px]">my_location</span>
                <span className="text-on-surface text-sm">
                  محدوده شعاع تقریبی ۲ کیلومتری {form.area || form.city}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col-reverse sm:flex-row items-center gap-4 justify-end">
            <button
              type="button"
              onClick={() => goStep(2)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-lg bg-m3-primary text-on-primary shadow-md hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>ادامه: بارگذاری تصاویر و مشخصات فنی</span>
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-m3-primary">
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
              </span>
              <h3 className="font-bold">راهنمایی بهبود بازدید آگهی</h3>
            </div>
            <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
              <div className="flex items-start gap-2.5">
                <span
                  className="material-symbols-outlined text-m3-primary text-[18px] mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>
                  <strong>دسته‌بندی دقیق:</strong> انتخاب درست دسته‌بندی نرخ کلیک آگهی را
                  به‌طور محسوس ارتقا می‌دهد.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  className="material-symbols-outlined text-m3-primary text-[18px] mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>
                  <strong>ذکر اقلام جانبی:</strong> قرار دادن کیف، شارژر و لوازم همراه،
                  کالا را برای پروژه‌های فوری جذاب‌تر می‌کند.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  className="material-symbols-outlined text-m3-primary text-[18px] mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>
                  <strong>محدوده مشخص:</strong> تعیین محله به مستاجران نزدیک شما اجازه
                  می‌دهد وسیله را سریع‌تر و بدون کرایه حمل تحویل بگیرند.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* --------------------------------- step 2 -------------------------------- */
  const step2 = (
    <div className="flex flex-col w-full">
      {heroHeader}
      {stepper}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-[24px]">photo_library</span>
                <h2 className="text-base font-bold text-on-surface">تصاویر واقعی و باکیفیت وسیله</h2>
              </div>
              <span className="text-xs font-semibold text-m3-tertiary bg-surface-container-low px-2.5 py-1 rounded-full">
                {faNumber(form.images.length)} از ۸ تصویر انتخاب شده
              </span>
            </div>
            {errors.images && (
              <p className="text-[12px] text-m3-error font-semibold">{errors.images}</p>
            )}

            <div className="border-2 border-dashed border-m3-primary/40 hover:border-m3-primary bg-surface-container-low/40 hover:bg-surface-container/60 transition-all rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-m3-primary/10 text-m3-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-on-surface">
                  انتخاب از نمونه‌ها — آپلود اختصاصی پس از اتصال فضای ذخیره‌سازی فعال می‌شود
                </p>
                <p className="text-xs text-m3-tertiary">
                  از بانک نمونه‌های زیر حداکثر ۸ تصویر برای وسیله انتخاب کنید (حداقل ۱ تصویر
                  برای ثبت نهایی)
                </p>
              </div>
            </div>

            {/* Selected photos strip */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {form.images.map((url, idx) => (
                  <div
                    key={url}
                    className="relative group rounded-xl overflow-hidden border border-outline-variant/40 aspect-[4/3] bg-surface-container shadow-xs"
                  >
                    { }
                    <img className="w-full h-full object-cover" src={url} alt={`تصویر ${idx + 1}`} />
                    {idx === 0 && (
                      <div className="absolute top-2 right-2 bg-m3-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        عکس کاور
                      </div>
                    )}
                    <div className="absolute inset-0 bg-m3-inverse-surface/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-surface-container-lowest text-m3-error hover:bg-m3-error-container transition-colors cursor-pointer"
                        title="حذف"
                        onClick={() => toggleImage(url)}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sample pool */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-m3-primary">collections</span>
                  بانک نمونه تصاویر اورا
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllImages((v) => !v)}
                  className="text-[11px] font-bold text-m3-primary hover:text-primary-container"
                >
                  {showAllImages ? "نمایش کمتر" : `نمایش همه ${faNumber(sampleImages.length)} نمونه`}
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {poolImages.map((url) => {
                  const selected = form.images.includes(url);
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => toggleImage(url)}
                      className={`relative rounded-lg overflow-hidden border aspect-square transition-all ${
                        selected
                          ? "border-m3-primary ring-2 ring-m3-primary/40"
                          : "border-outline-variant/40 hover:border-m3-primary/60"
                      }`}
                      title={selected ? "حذف از انتخاب‌ها" : "افزودن به تصاویر وسیله"}
                    >
                      { }
                      <img className="w-full h-full object-cover" src={url} alt="نمونه" />
                      {selected && (
                        <span className="absolute top-1 left-1 size-5 rounded-full bg-m3-primary text-on-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[13px]">check</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-secondary-fixed/40 border border-secondary-fixed-dim/60 rounded-xl text-xs leading-relaxed text-on-secondary-container">
              <span
                className="material-symbols-outlined text-m3-secondary text-[20px] shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lightbulb
              </span>
              <p>
                <strong className="font-bold">راهنمای هوشمند عکاسی اورا:</strong>
                نور طبیعی روز، پس‌زمینه مرتب، و نمایش صادقانه خط و خش‌های احتمالی احتمال
                اجاره موفق وسیله را تا ۳ برابر افزایش داده و از هرگونه اختلاف هنگام عودت
                جلوگیری می‌کند.
              </p>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-m3-primary text-[24px]">tune</span>
              <h2 className="text-base font-bold text-on-surface">مشخصات فنی و توصیف کالا</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface">
                وضعیت ظاهری و سلامت فنی
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONDITIONS.map((opt) => (
                  <label
                    key={opt.val}
                    className={`relative flex flex-col p-3 rounded-xl cursor-pointer transition-all ${
                      form.condition === opt.val
                        ? "border-2 border-m3-primary bg-m3-primary/5"
                        : "border border-outline-variant/60 bg-surface-container-lowest hover:border-m3-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={opt.val}
                      checked={form.condition === opt.val}
                      onChange={() => update({ condition: opt.val })}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${form.condition === opt.val ? "text-m3-primary" : "text-on-surface"}`}
                      >
                        {opt.label}
                      </span>
                      {form.condition === opt.val ? (
                        <span
                          className="material-symbols-outlined text-[18px] text-m3-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-outline-variant"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-m3-tertiary mt-1">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-on-surface">
                  شماره سریال یا کد اختصاصی دستگاه
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-m3-secondary font-medium">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  محرمانه نزد اورا
                </span>
              </div>
              <input
                type="text"
                dir="ltr"
                value={form.serialNumber}
                onChange={(e) => update({ serialNumber: e.target.value })}
                className="w-full text-right rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-mono text-on-surface focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface" htmlFor="specsInput">
                مشخصات فنی خلاصه (با | جدا کنید)
              </label>
              <input
                id="specsInput"
                type="text"
                value={form.specs}
                onChange={(e) => update({ specs: e.target.value })}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 outline-none"
                placeholder="سنسور ۳۳ مگاپیکسل • فیلم‌برداری 4K 60p • وزن ۶۹۵ گرم"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface" htmlFor="descInput">
                توضیحات جامع، نکات و شرایط استفاده <span className="text-m3-error">*</span>
              </label>
              <textarea
                id="descInput"
                rows={4}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-xs lg:text-sm text-on-surface leading-relaxed focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 outline-none"
              ></textarea>
              {errors.description && (
                <p className="text-[12px] text-m3-error font-semibold">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface">
                اقلام و لوازم جانبی همراه تحویلی
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {form.accessories.map((acc, index) => (
                  <span
                    key={`${acc}-${index}`}
                    className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface-variant text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    <span>{acc}</span>
                    <button
                      type="button"
                      onClick={() =>
                        update({ accessories: form.accessories.filter((_, i) => i !== index) })
                      }
                      className="hover:text-m3-error transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="افزودن قلم جدید..."
                    value={newAccessory}
                    onChange={(e) => setNewAccessory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAccessory();
                      }
                    }}
                    className="text-xs rounded-full border border-dashed border-outline-variant bg-transparent px-3 py-1 text-on-surface focus:border-m3-primary focus:ring-0 w-32 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAccessory}
                    className="w-6 h-6 rounded-full bg-m3-primary text-on-primary flex items-center justify-center text-xs hover:bg-primary-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-m3-primary text-[24px]">payments</span>
              <h2 className="text-base font-bold text-on-surface">
                شیوه‌های تحویل و احراز هویت تحویل کالا
              </h2>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-m3-primary text-[22px]">location_on</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      تحویل حضوری در محل مالک
                    </span>
                    <span className="text-[11px] text-m3-tertiary">
                      {form.city}، {form.area || "—"} (آدرس دقیق فقط پس از قطعی شدن رزرو نمایش داده خواهد شد)
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.pickupInPerson}
                  onChange={(e) => update({ pickupInPerson: e.target.checked })}
                  className="rounded text-m3-primary focus:ring-m3-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-m3-secondary text-[22px]">local_shipping</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      ارسال با پیک اکسپرس و سفیر اختصاصی اورا
                    </span>
                    <span className="text-[11px] text-m3-tertiary">
                      سفیر بیمه‌شده کالا را تست و درب منزل مستاجر تحویل می‌دهد (هزینه پیک بر عهده مستاجر)
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.deliveryCourier}
                  onChange={(e) => update({ deliveryCourier: e.target.checked })}
                  className="rounded text-m3-primary focus:ring-m3-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[22px]">badge</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      احراز هویت بیومتریک و تطبیق چهره در زمان تحویل
                    </span>
                    <span className="text-[11px] text-m3-tertiary">
                      مستاجر موظف به ثبت امضای دیجیتال و تطبیق کارت ملی هوشمند خواهد بود
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.biometricAuth}
                  onChange={(e) => update({ biometricAuth: e.target.checked })}
                  className="rounded text-m3-primary focus:ring-m3-primary"
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
            <button
              type="button"
              onClick={() => goStep(1)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              <span>مرحله قبل: اطلاعات پایه</span>
            </button>
            <button
              type="button"
              onClick={() => goStep(3)}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-m3-primary text-on-primary hover:bg-primary-container font-extrabold text-sm shadow-md shadow-m3-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ادامه: تنظیم تقویم و دسترسی‌پذیری</span>
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          </div>
        </div>

        {/* Sidebar preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-4 space-y-3 lg:sticky lg:top-20">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-[18px]">visibility</span>
                پیش‌نمایش زنده در نتایج جستجو
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                زنده
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-[16/10] bg-surface-container overflow-hidden">
                { }
                <img
                  className="w-full h-full object-cover"
                  src={previewImage ?? "/assets/img/30b557be7b01.jpg"}
                  alt="پیش‌نمایش وسیله"
                />
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-start">
                  <span className="inline-flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-xs text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    <span
                      className="material-symbols-outlined text-[13px] text-emerald-600"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    تایید اصالت کالا
                  </span>
                </div>
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="bg-m3-inverse-surface/85 backdrop-blur-xs text-on-primary text-[10px] font-medium px-2 py-0.5 rounded-md">
                    {form.city}، {form.area || "—"}
                  </span>
                </div>
              </div>
              <div className="p-3.5 space-y-2.5">
                <span className="font-extrabold text-on-surface line-clamp-1 text-xs block">
                  {form.title || "عنوان وسیله"}
                </span>
                <div className="flex items-center justify-between text-[11px] text-m3-tertiary">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-secondary-fixed text-m3-primary flex items-center justify-center font-bold text-[10px]">
                      {userName?.trim()?.[0] ?? "م"}
                    </div>
                    <span className="font-medium text-on-surface-variant">{userName}</span>
                  </div>
                  <span className="text-on-surface-variant">میزبان اورا</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-m3-tertiary block">
                      ودیعه: {Number.isFinite(depositNum) ? faNumber(depositNum) : 0} تومان
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-extrabold text-m3-primary">
                      {Number.isFinite(dailyNum) ? faNumber(dailyNum) : "—"}
                    </span>
                    <span className="text-[10px] text-m3-tertiary"> تومان / روز</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary-fixed/50 via-surface-container-high/40 to-primary-fixed/30 border border-primary-fixed space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-m3-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                </div>
                <h3 className="text-xs font-extrabold text-on-surface">
                  ماشین‌حساب هوشمند تخمین درآمد ماهانه
                </h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-on-surface">
                  <span>تعداد روزهای اجاره در ماه:</span>
                  <span className="text-m3-primary font-black">
                    {faNumber(rentalDaysEst)} روز در ماه
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={rentalDaysEst}
                  onChange={(e) => setRentalDaysEst(Number(e.target.value))}
                  className="w-full accent-m3-primary h-1.5 bg-outline-variant/40 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-m3-tertiary">
                  <span>۱ روز</span>
                  <span>۱۵ روز</span>
                  <span>۳۰ روز</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest/90 p-3 rounded-lg border border-m3-primary/20 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">درآمد تخمینی خالص شما:</span>
                <div className="text-left">
                  <span className="text-base font-black text-m3-primary">
                    {Number.isFinite(dailyNum)
                      ? faNumber(Math.round(dailyNum * rentalDaysEst * 0.85))
                      : "—"}
                  </span>
                  <span className="text-[10px] font-medium text-m3-tertiary mr-1">تومان / ماه</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* --------------------------------- step 3 -------------------------------- */
  const gross = Number.isFinite(dailyNum) ? dailyNum * 3 : NaN;
  const discountAmt = Number.isFinite(gross) ? Math.round((gross * form.discountPercent) / 100) : NaN;
  const fee = Number.isFinite(gross) && Number.isFinite(discountAmt) ? Math.round((gross - discountAmt) * 0.1) : NaN;
  const net = Number.isFinite(gross) && Number.isFinite(fee) ? gross - discountAmt - fee : NaN;

  const step3 = (
    <div className="flex flex-col w-full">
      {heroHeader}
      {stepper}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-surface-container-high pb-4">
              <div className="flex items-center gap-3">
                <span className="size-10 rounded-xl bg-surface-container-high text-m3-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </span>
                <div>
                  <h2 className="text-on-surface font-bold">۱. نرخ اجاره و سیاست‌های تخفیف</h2>
                  <p className="text-sm text-on-surface-variant">
                    تعیین قیمت منطقی و پایدار شانس دریافت درخواست را تا ۳ برابر افزایش می‌دهد.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div className="space-y-2">
                <label
                  className="text-on-surface block font-semibold text-sm"
                  htmlFor="daily-rate-input"
                >
                  اجاره روزانه پایه (تومان) <span className="text-m3-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="daily-rate-input"
                    type="text"
                    value={form.dailyPrice}
                    onChange={(e) => update({ dailyPrice: e.target.value })}
                    className="w-full h-12 pr-4 pl-16 rounded bg-surface-container-lowest text-on-surface font-bold border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary shadow-sm outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                    تومان / روز
                  </span>
                </div>
                {errors.dailyPrice && (
                  <p className="text-[12px] text-m3-error font-semibold">{errors.dailyPrice}</p>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-on-surface-variant block text-sm">میانگین نرخ این دسته در اورا</span>
                  <span className="font-bold text-on-surface text-sm">
                    {avgPrice ? `${faNumber(avgPrice)} تومان` : "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    avgPrice &&
                    update({ dailyPrice: String(avgPrice) })
                  }
                  disabled={!avgPrice}
                  className="px-3 py-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-colors font-bold shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {avgPrice ? `اعمال ${faNumber(avgPrice)}` : "—"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div className="space-y-2">
                <label className="text-on-surface block font-semibold text-sm" htmlFor="weekly-rate-input">
                  اجاره هفتگی (اختیاری)
                </label>
                <div className="relative">
                  <input
                    id="weekly-rate-input"
                    type="text"
                    value={form.weeklyPrice}
                    onChange={(e) => update({ weeklyPrice: e.target.value })}
                    className="w-full h-12 pr-4 pl-16 rounded bg-surface-container-lowest text-on-surface font-bold border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary shadow-sm outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                    تومان / هفته
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-on-surface block font-semibold text-sm" htmlFor="deposit-amount">
                  میزان ودیعه نقدی پیشنهادی (تومان)
                </label>
                <div className="relative">
                  <input
                    id="deposit-amount"
                    type="text"
                    value={form.deposit}
                    onChange={(e) => update({ deposit: e.target.value })}
                    className="w-full h-12 pr-4 pl-16 rounded bg-surface-container-lowest text-on-surface font-bold border border-outline-variant/40 focus:ring-2 focus:ring-m3-primary shadow-sm outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                    تومان
                  </span>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-on-surface font-semibold text-sm">حداقل مدت زمان رزرو</label>
                <select
                  value={form.minDays}
                  onChange={(e) => update({ minDays: e.target.value })}
                  className="w-full h-12 px-3 rounded bg-surface-container-low text-on-surface border border-outline-variant/30 focus:ring-2 focus:ring-m3-primary"
                >
                  <option value="1">۱ روز (۲۴ ساعت)</option>
                  <option value="2">۲ روز</option>
                  <option value="3">۳ روز</option>
                  <option value="7">۱ هفته</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-on-surface font-semibold text-sm">
                  حداکثر مدت زمان رزرو پیوسته
                </label>
                <select
                  value={form.maxDays}
                  onChange={(e) => update({ maxDays: e.target.value })}
                  className="w-full h-12 px-3 rounded bg-surface-container-low text-on-surface border border-outline-variant/30 focus:ring-2 focus:ring-m3-primary"
                >
                  <option value="14">۱۴ روز</option>
                  <option value="30">۳۰ روز (یک ماه)</option>
                  <option value="60">۶۰ روز</option>
                  <option value="90">نامحدود با هماهنگی</option>
                </select>
              </div>
            </div>

            {/* Instant book */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-m3-primary/30 bg-m3-primary/5 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-m3-primary text-[22px]">bolt</span>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    رزرو آنی (Instant Book)
                  </span>
                  <span className="text-[11px] text-m3-tertiary">
                    درخواست‌ها بدون نیاز به تایید شما، به‌صورت خودکار قطعی می‌شوند
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.instantBook}
                onChange={(e) => update({ instantBook: e.target.checked })}
                className="rounded text-m3-primary focus:ring-m3-primary"
              />
            </label>

            {/* Discount */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-on-surface block font-bold text-base">تخفیف‌ها</span>
                <span className="px-2.5 py-1 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm">
                  {faNumber(form.discountPercent)}٪ تخفیف
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-medium">
                    درصد تخفیف اعمالی برای رزروهای بیش از ۳ روز
                  </span>
                  <span className="text-m3-primary font-bold">(نمایشی — در تقویم رزرو اعمال می‌شود)</span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={form.discountPercent}
                    onChange={(e) => update({ discountPercent: Number(e.target.value) })}
                    className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-m3-primary focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium mt-2 px-1">
                    <span>۱٪</span>
                    <span>۲۵٪</span>
                    <span>۵۰٪</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
              <span className="size-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">security</span>
              </span>
              <div>
                <h2 className="text-on-surface font-bold">۲. ودیعه ضمانت امانت و شرایط اسکرو</h2>
                <p className="text-sm text-on-surface-variant">
                  مبلغ امانی در حساب واسط اورا مسدود می‌ماند و پس از تست سلامت به مستاجر
                  عودت داده می‌شود.
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  پرداخت آزمایشی (Sandbox) — هیچ پول واقعی جابه‌جا نمی‌شود
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <p className="text-m3-tertiary text-sm">
                  سقف پوشش ضمانت اورا تا سقف مشخص‌شده در قوانین فعال است.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center gap-2 text-m3-primary font-bold text-sm">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified_user
                  </span>
                  <span>تعهد اوراگارد (OveraGuard)</span>
                </div>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  ودیعه نقدی در صورت بروز خسارت یا تاخیر، پس از ارائه صورت‌جلسه دیجیتال
                  تحویل به حساب شما بازگردانده می‌شود (شبیه‌سازی).
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-on-surface block font-bold">روش‌های جایگزین ودیعه نقدی:</span>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.acceptPromissoryNote}
                      onChange={(e) => update({ acceptPromissoryNote: e.target.checked })}
                      className="rounded text-m3-primary focus:ring-m3-primary"
                    />
                    <div>
                      <span className="font-semibold text-on-surface block text-sm">
                        پذیرش سفته الکترونیک بانکی
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        مستاجر بدون بلوکه کردن پول نقد، سفته رسمی با امضای دیجیتال ثبت می‌کند.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-500/15 px-2.5 py-1 rounded-full font-bold shrink-0 hidden sm:inline-block">
                    محبوب‌ترین
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high pb-4">
              <div className="flex items-center gap-3">
                <span className="size-10 rounded-xl bg-surface-container-high text-m3-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </span>
                <div>
                  <h2 className="text-on-surface font-bold">۳. تقویم رزرو و زمان‌بندی تحویل</h2>
                  <p className="text-sm text-on-surface-variant">
                    روزهایی که مایل نیستید کالا اجاره داده شود را در تقویم شمسی مسدود کنید؛ این
                    روزها برای مستأجرها قابل رزرو نخواهد بود.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-m3-primary bg-m3-primary/5 border border-m3-primary/25 px-2.5 py-1 rounded-full shrink-0">
                تقویم شمسی ۱۴۰۵
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Jalali (Shamsi) ۱۴۰۵ availability calendar — same calendar as item-details */}
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30">
                  <JalaliCalendar
                    variant="host"
                    startIso={blockStart}
                    endIso={blockEnd}
                    onRangeChange={handleBlockPick}
                    bookedRanges={reservedRanges}
                    ownerBlockedRanges={form.blockedRanges}
                  />
                </div>

                {/* Blocked ranges manager */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-on-surface">
                      روزهای مسدودشده ({faNumber(form.blockedRanges.length)})
                    </span>
                    {form.blockedRanges.length > 0 ? (
                      <button
                        type="button"
                        onClick={clearBlockedRanges}
                        className="text-xs font-semibold text-m3-error hover:underline cursor-pointer"
                      >
                        پاک کردن همه
                      </button>
                    ) : null}
                  </div>

                  {form.blockedRanges.length === 0 ? (
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      هنوز روزی مسدود نشده است. روز شروع و روز پایان را در تقویم انتخاب کنید تا
                      آن بازه مسدود شود؛ برای مسدود کردن فقط یک روز، همان روز را دوباره بزنید.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                      {form.blockedRanges.map((r) => (
                        <li
                          key={`${r.start}..${r.end}`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 px-3 py-2"
                        >
                          <span className="text-xs font-bold text-on-surface">
                            {formatJalaliIso(r.start)}
                            {r.end !== r.start ? ` تا ${formatJalaliIso(r.end)}` : " (یک روز)"}
                            <span className="text-on-surface-variant font-medium">
                              {" "}
                              — {faNumber(rentalDaysIso(r.start, r.end))} روز
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBlockedRange(r.start, r.end)}
                            aria-label="حذف بازه مسدود"
                            className="size-7 rounded-full flex items-center justify-center text-m3-error hover:bg-m3-error/10 transition-colors cursor-pointer shrink-0"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-medium pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[#ede9fe] border border-[#c4b5fd]"></span>
                      مسدود شده
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-slate-200"></span>
                      در حال اجاره
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-slate-100"></span>
                      گذشته
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface text-sm">فاصله تنفس بین دو رزرو</span>
                  <span className="material-symbols-outlined text-m3-primary text-[20px]">timelapse</span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  زمان مورد نیاز برای تست عملکرد و نظافت قبل از مشتری بعدی.
                </p>
                <select
                  value={form.bufferHours}
                  onChange={(e) => update({ bufferHours: e.target.value })}
                  className="w-full h-11 px-8 mt-1 rounded bg-surface-container-lowest text-on-surface border border-outline-variant/30"
                >
                  <option value="12">۱۲ ساعت</option>
                  <option value="24">۲۴ ساعت (توصیه شده)</option>
                  <option value="48">۴۸ ساعت</option>
                  <option value="0">بدون وقفه (تحویل متوالی)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="w-full p-5 bg-surface-container-lowest shadow-md rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goStep(2)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              <span>مرحله قبلی: مشخصات فنی</span>
            </button>
            <button
              type="button"
              onClick={() => goStep(4)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary font-bold shadow-md shadow-m3-primary/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>ادامه: قوانین تحویل و تایید نهایی</span>
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          </section>
        </div>

        {/* Sticky financial sidebar */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <div className="bg-surface-container-lowest rounded-xl p-5 md:p-6 shadow-md border-0 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-[24px]">calculate</span>
                <span className="font-bold text-on-surface">درآمد خالص میزبان</span>
              </div>
              <span className="text-xs text-emerald-800 bg-emerald-500/15 px-2.5 py-0.5 rounded-full font-bold">
                محاسبه نمونه (شبیه‌سازی)
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-on-surface-variant">
                <span>مدت زمان نمونه:</span>
                <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-md text-on-surface font-bold">
                  <span>۳ روز اجاره</span>
                </div>
              </div>
              <div className="space-y-2.5 pt-2 text-sm text-on-surface">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">مجموع اجاره ناخالص:</span>
                  <span className="font-bold">
                    {Number.isFinite(gross) ? `${faNumber(gross)} تومان` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-m3-primary font-medium">
                  <span>تخفیف ({faNumber(form.discountPercent)}٪):</span>
                  <span>
                    {Number.isFinite(discountAmt) ? `- ${faNumber(discountAmt)} تومان` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>کارمزد پلتفرم اورا (۱۰٪):</span>
                  <span>{Number.isFinite(fee) ? `- ${faNumber(fee)} تومان` : "—"}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span>بیمه سلامت کالا (اوراگارد):</span>
                  <span className="font-bold">رایگان برای میزبان</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-high space-y-1 mt-4">
                <span className="text-on-surface-variant block text-sm">
                  دریافتی خالص میزبان (سهم شما):
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-extrabold text-m3-primary">
                    {Number.isFinite(net) ? faNumber(net) : "—"}
                  </span>
                  <span className="font-bold text-on-surface">تومان</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3">
              <span className="size-9 rounded-full bg-primary-fixed text-m3-primary flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield_with_heart
                </span>
              </span>
              <div className="space-y-0.5">
                <h4 className="font-bold text-on-surface text-sm">ضمانت بازگشت و سلامت کالا</h4>
                <p className="text-sm text-on-surface-variant">
                  ودیعه{" "}
                  {Number.isFinite(depositNum) ? faNumber(depositNum) : 0} تومانی تا تایید
                  سلامت فیزیکی توسط شما آزاد نخواهد شد (شبیه‌سازی).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* --------------------------------- step 4 -------------------------------- */
  const step4 = (
    <div className="flex flex-col w-full">
      {heroHeader}
      {stepper}

      {published && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-[28px] text-emerald-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div>
              <h4 className="font-bold text-sm">
                آگهی شما با موفقیت ثبت شد و در صف تایید کارشناسان قرار گرفت!
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                شناسه پیگیری ثبت: {published.id !== "—" ? published.id : "در حال ثبت"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/my-items"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
            >
              مشاهده وسایل من
            </Link>
            <Link
              href="/host-dashboard"
              className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
            >
              پیشخوان میزبان
            </Link>
            <button
              onClick={resetWizard}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
            >
              ثبت آگهی دیگر
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary-fixed flex items-center justify-center text-m3-primary">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div>
                  <h2 className="text-on-surface font-bold">روش‌ها و شرایط تحویل و بازگشت کالا</h2>
                  <p className="text-sm text-on-surface-variant">
                    نحوه دریافت کالا توسط مستاجر و بازگرداندن آن را تعیین کنید.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex px-3 py-1 bg-surface-container text-m3-primary rounded-full text-sm">
                امنیت لجستیک اورا
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="cursor-pointer relative flex flex-col p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all">
                <input
                  type="checkbox"
                  checked={form.pickupInPerson}
                  onChange={(e) => update({ pickupInPerson: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="flex items-start justify-between mb-3">
                  <div className="size-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-m3-primary">
                    <span className="material-symbols-outlined text-[22px]">pin_drop</span>
                  </div>
                  {form.pickupInPerson && (
                    <span
                      className="material-symbols-outlined text-m3-primary text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>
                <span className="font-bold text-on-surface">تحویل حضوری در محل مالک</span>
                <span className="text-sm text-on-surface-variant mt-1">
                  {form.city}، {form.area || "—"}
                </span>
                <span className="inline-flex mt-3 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 w-fit px-2 py-0.5 rounded">
                  رایگان و بدون هزینه پستی
                </span>
              </label>

              <label className="cursor-pointer relative flex flex-col p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all">
                <input
                  type="checkbox"
                  checked={form.deliveryCourier}
                  onChange={(e) => update({ deliveryCourier: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="flex items-start justify-between mb-3">
                  <div className="size-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-m3-primary">
                    <span className="material-symbols-outlined text-[22px]">two_wheeler</span>
                  </div>
                  {form.deliveryCourier && (
                    <span
                      className="material-symbols-outlined text-m3-primary text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>
                <span className="font-bold text-on-surface">ارسال با سفیر اختصاصی اورا</span>
                <span className="text-sm text-on-surface-variant mt-1">
                  ناوگان امن مجهز به جعبه ضدضربه
                </span>
                <span className="inline-flex mt-3 text-[11px] font-semibold text-m3-primary bg-primary-fixed/60 w-fit px-2 py-0.5 rounded">
                  هزینه به عهده مستاجر
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <label className="text-on-surface flex items-center gap-1.5 font-semibold text-sm">
                  <span className="material-symbols-outlined text-[18px] text-m3-primary">schedule</span>
                  بازه زمانی مجاز تحویل و عودت کالا
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">از ساعت:</span>
                    <span className="font-bold text-on-surface">۱۰:۰۰ صبح</span>
                  </div>
                  <span className="text-on-surface-variant text-sm">الی</span>
                  <div className="flex-1 bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">تا ساعت:</span>
                    <span className="font-bold text-on-surface">۲۰:۰۰ شب</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-2">
              <div className="size-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-m3-secondary">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
              </div>
              <div>
                <h2 className="text-on-surface font-bold">قوانین اختصاصی و شرایط رزرو</h2>
                <p className="text-sm text-on-surface-variant">
                  سیاست استرداد و شروط ویژه استفاده از دستگاه خود را تنظیم نمایید.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-on-surface font-bold text-sm">سیاست لغو رزرو توسط مستاجر</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CANCELLATION_POLICIES.map((pol) => (
                  <label
                    key={pol.id}
                    className={`cursor-pointer relative p-4 rounded-xl flex flex-col gap-2 transition-all ${
                      form.cancellationPolicy === pol.id
                        ? "bg-surface-container border-2 border-m3-primary"
                        : "bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface text-sm">{pol.title}</span>
                      <input
                        type="radio"
                        name="cancellation_policy"
                        checked={form.cancellationPolicy === pol.id}
                        onChange={() => update({ cancellationPolicy: pol.id })}
                        className="accent-m3-primary size-4"
                      />
                    </div>
                    <p className="text-sm text-on-surface-variant">{pol.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <span className="text-on-surface font-bold text-sm">
                محدودیت‌ها و الزامات فنی حین استفاده
              </span>
              <div className="flex flex-col gap-2 w-full">
                <textarea
                  rows={4}
                  value={form.customRules}
                  onChange={(e) => update({ customRules: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 text-sm text-on-surface placeholder:text-outline-variant focus:border-m3-primary focus:ring-1 focus:ring-m3-primary outline-none transition-all leading-relaxed"
                  placeholder="محدودیت‌ها، نکات نگهداری یا شروط فنی خاص این دستگاه را بنویسید (مثلاً: عدم استفاده در شرایط بارانی، نیاز به شارژ با شارژر اورجینال و...)"
                ></textarea>
                <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
                  <span className="inline-flex items-center gap-1.5 text-m3-tertiary">
                    <span className="material-symbols-outlined text-[16px] text-m3-primary">info</span>
                    شروط ثبت‌شده در برگه آگهی درج خواهد شد.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-surface-container-high flex items-center justify-center text-m3-primary">
                <span className="material-symbols-outlined text-[24px]">contract</span>
              </div>
              <div>
                <h2 className="text-on-surface font-bold">تعهدات حقوقی و قرارداد دیجیتال امانی</h2>
                <p className="text-sm text-on-surface-variant">
                  قرارداد رسمی الکترونیکی مطابق با قوانین تجارت الکترونیک
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b pb-2 text-xs text-on-surface-variant">
                <span className="font-bold flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-m3-primary text-[18px]">policy</span>
                  خلاصه سند امانت‌سپاری اورا (نسخه نمایشی)
                </span>
                <span className="bg-surface-container px-2 py-0.5 rounded text-m3-tertiary">
                  Sandbox — سند قطعی پس از رزرو
                </span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed text-justify">
                این قرارداد به استناد ماده ۱۰ قانون مدنی و قانون تجارت الکترونیک تنظیم
                گردیده و مطابق آن، مالک متعهد می‌شود کالای فوق‌الذکر را با سلامت کامل فنی
                در زمان مشخص تحویل دهد و مستاجر متعهد است در موعد مقرر کالا را عودت دهد.
                هرگونه خسارت ناشی از استفاده نامتعارف توسط کارشناسان اورا ارزیابی و جبران
                می‌گردد.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms1}
                  onChange={(e) => update({ agreeTerms1: e.target.checked })}
                  className="size-5 rounded text-m3-primary focus:ring-m3-primary accent-m3-primary mt-0.5"
                />
                <span className="text-sm text-on-surface leading-snug">
                  صحت کلیه اطلاعات فنی، سلامت فیزیکی دستگاه و مالکیت قانونی کالا را تایید
                  می‌نمایم.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms2}
                  onChange={(e) => update({ agreeTerms2: e.target.checked })}
                  className="size-5 rounded text-m3-primary focus:ring-m3-primary accent-m3-primary mt-0.5"
                />
                <span className="text-sm text-on-surface leading-snug">
                  قوانین و مقررات میزبانی کالا و شیوه حل اختلاف سامانه داوری اورا را مطالعه
                  نموده و می‌پذیرم.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Live preview sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xl flex flex-col gap-5 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">پیش‌نمایش زنده آگهی</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                آماده تایید و انتشار
              </span>
            </div>

            <div className="relative w-full h-56 rounded-xl overflow-hidden bg-surface-container group">
              { }
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={previewImage ?? "/assets/img/9ddd0b723001.jpg"}
                alt="پیش‌نمایش آگهی"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-transparent to-black/20"></div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-m3-primary shadow-sm">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>تایید اصالت اورا</span>
              </div>
              <div className="absolute bottom-3 right-3 left-3 text-on-primary">
                <span className="text-xs text-primary-fixed block font-medium">
                  {selectedCategory?.name ?? "دسته‌بندی انتخاب نشده"}
                </span>
                <h3 className="text-base font-bold truncate">{form.title || "عنوان وسیله"}</h3>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container-low">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">اجاره بها روزانه:</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-m3-primary">
                    {Number.isFinite(dailyNum) ? faNumber(dailyNum) : "—"}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">تومان / روز</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-2.5">
                <span className="text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-m3-secondary">lock</span>
                  مبلغ ودیعه امن (نقدی):
                </span>
                <span className="font-bold text-on-surface">
                  {Number.isFinite(depositNum) ? faNumber(depositNum) : 0} تومان
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>تحویل در محل:</span>
                <span className="font-semibold text-on-surface">
                  {form.city}، {form.area || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
              <div className="relative size-12 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
                <span className="text-m3-primary font-black text-lg">{userName?.trim()?.[0] ?? "م"}</span>
                <div className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 rounded-full border-2 border-surface-container-lowest"></div>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-on-surface truncate text-sm">{userName}</span>
                  <span
                    className="material-symbols-outlined text-emerald-600 text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                  <span>میزبان اورا</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="sticky bottom-0 z-30 mt-8 w-full bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-4 lg:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-outline-variant/30">
        <button
          type="button"
          onClick={() => goStep(3)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-semibold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          <span>بازگشت به مرحله ۳ (قیمت‌گذاری)</span>
        </button>

        <button
          type="button"
          onClick={finalSubmit}
          disabled={!form.agreeTerms1 || !form.agreeTerms2 || submitting}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base shadow-lg transition-all ${
            form.agreeTerms1 && form.agreeTerms2
              ? "bg-m3-primary hover:bg-primary-container text-on-primary shadow-m3-primary/25 active:scale-[0.98] cursor-pointer"
              : "bg-surface-container text-m3-tertiary cursor-not-allowed opacity-60"
          }`}
        >
          <span>{submitting ? "در حال ارسال…" : "ثبت نهایی و انتشار آگهی"}</span>
          <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
        </button>
      </section>
    </div>
  );

  return (
    <div className="bg-m3-background text-on-surface min-h-screen flex flex-col justify-between">
      <Toaster position="bottom-left" richColors />
      <div>
        {header}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {step === 1 && step1}
          {step === 2 && step2}
          {step === 3 && step3}
          {step === 4 && step4}
        </main>
      </div>
      {footer}
    </div>
  );
}

function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
