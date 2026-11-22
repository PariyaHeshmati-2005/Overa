import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TosFaqApp from "./TosFaqApp";

export const metadata = {
  title: "قوانین و پرسش‌های متداول",
  description: "مرکز شفافیت، قوانین و سوالات متداول اٌوِرا",
};

export default function TosSupportFaqPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex-1 bg-m3-surface text-on-surface antialiased">
        <div
          className="w-full max-w-[1240px] mx-auto px-6 lg:px-10 py-5 flex flex-col"
          style={{ fontFamily: '"Vazirmatn"' }}
        >
          <TosFaqApp />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
