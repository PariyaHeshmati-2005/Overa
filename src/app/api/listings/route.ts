import { db } from "@/lib/db";
import { jsonError, jsonOk, parseIntSafe, requireUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/listings?q=&category=&city=&min=&max=&sort=&instant=&mine=&status= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const city = url.searchParams.get("city");
  const min = url.searchParams.get("min");
  const max = url.searchParams.get("max");
  const sort = url.searchParams.get("sort") ?? "newest"; // newest | price_asc | price_desc | rating
  const instant = url.searchParams.get("instant") === "1";
  const mine = url.searchParams.get("mine") === "1";
  const statusParam = url.searchParams.get("status");

  const user = await getCurrentUser();

  const where: Record<string, unknown> = {};
  // Public discovery shows only ACTIVE listings; owners may list their own.
  if (mine && user) {
    where.ownerId = user.id;
    if (statusParam) where.status = statusParam;
  } else {
    where.status = "ACTIVE";
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { brand: { contains: q } },
    ];
  }
  if (category) where.categoryId = category;
  if (city) where.city = city;
  const priceFilter: Record<string, number> = {};
  if (min) priceFilter.gte = Number(min);
  if (max) priceFilter.lte = Number(max);
  if (Object.keys(priceFilter).length) where.dailyPrice = priceFilter;
  if (instant) where.instantBook = true;

  const orderBy =
    sort === "price_asc" ? { dailyPrice: "asc" as const }
    : sort === "price_desc" ? { dailyPrice: "desc" as const }
    : sort === "rating" ? { rating: "desc" as const }
    : { createdAt: "desc" as const };

  const listings = await db.listing.findMany({
    where,
    orderBy,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { name: true, slug: true } },
      owner: { select: { name: true } },
    },
    take: parseIntSafe(url.searchParams.get("take"), 60),
  });

  return jsonOk({ listings });
}

/** POST /api/listings — create a listing (draft or submit for review). */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const categoryId = String(body.categoryId ?? "");
    const dailyPrice = Number(body.dailyPrice);
    if (title.length < 5) return jsonError("عنوان وسیله باید حداقل ۵ کاراکتر باشد.");
    if (description.length < 20) return jsonError("توضیحات باید حداقل ۲۰ کاراکتر باشد.");
    if (!categoryId) return jsonError("دسته‌بندی را انتخاب کنید.");
    if (!Number.isFinite(dailyPrice) || dailyPrice < 1000)
      return jsonError("قیمت روزانه معتبر نیست.");

    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) return jsonError("دسته‌بندی یافت نشد.", 404);

    const images: string[] = Array.isArray(body.images) ? body.images.slice(0, 8) : [];
    const status = body.submit ? "PENDING" : "DRAFT";

    const listing = await db.listing.create({
      data: {
        ownerId: user.id,
        categoryId,
        title,
        description,
        brand: body.brand ? String(body.brand) : null,
        specs: body.specs ? String(body.specs) : null,
        dailyPrice: Math.floor(dailyPrice),
        weeklyPrice: Number.isFinite(Number(body.weeklyPrice)) && Number(body.weeklyPrice) > 0
          ? Math.floor(Number(body.weeklyPrice)) : null,
        deposit: Math.max(0, Math.floor(Number(body.deposit) || 0)),
        city: String(body.city ?? user.city ?? "تهران"),
        area: body.area ? String(body.area) : null,
        pickupInPerson: body.pickupInPerson !== false,
        deliveryCourier: Boolean(body.deliveryCourier),
        rules: body.rules ? String(body.rules) : null,
        minDays: Math.max(1, Math.floor(Number(body.minDays) || 1)),
        maxDays: Math.max(1, Math.floor(Number(body.maxDays) || 30)),
        instantBook: Boolean(body.instantBook),
        status,
        images: {
          create: images.map((img, i) => ({
            url: String(img).startsWith("/") ? String(img) : `/assets/img/${img}`,
            sortOrder: i,
          })),
        },
      },
      include: { images: true },
    });

    // Enable host capability the first time someone creates a listing.
    if (!user.isHost) {
      await db.user.update({ where: { id: user.id }, data: { isHost: true } });
    }
    await db.auditLog.create({
      data: { actorId: user.id, action: "LISTING_CREATE", entityType: "Listing", entityId: listing.id, meta: JSON.stringify({ status }) },
    });

    return jsonOk({ listing }, 201);
  } catch {
    return jsonError("خطای غیرمنتظره در ثبت وسیله.", 500);
  }
}
