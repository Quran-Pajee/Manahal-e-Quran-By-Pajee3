"use client";

import { useActionState, useState } from "react";
import { savePageSettings, type EditorState } from "@/app/(app)/admin/content-actions";
import { SchemaField } from "./SchemaField";

/** Search settings for one built-in page: a replacement title and description, noindex, and extra schema markup. */
export function SeoForm({ path, lang, saved, live }: { path: string; lang: string; saved: { title: string; description: string; noindex: boolean; schemaJson: string }; live: { title: string; description: string } }) {
  const [state, action, pending] = useActionState<EditorState, FormData>(savePageSettings, {});
  const [title, setTitle] = useState(saved.title);
  const [description, setDescription] = useState(saved.description);
  const [noindex, setNoindex] = useState(saved.noindex);
  const shownTitle = title || live.title || "Page title";
  const shownDescription = description || live.description;
  const rtl = lang !== "en";

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="lang" value={lang} />
      <div className="grid content-start gap-5">
        {state.error && (
          <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 font-medium text-bad">
            {state.error}
          </p>
        )}
        <div className="rounded-xl border border-line bg-white p-5">
          <label className="label" htmlFor="title">
            Search title <span className="font-normal text-muted">(leave empty to keep the built-in one)</span>
          </label>
          <input id="title" name="title" className="field" maxLength={120} dir={rtl ? "rtl" : "ltr"} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={live.title} />
          <p className={`mt-1 text-[0.86rem] ${title && (title.length < 30 || title.length > 60) ? "text-gold-deep" : "text-muted"}`}>
            {title ? `${title.length} characters. Aim for 30 to 60. Write the whole title: the site name is not added to it.` : `Built-in title: ${live.title || "could not be read"}`}
          </p>

          <label className="label mt-4" htmlFor="description">
            Meta description <span className="font-normal text-muted">(leave empty to keep the built-in one)</span>
          </label>
          <textarea id="description" name="description" className="field" rows={3} maxLength={320} dir={rtl ? "rtl" : "ltr"} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={live.description} />
          <p className={`mt-1 text-[0.86rem] ${description && (description.length < 110 || description.length > 160) ? "text-gold-deep" : "text-muted"}`}>{description ? `${description.length} characters. Aim for 110 to 160.` : "Built-in description is shown in grey above."}</p>

          <label className="mt-5 flex cursor-pointer items-start gap-2.5">
            <input type="checkbox" name="noindex" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="mt-1 h-4 w-4 accent-[#123D32]" />
            <span>
              <span className="block font-semibold">Hide this page from search engines</span>
              <span className="block text-[0.86rem] text-muted">Adds “noindex”. Use it rarely: a hidden page brings no visitors from Google.</span>
            </span>
          </label>
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <SchemaField defaultValue={saved.schemaJson} error={state.fields?.schemaJson} hint="Added to this page on top of the schema the site already writes for it (organisation, breadcrumbs, FAQ, course or service). Start from an example:" />
        </div>
      </div>

      <div className="grid content-start gap-5">
        <div className="rounded-xl border border-line bg-white p-5">
          <p className="text-[0.82rem] text-muted">How it can look on Google</p>
          <div className="mt-1 rounded-lg border border-line p-3" dir={rtl ? "rtl" : "ltr"}>
            <p className="text-[1.05rem] leading-snug text-[#1a0dab]">{shownTitle.length > 62 ? `${shownTitle.slice(0, 60)}…` : shownTitle}</p>
            <p className="mt-0.5 text-[0.85rem] leading-snug text-charcoal">{shownDescription.length > 160 ? `${shownDescription.slice(0, 158)}…` : shownDescription}</p>
          </div>
          <button type="submit" className="btn btn-emerald mt-5 w-full" disabled={pending}>
            Save
          </button>
          <p className="mt-3 text-[0.86rem] text-muted">Changes appear on the page straight away. Google shows them after it next visits the page, usually within days.</p>
        </div>
      </div>
    </form>
  );
}
