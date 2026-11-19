"use client";

import { useActionState, useState } from "react";
import { savePost, type EditorState } from "@/app/(app)/admin/content-actions";
import { internalLinks, parseFaqs, wordCount } from "@/lib/markdown";
import { SchemaField } from "./SchemaField";

/**
 * The editor for an article, a pillar page or a cluster page.
 * Left: the writing. Right: publishing, the page type, search settings with a live checklist, and schema markup.
 */
export type EditorPost = {
  id: string;
  status: "draft" | "published";
  kind: "article" | "pillar" | "cluster";
  parentId: string;
  slug: string;
  title: string;
  excerpt: string;
  answer: string;
  body: string;
  faqs: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonical: string;
  noindex: boolean;
  ogImage: string;
  schemaType: string;
  schemaJson: string;
};

const toSlug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const KIND_HELP: Record<string, string> = {
  article: "A stand-alone guide that answers one question.",
  pillar: "The main page for a whole subject. It lists every cluster page that belongs to it.",
  cluster: "Goes deep on one question inside a subject, and links back to its pillar page.",
};

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[0.9rem]">
      <span aria-hidden="true" className={`mt-[0.15rem] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold text-white ${ok ? "bg-ok" : "bg-gold-deep"}`}>
        {ok ? "✓" : "!"}
      </span>
      <span className={ok ? "text-muted" : ""}>
        <span className="sr-only">{ok ? "Done: " : "To do: "}</span>
        {children}
      </span>
    </li>
  );
}

export function PostEditor({ post, pillars, siteHost, titleSuffix }: { post: EditorPost; pillars: { id: string; title: string }[]; siteHost: string; titleSuffix: string }) {
  const [state, action, pending] = useActionState<EditorState, FormData>(savePost, {});
  const [f, setF] = useState(post);
  // For a new page the address follows the title until the address is typed by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(post.id));
  const set = <K extends keyof EditorPost>(k: K, v: EditorPost[K]) => setF((old) => ({ ...old, [k]: v }));
  const err = (k: string) =>
    state.fields?.[k] ? (
      <p className="mt-1 text-[0.88rem] text-bad" role="alert">
        {state.fields[k]}
      </p>
    ) : null;

  const slug = slugTouched ? f.slug : toSlug(f.title);
  const shownTitle = `${f.seoTitle || f.title || "Page title"}${titleSuffix}`;
  const shownDescription = f.seoDescription || f.excerpt || "The description shown under the title in search results.";
  const kw = f.focusKeyword.trim().toLowerCase();
  const has = (text: string) => kw !== "" && text.toLowerCase().includes(kw);
  const words = wordCount(f.body);
  const wantWords = f.kind === "pillar" ? 1200 : 600;
  const h2s = (f.body.match(/^##\s+/gm) ?? []).length;
  const links = internalLinks(f.body).length;
  const answerWords = wordCount(f.answer);
  const faqCount = parseFaqs(f.faqs).length;
  const firstParagraph = f.body.split(/\n\s*\n/).find((p) => p.trim() && !/^[#>|\-*\d]/.test(p.trim())) ?? "";

  const checks: [boolean, string][] = [
    [shownTitle.length >= 30 && shownTitle.length <= 62, `Search title is 30 to 60 characters (now ${shownTitle.length})`],
    [shownDescription.length >= 110 && shownDescription.length <= 160 && Boolean(f.seoDescription || f.excerpt), `Description is 110 to 160 characters (now ${f.seoDescription || f.excerpt ? shownDescription.length : 0})`],
    [kw !== "", "A focus keyword is set"],
    [has(f.seoTitle || f.title), "Focus keyword is in the title"],
    [has(f.seoDescription || f.excerpt), "Focus keyword is in the description"],
    [kw !== "" && slug.includes(toSlug(kw)), "Focus keyword is in the address"],
    [has(f.answer) || has(firstParagraph), "Focus keyword is in the short answer or first paragraph"],
    [answerWords >= 35 && answerWords <= 65, `Short answer is 40 to 60 words (now ${answerWords})`],
    [words >= wantWords, `At least ${wantWords} words (now ${words})`],
    [h2s >= 3, `At least 3 section headings (now ${h2s})`],
    [links >= 3, `At least 3 links to other pages of this site (now ${links})`],
    [faqCount >= 2, `At least 2 questions and answers (now ${faqCount})`],
    ...(f.kind === "cluster" ? ([[Boolean(f.parentId), "A pillar page is chosen"]] as [boolean, string][]) : []),
  ];
  const done = checks.filter((c) => c[0]).length;

  const box = "rounded-xl border border-line bg-white p-5";
  const h = "font-sans text-[1.02rem] font-semibold tracking-normal";

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <input type="hidden" name="id" value={f.id} />
      <input type="hidden" name="slug" value={slug} />

      {/* ---------------- the writing ---------------- */}
      <div className="grid content-start gap-5">
        {state.error && (
          <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 font-medium text-bad">
            {state.error}
          </p>
        )}
        <div className={box}>
          <label className="label" htmlFor="title">
            Title <span className="font-normal text-muted">(the main heading of the page)</span>
          </label>
          <input id="title" name="title" className="field text-[1.1rem] font-semibold" required maxLength={160} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="How long does it take to learn Tajweed?" />
          {err("title")}

          <label className="label mt-4" htmlFor="slug-in">
            Address
          </label>
          <div className="flex items-center gap-1.5" dir="ltr">
            <span className="shrink-0 text-[0.9rem] text-muted">{siteHost}/blog/</span>
            <input
              id="slug-in"
              className="field"
              maxLength={80}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", toSlug(e.target.value.replace(/\s+/g, "-")) + (e.target.value.endsWith("-") ? "-" : ""));
              }}
            />
          </div>
          {f.status === "published" && <p className="mt-1 text-[0.86rem] text-muted">This page is live. Changing its address breaks links that already point to it.</p>}
          {err("slug")}
        </div>

        <div className={box}>
          <label className="label" htmlFor="answer">
            The short answer <span className="font-normal text-muted">(40 to 60 words, shown in a box at the top)</span>
          </label>
          <textarea id="answer" name="answer" className="field" rows={3} maxLength={700} value={f.answer} onChange={(e) => set("answer", e.target.value)} placeholder="Answer the question in the title directly, in two or three sentences. Search engines and AI assistants quote this part." />

          <label className="label mt-4" htmlFor="excerpt">
            Summary <span className="font-normal text-muted">(one or two sentences, shown in lists of guides)</span>
          </label>
          <textarea id="excerpt" name="excerpt" className="field" rows={2} maxLength={320} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          {err("excerpt")}
        </div>

        <div className={box}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label className="label mb-0" htmlFor="body">
              The page
            </label>
            <span className="text-[0.86rem] tabular-nums text-muted">{words} words</span>
          </div>
          <details className="mb-2 mt-1 text-[0.9rem]">
            <summary className="cursor-pointer text-leaf underline underline-offset-2">How to format text</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-wash p-3 text-[0.82rem] leading-relaxed" dir="ltr">{`## A section heading
### A smaller heading

A paragraph. **Bold**, *italic* and a [link to another page](/pricing).

- a bullet point
- another one

1. a numbered step
2. the next step

> A highlighted note.

| Plan | Classes | Fee |
| --- | --- | --- |
| Starter | 8 | $32 |`}</pre>
            <p className="mt-2 text-muted">Leave an empty line between paragraphs. Do not start the page with the title: it is added for you.</p>
          </details>
          <textarea id="body" name="body" className="field font-mono text-[0.92rem] leading-relaxed" rows={26} value={f.body} onChange={(e) => set("body", e.target.value)} dir="auto" spellCheck />
          {err("body")}
        </div>

        <div className={box}>
          <label className="label" htmlFor="faqs">
            Questions and answers <span className="font-normal text-muted">(optional, shown at the end and added as FAQ schema)</span>
          </label>
          <textarea id="faqs" name="faqs" className="field" rows={7} value={f.faqs} onChange={(e) => set("faqs", e.target.value)} placeholder={"Q: Can I learn Tajweed online?\nA: Yes. A live teacher listens to you recite and corrects you.\n\nQ: How long does it take?\nA: Most learners cover the main rules in 4 to 8 months."} />
          <p className="mt-1 text-[0.86rem] text-muted">Start each question with “Q:” and each answer with “A:”.</p>
        </div>
      </div>

      {/* ---------------- settings ---------------- */}
      <div className="grid content-start gap-5">
        <div className={`${box} lg:sticky lg:top-4 lg:z-10`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={h}>Publish</h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-[0.8rem] font-semibold ${f.status === "published" ? "border-ok/40 bg-ok/10 text-ok" : "border-line bg-wash text-emerald"}`}>{f.status === "published" ? "Published" : "Draft"}</span>
          </div>
          <div className="mt-4 grid gap-2">
            <button type="submit" name="intent" value="publish" className="btn btn-emerald" disabled={pending}>
              {f.status === "published" ? "Save and update the live page" : "Publish"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" name="intent" value={f.status === "published" ? "unpublish" : "draft"} className="btn btn-line min-h-[2.6rem] px-2" disabled={pending}>
                {f.status === "published" ? "Unpublish" : "Save draft"}
              </button>
              <button type="submit" name="intent" value="preview" className="btn btn-line min-h-[2.6rem] px-2" disabled={pending}>
                Save and preview
              </button>
            </div>
          </div>
          <p className="mt-3 text-[0.86rem] text-muted">{f.status === "published" ? "“Save and preview” saves your changes to the live page too. Unpublish first if you want to work in private." : "A draft is visible only to staff, here and in preview."}</p>
        </div>

        <div className={box}>
          <h2 className={h}>Page type</h2>
          <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Page type">
            {(["article", "pillar", "cluster"] as const).map((k) => (
              <label key={k} className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 ${f.kind === k ? "border-emerald bg-wash" : "border-line"}`}>
                <input type="radio" name="kind" value={k} checked={f.kind === k} onChange={() => set("kind", k)} className="mt-1 accent-[#123D32]" />
                <span>
                  <span className="block font-semibold capitalize">{k === "article" ? "Article" : `${k} page`}</span>
                  <span className="block text-[0.86rem] text-muted">{KIND_HELP[k]}</span>
                </span>
              </label>
            ))}
          </div>
          {f.kind === "cluster" && (
            <div className="mt-3">
              <label className="label" htmlFor="parentId">
                Belongs to pillar page
              </label>
              <select id="parentId" name="parentId" className="field" value={f.parentId} onChange={(e) => set("parentId", e.target.value)}>
                <option value="">Choose a pillar page</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {pillars.length === 0 && <p className="mt-1 text-[0.86rem] text-muted">There is no pillar page yet. Create one first.</p>}
            </div>
          )}
        </div>

        <div className={box}>
          <h2 className={h}>Search settings</h2>

          <p className="mt-3 text-[0.82rem] text-muted">How it can look on Google</p>
          <div className="mt-1 rounded-lg border border-line p-3" dir="ltr">
            <p className="truncate text-[0.8rem] text-muted">
              {siteHost} › blog › {slug || "address"}
            </p>
            <p className="mt-0.5 text-[1.05rem] leading-snug text-[#1a0dab]">{shownTitle.length > 62 ? `${shownTitle.slice(0, 60)}…` : shownTitle}</p>
            <p className="mt-0.5 text-[0.85rem] leading-snug text-charcoal">{shownDescription.length > 160 ? `${shownDescription.slice(0, 158)}…` : shownDescription}</p>
          </div>

          <label className="label mt-4" htmlFor="focusKeyword">
            Focus keyword
          </label>
          <input id="focusKeyword" name="focusKeyword" className="field" maxLength={80} value={f.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} placeholder="online tajweed classes" />

          <label className="label mt-3" htmlFor="seoTitle">
            Search title <span className="font-normal text-muted">(empty = the page title)</span>
          </label>
          <input id="seoTitle" name="seoTitle" className="field" maxLength={120} value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />

          <label className="label mt-3" htmlFor="seoDescription">
            Meta description <span className="font-normal text-muted">(empty = the summary)</span>
          </label>
          <textarea id="seoDescription" name="seoDescription" className="field" rows={3} maxLength={320} value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />

          <h3 className="mt-5 font-sans text-[0.95rem] font-semibold tracking-normal">
            Checklist: {done} of {checks.length}
          </h3>
          <ul className="mt-2 grid gap-1.5">
            {checks.map(([ok, label]) => (
              <Check key={label.replace(/\(now.*\)/, "")} ok={ok}>
                {label}
              </Check>
            ))}
          </ul>

          <details className="mt-5">
            <summary className="cursor-pointer text-[0.95rem] font-semibold">More search settings</summary>
            <label className="label mt-3" htmlFor="canonical">
              Canonical address <span className="font-normal text-muted">(only if this page copies another)</span>
            </label>
            <input id="canonical" name="canonical" className="field" dir="ltr" maxLength={300} value={f.canonical} onChange={(e) => set("canonical", e.target.value)} placeholder="https://" />
            {err("canonical")}
            <label className="label mt-3" htmlFor="ogImage">
              Picture for social sharing <span className="font-normal text-muted">(address of an image)</span>
            </label>
            <input id="ogImage" name="ogImage" className="field" dir="ltr" maxLength={400} value={f.ogImage} onChange={(e) => set("ogImage", e.target.value)} placeholder="https://" />
            {err("ogImage")}
            <label className="mt-4 flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" name="noindex" checked={f.noindex} onChange={(e) => set("noindex", e.target.checked)} className="mt-1 h-4 w-4 accent-[#123D32]" />
              <span>
                <span className="block font-semibold">Hide from search engines</span>
                <span className="block text-[0.86rem] text-muted">Adds “noindex” and leaves the page out of the sitemap.</span>
              </span>
            </label>
          </details>
        </div>

        <div className={box}>
          <h2 className={h}>Schema markup</h2>
          <label className="label mt-3" htmlFor="schemaType">
            Main schema type
          </label>
          <select id="schemaType" name="schemaType" className="field" value={f.schemaType} onChange={(e) => set("schemaType", e.target.value)}>
            <option value="BlogPosting">Blog post (BlogPosting)</option>
            <option value="Article">Article</option>
            <option value="HowTo">Article + How-to (from the numbered steps)</option>
            <option value="None">None</option>
          </select>
          <p className="mb-4 mt-1.5 text-[0.86rem] text-muted">FAQ schema is added by itself when the page has questions and answers. Breadcrumb schema is always added.</p>
          <SchemaField defaultValue={post.schemaJson} error={state.fields?.schemaJson} />
        </div>
      </div>
    </form>
  );
}
