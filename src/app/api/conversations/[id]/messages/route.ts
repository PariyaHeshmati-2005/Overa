import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function assertParticipant(conversationId: string, userId: string) {
  return db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
}

/** GET /api/conversations/[id]/messages — participant only (polled for near-real-time). */
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const participation = await assertParticipant(id, user.id);
  if (!participation) return jsonError("دسترسی به این گفتگو مجاز نیست.", 403);

  const url = new URL(req.url);
  const after = url.searchParams.get("after");

  const messages = await db.message.findMany({
    where: {
      conversationId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
    take: 200,
  });

  // mark incoming messages as read
  await db.conversationParticipant.update({
    where: { id: participation.id },
    data: { lastReadAt: new Date() },
  });

  return jsonOk({ messages });
}

/** POST /api/conversations/[id]/messages — send a message (validated). */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const participation = await assertParticipant(id, user.id);
  if (!participation) return jsonError("دسترسی به این گفتگو مجاز نیست.", 403);

  const body = await req.json().catch(() => ({}));
  const text = String(body.body ?? "").trim();
  const attachmentUrl = body.attachmentUrl ? String(body.attachmentUrl) : null;
  if (!text && !attachmentUrl) return jsonError("متن پیام خالی است.");
  if (text.length > 2000) return jsonError("پیام بیش از حد طولانی است (حداکثر ۲۰۰۰ کاراکتر).");
  if (attachmentUrl && !/^https?:\/\/|^\/(assets|uploads)\//.test(attachmentUrl))
    return jsonError("لینک فایل پیوست معتبر نیست.");

  // Damage-claim conversations are TEXT-ONLY: no images, voice or attachments.
  const conversation = await db.conversation.findUnique({
    where: { id },
    select: { reservationId: true },
  });
  if (attachmentUrl && conversation?.reservationId) {
    const openClaim = await db.damageClaim.findFirst({
      where: { reservationId: conversation.reservationId, status: { notIn: ["SETTLED"] } },
      select: { id: true },
    });
    if (openClaim) {
      return jsonError(
        "در گفتگوی پرونده خسارت فقط پیام متنی مجاز است؛ ارسال تصویر و فایل ممکن نیست.",
        422,
      );
    }
  }

  const message = await db.message.create({
    data: { conversationId: id, senderId: user.id, body: text, attachmentUrl },
    include: { sender: { select: { id: true, name: true } } },
  });
  await db.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // notify the other participant(s)
  const others = await db.conversationParticipant.findMany({
    where: { conversationId: id, userId: { not: user.id } },
  });
  for (const o of others) {
    await db.notification.create({
      data: { userId: o.userId, type: "MESSAGE", title: "پیام جدید", body: `${user.name}: ${text.slice(0, 60)}`, link: `/live-chat?c=${id}` },
    });
  }

  return jsonOk({ message }, 201);
}
