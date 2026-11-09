import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import DamageClaimsClient from "./DamageClaimsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "ثبت ادعای خسارت و داوری" };

/**
 * damage-claims.html → /damage-claims (protected)
 * Header faithful to the source fixed header; user chip is session-aware.
 */
export default async function DamageClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/damage-claims"));

  return (
    <>
      {/* Fixed header — faithful to damage-claims.html */}
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(99,14,212,0.05)]">
        <div className="h-28 flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="h-16 flex items-center justify-between gap-6">
            {/* Brand Logo & Slogan */}
            <Link className="flex items-center gap-3 group shrink-0" href="/">
              <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200">
                <img src="/assets/img/overa_logo_transparent.png" alt="logo" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">اٌوِرا</span>
                <span className="text-[11px] font-medium text-neutral-muted -mt-1">وسایل بهتر، زندگی سبک‌تر</span>
              </div>
            </Link>
            {/* Search */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block" data-purpose="global-search">
              <form action="/categories" className="relative flex items-center">
                <input
                  name="q"
                  className="w-full h-12 pr-5 pl-14 text-sm bg-neutral-bg border border-purple-100/90 rounded-full focus:bg-white focus:border-m3-primary focus:ring-4 focus:ring-m3-primary/10 transition-all text-neutral-text placeholder-neutral-muted/70"
                  placeholder="جستجو در بین هزاران وسیله..."
                  type="text"
                />
                <button
                  aria-label="جستجو"
                  className="absolute left-1.5 w-9 h-9 rounded-full bg-m3-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-sm transition-colors duration-150"
                  type="submit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                  </svg>
                </button>
              </form>
            </div>
            {/* User actions — session-aware per guest-state rule */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <button
                  className="relative p-1 hover:text-m3-primary transition-colors flex items-center justify-center"
                  type="button"
                  disabled
                  title="به‌زودی"
                >
                  <span className="material-symbols-outlined text-[22px]">notifications</span>
                </button>
                <Link
                  className="p-1 hover:text-m3-primary transition-colors flex items-center justify-center"
                  href="/live-chat"
                  title="گفت‌وگوها"
                >
                  <span className="material-symbols-outlined text-[22px]">chat_bubble_outline</span>
                </Link>
              </div>
              <div className="h-5 w-px bg-outline-variant"></div>
              {user ? (
                <UserMenu
                  user={{ name: user.name, avatarUrl: user.avatarUrl, isHost: user.isHost, isAdmin: user.isAdmin }}
                />
              ) : (
                <a
                  href="/signin-otp"
                  className="inline-flex items-center h-9 px-4 rounded-full bg-m3-primary text-on-primary text-xs font-bold shadow-sm hover:bg-surface-tint transition-colors"
                >
                  ورود | ثبت‌نام
                </a>
              )}
            </div>
          </div>
          <nav className="h-11 flex items-center justify-start gap-4 sm:gap-8 border-t border-surface-container-highest/60 overflow-x-auto">
            <Link className="py-2 text-sm text-on-surface font-bold hover:text-m3-primary transition-colors shrink-0" href="/">خانه</Link>
            <Link className="py-2 text-sm text-on-surface-variant font-medium hover:text-m3-primary transition-colors shrink-0" href="/categories">دسته‌بندی‌ها</Link>
            <Link className="py-2 text-sm text-m3-primary font-bold border-b-2 border-m3-primary -mb-px transition-colors shrink-0" href="/categories">اجاره وسایل</Link>
            <Link className="py-2 text-sm text-on-surface-variant font-medium hover:text-m3-primary transition-colors shrink-0" href="/create-listing">ثبت وسیله</Link>
            <Link className="py-2 text-sm text-on-surface-variant font-medium hover:text-m3-primary transition-colors shrink-0" href="/how-it-works">چگونه کار می‌کند؟</Link>
            <Link className="py-2 text-sm text-on-surface-variant font-medium hover:text-m3-primary transition-colors shrink-0" href="/about">درباره ما</Link>
          </nav>
        </div>
      </header>

      <DamageClaimsClient />
    </>
  );
}
