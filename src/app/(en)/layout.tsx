import type { Viewport } from "next";
import { SiteShell, siteMetadata } from "@/views/SiteShell";
import { SEO_ORIGIN, absIn } from "@/lib/seo";

export const metadata = {
  ...siteMetadata("en"),
  metadataBase: new URL(SEO_ORIGIN),
  alternates: {
    canonical: absIn("en", "/"),
    languages: { en: absIn("en", "/"), ur: absIn("ur", "/"), ar: absIn("ar", "/"), "x-default": absIn("en", "/") },
  },
};
export const viewport: Viewport = { themeColor: "#123D32", width: "device-width", initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  // SiteShell owns the document <html lang="en" dir="ltr"> element.
  return <SiteShell lang="en">{children}</SiteShell>;
}
