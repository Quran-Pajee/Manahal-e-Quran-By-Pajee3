import { revalidatePath } from "next/cache";
import { q, one, storageMode } from "./db";
import { library, type LibraryPost } from "@/content/library";
import type { Faq } from "@/content/types";

/**
 * Database-backed multilingual content. All bootstrap posts are inserted by
 * migrations/0001_neon_bootstrap.sql; reads never write or migrate the database.
 * Existing editor actions keep working with English as their default language.
 */
export type CmsLang = "en" | "ur" | "ar";
export const CMS_LANGUAGES: readonly CmsLang[] = ["en", "ur", "ar"];
export type PostKind = "article" | "pillar" | "cluster";
export type PostStatus = "draft" | "published";
export const SCHEMA_TYPES = ["BlogPosting", "Article", "HowTo", "None"] as const;

export type Post = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  status: PostStatus;
  kind: PostKind;
  parentId: string | null;
  slug: string;
  title: string;
  excerpt: string;
  answer: string;
  body: string;
  faqs: Faq[];
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonical: string;
  noindex: boolean;
  ogImage: string;
  schemaType: string;
  schemaJson: string;
  author: string;
  updatedBy: string;
  lang: CmsLang;
};

const fromLibrary = (p: LibraryPost): Post => ({
  id: `seed-${p.slug}`,
  createdAt: `${p.date}T00:00:00.000Z`,
  updatedAt: `${p.updated}T00:00:00.000Z`,
  publishedAt: `${p.date}T00:00:00.000Z`,
  status: "published",
  kind: p.kind,
  parentId: p.pillar ? `seed-${p.pillar}` : null,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  answer: p.answer,
  body: p.body,
  faqs: p.faqs,
  seoTitle: p.seoTitle,
  seoDescription: p.seoDescription,
  focusKeyword: p.focusKeyword,
  canonical: "",
  noindex: false,
  ogImage: "",
  schemaType: "BlogPosting",
  schemaJson: "",
  author: "",
  updatedBy: "",
  lang: "en",
});

/** Static English guides remain an emergency fallback when Postgres is unavailable. */
export const libraryPosts = (): Post[] => library.map(fromLibrary);
type PostRow = Omit<Post, "faqs"> & { faqs: string; lang: string };
const parse = (r: PostRow): Post => {
  let faqs: Faq[] = [];
  try {
    const raw: unknown = JSON.parse(r.faqs || "[]");
    if (Array.isArray(raw)) faqs = raw.filter((f): f is Faq => f !== null && typeof f === "object" && typeof f.q === "string" && typeof f.a === "string");
  } catch {
    // Corrupt/older FAQ data should not take a published page offline.
  }
  return { ...r, faqs, noindex: Boolean(r.noindex), lang: validLang(r.lang) ? r.lang : "en" };
};
const validLang = (v: string): v is CmsLang => (CMS_LANGUAGES as readonly string[]).includes(v);
const stored = () => storageMode() !== "none";
const refreshEverything = () => revalidatePath("/", "layout");

/* ---------- public guides: read-only, language aware ---------- */

export async function publishedPosts(lang: CmsLang = "en"): Promise<Post[]> {
  if (!stored()) return lang === "en" ? libraryPosts() : [];
  try {
    return (await q<PostRow>(`select * from cms_posts where status = 'published' and lang = $1 order by published_at desc nulls last limit 1000`, [lang])).map(parse);
  } catch (e) {
    console.error("[cms] guides unavailable, using built-in English copies:", (e as Error)?.message);
    return lang === "en" ? libraryPosts() : [];
  }
}

export async function publishedPost(slug: string, lang: CmsLang = "en"): Promise<Post | null> {
  return (await publishedPosts(lang)).find((p) => p.slug === slug) ?? null;
}

/** A pillar with its cluster pages, or a cluster with its pillar and sibling pages. */
export function family(all: Post[], post: Post): { pillar: Post | null; clusters: Post[] } {
  if (post.kind === "pillar") return { pillar: post, clusters: all.filter((p) => p.parentId === post.id).sort((a, b) => a.title.localeCompare(b.title)) };
  const pillar = post.parentId ? (all.find((p) => p.id === post.parentId) ?? null) : null;
  return { pillar, clusters: pillar ? all.filter((p) => p.parentId === pillar.id && p.id !== post.id).sort((a, b) => a.title.localeCompare(b.title)) : [] };
}

/* ---------- admin guide operations: English by default for existing UI ---------- */

export async function allPosts(lang: CmsLang = "en"): Promise<Post[]> {
  if (!stored()) return [];
  return (await q<PostRow>(`select * from cms_posts where lang = $1 order by updated_at desc limit 2000`, [lang])).map(parse);
}
export async function getPost(id: string): Promise<Post | null> {
  if (!stored()) return null;
  const r = await one<PostRow>(`select * from cms_posts where id = $1`, [id]);
  return r ? parse(r) : null;
}
export async function slugTaken(slug: string, exceptId = "", lang: CmsLang = "en"): Promise<boolean> {
  return Boolean(await one(`select 1 as x from cms_posts where slug = $1 and id <> $2 and lang = $3`, [slug, exceptId, lang]));
}

export type PostInput = Pick<Post, "kind" | "parentId" | "slug" | "title" | "excerpt" | "answer" | "body" | "faqs" | "seoTitle" | "seoDescription" | "focusKeyword" | "canonical" | "noindex" | "ogImage" | "schemaType" | "schemaJson">;

/** Pass lang = 'ur' or 'ar' for a translated article without changing old callers. */
export async function createPost(id: string, n: PostInput, by: string, lang: CmsLang = "en"): Promise<void> {
  await q(
    `insert into cms_posts (id, kind, parent_id, slug, title, excerpt, answer, body, faqs, seo_title, seo_description, focus_keyword, canonical, noindex, og_image, schema_type, schema_json, author, updated_by, lang)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18,$19)`,
    [id, n.kind, n.parentId, n.slug, n.title, n.excerpt, n.answer, n.body, JSON.stringify(n.faqs), n.seoTitle, n.seoDescription, n.focusKeyword, n.canonical, n.noindex, n.ogImage, n.schemaType, n.schemaJson, by, lang],
  );
  refreshEverything();
}
export async function updatePost(id: string, n: PostInput, by: string): Promise<void> {
  await q(
    `update cms_posts set kind = $2, parent_id = $3, slug = $4, title = $5, excerpt = $6, answer = $7, body = $8, faqs = $9, seo_title = $10, seo_description = $11, focus_keyword = $12,
       canonical = $13, noindex = $14, og_image = $15, schema_type = $16, schema_json = $17, updated_by = $18, updated_at = $19 where id = $1`,
    [id, n.kind, n.parentId, n.slug, n.title, n.excerpt, n.answer, n.body, JSON.stringify(n.faqs), n.seoTitle, n.seoDescription, n.focusKeyword, n.canonical, n.noindex, n.ogImage, n.schemaType, n.schemaJson, by, new Date().toISOString()],
  );
  if (n.kind !== "pillar") await q(`update cms_posts set parent_id = null where parent_id = $1`, [id]);
  refreshEverything();
}
export async function setPostStatus(id: string, status: PostStatus, by: string): Promise<void> {
  const now = new Date().toISOString();
  if (status === "published") await q(`update cms_posts set status = 'published', published_at = coalesce(published_at, $2), updated_at = $2, updated_by = $3 where id = $1`, [id, now, by]);
  else await q(`update cms_posts set status = 'draft', updated_at = $2, updated_by = $3 where id = $1`, [id, now, by]);
  refreshEverything();
}
export async function deletePost(id: string): Promise<void> {
  await q(`update cms_posts set parent_id = null where parent_id = $1`, [id]);
  await q(`delete from cms_posts where id = $1`, [id]);
  refreshEverything();
}

/* ---------- SEO settings for all existing public routes, in en / ur / ar ---------- */

export type PageSeo = { path: string; lang: string; title: string; description: string; noindex: boolean; schemaJson: string; updatedAt: string; updatedBy: string };
const cacheG = globalThis as unknown as { __qaSeo?: { at: number; rows: PageSeo[] } };
/** Short-lived in-memory cache; saves invalidate it and refresh the public layout. */
export async function pageSeoAll(fresh = false): Promise<PageSeo[]> {
  if (!stored()) return [];
  const c = cacheG.__qaSeo;
  if (!fresh && c && Date.now() - c.at < 15000) return c.rows;
  try {
    const rows = (await q<PageSeo>(`select * from page_seo`)).map((r) => ({ ...r, noindex: Boolean(r.noindex) }));
    cacheG.__qaSeo = { at: Date.now(), rows };
    return rows;
  } catch {
    return [];
  }
}
export async function pageSeo(path: string, lang: string): Promise<PageSeo | null> {
  return (await pageSeoAll()).find((r) => r.path === path && r.lang === lang) ?? null;
}
export async function savePageSeo(n: Omit<PageSeo, "updatedAt">): Promise<void> {
  const empty = !n.title && !n.description && !n.noindex && !n.schemaJson;
  if (empty) await q(`delete from page_seo where path = $1 and lang = $2`, [n.path, n.lang]);
  else await q(
    `insert into page_seo (path, lang, title, description, noindex, schema_json, updated_at, updated_by) values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (path, lang) do update set title = excluded.title, description = excluded.description, noindex = excluded.noindex, schema_json = excluded.schema_json, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [n.path, n.lang, n.title, n.description, n.noindex, n.schemaJson, new Date().toISOString(), n.updatedBy],
  );
  cacheG.__qaSeo = undefined;
  refreshEverything();
}

/* ---------- WordPress-style JSON content overrides for any public page ---------- */

/** A content object may contain h1, lead, sections, faqs, blocks, or template-specific fields. */
export type PageContent = Record<string, unknown>;
export type PageOverrideStatus = "draft" | "published";
export type PageOverride = { path: string; lang: CmsLang; status: PageOverrideStatus; content: PageContent; updatedAt: string; updatedBy: string };
export type PageOverrideInput = Pick<PageOverride, "path" | "lang" | "status" | "content">;

const pageCache = globalThis as unknown as { __qaPageOverrides?: { at: number; rows: PageOverride[] } };
const isPublicPath = (path: string) => path === "/" || (/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(path) && !/^\/(?:admin|portal|teach|api|login|signup)(?:\/|$)/.test(path));
const pageParse = (row: Omit<PageOverride, "content"> & { content: unknown }): PageOverride => {
  let raw = row.content;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { raw = {}; }
  }
  const content = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as PageContent : {};
  return { ...row, content, lang: validLang(row.lang) ? row.lang : "en" };
};

/** All published overrides in a single database read, cached per warm worker. */
export async function pageOverridesAll(fresh = false): Promise<PageOverride[]> {
  if (!stored()) return [];
  const cached = pageCache.__qaPageOverrides;
  if (!fresh && cached && Date.now() - cached.at < 15000) return cached.rows;
  try {
    const rows = (await q<Omit<PageOverride, "content"> & { content: unknown }>(
      `select path, lang, status, content, updated_at, updated_by from cms_page_overrides where status = 'published'`,
    )).map(pageParse);
    pageCache.__qaPageOverrides = { at: Date.now(), rows };
    return rows;
  } catch (e) {
    console.error("[cms] page overrides unavailable:", (e as Error)?.message);
    return [];
  }
}

/** Fetch a published override for home, pricing, courses, about, faq, country pages, or blogs. */
export async function pageOverride(path: string, lang: CmsLang = "en"): Promise<PageOverride | null> {
  if (!isPublicPath(path)) return null;
  return (await pageOverridesAll()).find((p) => p.path === path && p.lang === lang) ?? null;
}

/** Pages opt into overrides by calling this with their existing static content object. */
export async function resolvePageContent<T extends PageContent>(path: string, lang: CmsLang, defaults: T): Promise<T & PageContent> {
  const override = await pageOverride(path, lang);
  return override ? { ...defaults, ...override.content } as T & PageContent : defaults;
}

/** Admin-only caller: save a draft/published override, then invalidate every public route. */
export async function savePageOverride(n: PageOverrideInput, by: string): Promise<void> {
  if (!isPublicPath(n.path)) throw new Error("Expected a public path such as /, /about, /courses/name, or /blog/slug.");
  if (!validLang(n.lang)) throw new Error("Unsupported CMS language.");
  if (n.status !== "draft" && n.status !== "published") throw new Error("Unsupported publication status.");
  if (n.content === null || Array.isArray(n.content) || typeof n.content !== "object") throw new Error("Content must be a JSON object.");
  const json = JSON.stringify(n.content);
  if (json.length > 250000) throw new Error("Content exceeds the 250 KB editor limit.");
  await q(
    `insert into cms_page_overrides (path, lang, status, content, updated_at, updated_by) values ($1,$2,$3,$4,$5,$6)
     on conflict (path, lang) do update set status = excluded.status, content = excluded.content, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [n.path, n.lang, n.status, json, new Date().toISOString(), by],
  );
  pageCache.__qaPageOverrides = undefined;
  refreshEverything();
}

/** Read draft content for an authenticated admin preview/editor. */
export async function getPageOverrideForAdmin(path: string, lang: CmsLang): Promise<PageOverride | null> {
  if (!stored() || !isPublicPath(path)) return null;
  const row = await one<Omit<PageOverride, "content"> & { content: unknown }>(
    `select path, lang, status, content, updated_at, updated_by from cms_page_overrides where path = $1 and lang = $2`,
    [path, lang],
  );
  return row ? pageParse(row) : null;
}

export async function deletePageOverride(path: string, lang: CmsLang): Promise<void> {
  if (!isPublicPath(path) || !validLang(lang)) throw new Error("Invalid page or language.");
  await q(`delete from cms_page_overrides where path = $1 and lang = $2`, [path, lang]);
  pageCache.__qaPageOverrides = undefined;
  refreshEverything();
}

/** Checks custom JSON-LD in the existing admin SEO editor. */
export function checkSchemaJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const t = text.trim();
  if (!t) return { ok: true, value: null };
  try {
    const v = JSON.parse(t);
    if (typeof v !== "object" || v === null) return { ok: false, error: "Schema markup must be a JSON object or a list of objects." };
    for (const item of Array.isArray(v) ? v : [v]) {
      if (typeof item !== "object" || item === null || !("@type" in item || "@graph" in item)) return { ok: false, error: 'Each schema object needs an "@type".' };
    }
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false, error: `Schema markup is not valid JSON: ${(e as Error).message}` };
  }
}
