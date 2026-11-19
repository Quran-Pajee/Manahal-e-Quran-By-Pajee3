import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { pageSeoAll } from "@/lib/cms";
import { sitePages } from "@/lib/site-pages";
import { href, isLang, langName } from "@/i18n";
import { SeoForm } from "@/components/app/SeoForm";

export const metadata = { title: "Page SEO" };

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Reads the title, description and schema types the page has right now, by opening the page itself. */
async function readLive(address: string): Promise<{ title: string; description: string; types: string[] }> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    const res = await fetch(`${proto}://${host}${address}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    const html = await res.text();
    const types = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
      try {
        const v = JSON.parse(m[1]);
        return (Array.isArray(v) ? v : [v]).map((x) => String(x?.["@type"] ?? "")).filter(Boolean);
      } catch {
        return [];
      }
    });
    return { title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""), description: decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""), types: [...new Set(types)] };
  } catch {
    return { title: "", description: "", types: [] };
  }
}

export default async function SeoEditPage({ searchParams }: { searchParams: Promise<{ path?: string; lang?: string; msg?: string }> }) {
  await requireAdmin();
  const { path = "", lang = "en", msg } = await searchParams;
  const page = sitePages().find((p) => p.path === path);
  if (!page || !isLang(lang) || (!page.translated && lang !== "en")) notFound();
  const saved = (await pageSeoAll(true)).find((s) => s.path === path && s.lang === lang);
  const address = href(lang, path);
  const live = await readLive(address);

  return (
    <>
      <p className="mb-3">
        <Link className="link" href="/admin/seo">
          SEO
        </Link>
      </p>
      <h1 className="text-[1.9rem]">
        {page.name} <span className="text-muted">· {langName[lang]}</span>
      </h1>
      <p className="mt-1 text-muted">
        <a className="link" href={address} target="_blank" rel="noopener" dir="ltr">
          {address}
        </a>
        {live.types.length > 0 && <> · schema already on this page: {live.types.join(", ")}</>}
      </p>
      <p className="mt-2 text-sm text-muted">
        To edit the visible H1, subheadings, CTA buttons or FAQs, use{" "}
        <Link className="link" href={`/admin/content?path=${encodeURIComponent(path)}&lang=${lang}`}>the page content editor</Link>.
        SEO title and description changes here are read by the existing public metadata renderer.
      </p>
      {msg === "saved" && (
        <p role="status" className="mt-5 rounded-lg border border-ok/40 bg-ok/10 px-4 py-3 font-medium text-ok">
          Saved. The page has been refreshed.
        </p>
      )}
      <div className="mt-6">
        <SeoForm
          key={saved?.updatedAt ?? "new"}
          path={path}
          lang={lang}
          saved={{ title: saved?.title ?? "", description: saved?.description ?? "", noindex: saved?.noindex ?? false, schemaJson: saved?.schemaJson ?? "" }}
          live={saved?.title || saved?.description ? { title: saved.title ? "" : live.title, description: saved.description ? "" : live.description } : live}
        />
      </div>
    </>
  );
}
