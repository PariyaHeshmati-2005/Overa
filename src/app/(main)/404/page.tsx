import NotFoundContent from "@/components/overa/NotFoundContent";

export const metadata = { title: "صفحه مورد نظر پیدا نشد" };

/** Direct URL access to the 404 design (same markup as the global not-found). */
export default function NotFoundPage() {
  return <NotFoundContent />;
}
