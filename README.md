<div align="center">

<img src="docs/assets/hero.svg" alt="اُوِرا — پلتفرم هوشمند اجارهٔ آنلاین وسایل" width="100%">

<br>

<img src="https://img.shields.io/badge/Next.js-16-1F1B2E?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16">
<img src="https://img.shields.io/badge/React-19-4C2A9E?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
<img src="https://img.shields.io/badge/TypeScript-5-8B5CF6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5">
<img src="https://img.shields.io/badge/Tailwind_CSS-4-EC4899?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
<br>
<img src="https://img.shields.io/badge/Prisma-6-3A1E7B?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma 6">
<img src="https://img.shields.io/badge/PostgreSQL-16-F5A623?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16">
<img src="https://img.shields.io/badge/Bun-runtime-10B981?style=for-the-badge&logo=bun&logoColor=white" alt="Bun">
<img src="https://img.shields.io/badge/Docker-ready-630ED4?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
<img src="https://img.shields.io/badge/PWA-installable-801E76?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">

<br><br>

<a href="#about">معرفی</a> &nbsp;·&nbsp;
<a href="#features">ویژگی‌ها</a> &nbsp;·&nbsp;
<a href="#screens">تصاویر</a> &nbsp;·&nbsp;
<a href="#lifecycle">چرخهٔ اجاره</a> &nbsp;·&nbsp;
<a href="#stack">استک فنی</a> &nbsp;·&nbsp;
<a href="#langs">زبان‌ها</a> &nbsp;·&nbsp;
<a href="#arch">معماری</a> &nbsp;·&nbsp;
<a href="#run">اجرا</a> &nbsp;·&nbsp;
<a href="#quality">تست</a> &nbsp;·&nbsp;
<a href="#docs">مستندات</a>

<br>

<img src="docs/assets/divider.svg" alt="" width="70%">

</div>

<h2 id="about"><img src="docs/assets/section-about.svg" alt="اُوِرا چیست؟" width="100%"></h2>

<div dir="rtl">

**اُوِرا** یک بازار آنلاین اجارهٔ وسایل (Peer-to-Peer Rental Marketplace) است که اجارهٔ «هر وسیله‌ای» را بین افراد ممکن می‌کند: از دوربین عکاسی و ابزار برقی تا ویدیوپروژکتور، چادر کمپینگ و صندلی ماساژور.
**میزبان‌ها** وسیله‌شان را با قیمت و تقویم دسترسی خودشان ثبت می‌کنند و **مستأجرها** دقیقاً همان روزهایی را که لازم دارند رزرو می‌کنند — همه‌چیز فارسی، راست‌به‌چپ، با **تقویم شمسی** و یک چرخهٔ اجارهٔ شفاف که هر مرحله‌اش سمت سرور اعتبارسنجی می‌شود.

> 💜 شعار پروژه: **«هر چیزی که نیاز داری، فقط برای مدتی کوتاه!»** — اجاره کن، به‌جای خرید.

این مخزن یک اپلیکیشن **فول‌استک کامل** است (نه صرفاً ظاهر): صفحات و APIها در یک کدبیس Next.js، دیتابیس PostgreSQL با Prisma، احراز هویت، ماشین‌حالت رزرو، کیف پول و امانی (شبیه‌سازی‌شده)، چت، اعلان، داوری اختلاف و پنل مدیریت.

<br>

<table align="center">
  <tr>
<td align="center" width="16%"><h2>۳۴</h2><sub>صفحهٔ کاربری</sub></td>
<td align="center" width="16%"><h2>۲۹</h2><sub>Route Handler (API)</sub></td>
<td align="center" width="16%"><h2>۱۸</h2><sub>مدل دیتابیس</sub></td>
<td align="center" width="16%"><h2>۸</h2><sub>مایگریشن Prisma</sub></td>
<td align="center" width="16%"><h2>+۵۲٬۰۰۰</h2><sub>خط کد</sub></td>
<td align="center" width="16%"><h2>۸</h2><sub>گام چرخهٔ اجاره</sub></td>
  </tr>
</table>

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="features"><img src="docs/assets/section-features.svg" alt="ویژگی‌های کلیدی" width="100%"></h2>

<div dir="rtl">

<table>
  <tr>
<td width="50%" valign="top">

### 🗓 تقویم شمسی اختصاصی
انتخاب بازهٔ تحویل و بازگشت با تقویم جلالی؛ روزهای گذشته و رزروشده غیرفعال، روزهای مسدودشدهٔ میزبان مشخص و خطاها فارسی و دقیق‌اند. تبدیل تاریخ، سال کبیسه و بازه‌های رزروشده و مسدود در `src/lib/jalali.ts` با تست واحد پوشش داده شده‌اند. تقویم در حال حاضر روی **سال ۱۴۰۵** قفل است (`JALALI_YEAR_LOCK`).

</td>
<td width="50%" valign="top">

### 🔁 ماشین‌حالت رزرو
۱۴ وضعیت رزرو، جدول انتقال و ماتریس دسترسی نقش‌ها (مستأجر / میزبان / مدیر) در یک فایل مرجع (`rental-state.ts`) تعریف شده؛ هر انتقال نامعتبر با خطای ۴۲۲ و پیام فارسی رد می‌شود و تاریخچهٔ رویدادها (`ReservationEvent`) ثبت می‌گردد.

</td>
  </tr>
  <tr>
<td width="50%" valign="top">

### 🔐 تأیید دوطرفه با OTP
تأیید دریافت کالا توسط مستأجر و تأیید بازگشت سالم توسط میزبان بدون کد یک‌بارمصرف نهایی نمی‌شود: کد ۶ رقمی تصادفی، ذخیرهٔ هش‌شدهٔ scrypt، اعتبار ۵ دقیقه، حداکثر ۵ تلاش و محدودیت ارسال مجدد. تأیید کد و تغییر وضعیت در **یک تراکنش** انجام می‌شود.

</td>
<td width="50%" valign="top">

### ✍️ امضای دیجیتال قرارداد
مستأجر پیش از پرداخت، قرارداد را با کد یک‌بارمصرف امضا می‌کند (امضا فقط کار مستأجر است؛ تأیید میزبان یک کنش معمولی ماشین‌حالت است). زمان امضا روی رزرو ذخیره می‌شود (`signedByRenterAt`) و تا امضا انجام نشده، دکمهٔ ساده «تأیید قرارداد» در رابط پنهان است.

</td>
  </tr>
  <tr>
<td width="50%" valign="top">

### 🧙 ویزارد ثبت وسیله
ثبت آگهی در ۴ مرحله با پیش‌نمایش زنده، تقویم مسدودسازی روزها، ماشین‌حساب تخمین درآمد ماهانه، انتخاب موقعیت روی نقشه (با دکمهٔ «موقعیت من») و آپلود تصویر با کوچک‌سازی تا ۱۶۰۰ پیکسل و فشرده‌سازی JPEG سمت مرورگر (سمت سرور: حداکثر ۵ مگابایت، فقط jpeg/png/webp).

</td>
<td width="50%" valign="top">

### 💰 کیف پول و امانی (Sandbox)
دفتر تراکنش، ودیعه و امانی که **عمداً و آشکارا «شبیه‌سازی» برچسب خورده‌اند**؛ هیچ جریان پول واقعی ادعا نمی‌شود. ودیعه هنگام پرداخت بلوکه می‌شود، اجارهٔ روزانه پس از تأیید دریافت کسر می‌گردد و در بازگشت سالم ودیعه خودکار آزاد می‌شود. موجودی هرگز منفی نمی‌شود و امتیاز اعتبار کاربر در صفحهٔ کیف پول نمایش داده می‌شود.

</td>
  </tr>
  <tr>
<td width="50%" valign="top">

### ⚖️ خسارت و داوری
اگر کالا هنگام تحویل آسیب‌دیده باشد، مستأجر می‌تواند آن را نپذیرد (لغو سفارش و بازگشت ودیعه)؛ در میان اجاره یا هنگام بازگشت، اعلام خسارت پرونده را به صف «اعلام خسارت‌ها» می‌برد. گفتگوی پرونده **فقط‌متنی** است (سرور پیوست را رد می‌کند) و مدیر در پنل داوری رأی می‌دهد. رأی **درصدی** است: چند درصد ودیعه به مستأجر برگردد و بقیه به کیف پول میزبان برود؛ در یک تراکنش، بدون منفی‌شدن موجودی، و وضعیت `SETTLED` نهایی است.

</td>
<td width="50%" valign="top">

### 💬 تعامل زنده
چت بین مستأجر و میزبان، مرکز اعلان‌ها، یادآورهای موعد تحویل/بازگشت (۲ روز و ۱ روز مانده، روز موعد و روزهای تأخیر؛ بدون نیاز به worker جداگانه)، نظرات با پاسخ میزبان و فهرست علاقه‌مندی‌ها.

</td>
  </tr>
  <tr>
<td width="50%" valign="top">

### 🗺 نقشه و جست‌وجو
نمایش و انتخاب موقعیت با Leaflet و OpenStreetMap، جست‌وجوی آدرس با Nominatim (از طریق یک Route Handler سروری) و جست‌وجوی فارسی‌محور (نرمال‌سازی حروف و اعداد فارسی/عربی روی کلید جست‌وجو).

</td>
<td width="50%" valign="top">

### 👮 پنل‌های مدیریتی
داشبورد میزبان (درآمد کل، میانگین امتیاز، نمودار درآمد ۷/۳۰/۹۰ روزه و رزروها)، پنل ادمین (صف تأیید آگهی و احراز هویت، مدیریت چرخهٔ آگهی، صف «اعلام خسارت‌ها») و لاگ ممیز (Audit Log) برای کنش‌های حساس.

</td>
  </tr>
  <tr>
<td width="50%" valign="top">

### 📱 PWA
نصب روی اندروید، iOS و دسکتاپ بدون استور؛ Service Worker، Manifest و QR نصب در صفحهٔ `/install`.

</td>
<td width="50%" valign="top">

### 🧭 RTL و اعداد فارسی
چیدمان راست‌به‌چپ کامل با فونت وزیرمتن؛ ورودی‌های عددی با ارقام فارسی و جداکنندهٔ هزارگان (`input-guard.ts`) که پیش از ارسال به ارقام لاتین بازمی‌گردند.

</td>
  </tr>
</table>

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="screens"><img src="docs/assets/section-screens.svg" alt="نگاهی به اُوِرا" width="100%"></h2>

<div align="center">

<a href="docs/screenshots/home.webp"><img src="docs/assets/showcase-desktop.webp" alt="صفحهٔ اصلی اُوِرا در مرورگر دسکتاپ" width="100%"></a>

<br><br>

<a href="docs/screenshots/home-mobile.jpg"><img src="docs/assets/showcase-mobile.webp" alt="نسخهٔ موبایل اُوِرا: هیرو و فیلترها، کارت وسایل و بخش نصب اپلیکیشن" width="100%"></a>

<br><br>

<sub>روی هر تصویر کلیک کنید تا نسخهٔ کامل و تمام‌طول همان صفحه باز شود</sub>

<br><br>

<table>
  <tr>
<td width="50%" align="center"><a href="docs/screenshots/categories.webp"><img src="docs/assets/thumbs/categories.webp" alt="صفحهٔ دسته‌بندی‌ها" width="100%"></a><br><b>دسته‌بندی‌ها</b><br><sub>سرفصل‌های تخصصی، زیردسته‌ها و مزایای اجاره</sub></td>
<td width="50%" align="center"><a href="docs/screenshots/search-results.webp"><img src="docs/assets/thumbs/search-results.webp" alt="نتایج جست‌وجو" width="100%"></a><br><b>نتایج جست‌وجو</b><br><sub>جست‌وجوی فارسی‌محور؛ نمونه: «دوربین»</sub></td>
  </tr>
  <tr>
<td width="50%" align="center"><a href="docs/screenshots/item-details.webp"><img src="docs/assets/thumbs/item-details.webp" alt="جزئیات وسیله" width="100%"></a><br><b>جزئیات وسیله</b><br><sub>گالری، قیمت و ودیعه، تقویم شمسی، محدودهٔ تحویل روی نقشه و نظرات</sub></td>
<td width="50%" align="center"><a href="docs/screenshots/signin-otp.webp"><img src="docs/assets/thumbs/signin-otp.webp" alt="ورود با کد یک‌بارمصرف" width="100%"></a><br><b>ورود / ثبت‌نام</b><br><sub>ورود با کد یک‌بارمصرف (حالت دمو با برچسب شفاف)</sub></td>
  </tr>
  <tr>
<td width="50%" align="center"><a href="docs/screenshots/how-it-works.webp"><img src="docs/assets/thumbs/how-it-works.webp" alt="چگونه کار می‌کند" width="100%"></a><br><b>چگونه کار می‌کند؟</b><br><sub>راهنمای ۴ گامی اجاره، ضمانت‌ها و پرسش‌های متداول</sub></td>
<td width="50%" align="center"><a href="docs/screenshots/faq.webp"><img src="docs/assets/thumbs/faq.webp" alt="قوانین و پرسش‌های متداول" width="100%"></a><br><b>قوانین و پشتیبانی</b><br><sub>پرسش‌های متداول، جدول جریمهٔ لغو رزرو و خلاصهٔ مواد حقوقی</sub></td>
  </tr>
  <tr>
<td width="50%" align="center"><a href="docs/screenshots/about.webp"><img src="docs/assets/thumbs/about.webp" alt="دربارهٔ اُوِرا" width="100%"></a><br><b>دربارهٔ ما</b><br><sub>مأموریت، ارزش‌ها و مسیر رشد</sub></td>
<td width="50%" align="center"><a href="docs/screenshots/install-app.webp"><img src="docs/assets/thumbs/install-app.webp" alt="نصب اپلیکیشن" width="100%"></a><br><b>نصب اپلیکیشن (PWA)</b><br><sub>نصب مستقیم روی دستگاه یا اسکن QR</sub></td>
  </tr>
</table>

<div dir="rtl">

<sub>تصاویر بالا **نمای مهمان** (بدون ورود) هستند. صفحات پس از ورود — پنل میزبان، رزروها، کیف پول، چرخهٔ اجاره، اعلان‌ها و پنل مدیریت — را با حساب‌های دمو در بخش <a href="#run">اجرای پروژه</a> می‌توانید ببینید.</sub>

</div>

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="lifecycle"><img src="docs/assets/section-lifecycle.svg" alt="چرخهٔ اجاره" width="100%"></h2>

<div align="center">

<img src="docs/assets/lifecycle.svg" alt="نمودار انیمیشنی چرخهٔ اجاره: درخواست، تأیید، قرارداد، پرداخت، تحویل، فعال‌سازی، بازگشت، تکمیل" width="100%">

</div>

<div dir="rtl">

<br>

قلب اُوِرا `src/lib/rental-state.ts` است؛ **تنها منبع حقیقت** برای وضعیت‌ها، انتقال‌ها و اینکه هر کنش را کدام نقش می‌تواند انجام دهد. کنش‌های حساس (تأیید دریافت و تأیید بازگشت سالم) از مسیر عمومی `PATCH /api/reservations/[id]` رد می‌شوند و فقط با تأیید کد یک‌بارمصرف در `POST /api/reservations/[id]/otp/verify` انجام می‌گیرند.

| مرحلهٔ OTP | نقش مجاز | وضعیت لازم | نتیجهٔ تأیید |
| --- | --- | --- | --- |
| `AGREEMENT_SIGNATURE` | مستأجر | `REQUESTED` / `APPROVED` | امضای دیجیتال قرارداد |
| `DELIVERY_RECEIVED` | مستأجر | `DELIVERED` | `RENTAL_ACTIVE`، ثبت زمان شروع واقعی و کسر اجارهٔ روزانه از کیف پول (Sandbox) |
| `RETURN_RECEIVED` | میزبان | `RETURN_REQUESTED` | `COMPLETED`، آزادسازی خودکار ودیعه به کیف پول مستأجر (Sandbox) و ثبت نظر «اجارهٔ موفق» برای میزبان |

**قوانین امنیتی کد:** ۶ رقم با `crypto.randomInt` · هش scrypt و مقایسهٔ `timingSafeEqual` · اعتبار ۵ دقیقه · یک‌بارمصرف · حداکثر ۵ تلاش · فاصلهٔ ۶۰ ثانیه بین دو ارسال و حداکثر ۳ ارسال در ۱۵ دقیقه · صدور کد جدید همهٔ کدهای فعال قبلی را باطل می‌کند · شمارهٔ موبایل همیشه از نشست کاربر خوانده می‌شود، نه از ورودی کلاینت · کلیک هم‌زمان با گارد `updateMany` و خطای ۴۰۹ بی‌اثر می‌شود. جزئیات کامل: [`docs/TWO-STEP-CONFIRMATION.md`](docs/TWO-STEP-CONFIRMATION.md).

**مسیرهای انحرافی:** مستأجر می‌تواند هنگام تحویل کالای آسیب‌دیده را نپذیرد (`refuse_delivery`: لغو سفارش، بازگشت ودیعه و ثبت نظر «اجارهٔ ناموفق» برای میزبان). اعلام خسارت هنگام بازگشت (`declare_damage` توسط میزبان) یا وسط اجاره (`dispute`) پرونده را به `DISPUTED` می‌برد که فقط با رأی درصدی مدیر بسته می‌شود.

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="design"><img src="docs/assets/section-design.svg" alt="هویت بصری" width="100%"></h2>

<div align="center">

<img src="docs/assets/palette.svg" alt="پالت رنگی اُوِرا" width="100%">

</div>

<div dir="rtl">

<br>

هویت بصری اُوِرا یک **الزام انتشار** است، نه یک پیشنهاد: توکن‌ها در `src/app/globals.css` (بلوک `@theme` تیلویند ۴) نگهداری می‌شوند و مرجع کامل آن‌ها در [`docs/UI-DESIGN-BASELINE.md`](docs/UI-DESIGN-BASELINE.md) است.

| عنصر | مقدار |
| --- | --- |
| **فونت فارسی** | Vazirmatn (محلی، وزن‌های ۳۰۰ تا ۹۰۰) |
| **فونت لاتین / آیکون** | Plus Jakarta Sans · Material Symbols Outlined (هر دو محلی در `public/assets/fonts`) |
| **سایه‌ها** | `shadow-card` · `shadow-card-hover` · `shadow-glow` (بنفش) |
| **کارت وسیله** | `rounded-3xl`، تصویر با زوم هنگام هاور، قیمت `font-black` بنفش + «تومان / روز» |
| **رنگ لوگوتایپ** | `#801E76` (مجنتا)، مستقیماً در کامپوننت‌های هدر استفاده می‌شود |
| **جهت و زبان** | `lang="fa" dir="rtl"` روی ریشه؛ تقویم جلالی؛ ارقام فارسی |
| **تم Material 3** | خانوادهٔ `m3-*` برای ورود، ثبت‌نام، تنظیمات، داشبوردها و کیف پول |

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="stack"><img src="docs/assets/section-stack.svg" alt="استک فنی" width="100%"></h2>

<div dir="rtl">

| لایه | فناوری | نقش در پروژه |
| --- | --- | --- |
| **فریم‌ورک** | Next.js 16 (App Router) · React 19 | صفحات سروری، Route Handlerها، `proxy.ts` برای ریدایرکت مهمان‌ها و ۴۰۴ واقعی |
| **زبان** | TypeScript 5 | کدبیس تایپ‌شده (تایپ‌چک جدا با `bunx tsc --noEmit`) |
| **استایل** | Tailwind CSS 4 · tw-animate-css · tailwindcss-animate | توکن‌های طراحی و انیمیشن |
| **کامپوننت** | shadcn/ui روی Radix UI | دکمه، شیت، دراپ‌داون، دیالوگ، پاپ‌اور، تولتیپ، اسکلتون و… |
| **دیتابیس** | PostgreSQL 16 + Prisma ORM 6 | ۱۸ مدل، ۸ مایگریشن افزایشی |
| **احراز هویت** | سشن کوکی `httpOnly` (`overa_session`، ۳۰ روزه) · هش scrypt · OTP | سشن‌ها در جدول `Session`؛ بدون سرویس احراز هویت خارجی |
| **نمودار** | کد اختصاصی (بدون کتابخانهٔ نمودار) | نمودار درآمد میزبان در بازه‌های ۷/۳۰/۹۰ روز |
| **نقشه و QR** | Leaflet 1.9.4 + OpenStreetMap (از CDN) · Nominatim · `qrcode` | موقعیت وسایل، جست‌وجوی آدرس و QR نصب PWA |
| **UI تکمیلی** | Embla Carousel · Sonner | کاروسل هیرو و توست‌ها |
| **ران‌تایم و ابزار** | Bun (نصب، اجرا، تست، seed) · ESLint 9 | |
| **استقرار** | Docker چندمرحله‌ای (deps ← build ← runtime، کاربر غیرروت + healthcheck) · docker-compose · خروجی `standalone` | آمادهٔ Vercel / Neon یا سرور شخصی |

<br>

<div align="center">

<img src="https://img.shields.io/badge/Radix_UI-shadcn%2Fui-8B5CF6?style=flat-square&logo=radixui&logoColor=white" alt="Radix UI">
<img src="https://img.shields.io/badge/Leaflet-maps-10B981?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet">
<img src="https://img.shields.io/badge/OpenStreetMap-tiles-F5A623?style=flat-square&logo=openstreetmap&logoColor=white" alt="OpenStreetMap">
<img src="https://img.shields.io/badge/Vazirmatn-font-4C2A9E?style=flat-square" alt="Vazirmatn">
<img src="https://img.shields.io/badge/ESLint-9-3A1E7B?style=flat-square&logo=eslint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/Neon-ready-630ED4?style=flat-square" alt="Neon ready">
<img src="https://img.shields.io/badge/Vercel-ready-1F1B2E?style=flat-square&logo=vercel&logoColor=white" alt="Vercel ready">

</div>

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="langs"><img src="docs/assets/section-langs.svg" alt="زبان‌های برنامه‌نویسی" width="100%"></h2>

<div align="center">

<img src="docs/assets/languages.svg" alt="سهم زبان‌های برنامه‌نویسی: TSX، TypeScript، CSS، SQL، Prisma، Shell، JavaScript و Dockerfile" width="100%">

</div>

<div dir="rtl">

<br>

| زبان / فرمت | فایل | خط کد | سهم | کاربرد |
| --- | ---: | ---: | ---: | --- |
| **TSX** (React 19) | ۱۴۴ | ۴۰٬۹۳۳ | ۷۷٫۴٪ | صفحات، کامپوننت‌ها و کلاینت‌های هر صفحه (شامل ۵٬۳۹۹ خط کامپوننت‌های shadcn/ui) |
| **TypeScript** | ۶۷ | ۸٬۴۲۵ | ۱۵٫۹٪ | Route Handlerها، منطق دامنه (`src/lib`)، اسکریپت‌ها، تست‌ها و فایل‌های پیکربندی |
| **CSS** (Tailwind 4) | ۲ | ۲٬۱۳۱ | ۴٫۰٪ | توکن‌های طراحی، تم Material 3، انیمیشن‌ها و تعریف فونت‌ها |
| **SQL** (PostgreSQL) | ۸ | ۴۵۵ | ۰٫۹٪ | مایگریشن‌های Prisma |
| **Prisma Schema** | ۱ | ۴۳۳ | ۰٫۸٪ | مدل‌سازی ۱۸ جدول و روابط |
| **Shell** (Bash / sh) | ۶ | ۲۷۹ | ۰٫۵٪ | استقرار، entrypoint داکر، اجرای تست محیط |
| **JavaScript** | ۳ | ۱۵۳ | ۰٫۳٪ | Service Worker و فایل‌های پیکربندی |
| **Dockerfile** | ۱ | ۶۲ | ۰٫۱٪ | ایمیج تولید چندمرحله‌ای |

> 📌 جمعاً **حدود ۵۲٬۸۷۱ خط کد در ۲۳۲ فایل**؛ بدون احتساب `node_modules`، فایل‌های lock، تصاویر و مستندات. علاوه بر کد، پروژه حدود **۲٬۴۰۰ خط مستندات Markdown** (۱۶ فایل، به فارسی و انگلیسی) دارد. زبان رابط کاربری **فارسی** است و متن‌ها، پیام‌های خطا و اعلان‌ها همگی فارسی نوشته شده‌اند.

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="arch"><img src="docs/assets/section-arch.svg" alt="معماری و ساختار" width="100%"></h2>

<div dir="rtl">

### 🧱 معماری یک نگاه

صفحات به‌صورت پیش‌فرض **Server Component** هستند و مستقیماً با Prisma حرف می‌زنند؛ بخش‌های تعاملی (فیلتر، ویزارد، چت، کنش‌های چرخهٔ اجاره) کلاینت‌اند و از طریق REST با `src/app/api/*` صحبت می‌کنند. **احراز هویت و سطح دسترسی در تک‌تک Route Handlerها سمت سرور اعمال می‌شود**؛ پنهان‌کردن دکمه‌ها در رابط، صرفاً ظاهری است.

</div>

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#EDE7FF','primaryTextColor':'#1F1B2E','primaryBorderColor':'#4C2A9E','lineColor':'#8B5CF6','secondaryColor':'#FFF4DD','tertiaryColor':'#F5F0FF','fontFamily':'Vazirmatn, Tahoma, sans-serif'}}}%%
flowchart LR
    U(["👤 مرورگر / PWA<br/>مستأجر · میزبان · مدیر"]):::user
    subgraph NEXT["⚡ Next.js 16 — App Router"]
        direction TB
        P["proxy.ts<br/>ریدایرکت مهمان‌ها و ۴۰۴ واقعی"]:::core
        S["Server Components<br/>صفحات (main)"]:::core
        A["Route Handlers<br/>src/app/api/*"]:::core
        L["Domain Logic · src/lib<br/>rental-state · reservation-otp<br/>jalali · search · auth"]:::logic
    end
    DB[("🐘 PostgreSQL<br/>Prisma ORM")]:::db
    EXT["🗺 Leaflet / OSM · Nominatim<br/>📩 SMS (حالت دمو)"]:::ext
    U --> P --> S
    U -- "fetch / REST" --> A
    S --> L
    S --> DB
    A --> L
    L --> DB
    U -.-> EXT
    classDef user fill:#4C2A9E,stroke:#3A1E7B,color:#fff
    classDef core fill:#EDE7FF,stroke:#4C2A9E,color:#1F1B2E
    classDef logic fill:#FFF4DD,stroke:#F5A623,color:#1F1B2E
    classDef db fill:#10B981,stroke:#0B7A57,color:#fff
    classDef ext fill:#FDE7F3,stroke:#EC4899,color:#1F1B2E
```

<div dir="rtl">

### 🗃 مدل دادهٔ اصلی

</div>

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#EDE7FF','primaryTextColor':'#1F1B2E','primaryBorderColor':'#4C2A9E','lineColor':'#8B5CF6'}}}%%
erDiagram
    USER ||--o{ LISTING : "owns"
    USER ||--o{ RESERVATION : "rents / hosts"
    CATEGORY ||--o{ LISTING : "groups"
    LISTING ||--o{ LISTING_IMAGE : "has"
    LISTING ||--o{ RESERVATION : "booked as"
    LISTING ||--o{ REVIEW : "receives"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ FAVORITE : "saves"
    LISTING ||--o{ FAVORITE : "saved in"
    RESERVATION ||--o{ RESERVATION_EVENT : "audit trail"
    RESERVATION ||--o{ RESERVATION_OTP : "confirms with"
    RESERVATION ||--o{ DAMAGE_CLAIM : "may raise"
    RESERVATION |o--o| CONVERSATION : "chat"
    CONVERSATION ||--o{ MESSAGE : "contains"
    CONVERSATION ||--o{ CONVERSATION_PARTICIPANT : "joined by"
    USER ||--o{ CONVERSATION_PARTICIPANT : "takes part"
    USER ||--o{ WALLET_TRANSACTION : "ledger"
    USER ||--o{ NOTIFICATION : "gets"
    USER ||--o{ SESSION : "signs in"
```

<div dir="rtl">

<sub>جدول‌های دیگر: `OtpCode` (ورود با کد یک‌بارمصرف)، `AuditLog` (لاگ ممیز کنش‌های ادمین). تراکنش‌های کیف پول از طریق فیلد `reference` (کد رزرو، مثل `OVR-XXXXX`) به رزرو اشاره می‌کنند، نه با کلید خارجی.</sub>

### 📂 ساختار پروژه

</div>

```text
Overa/
├── prisma/
│   ├── schema.prisma            # ۱۸ مدل PostgreSQL
│   └── migrations/              # ۸ مایگریشن افزایشی
├── src/
│   ├── app/
│   │   ├── (main)/              # ۳۴ صفحه: خانه، دسته‌بندی‌ها، جزئیات وسیله، رزرو،
│   │   │                        #   کیف پول، چت، داشبوردها، پنل داوری، ...
│   │   ├── api/                 # ۲۹ Route Handler: auth, listings, reservations (+OTP),
│   │   │                        #   conversations, wallet, reviews, claims, admin, geo, ...
│   │   └── globals.css          # توکن‌های طراحی اُوِرا (Tailwind 4 @theme)
│   ├── components/
│   │   ├── overa/               # کامپوننت‌های دامنه: نقشه، امضا، OTP، تقویم جلالی، چت خسارت
│   │   ├── home/  layout/  search/  pwa/
│   │   └── ui/                  # shadcn/ui (Radix)
│   ├── lib/                     # منطق دامنه: rental-state, reservation-otp, jalali,
│   │                            #   persian, input-guard, search, auth, geo, qr, sms, ...
│   └── proxy.ts                 # جایگزین middleware در Next 16
├── scripts/                     # seed, create-admin, import-listings, backfill, reminders
├── tests/                       # ۶ مجموعه تست واحد (bun test) + اسکریپت‌های shell محیط
├── docs/                        # معماری، استقرار، مسیرها، PWA، تقویم جلالی، اسکرین‌شات‌ها
├── public/                      # فونت‌ها و تصاویر (assets/)، لوگو، manifest، sw.js
├── Dockerfile · docker-compose.yml · docker-entrypoint.sh
└── package.json · bun.lock · tsconfig.json · next.config.ts
```

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="run"><img src="docs/assets/section-run.svg" alt="اجرای پروژه" width="100%"></h2>

<div dir="rtl">

### ⚡ سریع‌ترین راه — Docker

برای دیدن اپ همراه با دادهٔ نمونه (فقط پیش‌نمایش محلی؛ هرگز روی سرور واقعی استفاده نشود):

</div>

```bash
git clone https://github.com/PariyaHeshmati-2005/Overa.git
cd Overa
docker compose -f docker-compose.yml -f docker-compose.preview.yml up -d --build
# اپ روی http://localhost:3000 بالا می‌آید؛ مایگریشن‌ها اجرا و دادهٔ دمو seed می‌شود
```

<div dir="rtl">

### 🛠 اجرای محلی (توسعه)

**پیش‌نیازها:** [Bun](https://bun.sh) ‏۱٫۳ یا بالاتر · Git · یک PostgreSQL در دسترس (مثلاً از طریق Docker)

</div>

```bash
# ۱) دریافت کد و نصب وابستگی‌ها
git clone https://github.com/PariyaHeshmati-2005/Overa.git
cd Overa
bun install

# ۲) یک PostgreSQL محلی (اختیاری — اگر ندارید)
docker run -d --name overa-db -p 5432:5432 \
  -e POSTGRES_USER=overa -e POSTGRES_PASSWORD=overa_pg_password -e POSTGRES_DB=overa \
  postgres:16-alpine

# ۳) متغیرهای محیطی
cp .env.example .env
# DATABASE_URL و DIRECT_URL را روی دیتابیس خودتان تنظیم کنید، مثلاً:
# postgresql://overa:overa_pg_password@localhost:5432/overa?sslmode=disable

# ۴) ساخت جدول‌ها و دادهٔ نمونه
bun run db:migrate:deploy
bun run seed

# ۵) اجرا 🎉
bun run dev          # → http://localhost:3000
```

<div dir="rtl">

### 👥 حساب‌های دمو

بعد از `bun run seed` (یا اجرای پیش‌نمایش Docker) این حساب‌ها ساخته می‌شوند. رمز عبور همهٔ حساب‌های نمونه: `overa1234`

| نقش | شمارهٔ موبایل | چه چیزهایی می‌بینید |
| --- | --- | --- |
| 🧑 مستأجر (سارا محمدی) | `09121111111` | اجاره‌ها، چت، کیف پول، ادعای خسارت |
| 🏠 میزبان (علی رضایی) | `09122222222` | پنل میزبان، وسایل من، نظرات، ویزارد ثبت وسیله |
| 👮 مدیر | `09120000000` | پنل مدیریت و پنل داوری |

پنج حساب میزبان دیگر (`09123333333` تا `09127777777`) هم با همان رمز ساخته می‌شوند.

> 🔑 تا زمانی که سرویس پیامک تنظیم نشود، ورود و تأیید با OTP در **حالت دمو** کار می‌کند: کد روی صفحه و با برچسب «حالت توسعه» نشان داده می‌شود. اسکریپت seed به‌طور پیش‌فرض از نوشتن روی دیتابیس غیرمحلی خودداری می‌کند.

### 🔧 متغیرهای محیطی

| متغیر | الزامی؟ | توضیح |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | رشتهٔ اتصال PostgreSQL برای Prisma |
| `DIRECT_URL` | ✅ | اتصال مستقیم برای مایگریشن‌ها (روی Neon/Supabase با pooler مهم است) |
| `NEXT_PUBLIC_SITE_URL` | در تولید | آدرس عمومی سایت؛ QR نصب PWA از آن ساخته می‌شود (روی Vercel در غیاب آن از `VERCEL_URL` استفاده می‌شود) |
| `SMS_PROVIDER_API_KEY` | ❌ | خالی = OTP در حالت دمو؛ برای پیامک واقعی آداپتور `src/lib/sms.ts` را کامل کنید |
| `SMS_SENDER_NUMBER` | ❌ | شمارهٔ فرستندهٔ ارائه‌دهندهٔ پیامک؛ هنگام کامل‌کردن آداپتور استفاده می‌شود |
| `SEED_DEMO` | ❌ | `1` = seed دادهٔ دمو در entrypoint داکر (پیش‌فرض خاموش و امن برای تولید) |
| `OVERA_SEED_ALLOW_REMOTE` | ❌ | `1` = اجازهٔ seed روی دیتابیس غیرمحلی؛ فقط در پیش‌نمایش محلی داکر تنظیم می‌شود، روی سرور واقعی هرگز |
| `ADMIN_PHONE` / `ADMIN_PASSWORD` | ❌ | ساخت/ارتقای اولین ادمین هنگام راه‌اندازی (شمارهٔ `09XXXXXXXXX`، رمز حداقل ۸ نویسه)؛ `ADMIN_NAME` و `ADMIN_EMAIL` اختیاری‌اند |

> اسکریپت‌های `bun run …` در صورت وجود فایل `.env.local` آن را بارگذاری می‌کنند و بر متغیرهای محیطیِ سیستم اولویت دارد.

### 🧰 دستورهای کاربردی

| دستور | کار |
| --- | --- |
| `bun run dev` | `prisma generate` و اجرای سرور توسعه روی پورت ۳۰۰۰ (لاگ در `dev.log`) |
| `bun run build` | `prisma generate` ← `next build` ← کپی `static` و `public` در خروجی standalone ← اعمال مایگریشن‌ها (در صورت تنظیم `DATABASE_URL`) |
| `bun run start` | اعمال مایگریشن‌ها و اجرای `.next/standalone/server.js` |
| `bun run db:migrate` · `db:migrate:deploy` | ساخت مایگریشن جدید · اعمال مایگریشن‌ها (امن برای تولید) |
| `bun run db:push` · `db:generate` · `db:reset` | همگام‌سازی سریع اسکیما · تولید Prisma Client · ریست کامل دیتابیس (⚠️ مخرب) |
| `bun run seed` · `db:seed:categories` | دادهٔ دمو · فقط ۸ دسته‌بندی (ایمن برای هر دیتابیس) |
| `bun run db:import` · `db:coords` | درون‌ریزی آگهی‌های قدیمی · پر کردن مختصات نقشه |
| `bun run reminders` | اجرای دستی جاروی یادآورهای تحویل/بازگشت |
| `bun run scripts/create-admin.ts` | ساخت/ارتقای ادمین (با `ADMIN_PHONE` و `ADMIN_PASSWORD`) |
| `bun test` · `bun run lint` · `bunx tsc --noEmit` | تست، لینت و تایپ‌چک |

### 🐳 استقرار با Docker (تولید)

</div>

```bash
ADMIN_PHONE=09120000000 ADMIN_PASSWORD='یک-رمز-قوی' docker compose up -d --build
docker compose logs -f app     # دنبال کردن لاگ‌ها
docker compose down            # توقف (داده‌ها در والیوم overa_pg می‌مانند)
```

<div dir="rtl">

ایمیج چندمرحله‌ای است (deps ← build ← runtime)، با کاربر غیرروت و healthcheck. در هر بار اجرا، `entrypoint` مایگریشن‌ها را به‌صورت **غیرمخرب** (`migrate deploy`) اعمال می‌کند و دادهٔ دمو فقط با `SEED_DEMO=1` نوشته می‌شود. راهنمای کامل استقرار روی Vercel و Neon: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) و [`docs/NEON-MIGRATION.md`](docs/NEON-MIGRATION.md).

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="quality"><img src="docs/assets/section-quality.svg" alt="تست و کیفیت" width="100%"></h2>

<div dir="rtl">

بیش از **۷۰ تست واحد** با `bun test` در ۶ مجموعه، منطقِ حساس را پوشش می‌دهند:

| مجموعهٔ تست | چه چیزی را می‌سنجد |
| --- | --- |
| `rental-state.test.ts` | مسیر موفق (جریان دوطرفهٔ OTP) و مسیر قدیمی، `refuse_delivery`، پرش‌های نامعتبر، نقش مجاز هر کنش، کنش‌های فقط‌OTP |
| `reservation-otp.test.ts` | صدور کد ۶ رقمی (ذخیرهٔ هش‌شده)، فاصلهٔ ۶۰ ثانیه، سقف ۳ ارسال در ۱۵ دقیقه، ابطال کدهای قبلی، استقلال مراحل، مصرف یک‌باره و ابطال پس از ۵ تلاش اشتباه |
| `jalali.test.ts` | تبدیل تاریخ شمسی ↔ میلادی، سال کبیسه، طول ماه‌ها، جمع و تفاضل روز، روز هفته، بازه‌های رزروشده و مسدود |
| `persian.test.ts` | یکسان‌سازی ی/ک عربی و فارسی، حذف نیم‌فاصله، اعراب و کشیده، تبدیل ارقام فارسی/عربی، فاصله‌ها |
| `input-guard.test.ts` | تبدیل ارقام فارسی/عربی به لاتین، فقط ارقام مثبت، حفظ صفر ابتدایی در تلفن، OTP و کد ملی |
| `rental-reminders.test.ts` | یادآورهای ۲ روز و ۱ روز مانده و روز موعد، تأخیر روزانه با شمارندهٔ فارسی، جلوگیری از یادآور تکراری |

</div>

```bash
bun test              # تست‌های واحد
bun run lint          # ESLint
bunx tsc --noEmit     # تایپ‌چک کامل
```

<div dir="rtl">

> ⚠️ `next build` طبق `next.config.ts` خطاهای TypeScript را نادیده می‌گیرد (`ignoreBuildErrors`)؛ پس تایپ‌چک را پیش از انتشار جداگانه اجرا کنید.

</div>

<div align="center"><img src="docs/assets/divider.svg" alt="" width="70%"></div>

<h2 id="docs"><img src="docs/assets/section-docs.svg" alt="مستندات و نقشهٔ راه" width="100%"></h2>

<div dir="rtl">

### 📚 مستندات

| فایل | موضوع |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | تصمیم‌های معماری، جریان داده، سشن و دسترسی، ماشین‌حالت |
| [`docs/ROUTES-AND-PAGES.md`](docs/ROUTES-AND-PAGES.md) | نقشهٔ کامل صفحات و سطح API |
| [`docs/TWO-STEP-CONFIRMATION.md`](docs/TWO-STEP-CONFIRMATION.md) | تأیید دوطرفهٔ تحویل و بازگشت با OTP |
| [`docs/JALALI-CALENDAR-AND-FILTER.md`](docs/JALALI-CALENDAR-AND-FILTER.md) | معماری تقویم شمسی و فیلترهای صفحهٔ اصلی |
| [`docs/UI-DESIGN-BASELINE.md`](docs/UI-DESIGN-BASELINE.md) | توکن‌های طراحی و هویت بصری |
| [`docs/PWA.md`](docs/PWA.md) | جزئیات Progressive Web App |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/NEON-MIGRATION.md`](docs/NEON-MIGRATION.md) | استقرار و مهاجرت دیتابیس |
| [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) · [`docs/DELIVERY-REPORT.md`](docs/DELIVERY-REPORT.md) · [`docs/PHASE-HANDOFF.md`](docs/PHASE-HANDOFF.md) | گزارش‌های وضعیت، تحویل و انتقال فاز |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) · [`CHANGES.md`](CHANGES.md) | تاریخچهٔ تغییرات |
| [`AGENTS.md`](AGENTS.md) | قراردادهای کدنویسی و قوانین حفظ هویت بصری (برای توسعه‌دهندگان و ابزارهای کدنویسی) |

### ⚠️ محدودیت‌های شناخته‌شده

این موارد **عمداً و آشکارا** در خود اپ هم برچسب خورده‌اند — اُوِرا هیچ ادعای جعلی دربارهٔ پول یا هویت واقعی نمی‌کند:

- **پرداخت، ودیعه و امانی شبیه‌سازی‌شده (Sandbox)** هستند؛ درگاه واقعی پرداخت متصل نیست.
- **OTP** تا زمان تنظیم `SMS_PROVIDER_API_KEY` فقط در حالت دمو (نمایش کد روی صفحه) کار می‌کند.
- **سفتهٔ دیجیتال:** صفحات `/promissory-notes` فقط راهنمای فرآیند هستند و سند واقعی صادر نمی‌کنند؛ امضای قرارداد فقط با OTP انجام می‌شود.
- **تخفیف‌ها:** صفحهٔ `/discounts` نمایشی است؛ کوپن‌ها ثابت‌اند و صدور کوپن توسط میزبان هنوز API ندارد.
- **آمار و محتوای معرفی:** اعدادی مثل تعداد کاربران و اجاره‌ها در صفحات «دربارهٔ ما» و «دسته‌بندی‌ها» متن نمایشی ثابت‌اند و از دیتابیس نمی‌آیند.
- **تقویم شمسی** فعلاً فقط ماه‌های سال ۱۴۰۵ را نشان می‌دهد (`JALALI_YEAR_LOCK` در `src/lib/jalali.ts`)؛ برای پشتیبانی از سال‌های بعد باید این قفل برداشته شود.
- **تصاویر آپلودی** در `public/uploads` ذخیره می‌شوند؛ برای تولید، انتقال به Object Storage ابری توصیه می‌شود.
- **نقشه‌ها** Leaflet و کاشی‌های OpenStreetMap از CDN هستند؛ بدون اینترنت به کارت مختصات برمی‌گردند.
- **چت** به‌جای WebSocket از polling سبک (هر ۴ ثانیه) استفاده می‌کند (سازگار با Vercel) و گفتگوی پروندهٔ خسارت فقط متنی است.

### 🗺 نقشهٔ راه

- [ ] اتصال ارائه‌دهندهٔ پیامک واقعی برای OTP
- [ ] اتصال درگاه پرداخت (Sandbox → Production) با webhook امضاشده و idempotency
- [ ] انتقال آپلودها به Object Storage و اعتبارسنجی پیوست‌ها
- [ ] ارتقای چت به سرویس realtime مدیریت‌شده
- [ ] پیاده‌سازی واقعی کوپن تخفیف (مدل دیتابیس و API)
- [ ] احراز هویت (KYC) با ارائه‌دهندهٔ واقعی و ذخیرهٔ امن مدارک
- [ ] خط CI (lint ← تایپ‌چک ← تست ← بیلد) روی GitHub Actions

</div>

<br>

<div align="center">

<img src="docs/assets/footer.svg" alt="اُوِرا — وسایل بهتر، زندگی سبک‌تر" width="100%">

</div>
