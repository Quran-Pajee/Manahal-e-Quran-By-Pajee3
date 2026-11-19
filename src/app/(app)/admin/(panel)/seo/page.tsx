import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { pageSeoAll } from "@/lib/cms";
import { storageMode } from "@/lib/db";
import { sitePages } from "@/lib/site-pages";
import { LANGS, href, langName } from "@/i18n";

export const metadata = { title: "SEO" };

export default async function SeoPage() {
  await requireAdmin();
  const off = storageMode() === "none";
  const saved = await pageSeoAll(true);
  const pages = sitePages();
  const groups = [...new Set(pages.map((p) => p.group))];
  const has = (path: string, lang: string) => saved.find((s) => s.path === path && s.lang === lang);

  return (
    <>
      <h1 className="text-[1.9rem]">SEO: page by page</h1>
      <p className="mt-2 max-w-[72ch] text-muted">
        Every page already has a search title, a description and schema markup written for it. Here you can replace the title or description of any page, hide a page from search engines, and add extra schema markup. Guides have the same settings inside{" "}
        <Link className="link" href="/admin/content">
          Content
        </Link>
        .
      </p>
      {off && <p className="mt-6 rounded-xl border border-gold bg-white p-5">These settings can be saved once a database is connected.</p>}
      <p className="mt-3 text-sm text-muted">Need to change an H1, CTA, FAQ or section heading? Open <Link className="link font-semibold" href="/admin/content">Content → Website pages</Link>. SEO overrides on this screen already connect to the public page metadata.</p>

      {groups.map((g) => (
        <section key={g} className="mt-8">
          <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">{g}</h2>
          <div className="tbl-wrap mt-3">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col">Address</th>
                  <th scope="col">Settings, by language</th>
                </tr>
              </thead>
              <tbody>
                {pages
                  .filter((p) => p.group === g)
                  .map((p) => (
                    <tr key={p.path}>
                      <th scope="row">{p.name}</th>
                      <td dir="ltr">
                        <a className="link" href={p.path} target="_blank" rel="noopener">
                          {p.path}
                        </a>
                      </td>
                      <td>
                        <ul className="flex flex-wrap gap-2">
                          {(p.translated ? LANGS : (["en"] as const)).map((l) => {
                            const s = has(p.path, l);
                            return (
                              <li key={l}>
                                <Link href={`/admin/seo/edit?path=${encodeURIComponent(p.path)}&lang=${l}`} className={`block rounded-full border px-3 py-1 text-[0.88rem] ${s ? "border-emerald bg-wash font-semibold" : "border-line bg-white hover:border-emerald"}`} title={href(l, p.path)}>
                                  {langName[l]}
                                  {s ? (s.noindex ? ": hidden" : ": changed") : ""}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
