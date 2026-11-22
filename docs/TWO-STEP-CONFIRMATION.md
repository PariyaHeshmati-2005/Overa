# تأیید دوطرفه تحویل و بازگشت کالا با OTP (Two-Step Confirmation)

این قابلیت چرخه اجاره اٌوِرا را دو مرحله‌ای می‌کند: ثبت تحویل توسط میزبان به‌تنهایی
اجاره را فعال نمی‌کند؛ مستأجر باید دریافت سالم کالا را با کد یک‌بارمصرف تأیید کند.
به همین شکل، اعلام بازگشت مستأجر تنها پس از تأیید میزبان (با کد یک‌بارمصرف برای
حالت سالم، یا اعلام خسارت) سفارش را تکمیل می‌کند.

## وضعیت‌ها و انتقال‌ها

```
REQUESTED → APPROVED → AGREEMENT → PAYMENT → PAID
PAID --deliver(host)--> DELIVERED            (زمان ثبت تحویل: deliveredAt)
DELIVERED --confirm_delivery(renter, OTP)--> RENTAL_ACTIVE   (زمان شروع واقعی: actualStartAt)
RENTAL_ACTIVE --request_return(renter)--> RETURN_REQUESTED   (returnRequestedAt)
RETURN_REQUESTED --confirm_return(host, OTP)--> COMPLETED    (returnConfirmedAt، depositStatus=REFUND_PENDING)
RETURN_REQUESTED --dispute(host/renter)--> DISPUTED          (disputeOpenedAt — تکمیل خودکار متوقف می‌شود)
```

مسیر قدیمی `RETURNED → INSPECTION → COMPLETED` فقط برای سازگاری داده‌های قبل از
این قابلیت حفظ شده و برای سفارش‌های جدید دیگر تولید نمی‌شود.

## دو مرحله OTP مستقل

| مرحله               | نقش مجاز          | وضعیت لازم         | نتیجه تأیید                            |
| ------------------- | ----------------- | ------------------ | -------------------------------------- |
| `DELIVERY_RECEIVED` | مستأجر همان سفارش | `DELIVERED`        | `RENTAL_ACTIVE` + ثبت زمان شروع واقعی  |
| `RETURN_RECEIVED`   | میزبان همان سفارش | `RETURN_REQUESTED` | `COMPLETED` + آغاز فرآیند بازگشت ودیعه |

هر کد به `(reservationId, userId, stage, phone)` گره خورده است؛ کد یک سفارش/مرحله/
کاربر در سفارش دیگر قابل استفاده نیست. شماره تلفن همیشه از کاربر احراز هویت‌شده
سمت سرور خوانده می‌شود.

## قوانین کد (در حالت Demo هم واقعی اجرا می‌شوند)

- ۶ رقم، تصادفی و مختص هر صدور (`crypto.randomInt`) — کد ثابت وجود ندارد.
- ذخیره‌سازی فقط **هش‌شده** (scrypt با salt و مقایسه `timingSafeEqual`) در جدول `ReservationOtp`.
- اعتبار ۵ دقیقه؛ یک‌بارمصرف (پس از تأیید `consumed=true`).
- حداکثر ۵ تلاش اشتباه؛ پس از آن کد باطل می‌شود.
- فاصله حداقل ۶۰ ثانیه بین دو ارسال (per سفارش+کاربر+مرحله).
- حداکثر ۳ ارسال در بازه ۱۵ دقیقه.
- صدور کد جدید، کدهای قبلی فعال را باطل می‌کند.
- تأیید کد و تغییر وضعیت سفارش در **یک تراکنش** انجام می‌شود؛ گارد
  `updateMany` روی وضعیت مورد انتظار، کلیک هم‌زمان/دوباره را با خطای ۴۰۹
  (و rollback کامل) بی‌اثر می‌کند.

## معماری

```
src/lib/sms.ts                    آداپتور ارسال (DemoSmsProvider / UnconfiguredSmsProvider) — تعویض ارائه‌دهنده فقط همین‌جا
src/lib/reservation-otp.ts        منطق OTP: صدور، هش، محدودیت‌ها، مصرف یک‌باره + تراکنش
src/app/api/reservations/[id]/otp/request   POST — صدور کد برای یک مرحله
src/app/api/reservations/[id]/otp/verify    POST — تأیید کد + تغییر وضعیت در یک تراکنش
src/components/overa/OtpConfirmFlow.tsx     پنل مشترک کد (۶ خانه، شمارنده ارسال مجدد، باکس کد آزمایشی)
src/components/overa/DeliveryConfirmCard.tsx کارت «تأیید دریافت کالا» (مستأجر)
src/components/overa/ReturnConfirmCard.tsx   کارت تأیید بازگشت میزبان (سالم / اعلام خسارت)
```

کنش‌های OTP-gated (`confirm_delivery` و `confirm_return` از وضعیت
`RETURN_REQUESTED`) از مسیر عمومی `PATCH /api/reservations/[id]` مسدود شده‌اند؛
تنها مسیر تغییر وضعیت، تأیید کد است. مسیر قدیمی `confirm_return` از `RETURNED`
برای داده‌های قدیمی بدون کد باقی مانده است.

## کارت‌ها در UI

- مستأجر، وضعیت `DELIVERED`: کارت «تأیید دریافت کالا» در `/rentals` و در صفحه
  `/rental-lifecycle/[id]` (بخش تحویل) + کنش «اعلام خسارت» به‌عنوان خروج اضطراری.
- میزبان، وضعیت `RETURN_REQUESTED`: کارت تأیید بازگشت با دو گزینه در
  `/host-dashboard`، نمای میزبانِ `/rentals` و صفحه روند اجاره.
- پیام موفقیت مستأجر: «تحویل کالا با موفقیت تأیید شد و دوره اجاره شما آغاز گردید.»
- پیام موفقیت میزبان: «بازگشت کالا با موفقیت تأیید شد. سفارش تکمیل شده و فرآیند
  بازگشت ودیعه آغاز گردید.»
- اعلام خسارت: «درخواست اعلام خسارت ثبت شد. سفارش برای بررسی اختلاف به مرحله
  بررسی منتقل گردید.»

## ودیعه (Sandbox)

پس از تأیید میزبان: `depositStatus = REFUND_PENDING` و یک رکورد
`DEPOSIT_RELEASE` با وضعیت `PENDING` در دفتر کیف پول («تسویه توسط اپراتور»)
ثبت می‌شود؛ هیچ تراکنش مالی واقعی یا تغییر موجودی انجام نمی‌شود. آزادسازی نهایی
(`REFUNDED`) در این نسخه به فرآیند تسویه اپراتور واگذار شده است.

## حالت Demo و کد آزمایشی

تا زمانی که `SMS_PROVIDER_API_KEY` تنظیم نشده باشد، پاسخ API درخواست کد فیلد
`devCode` را شامل می‌شود و UI باکس «حالت توسعه: پیامک واقعی ارسال نشده است» را
نمایش می‌دهد. این تصمیم سمت سرور و بر اساس متغیر محیطی است (نه CSS/شرط فرانت).
با تنظیم کلید، نمایش کد به‌طور خودکار غیرفعال می‌شود؛ اگر کلید تنظیم شده باشد اما
آداپتور واقعی پیاده‌سازی نشده باشد، صدور کد با خطای صادقانه ۵۰۲ ناموفق می‌شود.

## اتصال پیامک واقعی (آینده)

1. یک آداپتور `SmsProvider` در `src/lib/sms.ts` برای ارائه‌دهنده انتخابی
   (مثلاً کاوه‌نگار/SMS.ir) پیاده‌سازی کنید.
2. آن را در `getSmsProvider()` جای `UnconfiguredSmsProvider` برگردانید.
3. متغیرهای محیطی: `SMS_PROVIDER_API_KEY` و `SMS_SENDER_NUMBER` (نام‌ها در
   `.env.example` مستند شده‌اند). هیچ تغییر دیگری در منطق OTP/سفارش لازم نیست.
4. خطای سرویس پیامکی → کد صادرشده باطل و خطای ۵۰۲ صادقانه به کاربر نمایش داده
   می‌شود.

## تست

- واحدی: `bun test` (شامل `tests/reservation-otp.test.ts` برای همه قوانین کد).
- E2E (محلی): `node scripts/overa-e2e.mjs` با دیتابیس تست و `next start` روی
  پورت ۳۱۰۰ — کل سناریو مستأجر/میزبان، مسدودسازی‌های امنیتی، هم‌زمانی و
  محدودیت‌ها را بررسی می‌کند.
- سناریوی دستی Demo: ورود با حساب‌های آزمایشی (مستأجر `09121111111`، میزبان
  `09122222222`، رمز `overa1234`)، ثبت و طی سفارش تا پرداخت، «تحویل شد» توسط
  میزبان، سپس کارت تأیید در پنل مستأجر → کد نمایشی → تأیید؛ پس از «درخواست
  بازگشت» توسط مستأجر، کارت میزبان در داشبورد میزبان ظاهر می‌شود.

## استقرار و عیب‌یابی

- **مهاجرت خودکار:** از این نسخه `scripts/migrate-deploy.sh` به هر سه مسیر
  راه‌اندازی وصل است (اسکریپت `build`، اسکریپت `start` و `docker-entrypoint.sh`)
  تا هر پلتفرمی که اپ را بالا می‌آورد، قبل از شروع سرور `prisma migrate deploy`
  را اجرا کند. اسکریپت idempotent است (اجرای مکرر بی‌خطر) و فقط migrationهای
  افزایشی را اعمال می‌کند؛ هیچ داده‌ای حذف یا بازنویسی نمی‌شود. اگر
  `DATABASE_URL` ست نشده باشد (مثلاً build محلی) با هشدار رد می‌شود و build را
  نمی‌شکند.
- **fallback با baseline:** اگر دیتابیس قبلاً با `prisma db push` ساخته شده
  باشد و جدول تاریخچه `_prisma_migrations` نداشته باشد، اسکریپت سه migration
  قبلی را «اعمال‌شده» علامت می‌زند (baseline) و فقط migrationهای جدید را اجرا
  می‌کند.
- **خطای `P2022 — The column "Reservation.deliveredAt" does not exist`:** یعنی
  کدِ جدید deploy شده ولی migration متناظر روی دیتابیس اعمال نشده است. با نسخهٔ
  فعلی redeploy کنید تا خودکار اعمال شود؛ یا برای اصلاح فوری بدون redeploy، از
  روی ماشین محلی:
  ```bash
  cd Overa/Overa
  DATABASE_URL="postgresql://…?sslmode=require" DIRECT_URL="postgresql://…?sslmode=require" bunx prisma migrate deploy
  bunx prisma migrate status   # باید «Database is now up to date» بدهد
  ```
  این دستور فقط-افزایشی است (ستون‌های جدید جدول `Reservation` + جدول
  `ReservationOtp`) و پس از اجرا، صفحات بدون ری‌استارت اپ درست می‌شوند.
- هشدار `NODE_ENV was incorrectly set to "development"` روی پلتفرم بی‌ضرر است؛
  برای حذف آن در متغیرهای محیطی پلتفرم `NODE_ENV=production` را تنظیم کنید.
