import { courses } from "@/content/courses";
import { landings } from "@/content/pages";
import { legals } from "@/content/legal";

/** Every built-in page of the public site, for the SEO screen in the admin panel. Guides have their own settings under Content. */
export type SitePage = { path: string; name: string; group: string; translated: boolean };

export function sitePages(): SitePage[] {
  return [
    { path: "/", name: "Home", group: "Main pages", translated: true },
    { path: "/courses", name: "All courses", group: "Main pages", translated: true },
    { path: "/pricing", name: "Fees", group: "Main pages", translated: true },
    { path: "/free-trial", name: "Free trial", group: "Main pages", translated: true },
    { path: "/about", name: "About", group: "Main pages", translated: true },
    { path: "/faq", name: "Questions", group: "Main pages", translated: true },
    { path: "/contact", name: "Contact", group: "Main pages", translated: true },
    { path: "/blog", name: "Guides (list)", group: "Main pages", translated: false },
    ...courses.map((c) => ({ path: `/courses/${c.slug}`, name: c.name, group: "Course pages", translated: true })),
    ...landings.filter((l) => l.kind === "country").map((l) => ({ path: `/${l.slug}`, name: `Classes in ${l.country?.name ?? l.nav}`, group: "Country pages", translated: true })),
    ...landings.filter((l) => l.kind !== "country").map((l) => ({ path: `/${l.slug}`, name: l.nav, group: "Audience pages", translated: true })),
    ...legals.map((l) => ({ path: `/${l.slug}`, name: l.title, group: "Policy pages", translated: false })),
  ];
}
