import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import HeaderClient from "./HeaderClient";

/**
 * Shared session-aware header (server side).
 * Guests see «ورود | ثبت‌نام» — never a demo name. Signed-in users see their
 * real account control in the same established header position.
 */
export default async function SiteHeader() {
  const user = await getCurrentUser();
  let unreadCount = 0;
  if (user) {
    unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });
  }
  return (
    <HeaderClient
      user={
        user
          ? {
              name: user.name,
              avatarUrl: user.avatarUrl,
              isHost: user.isHost,
              isAdmin: user.isAdmin,
            }
          : null
      }
      unreadCount={unreadCount}
    />
  );
}
