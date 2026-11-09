import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import M3Styles from "@/components/overa/M3Styles";
import LiveChatClient from "./LiveChatClient";

export const metadata: Metadata = { title: "گفتگو و صندوق پیام‌ها" };
export const dynamic = "force-dynamic";

export default async function LiveChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/live-chat"));

  return (
    <div className="bg-m3-background text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <M3Styles />
      {/* ==================== TopNavBar — preserved from live-chat.html ==================== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Brand Logo & Slogan */}
            <Link className="flex items-center gap-3 group shrink-0" href="/">
              <div className="w-11 h-11 rounded-2xl from-m3-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-m3-primary/20 group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br">
                { }
                <img src="/assets/img/overa_logo_transparent.png" alt="لوگوی اورا" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">اٌوِرا</span>
                <span className="text-[11px] font-medium text-neutral-muted -mt-1">
                  وسایل بهتر، زندگی سبک‌تر
                </span>
              </div>
            </Link>
            {/* Search Bar (Center) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <form action="/categories" className="relative w-full flex items-center">
                <input
                  type="text"
                  name="q"
                  placeholder="جستجو در بین هزاران وسیله..."
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-full pr-12 pl-14 py-2.5 text-xs text-on-surface placeholder:text-m3-outline focus:outline-none focus:ring-2 focus:ring-m3-primary focus:border-transparent transition-all shadow-inner"
                />
                <span className="material-symbols-outlined text-m3-outline absolute right-4 text-[20px] pointer-events-none">search</span>
                <button
                  className="absolute left-1 w-8 h-8 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-white flex items-center justify-center transition-transform active:scale-95 shadow-sm"
                  title="جستجو"
                >
                  <span className="material-symbols-outlined text-[16px] rtl:rotate-180">arrow_back</span>
                </button>
              </form>
            </div>
            {/* User Actions & Profile (Left in RTL) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                className="relative p-2.5 rounded-xl bg-m3-primary/10 text-m3-primary transition-colors hover:bg-m3-primary/20"
                href="/live-chat"
                title="گفتگو و پیام‌ها"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </Link>
              <button className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" disabled title="به‌زودی">
                <span className="material-symbols-outlined text-[22px]">favorite</span>
              </button>
              <button className="relative p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" disabled title="به‌زودی">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </button>
              <div className="h-6 w-px bg-outline-variant/50 mx-1 hidden sm:block"></div>
              {/* User Profile Pill — session aware (guest state rule) */}
              <UserMenu
                user={{ name: user.name, avatarUrl: user.avatarUrl, isHost: user.isHost, isAdmin: user.isAdmin }}
              />
            </div>
          </div>
        </div>
        {/* Bottom Sub-Navigation Row */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-8 h-11 text-xs font-medium overflow-x-auto custom-scroll">
              <Link href="/" className="text-on-surface-variant hover:text-m3-primary transition-colors py-3 whitespace-nowrap">خانه</Link>
              <Link href="/categories" className="text-on-surface-variant hover:text-m3-primary transition-colors py-3 whitespace-nowrap">دسته‌بندی‌ها</Link>
              <Link href="/categories" className="text-on-surface-variant hover:text-m3-primary transition-colors py-3 whitespace-nowrap">اجاره وسایل</Link>
              <Link href="/create-listing" className="text-on-surface-variant hover:text-m3-primary transition-colors py-3 whitespace-nowrap">ثبت وسیله</Link>
              <Link href="/how-it-works" className="text-on-surface-variant hover:text-m3-primary transition-colors py-3 whitespace-nowrap">چگونه کار می‌کند؟</Link>
              <Link href="/about" className="text-on-surface-variant hover:text-m3-primary transition-colors py-3 whitespace-nowrap">درباره ما</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE CONTAINER ==================== */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col">
        <Suspense fallback={<div className="p-10 text-center text-sm text-on-surface-variant">در حال بارگذاری گفتگوها…</div>}>
          <LiveChatClient myUserId={user.id} myName={user.name} />
        </Suspense>
      </main>
    </div>
  );
}
