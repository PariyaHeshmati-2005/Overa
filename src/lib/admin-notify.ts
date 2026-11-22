/**
 * Oversight notifications for site admins.
 *
 * The rental state machine already notifies both parties on every step; the
 * admin, however, only saw a dispute through the claims table. These helpers
 * close that gap: whenever a rental reaches an oversight-worthy point — the
 * item coming back healthy (order completed) or a damage/dispute being
 * declared — every admin user receives a Notification so the operations side
 * knows the item was returned safe and sound (and when to settle deposits).
 *
 * Works with both the Prisma transaction client (inside a state-change
 * transaction) and the plain `db` delegate — both satisfy the structural
 * `NotifyDb` surface below. Admins who are themselves participants of the
 * reservation are excluded, so nobody receives the same news twice.
 */

/** Minimal surface shared by Prisma.TransactionClient and the `db` delegate. */
export interface NotifyDb {
  user: {
    findMany(args: {
      where: { isAdmin: boolean; id?: { notIn: string[] } };
      select: { id: true };
    }): Promise<{ id: string }[]>;
  };
  notification: {
    create(args: {
      data: {
        userId: string;
        type: string;
        title: string;
        body: string;
        link?: string | null;
      };
    }): Promise<unknown>;
  };
}

export type AdminNotice = {
  title: string;
  body: string;
  link: string;
  /** Notification.type value (RESERVATION | DISPUTE | SYSTEM | ...). */
  type?: "RESERVATION" | "DISPUTE" | "SYSTEM";
};

export async function notifyAdmins(
  client: NotifyDb,
  notice: AdminNotice,
  excludeUserIds: string[] = [],
): Promise<number> {
  const admins = await client.user.findMany({
    where: {
      isAdmin: true,
      ...(excludeUserIds.length ? { id: { notIn: excludeUserIds } } : {}),
    },
    select: { id: true },
  });
  for (const admin of admins) {
    await client.notification.create({
      data: {
        userId: admin.id,
        type: notice.type ?? "SYSTEM",
        title: notice.title,
        body: notice.body,
        link: notice.link,
      },
    });
  }
  return admins.length;
}
