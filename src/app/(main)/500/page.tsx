import SiteHeader from "@/components/layout/SiteHeader";
import ErrorContent from "@/components/overa/ErrorContent";

export const metadata = { title: "خطای داخلی سرور" };

/** Direct URL access to the 500 design (same markup as the global error). */
export default function ServerErrorPage() {
  return (
    <>
      <SiteHeader />
      <ErrorContent />
    </>
  );
}
