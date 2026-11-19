/**
 * Languages. English lives at the plain address (/pricing); Urdu and Arabic get a prefix (/ur/pricing, /ar/pricing).
 * To add a language: add it here, add its dictionary in ui.ts, and its content files in src/content/i18n/.
 */
export const LANGS = ["en", "ur", "ar"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
export const asLang = (v: unknown): Lang => (isLang(v) ? v : DEFAULT_LANG);

export const dirOf = (lang: Lang) => (lang === "en" ? "ltr" : "rtl");
export const langName: Record<Lang, string> = { en: "English", ur: "اردو", ar: "العربية" };
export const ogLocale: Record<Lang, string> = { en: "en_US", ur: "ur_PK", ar: "ar_AR" };
export const LANG_COOKIE = "qa_lang";

/** Guides (blog) and the policy pages exist in English only. */
export const englishOnly = (path: string) => path === "/blog" || path.startsWith("/blog/") || ["/privacy-policy", "/terms", "/refund-policy"].includes(path);

/** Address of a public page in a language. English-only pages always get the plain address. */
export function href(lang: Lang, path: string): string {
  if (!path.startsWith("/") || lang === "en" || englishOnly(path)) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Splits a browser path into language and the plain path, e.g. "/ur/pricing" -> ["ur", "/pricing"]. */
export function splitPath(pathname: string): [Lang, string] {
  const m = pathname.match(/^\/(ur|ar)(\/.*)?$/);
  if (m) return [m[1] as Lang, m[2] || "/"];
  return ["en", pathname || "/"];
}
