import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Pages compose their own header/footer (the source pages have
  // page-specific headers). This wrapper only guarantees full-height flex
  // layout and the sticky-footer behaviour.
  return <div className="min-h-screen flex flex-col">{children}</div>;
}
