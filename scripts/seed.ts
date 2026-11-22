/**
 * Overa demo seed — idempotent, non-destructive, production-safe.
 *
 * Design rules (IMPORTANT):
 *  1. NEVER deletes anything. Old versions of this script wiped every table
 *     first, which would destroy real users, reservations and the financial
 *     ledger if ever run against production. This version only creates.
 *  2. Re-runnable: every record is upserted/skipped by a stable natural key
 *     (category slug, demo phone number, listing title + owner). Running it
 *     twice never creates duplicates.
 *  3. Clearly labelled: demo users and demo listings carry `isDemo = true`
 *     so real (user-verified) data can always be told apart from showcase
 *     content created by this script.
 *  4. Guarded: refuses to run against a production database unless you pass
 *     OVERA_SEED_ALLOW_REMOTE=1 explicitly. Local databases (localhost /
 *     127.0.0.1 / docker hostnames) are always allowed.
 *
 * Run: bun run db:seed   (or: bun run scripts/seed.ts)
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { buildListingSearchKey } from "../src/lib/persian";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export const DEMO_PASSWORD = "overa1234";

/* --------------------------- environment guard ---------------------------- */

function databaseHost(url: string | undefined): string {
  if (!url) return "";
  try {
    // Handles both postgres:// URLs and postgresql:// URLs.
    return new URL(url).hostname.toLowerCase();
  } catch {
    // Prisma-style file: URLs have no host.
    return "";
  }
}

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

async function assertSafeTarget(): Promise<void> {
  const url = process.env.DATABASE_URL;
  const host = databaseHost(url);
  if (host === "" || LOCAL_HOSTS.has(host)) return; // local/dev target

  if (process.env.OVERA_SEED_ALLOW_REMOTE === "1") {
    console.warn(
      `⚠️  OVERA_SEED_ALLOW_REMOTE=1 — writing DEMO content to remote database "${host}".`,
    );
    return;
  }

  console.error(
    `Refusing to seed demo data into a NON-LOCAL database ("${host}").\n` +
      `Demo seed is meant for development only and must never pollute a\n` +
      `production database. To bootstrap a production admin account use:\n` +
      `    bun run scripts/create-admin.ts\n` +
      `If you truly intend to insert demo content here, re-run with:\n` +
      `    OVERA_SEED_ALLOW_REMOTE=1 bun run scripts/seed.ts`,
  );
  process.exit(1);
}

/* ------------------------------ demo content ------------------------------ */

const CATEGORY_DATA = [
  { slug: "digital", name: "لوازم دیجیتال", icon: "devices" },
  { slug: "home", name: "لوازم خانگی", icon: "home" },
  { slug: "sport", name: "ورزش و تفریح", icon: "sports_soccer" },
  { slug: "tools", name: "ابزار و تجهیزات", icon: "handyman" },
  { slug: "camping", name: "سفر و کمپینگ", icon: "forest" },
  { slug: "beauty", name: "مد و زیبایی", icon: "checkroom" },
  { slug: "kids", name: "کودک و نوزاد", icon: "child_care" },
  { slug: "other", name: "سایر دسته‌ها", icon: "category" },
];

const DEMO_USERS = [
  {
    key: "sara",
    name: "سارا محمدی",
    phone: "09121111111",
    city: "تهران",
    kycStatus: "VERIFIED",
    walletBalance: 2_500_000,
    isHost: false,
  },
  {
    key: "ali",
    name: "علی رضایی",
    phone: "09122222222",
    city: "تهران",
    kycStatus: "VERIFIED",
    walletBalance: 8_400_000,
    isHost: true,
    bio: "میزبان اٌوِرا از ۱۴۰۲ — تجهیزات عکاسی و دیجیتال",
  },
  {
    key: "mehrdad",
    name: "مهرداد رضایی",
    phone: "09123333333",
    city: "تهران",
    kycStatus: "VERIFIED",
    isHost: true,
  },
  {
    key: "campstore",
    name: "کمپ‌استور البرز",
    phone: "09124444444",
    city: "کرج",
    kycStatus: "VERIFIED",
    isHost: true,
  },
  {
    key: "sohrab",
    name: "سهراب علوی",
    phone: "09125555555",
    city: "تهران",
    kycStatus: "PENDING",
    isHost: true,
  },
  {
    key: "arash",
    name: "آرش کوهیار",
    phone: "09126666666",
    city: "تهران",
    kycStatus: "VERIFIED",
    isHost: true,
  },
  {
    key: "amirmahdi",
    name: "امیرمهدی رجبی",
    phone: "09127777777",
    city: "تهران",
    kycStatus: "VERIFIED",
    isHost: true,
  },
  {
    key: "admin",
    name: "مدیر اٌوِرا",
    phone: "09120000000",
    kycStatus: "VERIFIED",
    isAdmin: true,
  },
];

type DemoListing = {
  owner: string;
  category: string;
  title: string;
  brand?: string;
  description?: string;
  specs?: string;
  dailyPrice?: number;
  weeklyPrice?: number | null;
  deposit?: number;
  city?: string;
  area?: string;
  rating?: number;
  reviewsCount?: number;
  viewsCount?: number;
  instantBook?: boolean;
  deliveryCourier?: boolean;
  status?: string;
  images: string[];
};

const DEMO_LISTINGS: DemoListing[] = [
  {
    owner: "ali",
    category: "digital",
    title: "لپتاپ مکبوک پرو M1",
    brand: "Apple MacBook Pro M1",
    description:
      "لپتاپ مکبوک پرو M1 با تراشه M1، مناسب تدوین، طراحی و برنامه‌نویسی. همراه با شارژر اورجینال و کیف محافظ.",
    specs:
      "تراشه Apple M1 • رم ۱۶ گیگابایت • SSD ۵۱۲ گیگابایت • نمایشگر ۱۳ اینچ رتینا",
    dailyPrice: 850_000,
    weeklyPrice: 5_100_000,
    deposit: 15_000_000,
    area: "سعادت‌آباد",
    rating: 4.9,
    reviewsCount: 34,
    viewsCount: 512,
    images: ["d9aefd50adfa.jpg", "e7ea4079e9c9.jpg"],
  },
  {
    owner: "mehrdad",
    category: "camping",
    title: "چادر ۴ نفره دوپوش کلمبوس ضدآب",
    brand: "کلمبوس (Columbus)",
    description:
      "مقاومت ستون آب ۴۰۰۰mm، تیرک آلومینیومی سبک، ۲ ورودی با توری پشه‌بند و دوپوش قابل تنفس",
    specs: "ضدآب ۴۰۰۰mm • تیرک آلومینیوم • ظرفیت ۴ نفر",
    dailyPrice: 290_000,
    deposit: 1_200_000,
    area: "پونک",
    rating: 4.9,
    reviewsCount: 48,
    viewsCount: 341,
    instantBook: true,
    images: ["4e2c76ef8a36.jpg"],
  },
  {
    owner: "campstore",
    category: "camping",
    title: "یخچال خودرویی کمپینگی ۳۵ لیتری",
    brand: "ایستکول (EastCool)",
    description:
      "انجماد تا منفی ۱۸ درجه، اتصال به فندکی ۱۲/۲۴ ولت و برق شهری، سایلنت با محافظ باتری",
    specs: "کمپرسور LG • حجم ۳۵ لیتر • ۱۲/۲۴ ولت",
    dailyPrice: 450_000,
    deposit: 2_000_000,
    city: "کرج",
    area: "مهرشهر",
    rating: 5.0,
    reviewsCount: 31,
    viewsCount: 208,
    images: ["1f6397a60b34.jpg"],
  },
  {
    owner: "sohrab",
    category: "camping",
    title: "ست کامل ظروف آلومینیوم و سرشعله MSR",
    brand: "MSR پخت‌وپز",
    description:
      "قابلمه نچسب، کتری کمپینگی و سرشعله سوپاپ‌دار به همراه فندک پیزوالکتریک و روکش ضدخش",
    specs: "ضدعفونی UV • آلومینیوم سخت‌کاری",
    dailyPrice: 110_000,
    deposit: 500_000,
    area: "صادقیه",
    rating: 4.8,
    reviewsCount: 24,
    viewsCount: 156,
    images: ["a27d4fc5d70b.jpg"],
  },
  {
    owner: "arash",
    category: "camping",
    title: "کوله پشتی دیوتر Aircontact 65+10",
    brand: "دیوتر (Deuter)",
    description:
      "سیستم ارگونومیک تقسیم وزن، کاور باران اورجینال، دسترسی آسان از جلو و تهویه اختصاصی کمر",
    specs: "حجم ۶۵+۱۰ لیتر • کاور ضدباران",
    dailyPrice: 180_000,
    deposit: 1_500_000,
    area: "تجریش",
    rating: 4.9,
    reviewsCount: 56,
    viewsCount: 402,
    instantBook: true,
    images: ["e1f857cbe9ae.jpg"],
  },
  {
    owner: "mehrdad",
    category: "tools",
    title: "موتور برق اینورتری ۲ کیلووات لانسین",
    brand: "لانسین (Loncin)",
    description:
      "خروجی برق بدون نوسان مناسب لپ‌تاپ و تجهیزات حساس، مصرف بنزین اندک و سوپر سایلنت",
    specs: "اینورتر بی‌نوسان • ۲ کیلووات",
    dailyPrice: 390_000,
    deposit: 3_000_000,
    area: "سعادت‌آباد",
    rating: 4.7,
    reviewsCount: 19,
    viewsCount: 177,
    images: ["a3927f66f1c2.jpg"],
  },
  {
    owner: "arash",
    category: "camping",
    title: "ست صندلی‌های تاشو ارگونومیک و میز",
    brand: "آفرود پلاس",
    description:
      "تحمل وزن تا ۱۵۰ کیلوگرم، پارچه ۶۰۰D و کیف حمل برزنتی مستحکم به همراه میز رول‌شو",
    specs: "تحمل وزن ۱۵۰ کیلو • پارچه ۶۰۰D",
    dailyPrice: 140_000,
    deposit: 600_000,
    area: "یوسف‌آباد",
    rating: 4.9,
    reviewsCount: 72,
    viewsCount: 389,
    instantBook: true,
    images: ["775b85b02fa8.jpg"],
  },
  {
    owner: "ali",
    category: "digital",
    title: "دوربین سونی Sony Alpha A7 IV Body",
    brand: "Sony Alpha",
    description:
      "دوربین میرورلس فول فریم با سنسور ۳۳ مگاپیکسل BSI و فیلم‌برداری 4K 60p 10-Bit. مناسب تولید محتوا و عکاسی حرفه‌ای.",
    specs: "سنسور ۳۳ مگاپیکسل BSI • فیلم‌برداری 4K 60p 10-Bit",
    dailyPrice: 950_000,
    deposit: 6_000_000,
    area: "ونک",
    rating: 4.9,
    reviewsCount: 48,
    viewsCount: 733,
    deliveryCourier: true,
    images: ["75c37134b4d1.jpg", "842b1c23d1af.jpg"],
  },
  {
    owner: "ali",
    category: "digital",
    title: "لنز سونی Sony FE 24-70mm f/2.8 GM II",
    brand: "Sony G Master",
    description:
      "لنز زوم استاندارد نسل دوم با دیافراگم ثابت F/2.8 و وزن سبک ۶۹۵ گرم؛ انتخاب اول فیلم‌بردارها.",
    specs: "دیافراگم ثابت F/2.8 • وزن ۶۹۵ گرم",
    dailyPrice: 520_000,
    deposit: 3_000_000,
    area: "ونک",
    rating: 4.9,
    reviewsCount: 64,
    viewsCount: 465,
    images: ["7ef8af410b28.jpg"],
  },
  {
    owner: "amirmahdi",
    category: "digital",
    title: "کنسول PS5 Slim مدل استاندارد ۱ ترابایت با ۲ دسته",
    brand: "Sony PlayStation",
    description:
      "همراه با بازی‌های نصب‌شده: FC 24, Spider-Man 2, GTA V و Mortal Kombat 1. اشتراک پلاس اکسترا ۳ ماهه فعال.",
    specs: "۱ ترابایت • ۲ دسته اورجینال • اشتراک فعال",
    dailyPrice: 390_000,
    deposit: 5_000_000,
    area: "سعادت‌آباد",
    rating: 4.9,
    reviewsCount: 84,
    viewsCount: 866,
    instantBook: true,
    images: ["f7e71f79a728.jpg"],
  },
  {
    owner: "amirmahdi",
    category: "digital",
    title: "هدست واقعیت مجازی Meta Quest 3 با کابل لینک ۵ متری",
    brand: "Meta Quest",
    description:
      "همراه با بازی‌های اورجینال Beat Saber, Superhot VR, Eleven Table Tennis و Half-Life Alyx. پد سیلیکونی استریل UV.",
    specs: "۱۲۸ گیگابایت • کابل لینک ۵ متری",
    dailyPrice: 480_000,
    deposit: 6_000_000,
    area: "یوسف‌آباد",
    rating: 5.0,
    reviewsCount: 51,
    viewsCount: 458,
    images: ["e0318de08892.jpg"],
  },
  {
    owner: "mehrdad",
    category: "sport",
    title: "دوچرخه کوهستان حرفه‌ای",
    brand: "جمیز",
    description:
      "دوچرخه کوهستان با بدنه آلومینیوم، سیستم تعلیق جلو و دنده‌های شیمانو؛ مناسب مسیرهای خاکی و کوهستان.",
    specs: "بدنه آلومینیوم • تعلیق جلو • دنده شیمانو ۲۱ سرعته",
    dailyPrice: 450_000,
    deposit: 3_000_000,
    city: "اصفهان",
    rating: 4.7,
    reviewsCount: 26,
    viewsCount: 298,
    images: ["45fb8e31c9b9.jpg"],
  },
  {
    owner: "sohrab",
    category: "home",
    title: "صندلی ماساژور",
    brand: "ماساژور سلطنتی",
    description:
      "صندلی ماساژور با ۸ حالت ماساژ و گرمای مادون قرمز؛ مناسب ریلکس بعد از کار.",
    specs: "۸ حالت ماساژ • گرمای مادون قرمز",
    dailyPrice: 600_000,
    deposit: 4_000_000,
    area: "شهرک غرب",
    rating: 4.6,
    reviewsCount: 17,
    viewsCount: 190,
    images: ["8acd3309eb36.jpg"],
  },
  {
    owner: "mehrdad",
    category: "tools",
    title: "دریل شارژی بوش",
    brand: "Bosch",
    description:
      "دریل شارژی بوش با دو باتری ۴ آمپر، مناسب مصالح ساختمانی و نصب‌های خانگی.",
    specs: "۲ باتری ۴ آمپر • دور متغیر",
    dailyPrice: 220_000,
    deposit: 1_500_000,
    area: "افسریه",
    rating: 4.8,
    reviewsCount: 22,
    viewsCount: 164,
    images: ["46e703296228.jpg"],
  },
  {
    owner: "ali",
    category: "digital",
    title: "ویدیو پروژکتور",
    brand: "Epson",
    description:
      "پروژکتور فول اچ دی مناسب سینمای خانگی، ارائه و مراسم؛ همراه با ریموت و کیف حمل.",
    specs: "Full HD • ۳۶۰۰ لومن • HDMI",
    dailyPrice: 550_000,
    deposit: 4_000_000,
    area: "ونک",
    rating: 4.7,
    reviewsCount: 29,
    viewsCount: 254,
    images: ["e7ea4079e9c9.jpg"],
  },
  {
    owner: "arash",
    category: "digital",
    title: "دوربین ورزشی GoPro",
    brand: "GoPro",
    description:
      "دوربین ورزشی ضدآب با ۴K۶۰ و لرزشگیر HyperSmooth؛ مناسب سفر، ورزش و تولید محتوا.",
    specs: "۴K 60fps • ضدآب تا ۱۰ متر • HyperSmooth",
    dailyPrice: 350_000,
    deposit: 2_500_000,
    area: "تجریش",
    rating: 4.8,
    reviewsCount: 38,
    viewsCount: 312,
    images: ["0a8ce54551f9.jpg"],
  },
  {
    owner: "ali",
    category: "beauty",
    title: "دوربین چاپ عکس فوری کادرو",
    brand: "Kodak",
    description: "پیش‌نویس: دوربین چاپ فوری برای مهمانی‌ها و رویدادها.",
    dailyPrice: 180_000,
    status: "DRAFT",
    area: "ونک",
    images: ["75c37134b4d1.jpg"],
  },
  {
    owner: "ali",
    category: "digital",
    title: "میکروفون پادکست RODE",
    brand: "RODE",
    description: "میکروفون حرفه‌ای پادکست همراه با پایه و فیلتر پاپ.",
    dailyPrice: 260_000,
    status: "PENDING",
    area: "ونک",
    images: ["0a8ce54551f9.jpg"],
  },
];

/* ------------------------------ helpers ----------------------------------- */

/** Create-only upsert by unique key: returns existing record or inserts. */
async function ensureCategory(
  slug: string,
  name: string,
  icon: string,
  sortOrder: number,
) {
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return existing;
  return db.category.create({ data: { slug, name, icon, sortOrder } });
}

async function ensureDemoUser(u: (typeof DEMO_USERS)[number], pwHash: string) {
  const existing = await db.user.findUnique({ where: { phone: u.phone } });
  if (existing) {
    // Real user already occupies this phone number — never touch their data.
    if (!existing.isDemo) {
      console.warn(
        `⚠️  phone ${u.phone} belongs to a real user; keeping real account.`,
      );
      return existing;
    }
    return existing;
  }
  return db.user.create({
    data: {
      name: u.name,
      phone: u.phone,
      passwordHash: pwHash,
      city: u.city,
      isHost: u.isHost ?? false,
      isAdmin: u.isAdmin ?? false,
      kycStatus: u.kycStatus,
      walletBalance: u.walletBalance ?? 0,
      bio: u.bio,
      isDemo: true,
    },
  });
}

async function ensureDemoListing(
  l: DemoListing,
  ownerId: string,
  categoryId: string,
  categoryName: string,
) {
  const existing = await db.listing.findFirst({
    where: { title: l.title, ownerId },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await db.listing.create({
    data: {
      ownerId,
      categoryId,
      title: l.title,
      description:
        l.description ??
        "وسیله‌ای باکیفیت برای اجاره کوتاه‌مدت در اٌوِرا؛ تحویل منظم و تمیز، آماده استفاده.",
      brand: l.brand,
      specs: l.specs,
      searchKey: buildListingSearchKey({
        title: l.title,
        brand: l.brand,
        specs: l.specs,
        description: l.description,
        city: l.city ?? "تهران",
        categoryName,
      }),
      dailyPrice: l.dailyPrice ?? 250_000,
      weeklyPrice: l.weeklyPrice ?? null,
      deposit: l.deposit ?? 1_000_000,
      city: l.city ?? "تهران",
      area: l.area,
      rating: l.rating ?? 4.7,
      reviewsCount: l.reviewsCount ?? 12,
      viewsCount: l.viewsCount ?? 120,
      instantBook: l.instantBook ?? false,
      deliveryCourier: l.deliveryCourier ?? false,
      status: l.status ?? "ACTIVE",
      isDemo: true,
      images: {
        create: (l.images ?? ["45fb8e31c9b9.jpg"]).map((img, i) => ({
          url: `/assets/img/${img}`,
          sortOrder: i,
        })),
      },
    },
    select: { id: true },
  });
  return created.id;
}

/* --------------------------------- main ----------------------------------- */

async function main() {
  await assertSafeTarget();

  console.log("Seeding categories (upsert by slug)…");
  const cat: Record<string, string> = {};
  for (const [i, c] of CATEGORY_DATA.entries()) {
    const row = await ensureCategory(c.slug, c.name, c.icon, i);
    cat[c.slug] = row.id;
  }

  console.log("Seeding demo users (upsert by phone, create-only)…");
  const pw = hashPassword(DEMO_PASSWORD);
  const users: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const row = await ensureDemoUser(u, pw);
    users[u.key] = row.id;
  }

  console.log("Seeding demo listings (skip if title+owner exists)…");
  const catNameBySlug = Object.fromEntries(
    CATEGORY_DATA.map((c) => [c.slug, c.name]),
  );
  for (const l of DEMO_LISTINGS) {
    await ensureDemoListing(
      l,
      users[l.owner],
      cat[l.category],
      catNameBySlug[l.category],
    );
  }

  const counts = {
    categories: await db.category.count(),
    users: await db.user.count(),
    listings: await db.listing.count(),
    demoListings: await db.listing.count({ where: { isDemo: true } }),
  };
  console.log(
    `Seed complete. Totals → categories: ${counts.categories}, users: ${counts.users}, listings: ${counts.listings} (demo: ${counts.demoListings}).`,
  );
  console.log("Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log("  renter: 09121111111 (سارا محمدی)");
  console.log("  host:   09122222222 (علی رضایی)");
  console.log("  admin:  09120000000 (مدیر اٌوِرا)");
  console.log(
    "OTP demo code: shown on screen in dev mode (no SMS provider configured).",
  );
}

/**
 * Transient Prisma error codes that justify retrying the whole seed:
 * - P1008: socket timeout; P2024: pool timeout; P1017: server closed
 *   connection; P1001: cannot reach server. Safe to retry because the seed
 *   is idempotent (create-only upserts).
 */
const TRANSIENT_ERROR_CODES = new Set(["P1008", "P2024", "P1017", "P1001"]);
const MAX_SEED_ATTEMPTS = 3;

function errorCodeOf(e: unknown): string {
  return typeof e === "object" && e !== null && "code" in e
    ? String((e as { code: unknown }).code)
    : "";
}

async function runSeed(attempt = 1): Promise<void> {
  try {
    await main();
  } catch (e) {
    const code = errorCodeOf(e);
    if (TRANSIENT_ERROR_CODES.has(code) && attempt < MAX_SEED_ATTEMPTS) {
      console.warn(
        `Transient database error ${code} (attempt ${attempt}/${MAX_SEED_ATTEMPTS}) — retrying in 3s…`,
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return runSeed(attempt + 1);
    }
    throw e;
  }
}

runSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
