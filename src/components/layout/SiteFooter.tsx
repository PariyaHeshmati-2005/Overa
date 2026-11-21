import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-12 bg-white border-t border-purple-100 py-8 text-neutral-muted text-xs">
      <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white overflow-hidden">
            <img
              src="/assets/img/overa_logo_transparent.png"
              alt="اورا"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-neutral-text">
            پلتفرم اجاره وسایل اورا (Overa)
          </span>
          <span className="">— تمامی حقوق محفوظ است ۱۴۰۵</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <Link className="hover:text-primary transition-colors" href="/tos-support-faq">
            قوانین و مقررات
          </Link>
          <Link className="hover:text-primary transition-colors" href="/tos-support-faq">
            حفظ حریم خصوصی
          </Link>
          <Link className="hover:text-primary transition-colors" href="/tos-support-faq">
            راهنمای اعتماد و امنیت
          </Link>
          <Link className="hover:text-primary transition-colors" href="/tos-support-faq">
            پرسش‌های متداول
          </Link>
        </div>
      </div>
    </footer>
  );
}
