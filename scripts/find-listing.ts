// Get a listing id by title (dev utility for API testing).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const title = process.argv[2];
if (!title) {
  console.error("usage: bun run scripts/find-listing.ts <title-substring>");
  process.exit(1);
}
const l = await db.listing.findFirst({
  where: { title: { contains: title } },
  select: { id: true, title: true, status: true },
});
console.log(l ? `${l.id} ${l.status}` : "NOT_FOUND");
await db.$disconnect();
