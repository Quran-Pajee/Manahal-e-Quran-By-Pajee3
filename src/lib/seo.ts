import type { Metadata } from "next";
import { site } from "@/content/site";
import { LANGS, href, ogLocale, type Lang } from "@/i18n";

/** Public SEO origin: use the academy subdomain consistently. */
export const SEO_ORIGIN = "https://quran.pajee.org";
export const abs = (path = "/") => new URL(path.startsWith("/") ? path : `/${path}`, `${SEO_ORIGIN}/`).toString().replace(/\/$/, path === "/" ? "" : "/");

/** Full address of a page in a language. */
export const absIn = (lang: Lang, path: string) => abs(href(lang, path));

export function meta(opts: {
  lang?: Lang;
  title: string;
  description: string;
  /** The plain path, without a language prefix, e.g. "/pricing". */
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
  absoluteTitle?: boolean;
  /** False for pages that exist in English only (guides, policies). */
  translated?: boolean;
  /** Replaces the default language links, used by country pages which also have regional English versions. */
  languages?: Record<string, string>;
  published?: string;
  modified?: string;
  /** A different canonical address, when a page is a copy of another. */
  canonical?: string;
  /** A picture for social sharing, instead of the site's standard one. */
  image?: string;
}): Metadata {
  const lang = opts.lang ?? "en";
  const url = absIn(lang, opts.path);
  const translated = opts.translated ?? true;
  const languages = opts.languages ?? (translated
    ? { ...Object.fromEntries(LANGS.map((l) => [l, absIn(l, opts.path)])), "x-default": abs(opts.path) }
    : { en: abs(opts.path), "x-default": abs(opts.path) });
  return {
    metadataBase: new URL(SEO_ORIGIN),
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: opts.canonical ? new URL(opts.canonical, SEO_ORIGIN).toString() : url, languages },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: site.name,
      locale: ogLocale[lang],
      type: opts.type ?? "website",
      images: opts.image ? [{ url: opts.image }] : [{ url: abs("/opengraph-image"), width: 1200, height: 630, alt: site.name }],
      ...(opts.type === "article" ? { publishedTime: opts.published, modifiedTime: opts.modified } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [opts.image || abs("/opengraph-image")] },
  };
}

type MetaOptions = Parameters<typeof meta>[0];
/**
 * The same as meta(), but first looks for search settings saved for this page in the admin panel (SEO > Pages).
 * A saved title or description replaces the built-in one; "hide from search engines" adds noindex.
 */
export async function pageMeta(opts: MetaOptions): Promise<Metadata> {
  const { pageSeo } = await import("./cms");
  const saved = await pageSeo(opts.path, opts.lang ?? "en").catch(() => null);
  if (!saved) return meta(opts);
  return meta({ ...opts, title: saved.title || opts.title, absoluteTitle: saved.title ? true : opts.absoluteTitle, description: saved.description || opts.description, noindex: saved.noindex || opts.noindex });
}

const dateLocale: Record<Lang, string> = { en: "en-US", ur: "ur-PK-u-nu-latn", ar: "ar-u-nu-latn" };
export const longDate = (iso: string, lang: Lang = "en") =>
  new Date(iso + "T00:00:00Z").toLocaleDateString(dateLocale[lang], { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
