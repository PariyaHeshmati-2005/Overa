# گزارش تحویل — نسخه بهبودیافته اٌوِرا (Overa)

> تاریخ: ۱۴۰۵/۰۸/۲۴ (۲۰۲۶-۱۱-۱۵) — نسخه ۰٫۳٫۰
> این سند، خلاصه کامل تغییرات، معماری دیتابیس، متغیرهای محیطی، راهنمای استقرار در Vercel و نتایج تست‌ها است.

---

## ۱. فایل‌های تغییر یافته (Modify)

| فایل                                                       | شرح تغییر                                                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                     | افزودن `isDemo` به `User` و `Listing` (تفکیک داده دمو از واقعی)، افزودن `Listing.searchKey` (کلید جستجوی نرمال‌شده)   |
| `scripts/seed.ts`                                          | بازنویسی کامل: idempotent، غیرمخرب، با محافظ Production و برچسب `isDemo`                                              |
| `src/app/(main)/page.tsx`                                  | جایگزینی بنر استاتیک با Carousel واقعی، کارت نصب اپلیکیشن با QR واقعی، حذف دکمه‌های قلابی فروشگاه                     |
| `src/components/layout/HeaderClient.tsx`                   | جستجوی زنده دیتابیسی در هدر و منوی موبایل، حذف گزینه تخفیف‌ها برای مهمان، پنهان‌سازی زیرنویس برند در موبایل خیلی کوچک |
| `src/app/(main)/discounts/page.tsx`                        | محافظ دسترسی سمت سرور (redirect مهمان به ورود)، `noindex`                                                             |
| `src/app/(main)/categories/CategoriesApp.tsx`              | پشتیبانی از پارامتر `?category=slug` برای دسته‌های بدون تب (مثل لوازم خانگی)                                          |
| `src/app/(main)/item-details/[id]/page.tsx`                | ۴۰۴ واقعی برای شناسه نامعتبر، متادیتای SEO پویا (عنوان/توضیح/OG از محصول)، رفع کرش صفحه                               |
| `src/app/(main)/admin-dashboard/page.tsx`                  | واکشی کل کاتالوگ با تعداد رزروها برای بخش مدیریت محصولات                                                              |
| `src/app/(main)/admin-dashboard/AdminDashboardClient.tsx`  | بخش جدید «مدیریت محصولات»: جستجو، فیلتر وضعیت، تایید/رد/توقف/آرشیو/حذف امن                                            |
| `src/app/(main)/tos-support-faq/TosFaqApp.tsx`             | رفع سرریز افقی ۸px در موبایل (`min-w-72` → `w-full sm:min-w-72`)                                                      |
| `src/app/api/listings/route.ts`                            | تولید `searchKey` هنگام ساخت آگهی                                                                                     |
| `src/app/api/listings/[id]/route.ts`                       | به‌روزرسانی `searchKey` هنگام ویرایش فیلدهای متنی                                                                     |
| `src/app/api/admin/listings/[id]/route.ts`                 | تایید/رد + اکشن‌های pause/resume/archive/restore/delete امن، اعلان به مالک، Audit Log کامل                            |
| `src/lib/format.ts`                                        | Null-safe کردن `faNumber`/`faToman` (رفع کرش `null.toLocaleString`)                                                   |
| `src/lib/db.ts`                                            | حذف `log: ['query']` (کاهش نویز و بهبود کارایی)                                                                       |
| `src/app/(main)/host-dashboard/page.tsx`                   | هدر داشبورد میزبان: واکنش‌گرا در موبایل کوچک (پنهان‌سازی زیرنویس و آیکون‌های ثانویه زیر `sm`)                         |
| `src/app/(main)/rentals/page.tsx`                          | هدر محلی صفحه: همان بهینه‌سازی موبایل                                                                                 |
| `src/app/(main)/rentals/RentalsClient.tsx`                 | رفع سرریز افقی سوییچ «مستأجر/میزبان» در موبایل (`min-w-0`)                                                            |
| `src/app/(main)/account-settings/page.tsx`                 | رفع سرریز هدر در موبایل                                                                                               |
| `src/app/(main)/live-chat/page.tsx`                        | رفع سرریز هدر در موبایل                                                                                               |
| `src/app/(main)/reviews/page.tsx`                          | رفع سرریز هدر در موبایل                                                                                               |
| `src/app/(main)/loading/page.tsx`                          | پنهان‌سازی زیرنویس برند در موبایل                                                                                     |
| `src/components/overa/NotFoundContent.tsx`                 | پنهان‌سازی زیرنویس برند در موبایل                                                                                     |
| `package.json`                                             | اسکریپت‌های امن دیتابیس (`db:migrate*`، حذف `--accept-data-loss`)، wrapper محیطی                                      |
| `.env.example`                                             | مستندسازی `NEXT_PUBLIC_SITE_URL` و DATABASE_URL                                                                       |
| `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` | مهاجرت از SQLite به PostgreSQL، `migrate deploy`، بوت‌استرپ ادمین، Seed دمو فقط با `SEED_DEMO=1`                      |
| `bun.lock`                                                 | افزودن وابستگی `qrcode`                                                                                               |

## ۲. فایل‌های جدید (Create)

| فایل                                   | کارکرد                                                                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/lib/persian.ts`                   | نرمال‌سازی فارسی (ی/ك/اعراب/نیم‌فاصله/ارقام) + ساخت searchKey                                                     |
| `src/lib/search.ts`                    | موتور جستجوی دیتابیسی (فقط آگهی‌های ACTIVE، parameterized و امن)                                                  |
| `src/lib/qr.ts`                        | تولید QR واقعی به‌صورت محلی + تعیین URL پایه سایت                                                                 |
| `src/lib/pwa.ts`                       | مدیریت `beforeinstallprompt`، تشخیص نصب‌بودن، هوک `usePwaInstall`                                                 |
| `src/app/api/search/route.ts`          | API جستجو (`GET /api/search?q=&limit=`)                                                                           |
| `src/components/search/SearchBox.tsx`  | باکس جستجوی زنده (هدر + منوی موبایل)، کیبورد، RTL                                                                 |
| `src/app/(main)/search/`               | صفحه نتایج جستجو + حالت «پیدا نشد» با حفظ عبارت و اصلاح جستجو                                                     |
| `src/components/home/HeroCarousel.tsx` | Carousel صفحه اصلی (Embla: loop، autoplay ۵ثانیه، بدون فلش، دات، توقف با hover/focus/drag/تب مخفی/reduced-motion) |
| `src/components/pwa/AppPromoCard.tsx`  | کارت معرفی و نصب اپلیکیشن در بنر فعلی صفحه اصلی                                                                   |
| `src/app/(main)/install/`              | صفحه نصب با QR، تشخیص دستگاه، دکمه نصب واقعی، راهنمای iOS سه‌مرحله‌ای                                             |
| `src/proxy.ts`                         | ۴۰۴ واقعی برای شناسه نامعتبر + redirect واقعی (۳۰۷) صفحات محافظت‌شده برای مهمان                                   |
| `scripts/create-admin.ts`              | ساخت/ارتقای ادمین Production-safe با متغیرهای محیطی                                                               |
| `scripts/backfill-search-keys.ts`      | بازسازی searchKey برای داده‌های موجود (idempotent)                                                                |
| `scripts/env-run.sh`                   | wrapper محیطی برای توسعه محلی ( اولویت `.env.local`)                                                              |
| `scripts/find-listing.ts`              | ابزار کمکی توسعه برای یافتن شناسه آگهی                                                                            |
| `prisma/migrations/`                   | سه Migration کنترل‌شده: `init`، `add_is_demo_flags`، `add_listing_search_key`                                     |
| `tests/persian.test.ts`                | ۱۲ تست واحد نرمال‌سازی فارسی                                                                                      |

## ۳. معماری دیتابیس و اتصال

- **دیتابیس Production موجود شما همان PostgreSQL ابری Prisma Postgres است** (`db.prisma.io` در `.env` شما). Provider اسکیما `postgresql` است و با Prisma 6 و Vercel سازگار است؛ چیزی تغییر نکرده و نیازی به جابه‌جایی نیست. اگر بعداً Neon یا Supabase را ترجیح دادید، فقط `DATABASE_URL` در Vercel را عوض کنید.
- در سندباکس این پروژه، برای تست واقعی یک PostgreSQL 16 محلی اجرا شد؛ کد هیچ وابستگی به آن ندارد.
- **ذخیره‌سازی پایدار**: همه داده‌ها (کاربران، آگهی‌ها، رزروها، تراکنش‌های کیف پول) در PostgreSQL ذخیره می‌شوند و با Deploy مجدد در Vercel از بین نمی‌روند. تصاویر محصولات فعلاً فایل‌های استاتیک پروژه‌اند (`/assets/img/*`)؛ برای آپلود تصاویر توسط کاربران در آینده، یک Object Storage (مثل S3/R2) پیشنهاد می‌شود.
- **Migrationها**: به‌جای `db push --accept-data-loss` (مخرب)، سه Migration کنترل‌شده ساخته شد. برای Production فقط `prisma migrate deploy` اجرا می‌شود که هرگز داده حذف نمی‌کند.
- **Seed جدید**: هرگز چیزی حذف نمی‌کند؛ با کلید طبیعی (slug دسته، شماره موبایل، عنوان+مالک) فقط-می‌سازد؛ روی دیتابیس غیرمحلی به‌صورت پیش‌فرض رد می‌شود (مگر با `OVERA_SEED_ALLOW_REMOTE=1`)؛ همه رکوردهای دمو `isDemo=true` دارند و در پنل ادمین با نشان «نمونه دمو» متمایز می‌شوند.

## ۴. انتقال محصولات فعلی به دیتابیس

- محصولات نمایشی فعلی سایت عیناً در `scripts/seed.ts` وجود دارند (۱۸ آگهی با همان تصاویر، قیمت‌ها، برندها و توضیحات قبلی) و از دیتابیس خوانده می‌شوند.
- اجرای `bun run db:seed` روی هر دیتابیس، این ۱۸ آگهی دمو را با برچسب `isDemo` می‌سازد و هیچ‌کدام را دوباره نمی‌سازد (تکراری نمی‌شود) و به داده واقعی دست نمی‌زند.
- هر آگهی جدیدی که کاربران از «ثبت وسیله» ثبت کنند با `status=PENDING` وارد دیتابیس می‌شود و پس از تایید ادمین (`ACTIVE`) در صفحه اصلی و جستجو ظاهر می‌شود.
- جستجو روی ستون `searchKey` (متن نرمال‌شده عنوان+برند+مشخصات+توضیح+شهر+دسته) انجام می‌شود؛ برای داده‌های از قبل موجود: `bun run scripts/backfill-search-keys.ts`.

## ۵. Environment Variables

| متغیر                                 | الزامی    | شرح                                                                                                                       |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                        | بله       | رشته اتصال PostgreSQL (در Vercel تنظیم می‌شود؛ مقدار فعلی شما در `.env.overa-backup` حفظ شده)                             |
| `NEXT_PUBLIC_SITE_URL`                | توصیه‌شده | مثل `https://overa.vercel.app` — آدرس داخل QR Code نصب. در نبود آن از `VERCEL_URL` و در آخر از دامنه عمومی استفاده می‌شود |
| `SMS_PROVIDER_API_KEY`                | اختیاری   | بدون آن، OTP در «حالت دمو با برچسب» کار می‌کند (کد روی صفحه نمایش داده می‌شود)                                            |
| `NODE_ENV`, `NEXT_TELEMETRY_DISABLED` | —         | معمولی                                                                                                                    |

هیچ رمز یا توکنی در کد یا گیت قرار نگرفته؛ `.env*` در `.gitignore` است.

## ۶. راهنمای تنظیم دیتابیس در Vercel

1. Project → Settings → Environment Variables → `DATABASE_URL` = رشته اتصال PostgreSQL شما (همان که الان در `.env` خودتان دارید). برای همه محیط‌ها (Production/Preview/Development).
2. `NEXT_PUBLIC_SITE_URL` = `https://overa.vercel.app`.
3. (اختیاری) `SMS_PROVIDER_API_KEY` وقتی سرویس پیامک انتخاب شد.
4. Deploy → در لاگ Build، اجرای `prisma generate` باید موفق باشد (postinstall).
5. **اعمال Migrationها روی Production** (یک‌بار از کامپیوتر خودتان):
   ```bash
   # در پوشه پروژه با DATABASE_URL واقعی در .env یا شل:
   bunx prisma migrate deploy
   bun run scripts/backfill-search-keys.ts   # ساخت searchKey برای آگهی‌های موجود
   bun run scripts/create-admin.ts           # با ADMIN_PHONE و ADMIN_PASSWORD
   # فقط اگر داده دمو می‌خواهید:
   OVERA_SEED_ALLOW_REMOTE=1 bun run db:seed
   ```

## ۷. اجرای محیط توسعه

```bash
bun install
cp .env.example .env        # و DATABASE_URL محلی/خودتان را تنظیم کنید
bun run db:migrate          # prisma migrate dev (محلی)
bun run db:seed             # داده دمو (فقط لوکال)
bun run dev                 # http://localhost:3000
```

## ۸. نتایج تست‌ها (نهایی)

| تست                                 | نتیجه                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `bun run lint` (ESLint)             | ✔ ۰ خطا / ۰ هشدار                                                                              |
| `bunx tsc --noEmit`                 | ✔ بدون خطا                                                                                     |
| `bun test`                          | ✔ ۳۷/۳۷ پاس (۱۲ تست جدید نرمال‌سازی فارسی)                                                     |
| `bun run build` (production)        | ✔ Compiled successfully                                                                        |
| دود تست Production (standalone)     | ✔ صفحه اصلی ۲۰۰، جستجو ۲۰۰، نصب ۲۰۰، شناسه نامعتبر **۴۰۴ واقعی**، مهمان→تخفیف‌ها **۳۰۷ واقعی** |
| مرورگر واقعی (1440/768/430/360/320) | ✔ بدون اسکرول افقی؛ Carousel، جستجو، ورود OTP، منوی موبایل، پنل ادمین بررسی و تأیید شد         |

سناریوهای مرورگری تأییدشده: جستجوی «دوربین/چادر/sony/PS5/کمپینگ/عرب‌نویسی ي-ك/بدون نیم‌فاصله/عدم وجود»، کلیک نتیجه→جزئیات، ورود OTP مهمان، مخفی/آشکار بودن تخفیف‌ها، تایید/توقف/آرشیو ادمین با ثبت در Audit Log و اعلان مالک، autoplay دو جهته Carousel با دات و درگ.

## ۹. موارد باقی‌مانده که نیاز به اقدام شما دارد

1. **Vercel**: ثبت `DATABASE_URL`، `NEXT_PUBLIC_SITE_URL` (بند ۶) و اجرای یک‌باره `migrate deploy` + `backfill-search-keys.ts` + `create-admin.ts`.
2. **Push به GitHub**: تغییرات در مخزن محلی commit شده‌اند؛ `git push origin main` بزنید.
3. **پیامک OTP**: برای ورود واقعی، سرویس پیامک را انتخاب و `SMS_PROVIDER_API_KEY` را تنظیم کنید (تا آن‌ زمان کد روی صفحه نمایش داده می‌شود).
4. **QR Code**: پس از تنظیم `NEXT_PUBLIC_SITE_URL`، QRهای صفحه اصلی و `/install` به‌طور خودکار آدرس واقعی دامنه را نشان می‌دهند (در محیط dev آدرس localhost است — طبیعی است).
5. **آپلود تصویر کاربران** (پیشنهاد آینده): متصل کردن فرم ثبت وسیله به یک Object Storage.
6. **رمز ادمین دمو**: `09120000000 / overa1234` فقط برای توسعه است؛ روی Production با `create-admin.ts` رمز قوی بگذارید و اکانت دمو را حذف کنید.

## ۱۰. نکات فنی مهم

- **۴۰۴ واقعی**: به‌دلیل استریم‌مینگ Next.js 16، `notFound()` داخل صفحه پس از شروع استریم نمی‌تواند status code را عوض کند؛ بنابراین `src/proxy.ts` (جانشین middleware در Next 16 با Node runtime) قبل از استریم، شناسه را چک می‌کند و ۴۰۴ واقعی + صفحه برند ۴۰۴ را برمی‌گرداند. همین الگو برای redirect واقعی صفحات `/discounts` و `/admin-dashboard` استفاده شده است.
- **حذف امن**: ادمین می‌تواند آرشیو کند (Soft Delete). «حذف قطعی» فقط برای آگهی‌های بدون رزرو/نظر ممکن است؛ در غیر این‌صورت سرور به‌جای حذف، آرشیو می‌کند تا سوابق مالی و اجاره از بین نرود.
- **Carousel**: از Embla موجود پروژه استفاده شده (بدون وابستگی جدید). فلش‌ها عمداً ندارند؛ فقط دات‌های پایین. با `prefers-reduced-motion` پخش خودکار کاملاً خاموش می‌شود.
- **QR**: با پکیج `qrcode` به‌صورت SVG محلی تولید می‌شود (بدون سرویس خارجی) و آدرس `/install` دامنه واقعی را encode می‌کند.
