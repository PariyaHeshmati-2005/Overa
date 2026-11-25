import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

/** GET /api/conversations — the caller's conversations with last message + unread count. */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const participations = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          listing: { select: { id: true, title: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          participants: {
            include: { user: { select: { id: true, name: true } } },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const conversations = participations.map((p) => {
    const other = p.conversation.participants.find((x) => x.userId !== user.id);
    const unread = p.conversation.messages[0]
      ? p.conversation.messages[0].createdAt > p.lastReadAt && p.conversation.messages[0].senderId !== user.id
        ? 1
        : 0
      : 0;
    return {
      id: p.conversation.id,
      lastReadAt: p.lastReadAt,
      listing: p.conversation.listing,
      other: other?.user ?? null,
      reservationId: p.conversation.reservationId,
      lastMessage: p.conversation.messages[0] ?? null,
      unread,
    };
  });

  return jsonOk({ conversations });
}

/**
 * POST /api/conversations — open (or reuse) a conversation about a listing.
 * Body: { listingId } or { reservationId }
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  let listingId = body.listingId ? String(body.listingId) : null;
  let reservationId = body.reservationId ? String(body.reservationId) : null;
  let otherId: string | null = null;

  if (reservationId) {
    const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return jsonError("رزرو یافت نشد.", 404);
    if (reservation.renterId !== user.id && reservation.hostId !== user.id && !auth.user.isAdmin)
      return jsonError("دسترسی مجاز نیست.", 403);
    // Admin joins the reservation conversation so they can talk with the
    // renter (and host) straight from the «اعلام خسارت‌ها» case card.
    if (auth.user.isAdmin && reservation.renterId !== user.id && reservation.hostId !== user.id) {
      const existing = await db.conversation.findUnique({ where: { reservationId } });
      if (existing) {
        await db.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: existing.id, userId: user.id } },
          create: { conversationId: existing.id, userId: user.id },
          update: {},
        });
        return jsonOk({ conversationId: existing.id, existing: true });
      }
      const conversation = await db.conversation.create({
        data: {
          listingId: reservation.listingId,
          reservationId,
          participants: { create: [{ userId: reservation.renterId }, { userId: user.id }] },
        },
      });
      return jsonOk({ conversationId: conversation.id }, 201);
    }
    otherId = reservation.renterId === user.id ? reservation.hostId : reservation.renterId;
    listingId = reservation.listingId;
    const existing = await db.conversation.findUnique({ where: { reservationId } });
    if (existing) return jsonOk({ conversationId: existing.id, existing: true });
  } else if (listingId) {
    const listing = await db.listing.findUnique({ where: { id: listingId } });
    if (!listing) return jsonError("وسیله یافت نشد.", 404);
    if (listing.ownerId === user.id) return jsonError("گفتگو با خودتان معنی ندارد.", 422);
    otherId = listing.ownerId;
  } else {
    return jsonError("listingId یا reservationId لازم است.");
  }

  if (!otherId) return jsonError("طرف مقابل یافت نشد.", 404);

  // Reuse an existing conversation about the same listing between the two users.
  const existing = await db.conversation.findFirst({
    where: {
      listingId: listingId ?? undefined,
      reservationId: reservationId ?? undefined,
      participants: { every: { userId: { in: [user.id, otherId] } } },
    },
    include: { participants: true },
  });
  if (existing && existing.participants.length === 2) {
    return jsonOk({ conversationId: existing.id, existing: true });
  }

  const conversation = await db.conversation.create({
    data: {
      listingId,
      reservationId,
      participants: { create: [{ userId: user.id }, { userId: otherId }] },
    },
  });
  return jsonOk({ conversationId: conversation.id }, 201);
}
