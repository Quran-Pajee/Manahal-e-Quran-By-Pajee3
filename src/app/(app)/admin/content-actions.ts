"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { session } from "@/lib/auth";
import { clean } from "@/lib/validate";
import { parseFaqs } from "@/lib/markdown";
import { SCHEMA_TYPES, allPosts, checkSchemaJson, createPost, deletePost, deletePageOverride, getPost, getPageOverrideForAdmin, savePageOverride, savePageSeo, setPostStatus, slugTaken, updatePost, type CmsLang, type PageContent, type PostInput, type PostKind } from "@/lib/cms";
import { href, isLang } from "@/i18n";
import { sitePages } from "@/lib/site-pages";

export type EditorState = { error?: string; fields?: Record<string, string> };

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);
/** Long text keeps its line breaks (clean() is for single lines). */
const long = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max)
    .trim();
const toSlug = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
const webAddress = (v: string) => (/^https:\/\/[^\s]+$/i.test(v) ? v : "");

/** Everything a guide's address appears on is refreshed, so a change is live at once. */
async function refreshGuides(slugs: string[]) {
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`/blog/${s}`);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/", "layout");
}

/** Save draft, preview, publish or unpublish. Editors and admins may all do this. */
export async function savePost(_prev: EditorState, fd: FormData): Promise<EditorState> {
  const me = await session();
  if (!me) redirect("/admin/login");

  const id = text(fd, "id", 60);
  const intent = text(fd, "intent", 12);
  const existing = id ? await getPost(id) : null;
  if (id && !existing) return { error: "This page no longer exists. It may have been deleted." };

  const title = text(fd, "title", 160);
  const kindRaw = text(fd, "kind", 10);
  const kind: PostKind = kindRaw === "pillar" || kindRaw === "cluster" ? kindRaw : "article";
  const slug = toSlug(text(fd, "slug", 120) || title);
  const schemaJson = long(fd, "schemaJson", 20000);
  const schemaTypeRaw = text(fd, "schemaType", 20);
  const fields: Record<string, string> = {};

  if (title.length < 5) fields.title = "Write a title of at least 5 characters.";
  if (!slug) fields.slug = "The address can use letters, numbers and hyphens.";
  else if (await slugTaken(slug, id)) fields.slug = "Another page already uses this address. Change it a little.";
  const schema = checkSchemaJson(schemaJson);
  if (!schema.ok) fields.schemaJson = schema.error;

  let parentId: string | null = null;
  if (kind === "cluster") {
    const parent = await getPost(text(fd, "parentId", 60));
    if (parent && parent.kind === "pillar" && parent.id !== id) parentId = parent.id;
  }
  const canonicalRaw = text(fd, "canonical", 300);
  const canonical = canonicalRaw.startsWith("/") && !canonicalRaw.startsWith("//") ? canonicalRaw : webAddress(canonicalRaw);
  if (canonicalRaw && !canonical) fields.canonical = "Use a full address starting with https://, or a path on this site starting with /.";
  const ogRaw = text(fd, "ogImage", 400);
  if (ogRaw && !webAddress(ogRaw)) fields.ogImage = "Use a full picture address starting with https://.";

  const input: PostInput = {
    kind,
    parentId,
    slug,
    title,
    excerpt: text(fd, "excerpt", 320),
    answer: long(fd, "answer", 700).replace(/\n+/g, " "),
    body: long(fd, "body", 80000),
    faqs: parseFaqs(long(fd, "faqs", 12000)),
    seoTitle: text(fd, "seoTitle", 120),
    seoDescription: text(fd, "seoDescription", 320),
    focusKeyword: text(fd, "focusKeyword", 80),
    canonical,
    noindex: fd.get("noindex") === "on",
    ogImage: webAddress(ogRaw),
    schemaType: (SCHEMA_TYPES as readonly string[]).includes(schemaTypeRaw) ? schemaTypeRaw : "BlogPosting",
    schemaJson: schema.ok ? schemaJson : (existing?.schemaJson ?? ""),
  };

  if (intent === "publish") {
    if (input.body.length < 200) fields.body = "Write the page before publishing it (at least a few paragraphs).";
    if (!input.excerpt) fields.excerpt = "Add a short summary. It is shown in lists and used as the description in search results.";
  }
  if (Object.keys(fields).length) return { error: "Nothing was saved yet. Fix the marked fields and try again.", fields };

  const postId = existing?.id ?? randomUUID();
  if (existing) await updatePost(postId, input, me.name);
  else await createPost(postId, input, me.name);
  if (intent === "publish") await setPostStatus(postId, "published", me.name);
  if (intent === "unpublish") await setPostStatus(postId, "draft", me.name);

  const all = await allPosts();
  await refreshGuides([slug, existing?.slug ?? "", ...all.filter((p) => p.id === parentId || p.parentId === postId || (existing?.parentId && p.id === existing.parentId)).map((p) => p.slug)]);

  if (intent === "preview") redirect(`/admin/content/${postId}/preview`);
  redirect(`/admin/content/${postId}?msg=${intent === "publish" ? "published" : intent === "unpublish" ? "unpublished" : "saved"}`);
}

export async function removePost(fd: FormData) {
  const me = await session();
  if (!me) redirect("/admin/login");
  const post = await getPost(text(fd, "id", 60));
  if (!post) redirect("/admin/content");
  // Editors may delete drafts. Removing a published page is for admins, because it breaks links to it.
  if (post.status === "published" && me.role !== "admin") redirect(`/admin/content/${post.id}?msg=noremove`);
  const related = (await allPosts()).filter((p) => p.id === post.parentId || p.parentId === post.id).map((p) => p.slug);
  await deletePost(post.id);
  await refreshGuides([post.slug, ...related]);
  redirect("/admin/content?msg=deleted");
}

/** Search settings for one of the site's built-in pages. Admins only. */
export async function savePageSettings(_prev: EditorState, fd: FormData): Promise<EditorState> {
  const me = await session();
  if (!me) redirect("/admin/login");
  if (me.role !== "admin") redirect("/admin/content");
  const path = text(fd, "path", 200);
  const lang = text(fd, "lang", 2);
  if (!validPage(path, lang)) return { error: "That page was not recognised." };
  const schemaJson = long(fd, "schemaJson", 20000);
  const schema = checkSchemaJson(schemaJson);
  if (!schema.ok) return { error: "Nothing was saved yet.", fields: { schemaJson: schema.error } };
  await savePageSeo({ path, lang, title: text(fd, "title", 120), description: text(fd, "description", 320), noindex: fd.get("noindex") === "on", schemaJson, updatedBy: me.name });
  revalidatePath(href(lang, path));
  revalidatePath("/", "layout");
  redirect(`/admin/seo/edit?path=${encodeURIComponent(path)}&lang=${lang}&msg=saved`);
}


function validPage(path: string, lang: string): lang is CmsLang {
  const p = sitePages().find((page) => page.path === path);
  return Boolean(p && isLang(lang) && (p.translated || lang === "en"));
}

function cmsUrl(path: string, lang: string, msg: string) {
  return `/admin/content?path=${encodeURIComponent(path)}&lang=${encodeURIComponent(lang)}&msg=${msg}`;
}

function jsonList(value: string, type: "sections" | "faqs"): unknown[] {
  const parsed: unknown = JSON.parse(value || "[]");
  if (!Array.isArray(parsed) || parsed.length > 100) throw new Error("Expected an array of up to 100 items.");
  if (type === "faqs" && !parsed.every((item) => item && typeof item === "object" && typeof item.q === "string" && typeof item.a === "string" && item.q.length <= 500 && item.a.length <= 10000)) {
    throw new Error("Each FAQ must have a question (q) and answer (a).");
  }
  if (type === "sections" && !parsed.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    throw new Error("Each section must be a JSON object.");
  }
  return parsed;
}

/** Saves field-based public-page content to cms_page_overrides. Only editors/admins may publish. */
export async function savePublicPage(fd: FormData): Promise<void> {
  const me = await session();
  if (!me) redirect("/admin/login");
  const path = text(fd, "path", 200);
  const lang = text(fd, "lang", 2);
  if (!validPage(path, lang)) redirect("/admin/content");
  const intent = text(fd, "intent", 10);
  if (intent !== "draft" && intent !== "published") redirect(cmsUrl(path, lang, "invalid"));
  const ctaText = text(fd, "ctaText", 120);
  const ctaHref = text(fd, "ctaHref", 500);
  if (ctaHref && !(/^(\/(?!\/)[a-zA-Z0-9/_-]*(?:\?[a-zA-Z0-9_=&%-]*)?(?:#[a-zA-Z0-9_-]+)?)$/.test(ctaHref) || /^https:\/\/[^\s]+$/i.test(ctaHref))) {
    redirect(cmsUrl(path, lang, "invalid"));
  }
  let sections: unknown[];
  let faqs: unknown[];
  try {
    sections = jsonList(long(fd, "sectionsJson", 85000), "sections");
    faqs = jsonList(long(fd, "faqsJson", 65000), "faqs");
  } catch {
    redirect(cmsUrl(path, lang, "invalid"));
  }
  const old = await getPageOverrideForAdmin(path, lang);
  const content: PageContent = { ...(old?.content ?? {}) };
  const fields = { h1: text(fd, "h1", 240), lead: long(fd, "lead", 3000), subheading: text(fd, "subheading", 240) };
  for (const [k, v] of Object.entries(fields)) { if (v) content[k] = v; else delete content[k]; }
  if (ctaText || ctaHref) content.cta = { label: ctaText, href: ctaHref };
  else delete content.cta;
  if (sections.length) content.sections = sections;
  else delete content.sections;
  if (faqs.length) content.faqs = faqs;
  else delete content.faqs;
  await savePageOverride({ path, lang, status: intent, content }, me.name);
  revalidatePath(href(lang, path));
  revalidatePath("/", "layout");
  redirect(cmsUrl(path, lang, intent === "published" ? "published" : "saved"));
}

export async function removePublicPage(fd: FormData): Promise<void> {
  const me = await session();
  if (!me) redirect("/admin/login");
  const path = text(fd, "path", 200);
  const lang = text(fd, "lang", 2);
  if (!validPage(path, lang)) redirect("/admin/content");
  await deletePageOverride(path, lang);
  revalidatePath(href(lang, path));
  revalidatePath("/", "layout");
  redirect(cmsUrl(path, lang, "deleted"));
}
