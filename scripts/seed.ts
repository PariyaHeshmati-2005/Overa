/**
 * Overa seed script — fills the database with demo content extracted from the
 * original source pages (index.html product cards, categories.html React
 * mini-app tabs). All demo accounts are labelled; never use them in
 * production.
 *
 * Run: bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export const DEMO_PASSWORD = "overa1234";

async function main() {
  console.log("Clearing existing data…");
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.damageClaim.deleteMany();
  await db.message.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
  await db.reservationEvent.deleteMany();
  await db.reservation.deleteMany();
  await db.walletTransaction.deleteMany();
  await db.review.deleteMany();
  await db.favorite.deleteMany();
  await db.listingImage.deleteMany();
  await db.listing.deleteMany();
  await db.category.deleteMany();
  await db.otpCode.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  /* ------------------------------ categories ------------------------------ */
  console.log("Seeding categories…");
  // SQLite is a single-writer database: seed writes run sequentially (no
  // Promise.all) so the query engine never contends with itself — parallel
  // writes under memory pressure can wedge the engine (Prisma P1008).
  const categoryData = [
    { slug: "digital", name: "لوازم دیجیتال", icon: "devices", count: 38 },
    { slug: "home", name: "لوازم خانگی", icon: "home", count: 21 },
    { slug: "sport", name: "ورزش و تفریح", icon: "sports_soccer", count: 19 },
    { slug: "tools", name: "ابزار و تجهیزات", icon: "handyman", count: 15 },
    { slug: "camping", name: "سفر و کمپینگ", icon: "forest", count: 17 },
    { slug: "beauty", name: "مد و زیبایی", icon: "checkroom", count: 9 },
    { slug: "kids", name: "کودک و نوزاد", icon: "child_care", count: 6 },
    { slug: "other", name: "سایر دسته‌ها", icon: "category", count: 12 },
  ];
  const categories: { slug: string; id: string }[] = [];
  for (const [i, c] of categoryData.entries()) {
    categories.push(
      await db.category.create({
        data: { slug: c.slug, name: c.name, icon: c.icon, sortOrder: i },
      }),
    );
  }
  const cat = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  /* -------------------------------- users --------------------------------- */
  console.log("Seeding users (demo accounts)…");
  const pw = hashPassword(DEMO_PASSWORD);
  // Sequential creates (SQLite: single writer — see the note above).
  const sara = await db.user.create({
    data: {
      name: "سارا محمدی",
      phone: "09121111111",
      passwordHash: pw,
      city: "تهران",
      kycStatus: "VERIFIED",
      walletBalance: 2_500_000,
      avatarUrl: null,
    },
  });
  const ali = await db.user.create({
    data: {
      name: "علی رضایی",
      phone: "09122222222",
      passwordHash: pw,
      isHost: true,
      city: "تهران",
      kycStatus: "VERIFIED",
      walletBalance: 8_400_000,
      bio: "میزبان اورا از ۱۴۰۲ — تجهیزات عکاسی و دیجیتال",
    },
  });
  const mehrdad = await db.user.create({
    data: { name: "مهرداد رضایی", phone: "09123333333", passwordHash: pw, isHost: true, city: "تهران", kycStatus: "VERIFIED" },
  });
  const campstore = await db.user.create({
    data: { name: "کمپ‌استور البرز", phone: "09124444444", passwordHash: pw, isHost: true, city: "کرج", kycStatus: "VERIFIED" },
  });
  const sohrab = await db.user.create({
    data: { name: "سهراب علوی", phone: "09125555555", passwordHash: pw, isHost: true, city: "تهران", kycStatus: "PENDING" },
  });
  const arash = await db.user.create({
    data: { name: "آرش کوهیار", phone: "09126666666", passwordHash: pw, isHost: true, city: "تهران", kycStatus: "VERIFIED" },
  });
  const amirmahdi = await db.user.create({
    data: { name: "امیرمهدی رجبی", phone: "09127777777", passwordHash: pw, isHost: true, city: "تهران", kycStatus: "VERIFIED" },
  });

  const admin = await db.user.create({
    data: { name: "مدیر اورا", phone: "09120000000", passwordHash: pw, isAdmin: true, kycStatus: "VERIFIED" },
  });
  void admin;

  /* ------------------------------- listings ------------------------------- */
  console.log("Seeding listings…");
  const L = (
    ownerId: string,
    categoryId: string,
    title: string,
    data: Partial<{
      brand: string; description: string; specs: string; dailyPrice: number;
      weeklyPrice: number; deposit: number; city: string; area: string;
      rating: number; reviewsCount: number; viewsCount: number;
      instantBook: boolean; deliveryCourier: boolean; status: string;
      images: string[];
    }> = {},
  ) =>
    db.listing.create({
      data: {
        ownerId,
        categoryId,
        title,
        description: data.description ?? "وسیله‌ای باکیفیت برای اجاره کوتاه‌مدت در اورا؛ تحویل منظم و تمیز، آماده استفاده.",
        brand: data.brand,
        specs: data.specs,
        dailyPrice: data.dailyPrice ?? 250_000,
        weeklyPrice: data.weeklyPrice ?? null,
        deposit: data.deposit ?? 1_000_000,
        city: data.city ?? "تهران",
        area: data.area,
        rating: data.rating ?? 4.7,
        reviewsCount: data.reviewsCount ?? 12,
        viewsCount: data.viewsCount ?? 120,
        instantBook: data.instantBook ?? false,
        deliveryCourier: data.deliveryCourier ?? false,
        status: data.status ?? "ACTIVE",
        images: {
          create: (data.images ?? ["45fb8e31c9b9.jpg"]).map((img, i) => ({
            url: `/assets/img/${img}`,
            sortOrder: i,
          })),
        },
      },
    });

  const l1 = await L(ali.id, cat.digital, "لپتاپ مکبوک پرو M1", {
    brand: "Apple MacBook Pro M1",
    description: "لپتاپ مکبوک پرو M1 با تراشه M1، مناسب تدوین، طراحی و برنامه‌نویسی. همراه با شارژر اورجینال و کیف محافظ.",
    specs: "تراشه Apple M1 • رم ۱۶ گیگابایت • SSD ۵۱۲ گیگابایت • نمایشگر ۱۳ اینچ رتینا",
    dailyPrice: 850_000, weeklyPrice: 5_100_000, deposit: 15_000_000,
    area: "سعادت‌آباد", rating: 4.9, reviewsCount: 34, viewsCount: 512,
    images: ["d9aefd50adfa.jpg", "e7ea4079e9c9.jpg"],
  });
  const l2 = await L(mehrdad.id, cat.camping, "چادر ۴ نفره دوپوش کلمبوس ضدآب", {
    brand: "کلمبوس (Columbus)",
    description: "مقاومت ستون آب ۴۰۰۰mm، تیرک آلومینیومی سبک، ۲ ورودی با توری پشه‌بند و دوپوش قابل تنفس",
    specs: "ضدآب ۴۰۰۰mm • تیرک آلومینیوم • ظرفیت ۴ نفر",
    dailyPrice: 290_000, deposit: 1_200_000, area: "پونک",
    rating: 4.9, reviewsCount: 48, viewsCount: 341, instantBook: true,
    images: ["4e2c76ef8a36.jpg"],
  });
  const l3 = await L(campstore.id, cat.camping, "یخچال خودرویی کمپینگی ۳۵ لیتری", {
    brand: "ایستکول (EastCool)",
    description: "انجماد تا منفی ۱۸ درجه، اتصال به فندکی ۱۲/۲۴ ولت و برق شهری، سایلنت با محافظ باتری",
    specs: "کمپرسور LG • حجم ۳۵ لیتر • ۱۲/۲۴ ولت",
    dailyPrice: 450_000, deposit: 2_000_000, city: "کرج", area: "مهرشهر",
    rating: 5.0, reviewsCount: 31, viewsCount: 208,
    images: ["1f6397a60b34.jpg"],
  });
  const l4 = await L(sohrab.id, cat.camping, "ست کامل ظروف آلومینیوم و سرشعله MSR", {
    brand: "MSR پخت‌وپز",
    description: "قابلمه نچسب، کتری کمپینگی و سرشعله سوپاپ‌دار به همراه فندک پیزوالکتریک و روکش ضدخش",
    specs: "ضدعفونی UV • آلومینیوم سخت‌کاری",
    dailyPrice: 110_000, deposit: 500_000, area: "صادقیه",
    rating: 4.8, reviewsCount: 24, viewsCount: 156,
    images: ["a27d4fc5d70b.jpg"],
  });
  const l5 = await L(arash.id, cat.camping, "کوله پشتی دیوتر Aircontact 65+10", {
    brand: "دیوتر (Deuter)",
    description: "سیستم ارگونومیک تقسیم وزن، کاور باران اورجینال، دسترسی آسان از جلو و تهویه اختصاصی کمر",
    specs: "حجم ۶۵+۱۰ لیتر • کاور ضدباران",
    dailyPrice: 180_000, deposit: 1_500_000, area: "تجریش",
    rating: 4.9, reviewsCount: 56, viewsCount: 402, instantBook: true,
    images: ["e1f857cbe9ae.jpg"],
  });
  const l6 = await L(mehrdad.id, cat.tools, "موتور برق اینورتری ۲ کیلووات لانسین", {
    brand: "لانسین (Loncin)",
    description: "خروجی برق بدون نوسان مناسب لپ‌تاپ و تجهیزات حساس، مصرف بنزین اندک و سوپر سایلنت",
    specs: "اینورتر بی‌نوسان • ۲ کیلووات",
    dailyPrice: 390_000, deposit: 3_000_000, area: "سعادت‌آباد",
    rating: 4.7, reviewsCount: 19, viewsCount: 177,
    images: ["a3927f66f1c2.jpg"],
  });
  const l7 = await L(arash.id, cat.camping, "ست صندلی‌های تاشو ارگونومیک و میز", {
    brand: "آفرود پلاس",
    description: "تحمل وزن تا ۱۵۰ کیلوگرم، پارچه ۶۰۰D و کیف حمل برزنتی مستحکم به همراه میز رول‌شو",
    specs: "تحمل وزن ۱۵۰ کیلو • پارچه ۶۰۰D",
    dailyPrice: 140_000, deposit: 600_000, area: "یوسف‌آباد",
    rating: 4.9, reviewsCount: 72, viewsCount: 389, instantBook: true,
    images: ["775b85b02fa8.jpg"],
  });
  const l8 = await L(ali.id, cat.digital, "دوربین سونی Sony Alpha A7 IV Body", {
    brand: "Sony Alpha",
    description: "دوربین میرورلس فول فریم با سنسور ۳۳ مگاپیکسل BSI و فیلم‌برداری 4K 60p 10-Bit. مناسب تولید محتوا و عکاسی حرفه‌ای.",
    specs: "سنسور ۳۳ مگاپیکسل BSI • فیلم‌برداری 4K 60p 10-Bit",
    dailyPrice: 950_000, deposit: 6_000_000, area: "ونک",
    rating: 4.9, reviewsCount: 48, viewsCount: 733,
    deliveryCourier: true,
    images: ["75c37134b4d1.jpg", "842b1c23d1af.jpg"],
  });
  const l9 = await L(ali.id, cat.digital, "لنز سونی Sony FE 24-70mm f/2.8 GM II", {
    brand: "Sony G Master",
    description: "لنز زوم استاندارد نسل دوم با دیافراگم ثابت F/2.8 و وزن سبک ۶۹۵ گرم؛ انتخاب اول فیلم‌بردارها.",
    specs: "دیافراگم ثابت F/2.8 • وزن ۶۹۵ گرم",
    dailyPrice: 520_000, deposit: 3_000_000, area: "ونک",
    rating: 4.9, reviewsCount: 64, viewsCount: 465,
    images: ["7ef8af410b28.jpg"],
  });
  const l10 = await L(amirmahdi.id, cat.digital, "کنسول PS5 Slim مدل استاندارد ۱ ترابایت با ۲ دسته", {
    brand: "Sony PlayStation",
    description: "همراه با بازی‌های نصب‌شده: FC 24, Spider-Man 2, GTA V و Mortal Kombat 1. اشتراک پلاس اکسترا ۳ ماهه فعال.",
    specs: "۱ ترابایت • ۲ دسته اورجینال • اشتراک فعال",
    dailyPrice: 390_000, deposit: 5_000_000, area: "سعادت‌آباد",
    rating: 4.9, reviewsCount: 84, viewsCount: 866, instantBook: true,
    images: ["f7e71f79a728.jpg"],
  });
  const l11 = await L(amirmahdi.id, cat.digital, "هدست واقعیت مجازی Meta Quest 3 با کابل لینک ۵ متری", {
    brand: "Meta Quest",
    description: "همراه با بازی‌های اورجینال Beat Saber, Superhot VR, Eleven Table Tennis و Half-Life Alyx. پد سیلیکونی استریل UV.",
    specs: "۱۲۸ گیگابایت • کابل لینک ۵ متری",
    dailyPrice: 480_000, deposit: 6_000_000, area: "یوسف‌آباد",
    rating: 5.0, reviewsCount: 51, viewsCount: 458,
    images: ["e0318de08892.jpg"],
  });
  const l12 = await L(mehrdad.id, cat.sport, "دوچرخه کوهستان حرفه‌ای", {
    brand: "جمیز",
    description: "دوچرخه کوهستان با بدنه آلومینیوم، سیستم تعلیق جلو و دنده‌های شیمانو؛ مناسب مسیرهای خاکی و کوهستان.",
    specs: "بدنه آلومینیوم • تعلیق جلو • دنده شیمانو ۲۱ سرعته",
    dailyPrice: 450_000, deposit: 3_000_000, city: "اصفهان",
    rating: 4.7, reviewsCount: 26, viewsCount: 298,
    images: ["45fb8e31c9b9.jpg"],
  });
  const l13 = await L(sohrab.id, cat.home, "صندلی ماساژور", {
    brand: "ماساژور سلطنتی",
    description: "صندلی ماساژور با ۸ حالت ماساژ و گرمای مادون قرمز؛ مناسب ریلکس بعد از کار.",
    specs: "۸ حالت ماساژ • گرمای مادون قرمز",
    dailyPrice: 600_000, deposit: 4_000_000, area: "شهرک غرب",
    rating: 4.6, reviewsCount: 17, viewsCount: 190,
    images: ["8acd3309eb36.jpg"],
  });
  const l14 = await L(mehrdad.id, cat.tools, "دریل شارژی بوش", {
    brand: "Bosch",
    description: "دریل شارژی بوش با دو باتری ۴ آمپر، مناسب مصالح ساختمانی و نصب‌های خانگی.",
    specs: "۲ باتری ۴ آمپر • دور متغیر",
    dailyPrice: 220_000, deposit: 1_500_000, area: "افسریه",
    rating: 4.8, reviewsCount: 22, viewsCount: 164,
    images: ["46e703296228.jpg"],
  });
  const l15 = await L(ali.id, cat.digital, "ویدیو پروژکتور", {
    brand: "Epson",
    description: "پروژکتور فول اچ دی مناسب سینمای خانگی، ارائه و مراسم؛ همراه با ریموت و کیف حمل.",
    specs: "Full HD • ۳۶۰۰ لومن • HDMI",
    dailyPrice: 550_000, deposit: 4_000_000, area: "ونک",
    rating: 4.7, reviewsCount: 29, viewsCount: 254,
    images: ["e7ea4079e9c9.jpg"],
  });
  const l16 = await L(arash.id, cat.digital, "دوربین ورزشی GoPro", {
    brand: "GoPro",
    description: "دوربین ورزشی ضدآب با ۴K۶۰ و لرزشگیر HyperSmooth؛ مناسب سفر، ورزش و تولید محتوا.",
    specs: "۴K 60fps • ضدآب تا ۱۰ متر • HyperSmooth",
    dailyPrice: 350_000, deposit: 2_500_000, area: "تجریش",
    rating: 4.8, reviewsCount: 38, viewsCount: 312,
    images: ["0a8ce54551f9.jpg"],
  });
  // A draft + a pending listing for the host dashboard demo
  await L(ali.id, cat.beauty, "دوربین چاپ عکس فوری کادرو", {
    brand: "Kodak",
    description: "پیش‌نویس: دوربین چاپ فوری برای مهمانی‌ها و رویدادها.",
    dailyPrice: 180_000, status: "DRAFT", area: "ونک",
    images: ["75c37134b4d1.jpg"],
  });
  await L(ali.id, cat.digital, "میکروفون پادکست RODE", {
    brand: "RODE",
    description: "میکروفون حرفه‌ای پادکست همراه با پایه و فیلتر پاپ.",
    dailyPrice: 260_000, status: "PENDING", area: "ونک",
    images: ["0a8ce54551f9.jpg"],
  });

  /* ------------------------- reservations & events ------------------------ */
  console.log("Seeding reservations…");
  async function mkRes(
    listingId: string, renterId: string, hostId: string,
    daysAgoStart: number, days: number, status: string,
    events: { actor: string; type: string; message: string; hoursAfter: number }[],
    code: string,
  ) {
    const l = await db.listing.findUniqueOrThrow({ where: { id: listingId } });
    const startDate = new Date(Date.now() + daysAgoStart * 86400000);
    const endDate = new Date(startDate.getTime() + days * 86400000);
    const subtotal = l.dailyPrice * days;
    return db.reservation.create({
      data: {
        code, listingId, renterId, hostId, startDate, endDate, days,
        status,
        dailyPrice: l.dailyPrice, subtotal, deposit: l.deposit, total: subtotal + l.deposit,
        events: { create: events.map((e, i) => ({
          actor: e.actor, type: e.type, message: e.message,
          createdAt: new Date(Date.now() - (events.length - i) * e.hoursAfter * 3600000),
        })) },
      },
    });
  }

  const r1 = await mkRes(l8.id, sara.id, ali.id, -2, 3, "PAID", [
    { actor: "renter", type: "REQUEST", message: "درخواست اجاره ثبت شد.", hoursAfter: 24 },
    { actor: "host", type: "APPROVE", message: "مالک درخواست را تایید کرد.", hoursAfter: 24 },
    { actor: "renter", type: "AGREEMENT", message: "قرارداد توسط مستأجر تایید شد.", hoursAfter: 24 },
    { actor: "renter", type: "PAY", message: "پرداخت در حالت آزمایشی (Sandbox) انجام شد.", hoursAfter: 24 },
  ], "OVR-A7K2M");
  void r1;

  const r2 = await mkRes(l2.id, sara.id, mehrdad.id, -6, 2, "COMPLETED", [
    { actor: "renter", type: "REQUEST", message: "درخواست اجاره ثبت شد.", hoursAfter: 24 },
    { actor: "host", type: "APPROVE", message: "مالک درخواست را تایید کرد.", hoursAfter: 24 },
    { actor: "renter", type: "AGREEMENT", message: "قرارداد تایید شد.", hoursAfter: 12 },
    { actor: "renter", type: "PAY", message: "پرداخت آزمایشی انجام شد.", hoursAfter: 6 },
    { actor: "host", type: "DELIVER", message: "وسیله تحویل داده شد.", hoursAfter: 12 },
    { actor: "renter", type: "RETURN", message: "درخواست بازگشت ثبت شد.", hoursAfter: 48 },
    { actor: "host", type: "INSPECTION", message: "صورت‌جلسه تحویل تایید شد؛ وسیله سالم است.", hoursAfter: 6 },
    { actor: "system", type: "COMPLETE", message: "ودیعه آزاد شد و اجاره تکمیل شد.", hoursAfter: 2 },
  ], "OVR-B3X9P");
  void r2;

  await mkRes(l12.id, sara.id, mehrdad.id, 5, 4, "REQUESTED", [
    { actor: "renter", type: "REQUEST", message: "درخواست اجاره برای ۴ روز ثبت شد.", hoursAfter: 24 },
  ], "OVR-C1Q7T");

  await mkRes(l10.id, sara.id, amirmahdi.id, 2, 5, "APPROVED", [
    { actor: "renter", type: "REQUEST", message: "درخواست اجاره ثبت شد.", hoursAfter: 24 },
    { actor: "host", type: "APPROVE", message: "مالک درخواست را تایید کرد؛ منتظر تایید قرارداد.", hoursAfter: 24 },
  ], "OVR-D5N4S");

  await mkRes(l5.id, sara.id, arash.id, 9, 2, "REQUESTED", [
    { actor: "renter", type: "REQUEST", message: "درخواست اجاره ثبت شد.", hoursAfter: 24 },
  ], "OVR-E9H2W");

  const r6 = await mkRes(l16.id, sara.id, arash.id, -12, 2, "DISPUTED", [
    { actor: "renter", type: "REQUEST", message: "درخواست اجاره ثبت شد.", hoursAfter: 24 },
    { actor: "host", type: "APPROVE", message: "تایید مالک.", hoursAfter: 24 },
    { actor: "renter", type: "PAY", message: "پرداخت آزمایشی انجام شد.", hoursAfter: 12 },
    { actor: "host", type: "DELIVER", message: "تحویل حضوری انجام شد.", hoursAfter: 24 },
    { actor: "host", type: "DISPUTE", message: "اعلام خسارت جزئی به بدنه دوربین.", hoursAfter: 72 },
  ], "OVR-F2K8B");
  void r6;

  /* ----------------------------- conversations ---------------------------- */
  console.log("Seeding conversations…");
  await db.conversation.create({
    data: {
      listingId: l8.id,
      participants: { create: [{ userId: sara.id }, { userId: ali.id }] },
      messages: {
        create: [
          { senderId: sara.id, body: "سلام، دوربین برای این آخر هفته آزاده؟", createdAt: new Date(Date.now() - 5 * 3600000) },
          { senderId: ali.id, body: "سلام، بله آزاده. تحویل حضوری در ونک یا پیک.", readAt: new Date(), createdAt: new Date(Date.now() - 4.5 * 3600000) },
          { senderId: sara.id, body: "عالیه! برای ۳ روز درخواست ثبت کردم.", readAt: new Date(), createdAt: new Date(Date.now() - 4 * 3600000) },
        ],
      },
    },
  });
  await db.conversation.create({
    data: {
      listingId: l2.id,
      participants: { create: [{ userId: sara.id }, { userId: mehrdad.id }] },
      messages: {
        create: [
          { senderId: sara.id, body: "چادر برای ۲ نفر هم مناسبه؟", createdAt: new Date(Date.now() - 26 * 3600000) },
          { senderId: mehrdad.id, body: "بله کاملاً، فضای کافی داره و دوپوشه.", createdAt: new Date(Date.now() - 25 * 3600000) },
        ],
      },
    },
  });

  /* -------------------------------- reviews ------------------------------- */
  console.log("Seeding reviews…");
  await db.review.create({ data: { listingId: l2.id, authorId: sara.id, rating: 5, comment: "چادر خیلی تمیز و بدون ایراد بود؛ تحویل سریع و محترمانه. حتماً دوباره اجاره می‌گیرم.", hostReply: "ممنون از اعتمادتان؛ خوشحالیم که راضی بودید.", hostReplyUserId: mehrdad.id, hostReplyAt: new Date() } });
  await db.review.create({ data: { listingId: l8.id, authorId: sara.id, rating: 5, comment: "دوربین دقیقاً طبق توضیحات بود؛ کیفیت عالی." } });
  await db.review.create({ data: { listingId: l10.id, authorId: sara.id, rating: 4, comment: "کنسول سالم بود، فقط کابل HDMI کمی قدیمی بود." } });
  await db.review.create({ data: { listingId: l5.id, authorId: sara.id, rating: 5, comment: "کوله سبک و راحت؛ برای سفر دو روزه عالی بود." } });
  await db.review.create({ data: { listingId: l12.id, authorId: sara.id, rating: 4, comment: "دوچرخه تمیز و سالم بود؛ زین کمی تنظیم نیاز داشت." } });

  /* ------------------------------ wallet ledger --------------------------- */
  console.log("Seeding wallet transactions (sandbox ledger)…");
  await db.walletTransaction.createMany({
    data: [
      { userId: sara.id, type: "RENTAL_PAYMENT", amount: -2_850_000, reference: "OVR-A7K2M", description: "پرداخت اجاره دوربین سونی — حالت شبیه‌سازی" },
      { userId: sara.id, type: "DEPOSIT_HOLD", amount: -6_000_000, reference: "OVR-A7K2M", description: "بلوکه شدن ودیعه — حالت شبیه‌سازی" },
      { userId: sara.id, type: "DEPOSIT_RELEASE", amount: 1_200_000, reference: "OVR-B3X9P", description: "آزادسازی ودیعه چادر — حالت شبیه‌سازی" },
      { userId: ali.id, type: "RENTAL_PAYMENT", amount: 2_850_000, reference: "OVR-A7K2M", description: "دریافت اجاره دوربین سونی — حالت شبیه‌سازی" },
      { userId: ali.id, type: "PAYOUT", amount: -3_000_000, status: "PENDING", description: "درخواست برداشت به حساب بانکی — حالت شبیه‌سازی" },
    ],
  });

  /* ------------------------------ notifications --------------------------- */
  await db.notification.createMany({
    data: [
      { userId: ali.id, type: "RESERVATION", title: "درخواست اجاره جدید", body: "سارا محمدی برای «دوربین سونی A7 IV» درخواست ثبت کرد.", link: "/host-dashboard", read: false },
      { userId: ali.id, type: "MESSAGE", title: "پیام جدید", body: "پیام جدیدی از سارا محمدی دارید.", link: "/live-chat", read: false },
      { userId: sara.id, type: "RESERVATION", title: "درخواست شما تایید شد", body: "درخواست کنسول PS5 تایید شد؛ لطفاً قرارداد را تایید کنید.", link: "/rentals", read: false },
    ],
  });

  /* ------------------------------ damage claim ---------------------------- */
  console.log("Seeding damage claim…");
  await db.damageClaim.create({
    data: {
      reservationId: r6.id, claimantId: arash.id, againstId: sara.id,
      title: "خسارت جزئی به بدنه دوربین GoPro",
      description: "پس از بازگشت وسیله، خط و خش عمیق روی لنز و ترک کوچک در گوشه بدنه مشاهده شد.",
      evidenceUrls: JSON.stringify(["/assets/img/0a8ce54551f9.jpg"]),
      status: "UNDER_REVIEW",
    },
  });

  /* -------------------------------- favorites ----------------------------- */
  await db.favorite.createMany({
    data: [
      { userId: sara.id, listingId: l8.id },
      { userId: sara.id, listingId: l10.id },
      { userId: sara.id, listingId: l2.id },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log("  renter: 09121111111 (سارا محمدی)");
  console.log("  host:   09122222222 (علی رضایی)");
  console.log("  admin:  09120000000 (مدیر اورا)");
  console.log("OTP demo code: shown on screen in dev mode (no SMS provider configured).");
}

/**
 * Transient Prisma error codes that justify retrying the whole seed:
 * - P1008: socket timeout (query engine stopped responding — typical in
 *   memory/CPU-constrained containers, e.g. right after a Docker build)
 * - P2024: timed out fetching a connection from the pool
 * - P1017: database server closed the connection
 * - P1001: can't reach the database server
 * main() clears every table first, so re-running it from scratch is safe.
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
