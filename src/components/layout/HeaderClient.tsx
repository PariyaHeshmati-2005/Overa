"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import UserMenu, { type HeaderUser } from "./UserMenu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/categories", label: "اجاره وسایل", match: "/categories" },
  { href: "/create-listing", label: "ثبت وسیله" },
  { href: "/how-it-works", label: "چگونه کار می‌کند؟" },
  { href: "/about", label: "درباره ما" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function HeaderClient({
  user,
  unreadCount,
}: {
  user: HeaderUser | null;
  unreadCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/categories?q=${encodeURIComponent(q)}` : "/categories");
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm transition-all">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-3.5 flex flex-col gap-3">
        {/* Top row: brand, search, user actions */}
        <div className="flex items-center justify-between gap-3 md:gap-6">
          <Link
            className="flex items-center gap-3 group shrink-0"
            href="/"
            aria-label="اورا — صفحه اصلی"
          >
            <div className="w-11 h-11 rounded-2xl from-primary to-primary-light flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              <img
                src="/assets/img/overa_logo_transparent.png"
                alt="لوگوی اورا"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#801E76] mt-3 mb-1">
                اٌوِرا
              </span>
              <span className="text-[11px] font-medium text-neutral-muted -mt-1">
                وسایل بهتر، زندگی سبک‌تر
              </span>
            </div>
          </Link>

          {/* Global search */}
          <form
            onSubmit={submitSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4"
            role="search"
          >
            <div className="relative flex items-center w-full">
              <input
                className="w-full h-12 pr-5 pl-14 text-sm bg-neutral-bg border border-purple-100/90 rounded-full focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-neutral-text placeholder-neutral-muted/70"
                placeholder="جستجو در بین هزاران وسیله..."
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="جستجوی وسایل"
              />
              <button
                aria-label="جستجو"
                className="absolute left-1.5 w-9 h-9 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-sm transition-colors duration-150"
                type="submit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </form>

          {/* User actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              aria-label="گفتگوها"
              className="w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-neutral-muted hover:text-primary hover:bg-primary-soft/60 transition-colors"
              onClick={() => router.push("/live-chat")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            <button
              aria-label="علاقه‌مندی‌ها"
              className="w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-neutral-muted hover:text-primary hover:bg-primary-soft/60 transition-colors"
              onClick={() => router.push("/account-settings")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            <div className="relative hidden sm:block">
              <button
                aria-label="اعلان‌ها"
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-muted hover:text-primary hover:bg-primary-soft/60 transition-colors"
                onClick={() => router.push("/account-settings")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                {user && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {new Intl.NumberFormat("fa-IR").format(unreadCount)}
                  </span>
                )}
              </button>
            </div>
            <div className="h-6 w-px bg-purple-200/80 mx-1 hidden sm:block"></div>

            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link
                className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm shadow-primary/30"
                href="/signin-otp"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="whitespace-nowrap">ورود | ثبت‌نام</span>
              </Link>
            )}

            {/* Mobile menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="منوی موبایل"
                  className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-neutral-muted hover:text-primary hover:bg-primary-soft/60 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                  </svg>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6">
                <SheetHeader className="text-right">
                  <SheetTitle className="text-lg font-black text-primary">منوی اورا</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col gap-1">
                  {NAV_LINKS.map((l, i) => (
                    <Link
                      key={i}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive(pathname, l.match ?? l.href)
                          ? "bg-primary-soft text-primary font-bold"
                          : "text-neutral-muted hover:text-primary hover:bg-primary-surface"
                      }`}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className="my-2 h-px bg-purple-100" />
                  <Link href="/tos-support-faq" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm text-neutral-muted hover:text-primary hover:bg-primary-surface">
                    قوانین و پرسش‌های متداول
                  </Link>
                  <Link href="/discounts" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm text-neutral-muted hover:text-primary hover:bg-primary-surface">
                    تخفیف‌ها و کدهای ویژه
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Bottom navigation row */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium border-t border-purple-100/60 pt-2.5 text-neutral-muted"
          aria-label="ناوبری اصلی"
        >
          {NAV_LINKS.map((l, i) => {
            const active = isActive(pathname, l.match ?? l.href);
            return (
              <Link
                key={i}
                href={l.href}
                className={
                  active
                    ? "text-primary font-bold relative after:content-[''] after:absolute after:-bottom-2.5 after:inset-x-0 after:h-0.5 after:bg-primary"
                    : "hover:text-primary transition-colors"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
