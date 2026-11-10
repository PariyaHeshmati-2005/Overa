import Link from "next/link";

/**
 * Dark persistent host-portal sidebar — faithful conversion of the source
 * `host-dashboard.html` / `my-items.html` right rail. The active item keeps
 * the solid `#7312d8` pill; the support card links to the real live-chat route.
 */
export default function HostSidebar({
  active,
}: {
  active: "dashboard" | "items";
}) {
  const items = [
    {
      key: "dashboard",
      href: "/host-dashboard",
      icon: "home",
      label: "داشبورد",
    },
    {
      key: "items",
      href: "/my-items",
      icon: "shopping_bag",
      label: "وسایل من",
    },
    { key: "rentals", href: "/rentals", icon: "calendar_today", label: "اجاره‌ها" },
    { key: "wallet", href: "/wallet", icon: "monetization_on", label: "درآمد و تسویه حساب" },
    { key: "reviews", href: "/reviews", icon: "star_outline", label: "نظرات کاربران" },
    { key: "discounts", href: "/discounts", icon: "description", label: "تخفیف ها" },
    { key: "settings", href: "/account-settings", icon: "settings", label: "تنظیمات" },
  ] as const;

  return (
    <aside
      className="w-72 shrink-0 border-l border-[#2e175b]/60 flex flex-col justify-between p-4 min-h-screen hidden lg:flex sticky top-0 h-screen overflow-y-auto items-stretch z-30"
      style={{ background: "rgb(19, 8, 39)", minHeight: "100vh", height: "100vh" }}
    >
      <div className="flex flex-col gap-6">
        <nav aria-label="منوی پنل کاربری" className="flex flex-col gap-1.5 pt-3">
          {items.map((item) => {
            const isActive = item.key === active;
            if (isActive) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current="page"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white font-bold text-sm shadow-md shadow-purple-900/40 transition-all"
                  style={{ background: "#7312d8" }}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span className="text-[14px]">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#d4c5f9] hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[19px] text-[#b39ddb]">
                  {item.icon}
                </span>
                <span className="">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3 pt-4 pb-2">
        <div
          className="rounded-2xl p-4 flex flex-col items-center text-center gap-2 border border-[#431f7a]/40 shadow-inner"
          style={{ background: "rgba(36, 12, 69, 0.65)", backdropFilter: "blur(8px)" }}
        >
          <div className="size-10 rounded-full flex items-center justify-center bg-[#4c1d95]/40 text-[#c4b5fd] border border-[#7c3aed]/30 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">
              support_agent
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <span className="font-bold text-white text-xs tracking-tight">
              پشتیبانی ۲۴ ساعته
            </span>
            <span className="text-[11px] text-[#bca7e8]">
              در هر زمان کنار شما هستیم
            </span>
          </div>
          <Link
            href="/live-chat"
            className="w-full mt-2 py-2 px-3 rounded-xl border border-[#7c3aed]/50 text-white font-medium text-xs hover:bg-[#7c3aed]/20 transition-all active:scale-[0.98] text-center"
            style={{ background: "rgba(43, 14, 82, 0.6)" }}
          >
            تماس با پشتیبانی
          </Link>
        </div>

        <div className="text-center text-[10px] text-[#8e76be] py-1 font-medium">
          با ما، اجاره دادن ساده‌تر از همیشه است ✨
        </div>
      </div>
    </aside>
  );
}
