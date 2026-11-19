import { checkSchemaJson, pageSeo } from "@/lib/cms";
import { JsonLd } from "./JsonLd";
import type { Lang } from "@/i18n";

/** Extra schema markup saved for one page in the admin panel (SEO > Pages). Renders nothing when none is saved. */
export async function PageSchema({ lang, path }: { lang: Lang; path: string }) {
  const saved = await pageSeo(path, lang).catch(() => null);
  if (!saved?.schemaJson) return null;
  const checked = checkSchemaJson(saved.schemaJson);
  if (!checked.ok || !checked.value) return null;
  // The admin editor accepts a single schema object or a list of objects.
  // Existing page views already render the built-in Course and FAQPage schemas,
  // while SiteShell renders EducationalOrganization on every public page.
  const items = Array.isArray(checked.value) ? checked.value : [checked.value];
  const valid = items.filter((item): item is Record<string, unknown> =>
    !!item && typeof item === "object" && !Array.isArray(item) &&
    (typeof (item as Record<string, unknown>)["@type"] === "string" ||
      Array.isArray((item as Record<string, unknown>)["@graph"])),
  );
  if (!valid.length) return null;
  return <JsonLd data={valid.map((item) => ({ "@context": "https://schema.org", ...item }))} />;
}
