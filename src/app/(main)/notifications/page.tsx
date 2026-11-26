import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import NotificationsClient, { type NotificationRow } from "./NotificationsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "اعلان‌های من" };

/**
 * /notifications — the page the header bell opens (was /account-settings).
 * Protected: guests are redirected to login like every other account page.
 * Uses the shared site header (homepage header with the right slide-out
 * menu) and the shared site footer; visual language follows the site
 * palette (purple + gold, rounded-3xl cards, Persian numerals).
 */
export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user)
    redirect("/signin-otp?next=" + encodeURIComponent("/notifications"));

  /* Server-rendered initial data (same shape as GET /api/notifications) so
     the page paints real content immediately; the client still refreshes
     through the API after mark-read actions. */
  const rows = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const initialNotifications: NotificationRow[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <>
      {/* Shared site header — identical to the homepage (slide-out menu,
          live DB search, session-aware user area) */}
      <SiteHeader />

      {/* Breadcrumb — same pattern as the other account pages */}
      <nav
        aria-label="مسیریابی"
        className="flex items-center gap-2 text-sm text-neutral-muted pt-4 mb-4 mt-3 px-4 sm:px-6 max-w-[1440px] w-full mx-auto"
      >
        <Link
          className="hover:text-primary transition-colors flex items-center gap-1"
          href="/"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
            <path d="M3 10.5L12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>خانه</span>
        </Link>
        <svg className="w-3.5 h-3.5 opacity-50 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <Link className="hover:text-primary transition-colors" href="/account-settings">حساب کاربری</Link>
        <svg className="w-3.5 h-3.5 opacity-50 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className="text-neutral-text font-bold">اعلان‌ها</span>
      </nav>

      <NotificationsClient initialNotifications={initialNotifications} />

      <SiteFooter />
    </>
  );
}
