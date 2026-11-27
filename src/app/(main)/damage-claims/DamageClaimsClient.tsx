"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { faDate, faNumber, faToman } from "@/lib/format";
import ClaimChat from "@/components/overa/ClaimChat";

/* ------------------------------------------------------------------ types */

type ApiClaim = {
  id: string;
  reservationId: string;
  title: string;
  description: string;
  evidenceUrls: string;
  status: string;
  /** DELIVERY (declared at hand-over, item received anyway) | RETURN | GENERAL */
  stage: string;
  decision: string | null;
  createdAt: string;
  reservation: {
    id: string;
    code: string;
    status: string;
    /** PENDING | ACCEPTED_CLEAN | ACCEPTED_WITH_ISSUES | REFUSED_DAMAGE */
    deliveryStatus: string | null;
    listing: { title: string; images: { url: string; alt: string | null }[] };
  };
  claimant: { id: string; name: string };
  against: { id: string; name: string };
};

type ApiReservationLite = {
  id: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
  deposit: number;
  renterId: string;
  hostId: string;
  listing: { id: string; title: string };
  renter: { id: string; name: string };
  host: { id: string; name: string };
};

const CLAIM_STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "ثبت شده", cls: "bg-accent-gold/15 text-accent-gold" },
  COUNTER_EVIDENCE: {
    label: "در انتظار ادعای متقابل",
    cls: "bg-primary-soft text-primary",
  },
  UNDER_REVIEW: { label: "در حال بررسی", cls: "bg-amber-100 text-amber-800" },
  DECIDED: {
    label: "تصمیم صادر شد",
    cls: "bg-accent-emerald/15 text-accent-emerald",
  },
  APPEALED: { label: "اعتراض ثبت شد", cls: "bg-amber-100 text-amber-800" },
  REJECTED: { label: "رد شد", cls: "bg-red-100 text-red-600" },
  SETTLED: {
    label: "تسویه شد",
    cls: "bg-accent-emerald/15 text-accent-emerald",
  },
};

const CLAIM_STAGE: Record<string, { label: string; cls: string }> = {
  DELIVERY: {
    label: "اعلام خسارت در مرحلهٔ تحویل",
    cls: "bg-secondary-fixed text-on-secondary-fixed",
  },
  RETURN: {
    label: "اعلام خسارت در مرحلهٔ بازگشت",
    cls: "bg-m3-error-container text-m3-on-error-container",
  },
};

const GOODS_DELIVERY_STATUS: Record<string, string> = {
  ACCEPTED_CLEAN: "کالا سالم تحویل گرفته شد",
  ACCEPTED_WITH_ISSUES: "کالا با یادداشت مشکلات تحویل گرفته شد",
  REFUSED_DAMAGE: "تحویل رد شد (اجاره باطل شد)",
};

const INCIDENT_TYPES = [
  {
    icon: "broken_image",
    title: "شکستگی یا آسیب فیزیکی بدنه و لنز",
    sub: "ضربه مستقیم، ترک ماونت، کج شدگی حلقه زوم یا بدنه فلزی",
  },
  {
    icon: "grain",
    title: "خط و خش عمیق روی سنسور، عدسی یا المنت",
    sub: "آسیب لایه کوتینگ، شیار روی شیشه جلویی یا شیشه محافظ سنسور",
  },
  {
    icon: "precision_manufacturing",
    title: "نقص عملکرد الکترونیکی یا موتور فوکوس / شاتر",
    sub: "ارور فوکوس خودکار، صدای ناهنجار موتور AF، قطعی درگاه یا اسلات رم",
  },
  {
    icon: "inventory_2",
    title: "کسری اقلام همراه و لوازم جانبی",
    sub: "کسر باتری یدک، هود فابریک، شارژر دوقلو، کابل ارتباطی یا درپوش‌ها",
  },
  {
    icon: "schedule",
    title: "تاخیر غیرمجاز در عودت کالا (بیش از ۲۴ ساعت)",
    sub: "محاسبه جریمه روزانه عدم تحویل بر اساس تعرفه مصوب اٌوِرا",
  },
  {
    icon: "sanitizer",
    title: "عدم نظافت نامتعارف و نیاز به سرویس نظافتی",
    sub: "نفوذ مایعات، ماسه بادی، دوده یا گل و لای داخل شیارها",
  },
];

const QUICK_TOPICS = [
  "مغایرت در لحظه تحویل حضوری",
  "آسیب در طول دوره اجاره",
  "عدم پاسخگویی مستاجر",
  "مشاهده خط و خش پس از تست دقیق",
];

/* آپلود مستقیم فایل خارج از محدوده این نسخه است؛ نمونه‌های آماده به‌جای آن. */
const SAMPLE_EVIDENCE = [
  { url: "/assets/img/50715c08a08f.jpg", label: "تست عدسی" },
  { url: "/assets/img/a6d6f7264738.jpg", label: "پشت صحنه" },
  { url: "/assets/img/0a8ce54551f9.jpg", label: "نمای وسیله" },
  { url: "/assets/img/73195d3a6ac5.jpg", label: "متعلقات" },
];

export default function DamageClaimsClient({
  viewerId,
  viewerName,
}: {
  /** Signed-in user id (page is protected — always present). */
  viewerId: string;
  viewerName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ApiClaim[]>([]);
  const [reservations, setReservations] = useState<ApiReservationLite[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Which claim's text-only chat is expanded (claim id). */
  const [chatOpenId, setChatOpenId] = useState<string | null>(null);

  // form state
  const [reservationId, setReservationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [decision, setDecision] = useState("arbitration");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        fetch("/api/claims"),
        fetch("/api/reservations"),
      ]);
      const cData = await cRes.json();
      const rData = await rRes.json();
      if (cRes.ok) setClaims(cData.claims ?? []);
      if (rRes.ok) setReservations(rData.reservations ?? []);
    } catch {
      toast.error("خطا در دریافت پرونده‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => reservations.find((r) => r.id === reservationId) ?? null,
    [reservations, reservationId],
  );

  function toggleType(t: string) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function addEvidence(url: string) {
    const clean = url.trim();
    if (!clean) return;
    if (evidence.includes(clean) || evidence.length >= 6) return;
    setEvidence((prev) => [...prev, clean]);
    setEvidenceUrl("");
  }

  async function submitClaim() {
    if (!reservationId) {
      toast.error("سفارش مربوطه را انتخاب کنید.");
      return;
    }
    if (title.trim().length < 4) {
      toast.error("عنوان اعلام خسارت کوتاه است.");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("شرح خسارت باید حداقل ۲۰ کاراکتر باشد.");
      return;
    }
    setSubmitting(true);
    try {
      const fullDescription =
        types.length > 0
          ? `${description.trim()}\n\nانواع خسارت اعلام‌شده: ${types.join("؛ ")}`
          : description.trim();
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          title: title.trim(),
          description: fullDescription,
          evidenceUrls: evidence,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "ثبت پرونده ممکن نشد.");
        return;
      }
      toast.success(
        "پرونده خسارت ثبت شد؛ کارشناسان اٌوِرا بررسی را آغاز می‌کنند.",
      );
      setFormOpen(false);
      setReservationId("");
      setTitle("");
      setDescription("");
      setTypes([]);
      setEvidence([]);
      load();
    } catch {
      toast.error("خطا در ثبت پرونده");
    } finally {
      setSubmitting(false);
    }
  }

  const myClaimsCount = claims.length;

  return (
    <main className="w-full pt-6 bg-primary-soft/40 min-h-[calc(80vh-280px)] flex-1">
      <Toaster position="top-center" richColors />
      <div className="flex flex-col w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full">
          {/* Breadcrumb & Top Banner */}
          <div className="flex flex-col gap-6">
            <nav className="flex items-center gap-2 text-sm text-on-surface-variant flex-wrap">
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/"
              >
                خانه
              </Link>
              <span className="material-symbols-outlined text-[16px] text-outline-variant">
                chevron_left
              </span>
              <Link
                className="hover:text-m3-primary transition-colors"
                href="/rentals"
              >
                اجاره‌های من
              </Link>
              <span className="material-symbols-outlined text-[16px] text-outline-variant">
                chevron_left
              </span>
              <span className="text-m3-primary font-semibold">
                ثبت ادعای خسارت و ارجاع به داوری
              </span>
            </nav>
            {/* Urgency Notification Capsule */}
            <div className="p-4 sm:p-5 rounded-xl bg-m3-error-container/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-m3-error text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">
                    timer
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base text-m3-on-error-container font-bold">
                    مهلت قانونی اعلام خسارت و مغایرت فنی
                  </span>
                  <span className="text-sm text-m3-on-error-container/80">
                    حداکثر مهلت: ۲۴ ساعت پس از تحویل فیزیکی اقلام
                    یا حضوری
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm text-m3-outline">سیاست اٌوِرا:</span>
                <span className="text-base text-m3-error font-extrabold tracking-tight">
                  بررسی توسط کارشناسان اٌوِرا
                </span>
              </div>
            </div>
            {/* Main Header Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-sm font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">
                    gavel
                  </span>
                  دپارتمان حقوقی و داوری تخصصی اٌوِرا
                </span>
                {myClaimsCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-m3-primary text-sm font-semibold">
                    {faNumber(myClaimsCount)} پرونده فعال برای شما
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl text-on-surface font-extrabold leading-snug">
                فرم رسمی ثبت ادعای خسارت، نقص فنی و استناد به ودیعه امانی (Overa
                Escrow)
              </h1>
              <p className="text-base text-on-surface-variant max-w-4xl leading-relaxed">
                با تکمیل این فرم، کل مبلغ ودیعه سفارش انتخاب‌شده نزد صندوق امانی
                هوشمند اٌوِرا (شبیه‌سازی) مسدود موقت می‌ماند و گزارش فنی
                بلافاصله جهت بررسی توسط کارشناسان اٌوِرا به هیئت حل‌اختلاف ارجاع
                می‌گردد.
              </p>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
            {/* Right/Primary Stream (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Claims list */}
              <div className="p-4 sm:p-6 rounded-xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(76,42,158,0.06)] flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-m3-primary text-2xl">
                      folder_shared
                    </span>
                    <h2 className="text-lg text-on-surface font-bold">
                      پرونده‌های خسارت من
                    </h2>
                    <span className="text-xs text-on-surface-variant">
                      ({faNumber(myClaimsCount)} پرونده — به‌عنوان شاکی یا طرف
                      دعوا)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-m3-primary text-on-primary text-xs font-bold shadow-md shadow-m3-primary/25 hover:bg-primary-container transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">
                      {formOpen ? "close" : "add_circle"}
                    </span>
                    {formOpen ? "بستن فرم" : "اعلام خسارت جدید"}
                  </button>
                </div>

                {loading && (
                  <div className="space-y-3">
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </div>
                )}

                {!loading && claims.length === 0 && (
                  <div className="p-8 flex flex-col items-center gap-3 text-center border border-dashed border-outline-variant rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">
                      folder_off
                    </span>
                    <p className="text-sm font-bold text-on-surface">
                      پرونده خسارتی برای حساب شما ثبت نشده است
                    </p>
                    <p className="text-xs text-on-surface-variant max-w-md leading-relaxed">
                      در صورت مشاهده خسارت یا مغایرت در یکی از اجاره‌هایتان، با
                      دکمه «اعلام خسارت جدید» پرونده را ثبت کنید.
                    </p>
                  </div>
                )}

                {!loading &&
                  claims.map((c) => {
                    const st = CLAIM_STATUS[c.status] ?? {
                      label: c.status,
                      cls: "bg-surface-container-high text-on-surface-variant",
                    };
                    let thumbs: string[] = [];
                    try {
                      const parsed = JSON.parse(c.evidenceUrls);
                      if (Array.isArray(parsed))
                        thumbs = parsed.slice(0, 4).map(String);
                    } catch {
                      thumbs = [];
                    }
                    return (
                      <article
                        key={c.id}
                        className="border border-outline-variant/60 rounded-xl p-4 flex flex-col gap-3 bg-surface-container-low hover:bg-surface-container-lowest transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-on-surface-variant font-mono">
                                سفارش #{c.reservation.code}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.cls}`}
                              >
                                {st.label}
                              </span>
                              {c.stage && CLAIM_STAGE[c.stage] && (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${CLAIM_STAGE[c.stage].cls}`}
                                >
                                  {CLAIM_STAGE[c.stage].label}
                                </span>
                              )}
                              {/* «کالا رو گرفته» — the received-goods status
                                  of the order, visible to BOTH parties here. */}
                              {GOODS_DELIVERY_STATUS[
                                c.reservation.deliveryStatus ?? ""
                              ] && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">
                                    package_2
                                  </span>
                                  {
                                    GOODS_DELIVERY_STATUS[
                                      c.reservation.deliveryStatus ?? ""
                                    ]
                                  }
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-on-surface">
                              {c.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant">
                              کالای اجاره‌شده:{" "}
                              <b className="text-on-surface">
                                {c.reservation.listing.title}
                              </b>
                            </p>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-on-surface-variant">
                            <span>
                              شاکی:{" "}
                              <b className="text-on-surface">
                                {c.claimant.name}
                              </b>
                            </span>
                            <span>
                              طرف دعوا:{" "}
                              <b className="text-on-surface">
                                {c.against.name}
                              </b>
                            </span>
                            <span>تاریخ ثبت: {faDate(c.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                          {c.description}
                        </p>
                        {/* Delivery-stage declaration: the renter can still
                            take delivery — show the continuation hint until
                            the receipt is confirmed. */}
                        {c.stage === "DELIVERY" &&
                          c.reservation.status === "DELIVERED" && (
                            <div className="p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/30 text-xs text-emerald-800 flex items-start gap-2 leading-6">
                              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                                local_shipping
                              </span>
                              اعلام خسارت ثبت شد و سفارش همچنان در مرحلهٔ تحویل
                              است؛ می‌توانید کالا را تحویل بگیرید — کارت
                              «تأیید دریافت کالا» در روند اجاره باز است.
                            </div>
                          )}
                        {thumbs.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-on-surface-variant">
                              مستندات:
                            </span>
                            {thumbs.map((t) => (
                              <img
                                key={t}
                                src={t}
                                alt="مستند خسارت"
                                className="size-12 rounded-lg object-cover border border-outline-variant/60"
                              />
                            ))}
                          </div>
                        )}
                        {c.decision && (
                          <div className="p-3 rounded-lg bg-accent-emerald/10 text-xs text-emerald-800 border border-accent-emerald/30">
                            <b>تصمیم کارشناس:</b> {c.decision}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/40">
                          <button
                            type="button"
                            onClick={() =>
                              setChatOpenId((v) => (v === c.id ? null : c.id))
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-m3-primary hover:underline cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {chatOpenId === c.id ? "expand_less" : "forum"}
                            </span>
                            {chatOpenId === c.id
                              ? "بستن گفتگو"
                              : `گفتگو با ${c.claimant.id === viewerId ? c.against.name : c.claimant.name}`}
                          </button>
                          <Link
                            href={`/rental-lifecycle/${c.reservation.id}?code=${c.reservation.code}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-m3-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-sm">
                              route
                            </span>
                            مشاهده روند اجاره
                          </Link>
                        </div>
                        {chatOpenId === c.id && (
                          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low/50 p-3">
                            <p className="text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-m3-primary">
                                forum
                              </span>
                              گفتگوی دوطرفه پرونده — {c.title}
                            </p>
                            <ClaimChat
                              reservationId={c.reservation.id}
                              viewerId={viewerId}
                              viewerName={viewerName}
                              otherName={
                                c.claimant.id === viewerId
                                  ? c.against.name
                                  : c.claimant.name
                              }
                            />
                          </div>
                        )}
                        <span className="text-[10px] text-on-surface-variant">
                          پرونده‌ها توسط کارشناسان اٌوِرا بررسی می‌شوند
                        </span>
                      </article>
                    );
                  })}
              </div>

              {formOpen && (
                <>
                  {/* Order & Equipment Reference Card — bound to selected reservation */}
                  <div className="p-4 sm:p-6 rounded-xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(76,42,158,0.06)] flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-m3-primary text-2xl">
                        receipt_long
                      </span>
                      <h2 className="text-lg text-on-surface font-bold">
                        سفارش و وسیله مورد ادعا
                      </h2>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-on-surface-variant">
                        انتخاب سفارش از اجاره‌های من:
                      </label>
                      <select
                        value={reservationId}
                        onChange={(e) => setReservationId(e.target.value)}
                        className="bg-surface-container-low border border-outline-variant/80 text-xs font-semibold rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-m3-primary text-on-surface"
                      >
                        <option value="">— سفارش را انتخاب کنید —</option>
                        {reservations.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.listing.title} — کد {r.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selected ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-m3-primary text-[32px]">
                              photo_camera
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg text-on-surface font-bold">
                              {selected.listing.title}
                            </span>
                            <div className="flex items-center gap-3 text-on-surface-variant text-sm mt-1">
                              <span>
                                شناسه سفارش: <b>{selected.code}</b>
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-surface-container-high text-m3-secondary text-sm font-semibold self-start sm:self-auto">
                          {faDate(selected.startDate)} تا{" "}
                          {faDate(selected.endDate)} ({faNumber(selected.days)}{" "}
                          روز)
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">
                        پس از انتخاب سفارش، مشخصات وسیله، طرفین و ودیعه در همین
                        کارت نمایش داده می‌شود.
                      </p>
                    )}
                    {selected && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                          <span className="text-xs text-m3-outline">
                            مستاجر تحویل‌گیرنده
                          </span>
                          <span className="text-sm text-on-surface font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-m3-primary">
                              verified
                            </span>
                            {selected.renter.name}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                          <span className="text-xs text-m3-outline">
                            میزبان
                          </span>
                          <span className="text-sm text-on-surface font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-m3-secondary">
                              workspace_premium
                            </span>
                            {selected.host.name}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                          <span className="text-xs text-m3-outline">
                            بازه زمانی اجاره
                          </span>
                          <span className="text-sm text-on-surface font-semibold">
                            {faNumber(selected.days)} روز تقویمی
                          </span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                          <span className="text-xs text-m3-outline">
                            ضمانت امانی مسدود
                          </span>
                          <span className="text-base text-m3-primary font-bold">
                            {faToman(selected.deposit)}{" "}
                            <span className="text-xs font-normal text-on-surface">
                              تومان
                            </span>
                          </span>
                          <span className="text-xs text-m3-secondary font-medium">
                            سپرده کیف پول امن (شبیه‌سازی)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 1: Incident Type Selection */}
                  <div className="p-4 sm:p-6 rounded-xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(76,42,158,0.06)] flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-m3-primary text-on-primary flex items-center justify-center text-sm font-bold">
                          ۱
                        </span>
                        <h2 className="text-lg text-on-surface font-bold">
                          انتخاب نوع آسیب یا مغایرت مشاهده‌شده
                        </h2>
                      </div>
                      <span className="text-xs text-m3-outline">
                        چندگزینه‌ای مجاز است
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      موارد دقیقاً منطبق با نقایص مشهود کالا را تیک بزنید؛ موارد
                      انتخابی به‌صورت خودکار به شرح پرونده افزوده می‌شود.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {INCIDENT_TYPES.map((t) => {
                        const checked = types.includes(t.title);
                        return (
                          <label
                            key={t.title}
                            className={`p-4 rounded-xl flex items-start gap-3.5 cursor-pointer transition-all ${
                              checked
                                ? "bg-surface-container-high/70 shadow-sm"
                                : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                          >
                            <input
                              checked={checked}
                              onChange={() => toggleType(t.title)}
                              className="mt-1 w-5 h-5 rounded accent-m3-primary focus:ring-0"
                              type="checkbox"
                            />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`material-symbols-outlined text-[20px] ${checked ? "text-m3-primary" : "text-m3-outline"}`}
                                >
                                  {t.icon}
                                </span>
                                <span className="text-base text-on-surface font-bold">
                                  {t.title}
                                </span>
                              </div>
                              <span className="text-sm text-on-surface-variant">
                                {t.sub}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Description */}
                  <div className="p-4 sm:p-6 rounded-xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(76,42,158,0.06)] flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-m3-primary text-on-primary flex items-center justify-center text-sm font-bold">
                          ۲
                        </span>
                        <h2 className="text-lg text-on-surface font-bold">
                          شرح و توضیحات وضعیت خسارت کالا
                        </h2>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">
                          edit_note
                        </span>
                        ثبت اظهارات رسمی
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-m3-outline">
                        موضوعات سریع:
                      </span>
                      {QUICK_TOPICS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setDescription((d) =>
                              d ? `${d}\n• ${t}` : `• ${t}`,
                            )
                          }
                          className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant hover:text-m3-primary text-xs transition-colors cursor-pointer"
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container-highest focus:bg-surface-container-lowest focus:border-m3-primary focus:outline-none focus:ring-4 focus:ring-m3-primary/10 transition-all shadow-sm"
                        placeholder="عنوان پرونده (مثلاً: خط و خش لنز پس از عودت)"
                      />
                      <textarea
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value.slice(0, 2000))
                        }
                        className="w-full p-4 rounded-xl bg-surface-container-low text-on-surface text-base border border-surface-container-highest focus:bg-surface-container-lowest focus:border-m3-primary focus:outline-none focus:ring-4 focus:ring-m3-primary/10 transition-all leading-relaxed shadow-sm resize-none"
                        placeholder="شرح دقیق نحوه کشف خسارت، شرایط تحویل، وضعیت بسته و توافقات انجام‌شده را اینجا یادداشت فرمایید..."
                        rows={6}
                      ></textarea>
                      <div className="flex items-center justify-between text-m3-outline text-xs px-1">
                        <span>حداقل ۲۰ کاراکتر - حداکثر ۲۰۰۰ کاراکتر</span>
                        <span>
                          {faNumber(description.length)} / ۲۰۰۰ کاراکتر
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-high/70 flex items-start gap-3">
                      <span className="material-symbols-outlined text-m3-primary text-[22px] shrink-0 mt-0.5">
                        tips_and_updates
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-on-surface font-bold">
                          نکات کلیدی برای اثربخشی لایحه داوری:
                        </span>
                        <span className="text-sm text-on-surface-variant leading-relaxed">
                          ذکر زمان دقیق بازگشایی بسته، نام و شماره تماس شاهدان
                          احتمالی یا پیک تحویل، و بازتاب هرگونه گفت‌وگوی چت یا
                          تلفنی با طرف مقابل به ارزیابی سریع‌تر و عادلانه‌تر
                          پرونده کمک می‌کند.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Evidence */}
                  <div className="p-4 sm:p-6 rounded-xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(76,42,158,0.06)] flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-m3-primary text-on-primary flex items-center justify-center text-sm font-bold">
                          ۳
                        </span>
                        <h2 className="text-lg text-on-surface font-bold">
                          مستندات تصویری خسارت
                        </h2>
                      </div>
                      <span className="text-xs text-m3-outline">
                        حداکثر ۶ تصویر
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addEvidence(evidenceUrl);
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-slate-200 text-on-surface placeholder:text-m3-outline focus:outline-none focus:border-m3-primary"
                        placeholder="نشانی تصویر را بچسبانید (مثلاً /assets/img/50715c08a08f.jpg)"
                      />
                      <button
                        type="button"
                        onClick={() => addEvidence(evidenceUrl)}
                        className="px-5 py-2 bg-m3-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition"
                      >
                        افزودن
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-m3-outline">
                        نمونه‌های آماده:
                      </span>
                      {SAMPLE_EVIDENCE.map((s) => (
                        <button
                          key={s.url}
                          type="button"
                          onClick={() => addEvidence(s.url)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant hover:text-m3-primary text-xs transition-colors"
                        >
                          <img
                            src={s.url}
                            alt={s.label}
                            className="size-6 rounded-full object-cover border border-outline-variant/60"
                          />
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-tertiary-fixed text-xs text-on-tertiary-fixed-variant leading-relaxed">
                      آپلود مستقیم فایل در این نسخه فعال نیست و با راه‌اندازی
                      فضای ابری (Object Storage) به سامانه اضافه می‌شود؛ فعلاً
                      نشانی تصویر را بچسبانید یا از نمونه‌های آماده استفاده
                      کنید.
                    </div>
                    {evidence.length > 0 && (
                      <div className="flex items-center gap-3 flex-wrap">
                        {evidence.map((e) => (
                          <div key={e} className="relative">
                            <img
                              src={e}
                              alt="مستند"
                              className="size-16 rounded-lg object-cover border border-outline-variant/60"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEvidence((prev) =>
                                  prev.filter((x) => x !== e),
                                )
                              }
                              className="absolute -top-1.5 -left-1.5 size-5 rounded-full bg-m3-error text-on-primary flex items-center justify-center"
                              title="حذف تصویر"
                            >
                              <span className="material-symbols-outlined text-xs">
                                close
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Left/Sidebar: Escrow Claim Summary & Confirmation Action (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-36">
              <div className="p-6 rounded-xl bg-surface-container-lowest shadow-[0_16px_48px_rgba(76,42,158,0.12)] flex flex-col gap-6">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-m3-outline">
                      بررسی پرونده و عودت کالا
                    </span>
                    <span className="text-lg text-on-surface font-black">
                      وضعیت تصمیم‌گیری ودیعه امانی
                    </span>
                  </div>
                  <span className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-m3-primary shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">
                      gavel
                    </span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-high/60 border border-surface-container-highest flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm text-on-surface font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-m3-error animate-pulse"></span>
                      وضعیت کنونی ودیعه:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-m3-error-container text-m3-on-error-container text-xs font-bold">
                      {selected
                        ? "مسدود موقت (شبیه‌سازی)"
                        : "پس از انتخاب سفارش"}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    ودیعه امانی سفارش تا تعیین تکلیف نهایی نزد صندوق هوشمند امن
                    اٌوِرا محفوظ و فریز مانده است (شبیه‌سازی — هیچ پول واقعی
                    جابه‌جا نمی‌شود). تعیین تکلیف این مبلغ با رأی کارشناسان
                    اٌوِرا انجام می‌شود.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-m3-outline font-semibold">
                    گزینه‌های تصمیم‌گیری طرفین:
                  </span>
                  <label className="p-3.5 rounded-xl border-2 border-m3-primary bg-primary-container/10 flex items-start gap-3 cursor-pointer shadow-sm transition-all">
                    <input
                      checked={decision === "arbitration"}
                      onChange={() => setDecision("arbitration")}
                      className="mt-1 w-5 h-5 rounded accent-m3-primary focus:ring-0"
                      name="escrow_decision"
                      type="radio"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-m3-primary font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">
                          lock_clock
                        </span>
                        تعلیق ودیعه و ارجاع به پنل داوری
                      </span>
                      <span className="text-xs text-on-surface-variant leading-relaxed">
                        ارجاع پرونده به کارشناسان اٌوِرا جهت تطبیق مستندات و
                        صدور رأی.
                      </span>
                    </div>
                  </label>
                  <label className="p-3.5 rounded-xl border border-surface-container-highest bg-surface-container-low hover:bg-surface-container flex items-start gap-3 cursor-pointer transition-all">
                    <input
                      checked={decision === "release"}
                      onChange={() => setDecision("release")}
                      className="mt-1 w-5 h-5 rounded accent-m3-primary focus:ring-0"
                      name="escrow_decision"
                      type="radio"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-m3-outline">
                          published_with_changes
                        </span>
                        توافق طرفین بر سلامت کالا و آزادسازی ودیعه
                      </span>
                      <span className="text-xs text-on-surface-variant leading-relaxed">
                        در صورت توافق طرفین، آزادسازی ودیعه از صفحه روند اجاره و
                        پس از ثبت صورت‌جلسه انجام می‌شود.
                      </span>
                    </div>
                  </label>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container flex items-start gap-3">
                  <span className="material-symbols-outlined text-m3-secondary text-[22px] shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-on-surface font-bold">
                      تضمین سلامت فرآیند داوری
                    </span>
                    <span className="text-xs text-on-surface-variant leading-relaxed">
                      پرونده‌ها توسط کارشناسان اٌوِرا بررسی می‌شوند؛ این فرآیند
                      جایگزین مراجع قانونی نیست.
                    </span>
                  </div>
                </div>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    checked={decision === "arbitration" && formOpen}
                    readOnly
                    className="mt-1 w-5 h-5 rounded accent-m3-primary focus:ring-0"
                    type="checkbox"
                  />
                  <span className="text-xs text-on-surface-variant leading-relaxed">
                    تایید مستندات و ارسال پرونده جهت داوری تخصصی اٌوِرا
                  </span>
                </label>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={submitClaim}
                    disabled={!formOpen || submitting}
                    className={`w-full h-14 rounded-lg font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(99,14,212,0.25)] transition-all ${
                      formOpen && !submitting
                        ? "bg-m3-primary hover:bg-primary-container text-on-primary active:scale-[0.98]"
                        : "bg-surface-container-high text-on-surface-variant cursor-not-allowed shadow-none"
                    }`}
                  >
                    <span>
                      {submitting
                        ? "در حال ثبت پرونده..."
                        : formOpen
                          ? "ثبت نهایی اعلام خسارت"
                          : "برای ثبت، فرم را باز کنید"}
                    </span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_back
                    </span>
                  </button>
                  <Link
                    href="/rentals"
                    className="w-full h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-sm font-semibold transition-all flex items-center justify-center"
                  >
                    انصراف و بازگشت به اجاره‌ها
                  </Link>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <span className="text-xs text-m3-outline font-semibold">
                    مراحل رسیدگی در پنل داوری:
                  </span>
                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-on-surface">
                      <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[12px] font-bold">
                        ۱
                      </span>
                      <span>
                        اطلاع‌رسانی رسمی به طرف مقابل جهت ثبت دفاعیه (مهلت ۱۲
                        ساعت)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-on-surface">
                      <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[12px] font-bold">
                        ۲
                      </span>
                      <span>بررسی تخصصی کارشناس بی‌طرف اٌوِرا</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-on-surface">
                      <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[12px] font-bold">
                        ۳
                      </span>
                      <span>
                        صدور رأی قطعی و تسویه یا آزادسازی ودیعه (شبیه‌سازی)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust & Support Mini Card */}
              <div className="p-5 rounded-xl bg-surface-container-low flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-m3-primary">
                    <span className="material-symbols-outlined text-[22px]">
                      support_agent
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-on-surface font-bold">
                      خط اختصاصی داوری اٌوِرا
                    </span>
                    <span className="text-xs text-m3-outline">
                      پاسخگویی سریع
                    </span>
                  </div>
                </div>
                <a
                  href="tel:02191008000"
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-m3-primary text-xs font-bold shadow-sm hover:bg-surface-container-high transition-colors"
                >
                  تماس با ناظر
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
