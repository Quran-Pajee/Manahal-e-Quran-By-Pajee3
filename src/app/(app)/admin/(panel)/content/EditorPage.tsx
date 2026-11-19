import Link from "next/link";
import { allPosts, type Post, type PageOverride, type CmsLang } from "@/lib/cms";
import { faqsToText } from "@/lib/markdown";
import { PostEditor, type EditorPost } from "@/components/app/PostEditor";
import { site } from "@/content/site";
import { removePost, savePublicPage, removePublicPage } from "../../content-actions";
import { href, langName } from "@/i18n";
import { ui } from "@/i18n/ui";
import { coursesFor } from "@/content/courses";
import { landingsFor } from "@/content/pages";
import { faqsFor } from "@/content/faqs";
import { plans, groupTiers, moneyFor, lowestGroup } from "@/content/pricing";

const MSG: Record<string, [string, boolean]> = {
  saved: ["Saved.", true],
  published: ["Published. The page is live on the website now.", true],
  unpublished: ["Unpublished. The page is a draft again and no longer on the website.", true],
  noremove: ["Only an admin can delete a published page. Unpublish it first, or ask an admin.", false],
};

/** The editing screen, for a new page (post = null) or an existing one. */
export async function EditorPage({ post, kind, msg, canDelete }: { post: Post | null; kind: string; msg?: string; canDelete: boolean }) {
  const all = await allPosts();
  const pillars = all.filter((p) => p.kind === "pillar" && p.id !== post?.id).map((p) => ({ id: p.id, title: p.title }));
  const k = kind === "pillar" || kind === "cluster" ? kind : "article";
  const value: EditorPost = post
    ? { ...post, parentId: post.parentId ?? "", faqs: faqsToText(post.faqs) }
    : { id: "", status: "draft", kind: k, parentId: "", slug: "", title: "", excerpt: "", answer: "", body: "", faqs: "", seoTitle: "", seoDescription: "", focusKeyword: "", canonical: "", noindex: false, ogImage: "", schemaType: "BlogPosting", schemaJson: "" };
  const note = msg && Object.hasOwn(MSG, msg) ? MSG[msg] : undefined;
  const clusters = post?.kind === "pillar" ? all.filter((p) => p.parentId === post.id) : [];

  return (
    <>
      <p className="mb-3">
        <Link className="link" href="/admin/content">
          Content
        </Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[1.9rem]">{post ? "Edit page" : k === "pillar" ? "New pillar page" : k === "cluster" ? "New cluster page" : "New article"}</h1>
        {post && (
          <p className="flex gap-4 text-[0.95rem]">
            <Link className="link" href={`/admin/content/${post.id}/preview`}>
              Preview
            </Link>
            {post.status === "published" && (
              <a className="link" href={`/blog/${post.slug}`} target="_blank" rel="noopener">
                View live page
              </a>
            )}
          </p>
        )}
      </div>
      {note && (
        <p role="status" className={`mt-4 rounded-lg border px-4 py-3 font-medium ${note[1] ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>
          {note[0]}
        </p>
      )}

      <div className="mt-6">
        <PostEditor key={post ? `${post.id}-${post.updatedAt}` : "new"} post={value} pillars={pillars} siteHost={site.url.replace(/^https?:\/\//, "")} titleSuffix={` | ${site.shortName}`} />
      </div>

      {clusters.length > 0 && (
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="font-sans text-[1.02rem] font-semibold tracking-normal">Cluster pages under this pillar</h2>
          <ul className="mt-3 divide-y divide-line">
            {clusters.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link className="link" href={`/admin/content/${c.id}`}>
                  {c.title}
                </Link>
                <span className="text-[0.9rem] text-muted">{c.status === "published" ? "Published" : "Draft"}</span>
              </li>
            ))}
          </ul>
          <Link className="link mt-3 inline-block font-semibold" href="/admin/content/new?kind=cluster">
            Add a cluster page
          </Link>
        </section>
      )}

      {post && canDelete && (
        <details className="mt-6 rounded-xl border border-line bg-white p-5">
          <summary className="cursor-pointer font-semibold text-bad">Delete this page</summary>
          <p className="mt-2 text-[0.95rem] text-muted">This cannot be undone. If the page is live, links to it will stop working. To take it off the website and keep the text, unpublish it instead.</p>
          <form action={removePost} className="mt-3">
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="btn border-[1.5px] border-bad text-bad hover:bg-bad/10">
              Delete for good
            </button>
          </form>
        </details>
      )}
    </>
  );
}


/** Field-based editor for the CMS overrides added in Step 1. Public renderers opt in later. */
export function PublicPageEditor({ path, lang, saved, msg, isAdmin }: { path: string; lang: CmsLang; saved: PageOverride | null; msg?: string; isAdmin: boolean }) {
  const dict = ui[lang];
  const money = moneyFor(lang);
  const landing = landingsFor(lang).find((p) => `/${p.slug}` === path);
  const defaults: Record<string, { h1: string; lead: string }> = {
    "/": { h1: dict.home.h1, lead: dict.home.sub(site.name, site.trial.classes) },
    "/courses": { h1: dict.coursesPage.h1, lead: dict.coursesPage.lead(site.name, coursesFor(lang).length) },
    "/pricing": { h1: dict.pricingPage.h1, lead: dict.pricingPage.lead(site.name, money("USD", plans[0].prices.USD), money("USD", plans[1].prices.USD), money("USD", plans[2].prices.USD), site.classMinutes, money("USD", lowestGroup("USD")), site.trial.classes) },
    "/about": { h1: dict.aboutPage.h1(site.name), lead: dict.aboutPage.lead(site.name, site.organisation.name) },
    "/faq": { h1: dict.faqPage.h1, lead: dict.faqPage.lead },
    "/blog": { h1: "Guides for parents and learners", lead: "Straight answers to the questions families ask before and during Quran study." },
  };
  const original = defaults[path] ?? { h1: landing?.h1 ?? "", lead: landing?.answer ?? "" };
  const data = saved?.content ?? {};
  const str = (v: unknown) => typeof v === "string" ? v : "";
  const cta = data.cta && typeof data.cta === "object" && !Array.isArray(data.cta) ? data.cta as Record<string, unknown> : {};
  const structured = (value: unknown, fallback: unknown) => JSON.stringify(value ?? fallback, null, 2);
  const existingFaqs = faqsFor(lang);
  const templateFaqs = path === "/pricing" ? existingFaqs.pricing : path === "/" ? existingFaqs.home : landing?.faqs ?? [];
  const faqs = structured(data.faqs, templateFaqs);
  const isPricing = path === "/pricing";
  const visible = href(lang, path);

  return (
    <section className="mt-6 rounded-xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Public page · {langName[lang]} · {path}</p>
          <h2 className="mt-1 font-sans text-xl font-semibold tracking-normal">Edit page fields</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <Link href={`/admin/seo/edit?path=${encodeURIComponent(path)}&lang=${lang}`} className="btn btn-line">Edit SEO</Link>}
          <a href={visible} target="_blank" rel="noopener noreferrer" className="btn btn-line">View current public page</a>
        </div>
      </div>
      {msg === "saved" && <p role="status" className="mt-4 rounded-lg border border-ok/30 bg-ok/10 p-3 text-ok">Draft saved to Neon.</p>}
      {msg === "published" && <p role="status" className="mt-4 rounded-lg border border-ok/30 bg-ok/10 p-3 text-ok">Override published to Neon and ISR invalidation requested.</p>}
      {msg === "deleted" && <p role="status" className="mt-4 rounded-lg border border-ok/30 bg-ok/10 p-3 text-ok">Override removed.</p>}
      {msg === "invalid" && <p role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/10 p-3 text-bad">Invalid input. Check the JSON arrays, CTA link and text lengths.</p>}
      <p className="mt-4 text-sm text-muted">Saved values are stored separately by page and language. Blank fields keep their built-in defaults. Saving as a draft replaces a previously published override for that page/language because the current CMS stores one version per language. The public templates have not yet been connected to these overrides; publishing stores your changes but will not change the displayed headings, FAQs or prices until the next public-view integration step.</p>
      <form action={savePublicPage} className="mt-6 space-y-6">
        <input type="hidden" name="path" value={path} />
        <input type="hidden" name="lang" value={lang} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="public-h1" className="label">Hero H1</label>
            <input id="public-h1" name="h1" className="field" dir={lang === "en" ? "ltr" : "rtl"} maxLength={240} defaultValue={str(data.h1)} placeholder={original.h1} />
            <p className="mt-1 text-xs text-muted">Built-in: {original.h1 || "See current public page"}</p>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="public-lead" className="label">Hero description / subheading</label>
            <textarea id="public-lead" name="lead" className="field" rows={4} dir={lang === "en" ? "ltr" : "rtl"} maxLength={3000} defaultValue={str(data.lead)} placeholder={original.lead} />
          </div>
          <div>
            <label htmlFor="public-subheading" className="label">Secondary heading (H2)</label>
            <input id="public-subheading" name="subheading" className="field" maxLength={240} dir={lang === "en" ? "ltr" : "rtl"} defaultValue={str(data.subheading)} placeholder="Optional section heading" />
          </div>
          <div>
            <label htmlFor="public-cta-text" className="label">Primary CTA label</label>
            <input id="public-cta-text" name="ctaText" className="field" maxLength={120} dir={lang === "en" ? "ltr" : "rtl"} defaultValue={str(cta.label)} placeholder="Book free trial" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="public-cta-href" className="label">Primary CTA destination</label>
            <input id="public-cta-href" name="ctaHref" className="field" dir="ltr" maxLength={500} defaultValue={str(cta.href)} placeholder="/free-trial" />
            <p className="mt-1 text-xs text-muted">Use a local public path (/free-trial) or a secure https:// address.</p>
          </div>
        </div>
        <div>
          <label htmlFor="public-sections" className="label">Page sections (JSON array)</label>
          <textarea id="public-sections" name="sectionsJson" className="field font-mono text-sm" rows={7} dir="ltr" spellCheck={false} maxLength={85000} defaultValue={structured(data.sections, [])} />
          <p className="mt-1 text-sm text-muted">For additional headings and content blocks. Example: {`[{"heading":"How classes work","body":"Our teachers..."}]`}</p>
        </div>
        <div>
          <label htmlFor="public-faqs" className="label">Frequently asked questions (JSON array)</label>
          <textarea id="public-faqs" name="faqsJson" className="field font-mono text-sm" rows={8} dir="ltr" spellCheck={false} maxLength={65000} defaultValue={faqs} />
          <p className="mt-1 text-sm text-muted">Each entry must include a question and answer: {`{"q":"Question?","a":"Answer."}`}. Current static FAQs are loaded as a starting point where available.</p>
        </div>
        {isPricing && (
          <div className="rounded-lg border border-line bg-wash p-4">
            <p className="font-semibold">Monthly pricing for USD, GBP, CAD, AUD</p>
            <p className="mt-1 text-sm text-muted">Use the editable rate table in Billing to save all one-to-one and group rates to Neon. Current code-defined plan totals remain in place on public pages until the public pricing renderer is upgraded.</p>
            <p className="mt-2 text-sm text-muted">Configured plans: {plans.length} one-to-one and {groupTiers.reduce((n, g) => n + g.plans.length, 0)} group-frequency plans.</p>
            {isAdmin && <Link className="link mt-2 inline-block font-semibold" href="/admin/billing#pricing-rates">Edit pricing rates</Link>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button type="submit" name="intent" value="draft" className="btn btn-line">Save draft</button>
          <button type="submit" name="intent" value="published" className="btn btn-emerald">Publish to Neon + revalidate</button>
          <span className="text-sm text-muted">{saved ? `Status: ${saved.status} · last saved ${saved.updatedAt.slice(0, 16).replace("T", " ")} UTC` : "No saved override yet"}</span>
        </div>
      </form>
      {saved && <form action={removePublicPage} className="mt-3"><input type="hidden" name="path" value={path} /><input type="hidden" name="lang" value={lang} /><button className="text-sm font-semibold text-bad underline underline-offset-2" type="submit">Restore built-in content (delete override)</button></form>}
    </section>
  );
}
