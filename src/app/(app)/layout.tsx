import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/cormorant-garamond/index.css";
import "@fontsource-variable/noto-naskh-arabic/index.css";
import "../globals.css";
import { site } from "@/content/site";
import { LANG_COOKIE, asLang, dirOf } from "@/i18n";

/** Root layout for everything behind a login: the admin panel and the student, parent and teacher dashboards. */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.shortName}` },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#123D32", width: "device-width", initialScale: 1 };

export default async function AppRoot({ children }: { children: React.ReactNode }) {
  const lang = asLang((await cookies()).get(LANG_COOKIE)?.value);
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <body className="app">{children}</body>
    </html>
  );
}
