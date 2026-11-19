import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { courses } from "@/content/courses";
import { landings } from "@/content/pages";
import { legals } from "@/content/legal";
import { publishedPosts } from "@/lib/cms";
import { abs, absIn } from "@/lib/seo";
import { LANGS } from "@/i18n";

// Guides are added in the admin panel, so the list is rebuilt every five minutes.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await publishedPosts()).filter((p) => !p.noindex);
  const last = site.lastUpdated;
  type Entry = MetadataRoute.Sitemap[number];

  /** A page that exists in English, Urdu and Arabic: one entry per language, each listing the others. */
  const multi = (path: string, priority: number): Entry[] =>
    LANGS.map((lang) => ({
      url: absIn(lang, path),
      lastModified: last,
      changeFrequency: "monthly",
      priority: lang === "en" ? priority : Math.round(priority * 8) / 10,
      alternates: { languages: { ...Object.fromEntries(LANGS.map((l) => [l, absIn(l, path)])), "x-default": abs(path) } },
    }));
  /** A page that exists in English only. */
  const single = (path: string, priority: number, lastModified = last): Entry => ({ url: abs(path), lastModified, changeFrequency: "monthly", priority });

  return [
    ...multi("/", 1),
    ...multi("/free-trial", 0.9),
    ...multi("/pricing", 0.9),
    ...multi("/courses", 0.9),
    ...courses.flatMap((c) => multi(`/courses/${c.slug}`, 0.8)),
    ...landings.flatMap((l) => multi(`/${l.slug}`, 0.9)),
    ...multi("/about", 0.6),
    ...multi("/faq", 0.7),
    ...multi("/contact", 0.5),
    single("/blog", 0.7),
    ...posts.map((p) => single(`/blog/${p.slug}`, p.kind === "pillar" ? 0.8 : 0.7, p.updatedAt.slice(0, 10))),
    ...legals.map((l) => single(`/${l.slug}`, 0.2)),
  ];
}
