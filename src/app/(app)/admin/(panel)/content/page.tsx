import Link from "next/link";
import { requireStaff, fmtDateTime } from "@/lib/admin";
import { allPosts, getPageOverrideForAdmin, type CmsLang } from "@/lib/cms";
import { sitePages } from "@/lib/site-pages";
import { isLang, href, langName, LANGS } from "@/i18n";
import { PublicPageEditor } from "./EditorPage";
import { storageMode } from "@/lib/db";
import { wordCount } from "@/lib/markdown";

export const metadata = { title: "Content" };

const KIND: Record<string, string> = { article: "Article", pillar: "Pillar page", cluster: "Cluster page" };
const MSG: Record<string, string> = { deleted: "Page deleted." };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string; msg?: string; path?: string; lang?: string }> }) {
  const me = await requireStaff();
  const { kind = "", status = "", msg = "", path = "/", lang = "en" } = await searchParams;
  const pages = sitePages();
  const selectedPage = pages.find((p) => p.path === path) ?? pages[0];
  const selectedLang: CmsLang = isLang(lang) && (selectedPage.translated || lang === "en") ? lang : "en";
  const off = storageMode() === "none";
  const all = off ? [] : await allPosts();
  const savedPage = off ? null : await getPageOverrideForAdmin(selectedPage.path, selectedLang);
  const shown = all.filter((p) => (!kind || p.kind === kind) && (!status || p.status === status));
  const titleOf = (id: string | null) => all.find((p) => p.id === id)?.title ?? "";
  const count = (f: (p: (typeof all)[number]) => boolean) => all.filter(f).length;
  const link = (k: string, s: string) => `/admin/content${k || s ? "?" : ""}${[k && `kind=${k}`, s && `status=${s}`].filter(Boolean).join("&")}`;
  const chip = (on: boolean) => `block rounded-full border px-3 py-1 text-[0.9rem] ${on ? "border-emerald bg-emerald text-white" : "border-line bg-white hover:border-emerald"}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem]">Content</h1>
          <p className="mt-2 max-w-[70ch] text-muted">
            Edit your public pages, hero text, section headings, buttons and FAQs in three languages. The guide/article library is below the page editor.
          </p>
        </div>
        {!off && (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/content/new?kind=article" className="btn btn-emerald min-h-[2.6rem]">
              New article
            </Link>
            <Link href="/admin/content/new?kind=pillar" className="btn btn-line min-h-[2.6rem]">
              New pillar page
            </Link>
            <Link href="/admin/content/new?kind=cluster" className="btn btn-line min-h-[2.6rem]">
              New cluster page
            </Link>
          </div>
        )}
      </div>

      {Object.hasOwn(MSG, msg) && (
        <p role="status" className="mt-5 rounded-lg border border-ok/40 bg-ok/10 px-4 py-3 font-medium text-ok">
          {MSG[msg]}
        </p>
      )}
      {off && <p className="mt-6 rounded-xl border border-gold bg-white p-5">Content can be edited once a database is connected. Until then the website shows the built-in guides.</p>}

      <section className="mt-7 rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Website pages</h2>
          <Link className="link font-semibold" href="/admin/seo">SEO settings</Link>
        </div>
        <p className="mt-1 text-sm text-muted">Pick a page and language. The editor retains draft and published content independently for each combination.</p>
        <form method="GET" action="/admin/content" className="mt-4 grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
          <div>
            <label className="label" htmlFor="site-page">Public page</label>
            <select className="field" id="site-page" name="path" defaultValue={selectedPage.path}>
              {pages.map((p) => <option value={p.path} key={p.path}>{p.name} ({p.path})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="site-lang">Language</label>
            <select className="field" id="site-lang" name="lang" defaultValue={selectedLang}>
              {LANGS.map((l) => <option key={l} value={l}>{langName[l]} ({l.toUpperCase()})</option>)}
            </select>
          </div>
          <button className="btn btn-line" type="submit">Open editor</button>
        </form>
        <p className="mt-3 text-sm text-muted">Public URL: <a href={href(selectedLang, selectedPage.path)} target="_blank" rel="noopener noreferrer" className="link" dir="ltr">{href(selectedLang, selectedPage.path)}</a>{!selectedPage.translated && <span> · This page currently exists only in English.</span>}</p>
      </section>
      {!off && <PublicPageEditor key={`${selectedPage.path}:${selectedLang}`} path={selectedPage.path} lang={selectedLang} saved={savedPage} msg={msg} isAdmin={me.role === "admin"} />}

      <section className="mt-12">
        <h2 className="font-sans text-[1.25rem] font-semibold tracking-normal">Guides and articles</h2>
        <p className="mt-1 text-sm text-muted">Pillar pages, clusters and standalone learning guides. Existing guide editing continues to work.</p>
      </section>
      {!off && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ul className="flex flex-wrap gap-1.5" aria-label="Page type">
              {[["", `All (${all.length})`], ["pillar", `Pillar pages (${count((p) => p.kind === "pillar")})`], ["cluster", `Cluster pages (${count((p) => p.kind === "cluster")})`], ["article", `Articles (${count((p) => p.kind === "article")})`]].map(([k, label]) => (
                <li key={k}>
                  <Link href={link(k, status)} aria-current={kind === k ? "true" : undefined} className={chip(kind === k)}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-1.5" aria-label="Status">
              {[["", "Any status"], ["published", `Published (${count((p) => p.status === "published")})`], ["draft", `Drafts (${count((p) => p.status === "draft")})`]].map(([s, label]) => (
                <li key={s}>
                  <Link href={link(kind, s)} aria-current={status === s ? "true" : undefined} className={chip(status === s)}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {shown.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-line bg-white p-5 text-muted">Nothing here yet. Use the buttons above to write the first one.</p>
          ) : (
            <div className="tbl-wrap mt-5">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Words</th>
                    <th scope="col">Last change</th>
                    <th scope="col">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id}>
                      <th scope="row" className="min-w-[16rem]">
                        <Link className="link" href={`/admin/content/${p.id}`}>
                          {p.title}
                        </Link>
                        <span className="block text-[0.86rem] font-normal text-muted" dir="ltr">
                          /blog/{p.slug}
                        </span>
                      </th>
                      <td>
                        {KIND[p.kind]}
                        {p.kind === "cluster" && <span className="block text-[0.86rem] text-muted">{titleOf(p.parentId) ? `in: ${titleOf(p.parentId)}` : "no pillar chosen"}</span>}
                        {p.kind === "pillar" && <span className="block text-[0.86rem] text-muted">{count((c) => c.parentId === p.id)} cluster pages</span>}
                      </td>
                      <td>
                        <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${p.status === "published" ? "border-ok/40 bg-ok/10 text-ok" : "border-line bg-wash text-emerald"}`}>{p.status === "published" ? "Published" : "Draft"}</span>
                        {p.noindex && <span className="block text-[0.82rem] text-muted">hidden from search</span>}
                      </td>
                      <td className="tabular-nums">{wordCount(p.body)}</td>
                      <td className="whitespace-nowrap">
                        {fmtDateTime(p.updatedAt)}
                        {p.updatedBy && <span className="block text-[0.86rem] text-muted">{p.updatedBy}</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        {p.status === "published" ? (
                          <a className="link" href={`/blog/${p.slug}`} target="_blank" rel="noopener">
                            View
                          </a>
                        ) : (
                          <Link className="link" href={`/admin/content/${p.id}/preview`}>
                            Preview
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
