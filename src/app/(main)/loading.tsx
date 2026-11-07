import M3Styles from "@/components/overa/M3Styles";

/**
 * Route-level loading UI for the (main) segment — reuses the same
 * spinner/skeleton design language as /loading (source: loading.html),
 * without the page chrome or the auto-redirect.
 */
export default function MainLoading() {
  return (
    <div className="w-full">
      <M3Styles />
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col">
        {/* Top Shimmer Progress Line */}
        <div className="w-full h-1 bg-surface-container-high overflow-hidden rounded-full relative mb-8">
          <div className="h-full bg-gradient-to-r from-m3-primary via-primary-container to-secondary-container rounded-full animate-pulse w-3/4"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[ov-shimmer_1.8s_infinite]"></div>
        </div>
        {/* Smart Fetching Banner */}
        <div className="w-full bg-gradient-to-r from-m3-primary via-primary-container to-m3-secondary text-on-primary rounded-xl p-6 shadow-xl shadow-m3-primary/15 relative overflow-hidden mb-10">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative size-14 shrink-0 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <svg className="animate-spin size-8 text-on-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-90" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor"></path>
                </svg>
                <span className="material-symbols-outlined absolute text-base text-on-primary opacity-90 fill">sync</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-headline-md text-on-primary tracking-tight font-bold">
                  در حال بارگذاری تجهیزات آماده تحویل و استعلام ودیعه‌های امن...
                </h2>
                <p className="text-body-sm text-on-primary-container opacity-90">
                  لطفاً چند لحظه شکیبا باشید؛ داده‌ها از نزدیک‌ترین سرور ابری اورا دریافت می‌شوند.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-on-primary shrink-0">
              <span className="inline-block size-2 rounded-full bg-emerald-300 animate-ping"></span>
              <span>همگام‌سازی زنده فعال است</span>
            </div>
          </div>
        </div>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              <div className="w-full h-40 bg-surface-container-high rounded-xl animate-pulse"></div>
              <div className="space-y-2.5 mt-4">
                <div className="h-4 w-3/4 bg-surface-container-highest rounded-lg animate-pulse"></div>
                <div className="h-3 w-1/2 bg-surface-container rounded animate-pulse"></div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-24 bg-primary-container/20 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-20 bg-surface-container-highest rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
