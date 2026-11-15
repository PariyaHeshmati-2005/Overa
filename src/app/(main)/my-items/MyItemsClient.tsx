"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "sonner";
import HostSidebar from "../host-dashboard/HostSidebar";
import { faDate, faNumber } from "@/lib/format";

type ApiListing = {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  specs: string | null;
  dailyPrice: number;
  weeklyPrice: number | null;
  deposit: number;
  city: string;
  area: string | null;
  status: string;
  rejectionReason: string | null;
  rating: number;
  reviewsCount: number;
  instantBook: boolean;
  pickupInPerson: boolean;
  deliveryCourier: boolean;
  createdAt: string;
  updatedAt: string;
  images: { url: string }[];
  category: { name: string; slug: string };
  owner: { name: string };
};

export type { ApiListing };

export type MyItemsStats = {
  total: number;
  active: number;
  pending: number;
  draft: number;
  paused: number;
  rejected: number;
  archived: number;
  rented: number;
  revenueMonth: number;
  avgRating: number | null;
  reviewsCount: number;
  claimsAgainst: number;
};

type Props = {
  stats: MyItemsStats;
  rentedMap: Record<string, { id: string; endDateLabel: string }>;
  initialListings: ApiListing[];
};

type TabKey = "ALL" | "ACTIVE" | "PENDING" | "DRAFT" | "REJECTED" | "PAUSED" | "ARCHIVED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "همه وسایل" },
  { key: "ACTIVE", label: "آگهی‌های فعال و منتشرشده" },
  { key: "PENDING", label: "در انتظار تایید کارشناس" },
  { key: "DRAFT", label: "پیش‌نویس‌ها و ذخیره‌های موقت" },
  { key: "REJECTED", label: "نیازمند بازبینی و ویرایش" },
  { key: "PAUSED", label: "غیرفعال / در حال سرویس" },
  { key: "ARCHIVED", label: "آرشیو" },
];

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "فعال", cls: "bg-emerald-50 text-emerald-600 border border-emerald-200/50" },
  PENDING: { label: "در انتظار تایید کارشناس", cls: "bg-amber-100 text-amber-800 border border-amber-200/60" },
  DRAFT: { label: "پیش‌نویس", cls: "bg-primary-fixed text-primary border border-primary/20" },
  PAUSED: { label: "موقتاً غیرفعال", cls: "bg-surface-container text-on-surface-variant border border-outline-variant/40" },
  REJECTED: { label: "رد شده", cls: "bg-m3-error-container text-m3-on-error-container border border-m3-error/20" },
  ARCHIVED: { label: "آرشیو", cls: "bg-surface-container-high text-on-surface-variant border border-outline-variant/40" },
};

const PAGE_SIZE = 6;

/** Completion heuristic for draft cards (مرحله X از ۴). */
function draftProgress(l: ApiListing) {
  let pct = 0;
  if (l.title && l.category) pct += 25;
  if ((l.images?.length ?? 0) > 0) pct += 25;
  if (l.dailyPrice > 0 && l.deposit > 0) pct += 25;
  if (l.city) pct += 25;
  const step = pct === 0 ? 1 : Math.min(4, Math.max(1, Math.round(pct / 25)));
  const nextHint =
    pct === 0
      ? "گام بعدی: تکمیل اطلاعات پایه و دسته‌بندی"
      : pct < 50
        ? "گام بعدی: انتخاب تصاویر وسیله از نمونه‌ها"
        : pct < 75
          ? "گام بعدی: تعیین قیمت و ودیعه"
          : "گام بعدی: بازبینی نهایی و ارسال برای بررسی";
  return { pct, step, nextHint };
}

export default function MyItemsClient({ stats, rentedMap, initialListings }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [allListings, setAllListings] = useState<ApiListing[]>(initialListings);
  const [listings, setListings] = useState<ApiListing[]>(initialListings);
  const [loading, setLoading] = useState(initialListings.length === 0);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const loadAll = useCallback(async () => {
    const res = await fetch("/api/listings?mine=1");
    const data = await res.json();
    setAllListings(Array.isArray(data.listings) ? data.listings : []);
  }, []);

  const loadTab = useCallback(
    async (t: TabKey) => {
      setLoading(true);
      try {
        const url = t === "ALL" ? "/api/listings?mine=1" : `/api/listings?mine=1&status=${t}`;
        const res = await fetch(url);
        const data = await res.json();
        setListings(Array.isArray(data.listings) ? data.listings : []);
        if (t === "ALL") setAllListings(Array.isArray(data.listings) ? data.listings : []);
      } catch {
        toast.error("دریافت فهرست وسایل ممکن نشد.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadTab("ALL");
  }, [loadTab]);

  useEffect(() => {
    void loadTab(tab);
    setPage(1);
  }, [tab, loadTab]);

  async function patchStatus(
    l: ApiListing,
    next: string,
    confirmText: string,
    successMsg: string,
  ) {
    if (!window.confirm(confirmText)) return;
    setBusy(l.id);
    try {
      const res = await fetch(`/api/listings/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "تغییر وضعیت آگهی ممکن نشد.");
        return;
      }
      toast.success(successMsg);
      await Promise.all([loadAll(), loadTab(tab)]);
      router.refresh();
    } catch {
      toast.error("خطای شبکه — دوباره تلاش کنید.");
    } finally {
      setBusy(null);
    }
  }

  async function removeListing(l: ApiListing) {
    if (!window.confirm(`آگهی «${l.title}» از فهرست شما حذف (آرشیو) شود؟`)) return;
    setBusy(l.id);
    try {
      const res = await fetch(`/api/listings/${l.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "حذف آگهی ممکن نشد.");
        return;
      }
      toast.success("آگهی حذف و به آرشیو منتقل شد.");
      await Promise.all([loadAll(), loadTab(tab)]);
      router.refresh();
    } catch {
      toast.error("خطای شبکه — دوباره تلاش کنید.");
    } finally {
      setBusy(null);
    }
  }

  const counts: Record<TabKey, number> = useMemo(() => {
    const c: Record<TabKey, number> = {
      ALL: allListings.length,
      ACTIVE: 0,
      PENDING: 0,
      DRAFT: 0,
      REJECTED: 0,
      PAUSED: 0,
      ARCHIVED: 0,
    };
    for (const l of allListings) {
      const k = l.status as TabKey;
      if (k in c) c[k] += 1;
    }
    return c;
  }, [allListings]);

  const categoriesInUse = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of allListings) map.set(l.category.slug, l.category.name);
    return Array.from(map.entries());
  }, [allListings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...listings];
    if (q) {
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.brand ?? "").toLowerCase().includes(q) ||
          l.category.name.includes(q),
      );
    }
    if (categoryFilter !== "all") list = list.filter((l) => l.category.slug === categoryFilter);
    if (sort === "price_asc") list.sort((a, b) => a.dailyPrice - b.dailyPrice);
    else if (sort === "price_desc") list.sort((a, b) => b.dailyPrice - a.dailyPrice);
    else list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }, [listings, query, categoryFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const drafts = useMemo(() => allListings.filter((l) => l.status === "DRAFT"), [allListings]);

  const draftActions = (l: ApiListing) => {
    const items: { label: string; run: () => void }[] = [];
    if (l.status === "ACTIVE") {
      items.push({
        label: "توقف نمایش (غیرفعال)",
        run: () =>
          patchStatus(l, "PAUSED", `نمایش آگهی «${l.title}» موقتاً متوقف شود؟`, "آگهی موقتاً غیرفعال شد."),
      });
    }
    if (l.status === "PAUSED") {
      items.push({
        label: "فعال‌سازی مجدد",
        run: () => patchStatus(l, "ACTIVE", `آگهی «${l.title}» دوباره فعال شود؟`, "آگهی فعال شد و در سایت منتشر گردید."),
      });
    }
    if (l.status === "DRAFT") {
      items.push({
        label: "ارسال برای بررسی",
        run: () =>
          patchStatus(l, "PENDING", `آگهی «${l.title}» برای تایید کارشناس ارسال شود؟`, "آگهی برای بررسی کارشناس ارسال شد."),
      });
    }
    if (l.status === "REJECTED") {
      items.push({
        label: "ارسال مجدد برای بررسی",
        run: () =>
          patchStatus(l, "PENDING", `آگهی «${l.title}» پس از ویرایش دوباره ارسال شود؟`, "آگهی برای بررسی مجدد ارسال شد."),
      });
    }
    if (l.status !== "ARCHIVED") {
      items.push({
        label: "آرشیو کردن",
        run: () =>
          patchStatus(l, "ARCHIVED", `آگهی «${l.title}» به آرشیو منتقل شود؟`, "آگهی به آرشیو منتقل شد."),
      });
    } else {
      items.push({ label: "حذف از فهرست", run: () => removeListing(l) });
    }
    return items;
  };

  const renderCard = (l: ApiListing) => {
    const chip = STATUS_CHIP[l.status] ?? STATUS_CHIP.ARCHIVED;
    const img = l.images?.[0]?.url;
    const rented = rentedMap[l.id];
    const code = `#${l.id.slice(-6).toUpperCase()}`;
    return (
      <div
        key={l.id}
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
      >
        <div
          className="relative h-48 w-full bg-surface-container bg-cover bg-center"
          style={img ? { backgroundImage: `url('${img}')` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
          <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
            {rented ? (
              <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">key</span>
                هم‌اکنون در اجاره
              </span>
            ) : l.status === "ACTIVE" ? (
              <span className="bg-surface-container-lowest/90 text-on-surface text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500"></span>
                آماده رزرو
              </span>
            ) : (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${chip.cls}`}>
                {chip.label}
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 left-3 text-white text-xs font-semibold truncate">
            {l.title}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-[16px] text-amber-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <strong className="text-on-surface">
                  {l.reviewsCount > 0 ? faNumber(Math.round(l.rating * 10) / 10) : "—"}
                </strong>
                ({faNumber(l.reviewsCount)} نظر)
              </span>
              <span className="text-m3-primary font-semibold">کد وسیله: {code}</span>
            </div>

            {l.status === "REJECTED" && l.rejectionReason && (
              <p className="text-[11px] text-m3-on-error-container bg-m3-error-container/60 rounded-lg px-2.5 py-1.5 leading-relaxed">
                دلیل رد کارشناس: {l.rejectionReason}
              </p>
            )}
            {l.status === "PENDING" && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg px-2.5 py-1.5">
                در انتظار تایید کارشناس — تا تایید، آگهی منتشر نمی‌شود.
              </p>
            )}

            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">کرایه روزانه:</span>
                <span className="font-bold text-on-surface text-sm">
                  {faNumber(l.dailyPrice)} تومان
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-on-surface-variant">ودیعه ضمانت اورا:</span>
                <span className="font-medium text-on-surface">
                  {l.deposit > 0 ? `${faNumber(l.deposit)} تومان` : "بدون ودیعه"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-outline-variant/20">
                <span className="text-on-surface-variant">
                  {rented ? "تحویل به مستأجر:" : "تحویل:"}
                </span>
                <span
                  className={
                    rented ? "text-emerald-700 font-medium" : "text-on-surface-variant"
                  }
                >
                  {rented
                    ? `تا ${rented.endDateLabel}`
                    : `${l.city}${l.area ? "، " + l.area : ""} / ${
                        l.deliveryCourier ? "ارسال پیک" : "تحویل حضوری"
                      }`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
            {rented && (
              <Link
                href={`/rental-lifecycle/${rented.id}`}
                className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">hourglass_top</span>
                <span className="">در حال پیگیری</span>
              </Link>
            )}
            <Link
              href={`/create-listing?edit=${l.id}`}
              className="flex-1 h-9 px-3 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span className="">ویرایش</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
                  title="گزینه‌های بیشتر"
                  disabled={busy === l.id}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {busy === l.id ? "hourglass" : "more_vert"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                {draftActions(l).map((a) => (
                  <DropdownMenuItem
                    key={a.label}
                    className="rounded-lg text-xs cursor-pointer"
                    onClick={a.run}
                  >
                    {a.label}
                  </DropdownMenuItem>
                ))}
                {l.status === "PENDING" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled
                      className="rounded-lg text-xs text-on-surface-variant/60"
                      title="تایید آگهی فقط توسط کارشناس اورا انجام می‌شود"
                    >
                      تایید آگهی (فقط کارشناس)
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  const renderListRow = (l: ApiListing) => {
    const chip = STATUS_CHIP[l.status] ?? STATUS_CHIP.ARCHIVED;
    const img = l.images?.[0]?.url;
    const rented = rentedMap[l.id];
    return (
      <div
        key={l.id}
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-xs"
      >
        <div
          className="size-20 sm:size-16 rounded-xl bg-surface-container bg-cover bg-center shrink-0 border border-outline-variant/30"
          style={img ? { backgroundImage: `url('${img}')` } : undefined}
        ></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-on-surface truncate">{l.title}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chip.cls}`}>
              {chip.label}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {l.category.name} • {l.city}
            {l.area ? "، " + l.area : ""} • {faNumber(l.dailyPrice)} تومان/روز • آخرین ویرایش{" "}
            {faDate(l.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rented && (
            <Link
              href={`/rental-lifecycle/${rented.id}`}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
            >
              در حال پیگیری
            </Link>
          )}
          <Link
            href={`/create-listing?edit=${l.id}`}
            className="h-9 px-3 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            ویرایش
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="size-9 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant flex items-center justify-center"
                title="گزینه‌های بیشتر"
                disabled={busy === l.id}
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
              {draftActions(l).map((a) => (
                <DropdownMenuItem
                  key={a.label}
                  className="rounded-lg text-xs cursor-pointer"
                  onClick={a.run}
                >
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-m3-background text-on-surface antialiased min-h-screen">
      <Toaster position="bottom-left" richColors />
      <div className="flex min-h-screen w-full bg-m3-background items-stretch">
        <HostSidebar active="items" />
        <div className="flex-1 flex flex-col min-w-0">

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* 1. Hero header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                    مدیریت وسایل و آگهی‌های من
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  مدیریت کالاها، تنظیم موجودی و قیمت تقویم، مشاهده وضعیت تایید و
                  پیگیری پیش‌نویس‌های ذخیره‌شده موقت
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/create-listing"
                  className="h-10 px-5 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm shadow-m3-primary/20 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className=""> ثبت وسیله جدید</span>
                </Link>
              </div>
            </section>

            {/* 2. KPI cards — real aggregates */}
            <section aria-label="آمار کلیدی وسایل" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    کل وسایل ثبت‌شده
                  </span>
                  <div className="size-8 rounded-lg bg-surface-container-high text-m3-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">devices</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="text-2xl font-black text-on-surface tracking-tight">
                    {faNumber(stats.total)} وسیله
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-semibold">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span className="">
                      {faNumber(stats.active)} فعال | {faNumber(stats.rented)} در اجاره |{" "}
                      {faNumber(stats.pending)} در انتظار تایید
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-m3-primary h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm relative overflow-hidden flex flex-col justify-between ring-1 ring-m3-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-on-surface-variant">
                      پیش‌نویس‌ها و ثبت‌های موقت
                    </span>
                    <span className="size-2 rounded-full bg-m3-primary animate-pulse"></span>
                  </div>
                  <div className="size-8 rounded-lg bg-primary-fixed/60 text-m3-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">edit_document</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="text-2xl font-black text-m3-primary tracking-tight">
                    {faNumber(stats.draft)} مورد دردسترس
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-m3-primary">cloud_done</span>
                    <span className="">با دکمه «ذخیره موقت» در فرم ثبت ذخیره می‌شوند</span>
                  </div>
                </div>
                <div className="text-[11px] text-m3-primary/80 font-medium bg-primary-fixed/30 px-2 py-1 rounded-md">
                  قابل تکمیل و بازیابی از بخش پیش‌نویس‌ها
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    درآمد ناخالص این ماه
                  </span>
                  <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="text-2xl font-black text-on-surface tracking-tight">
                    {faNumber(stats.revenueMonth)}
                    <span className="text-xs font-normal text-on-surface-variant"> تومان</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
                    <span className="material-symbols-outlined text-sm">north_east</span>
                    <span className="">جمع تراکنش‌های دریافت اجاره</span>
                  </div>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  تسویه خودکار هر دوشنبه — شبیه‌سازی
                </span>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    شاخص سلامت و رضایت کالا
                  </span>
                  <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="text-2xl font-black text-on-surface tracking-tight">
                    {stats.avgRating != null ? faNumber(Math.round(stats.avgRating * 10) / 10) : "—"}
                    <span className="text-xs font-normal text-on-surface-variant"> از ۵.۰</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-variant">
                    <span
                      className="material-symbols-outlined text-sm text-amber-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      reviews
                    </span>
                    <span className="">بر اساس {faNumber(stats.reviewsCount)} نظر تاییدشده</span>
                  </div>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  {stats.claimsAgainst > 0
                    ? `${faNumber(stats.claimsAgainst)} گزارش خسارت ثبت‌شده`
                    : "بدون گزارش خسارت یا تاخیر"}
                </span>
              </div>
            </section>

            {/* 3. Draft sync banner */}
            <section className="rounded-2xl p-5 sm:p-6 bg-gradient-to-l from-m3-primary/10 via-surface-container-high to-surface-container-low border border-m3-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-m3-primary text-on-primary flex items-center justify-center shrink-0 shadow-md shadow-m3-primary/25">
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    cloud_sync
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      سیستم همگام‌سازی و ذخیره خودکار ابری اورا فعال است
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      فعال
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-3xl">
                    اگر در حین پر کردن فرم «ثبت وسیله جدید» دکمه ذخیره موقت را زده
                    باشید، تمامی عکس‌ها و اطلاعات شما در بخش پیش‌نویس‌ها محفوظ و
                    قابل تکمیل است.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <a
                  className="w-full md:w-auto h-10 px-4 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  href="#drafts-section"
                >
                  <span className="">
                    {drafts.length > 0
                      ? `مشاهده و تکمیل ${faNumber(drafts.length)} پیش‌نویس ناتمام`
                      : "مشاهده پیش‌نویس‌ها"}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </a>
              </div>
            </section>

            {/* 4. Status tabs & quick filters */}
            <section className="space-y-4">
              <div
                className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/30"
                role="tablist"
                aria-label="فیلتر وضعیت وسایل"
              >
                {TABS.map((t) => {
                  const isDraft = t.key === "DRAFT";
                  const isActiveTab = tab === t.key;
                  const base =
                    "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all";
                  const cls = isActiveTab
                    ? isDraft
                      ? "bg-primary-fixed text-on-primary-fixed-variant border border-m3-primary/20"
                      : "bg-m3-primary text-on-primary shadow-sm"
                    : isDraft
                      ? "bg-primary-fixed/60 text-on-primary-fixed-variant hover:bg-primary-fixed border border-primary/20"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container";
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={isActiveTab}
                      onClick={() => setTab(t.key)}
                      className={`${base} ${cls}`}
                    >
                      {isDraft && (
                        <span className="material-symbols-outlined text-[16px] text-m3-primary">
                          pending_actions
                        </span>
                      )}
                      <span className="">{t.label}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActiveTab
                            ? isDraft
                              ? "bg-m3-primary text-on-primary"
                              : "bg-white/20 text-on-primary"
                            : isDraft
                              ? "bg-m3-primary text-on-primary"
                              : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        {faNumber(counts[t.key])}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-m3-outline text-[20px]">
                      search
                    </span>
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-m3-primary focus:ring-1 focus:ring-m3-primary text-xs text-on-surface placeholder:text-m3-outline outline-none"
                      placeholder="جستجو با عنوان وسیله، برند یا دسته‌بندی..."
                      type="text"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-10 px-3 pr-8 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium text-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary outline-none"
                    >
                      <option value="all">همه دسته‌ها</option>
                      {categoriesInUse.map(([slug, name]) => (
                        <option key={slug} value={slug}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant hidden lg:inline">
                      مرتب‌سازی:
                    </span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="h-10 px-3 pr-7 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-semibold text-on-surface focus:border-m3-primary outline-none"
                    >
                      <option value="updated">جدیدترین ویرایش و فعالیت</option>
                      <option value="price_asc">کمترین کرایه روزانه</option>
                      <option value="price_desc">بیشترین کرایه روزانه</option>
                    </select>
                  </div>
                  <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
                    <button
                      onClick={() => setLayout("grid")}
                      className={`p-1.5 rounded-lg transition-all ${
                        layout === "grid"
                          ? "bg-surface-container-lowest text-m3-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      title="نمای شبکه‌ای"
                      aria-pressed={layout === "grid"}
                    >
                      <span className="material-symbols-outlined text-[18px]">grid_view</span>
                    </button>
                    <button
                      onClick={() => setLayout("list")}
                      className={`p-1.5 rounded-lg transition-all ${
                        layout === "list"
                          ? "bg-surface-container-lowest text-m3-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      title="نمای سطری"
                      aria-pressed={layout === "list"}
                    >
                      <span className="material-symbols-outlined text-[18px]">view_list</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Drafts section */}
            <section className="space-y-4 pt-2" id="drafts-section">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full bg-m3-primary ring-4 ring-m3-primary/20"></span>
                  <h3 className="text-base sm:text-lg font-bold text-on-surface">
                    پیش‌نویس‌ها و ثبت‌های ناتمام شما
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    | مواردی که با دکمه ذخیره موقت ذخیره شده‌اند
                  </span>
                </div>
                <span className="text-xs font-semibold text-m3-primary">
                  {faNumber(drafts.length)} آگهی در انتظار تکمیل نهایی
                </span>
              </div>

              {drafts.length === 0 ? (
                <p className="text-xs text-on-surface-variant bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-2xl p-6 text-center">
                  در حال حاضر پیش‌نویس ناتمامی ندارید.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {drafts.map((l) => {
                    const p = draftProgress(l);
                    return (
                      <div
                        key={l.id}
                        className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-m3-primary/30 p-5 flex flex-col justify-between hover:border-m3-primary hover:shadow-md transition-all group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary-fixed text-m3-primary px-2.5 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[13px]">cloud_done</span>
                              ذخیره موقت
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              {faDate(l.updatedAt)}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <div
                              className="size-16 rounded-xl bg-cover bg-center shrink-0 border border-outline-variant/30 bg-surface-container"
                              style={
                                l.images?.[0]?.url
                                  ? { backgroundImage: `url('${l.images[0].url}')` }
                                  : undefined
                              }
                            ></div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-bold text-sm text-on-surface group-hover:text-m3-primary transition-colors truncate">
                                {l.title}
                              </h4>
                              <p className="text-xs text-on-surface-variant">
                                دسته‌بندی: {l.category.name}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-on-surface">
                                مرحله {faNumber(p.step)} از ۴
                              </span>
                              <span className="font-bold text-m3-primary">
                                {faNumber(p.pct)}٪ تکمیل
                              </span>
                            </div>
                            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-m3-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${p.pct}%` }}
                              ></div>
                            </div>
                            <p className="text-[11px] text-on-surface-variant">{p.nextHint}</p>
                          </div>
                        </div>
                        <div className="pt-5 mt-3 border-t border-outline-variant/20 flex items-center gap-2">
                          <Link
                            href={`/create-listing?edit=${l.id}`}
                            className="flex-1 h-9 rounded-xl bg-m3-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span className="">ادامه ثبت از مرحله {faNumber(p.step)}</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                          </Link>
                          <button
                            onClick={() => removeListing(l)}
                            disabled={busy === l.id}
                            className="size-9 rounded-xl border border-outline-variant/40 hover:bg-m3-error-container hover:text-m3-error hover:border-m3-error/30 text-on-surface-variant flex items-center justify-center transition-colors"
                            title="حذف پیش‌نویس"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 6. Listings grid/list */}
            <section className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-on-surface">
                    {tab === "ALL" ? "آگهی‌های شما در همه وضعیت‌ها" : TABS.find((t) => t.key === tab)?.label}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {loading
                      ? "در حال دریافت…"
                      : `${faNumber(filtered.length)} وسیله از ${faNumber(stats.total)} وسیله ثبت‌شده`}
                  </p>
                </div>
              </div>

              {!loading && filtered.length === 0 && (
                <p className="text-xs text-on-surface-variant bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 text-center">
                  در این وضعیت آگهی‌ای یافت نشد.
                </p>
              )}

              {layout === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paged.map(renderCard)}
                </div>
              ) : (
                <div className="space-y-3">{paged.map(renderListRow)}</div>
              )}

              {/* Pagination */}
              {filtered.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 text-xs">
                  <span className="text-on-surface-variant font-medium">
                    نمایش {faNumber((safePage - 1) * PAGE_SIZE + 1)} تا{" "}
                    {faNumber(Math.min(safePage * PAGE_SIZE, filtered.length))} از کل{" "}
                    {faNumber(filtered.length)} آگهی
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="size-8 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
                      aria-label="صفحه قبل"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`size-8 rounded-lg flex items-center justify-center ${
                          p === safePage
                            ? "bg-m3-primary text-on-primary font-bold"
                            : "border border-outline-variant/40 hover:bg-surface-container text-on-surface font-semibold"
                        }`}
                      >
                        {faNumber(p)}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="size-8 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
                      aria-label="صفحه بعد"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>

          <footer className="mt-8 border-t border-outline-variant/30 bg-surface-container-lowest py-4 px-6 text-center text-xs text-on-surface-variant">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="">
                © ۱۴۰۳ سامانه هوشمند اجاره وسایل اورا (Overa) - کلیه حقوق برای پنل
                میزبان محفوظ است.
              </p>
              <div className="flex items-center gap-4">
                <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
                  قوانین و ضمانت اجرایی
                </Link>
                <Link className="hover:text-m3-primary transition-colors" href="/tos-support-faq">
                  مرکز تماس میزبانان
                </Link>
                <span className="">نسخه سامانه v2.8.4</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
