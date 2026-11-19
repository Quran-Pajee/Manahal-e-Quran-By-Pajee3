import type { Metadata } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/cormorant-garamond/index.css";
import "@fontsource-variable/noto-naskh-arabic/index.css";
import "@/app/globals.css";
import { site } from "@/content/site";
import { JsonLd } from "@/components/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Attribution } from "@/components/Attribution";
import { Tracking } from "@/components/Tracking";
import { LANG_COOKIE, dirOf, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

export function siteMetadata(lang: Lang): Metadata {
  return {
    metadataBase: new URL(site.url),
    title: { default: ui[lang].home.metaTitle(site.name), template: `%s | ${site.shortName}` },
    description: ui[lang].footer.description,
    applicationName: site.name,
    formatDetection: { telephone: false },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
    },
  };
}

/** The whole page frame of the public site in one language: <html>, header, footer and tracking. */
export function SiteShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <body>
        <Header lang={lang} />
        <main id="main">{children}</main>
        <Footer lang={lang} />
        {/* keeps the fixed phone bar from covering the end of the footer */}
        <div className="h-[4.25rem] bg-emerald sm:hidden" aria-hidden="true" />
        <MobileCta lang={lang} />
        <Attribution />
        <Tracking lang={lang} />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {/* Remembers the visitor's language so the login and dashboards open in it */}
        <script dangerouslySetInnerHTML={{ __html: `document.cookie="${LANG_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax"` }} />
      </body>
    </html>
  );
}
