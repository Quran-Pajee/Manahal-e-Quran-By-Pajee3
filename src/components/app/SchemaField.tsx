"use client";

import { useState } from "react";

/**
 * A box for extra schema markup (JSON-LD), with ready-made examples and a live check that it is valid JSON.
 * Used for guides and for the site's built-in pages.
 */
const EXAMPLES: Record<string, object> = {
  FAQ: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{ "@type": "Question", name: "Write the question here?", acceptedAnswer: { "@type": "Answer", text: "Write the answer here." } }],
  },
  "How-to": {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to ...",
    step: [
      { "@type": "HowToStep", position: 1, name: "First step", text: "What to do first." },
      { "@type": "HowToStep", position: 2, name: "Second step", text: "What to do next." },
    ],
  },
  Video: {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Title of the video",
    description: "What the video shows.",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    uploadDate: "2026-10-10",
    embedUrl: "https://www.youtube.com/embed/VIDEO_ID",
  },
  Course: {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Name of the course",
    description: "One or two sentences about the course.",
    provider: { "@type": "EducationalOrganization", name: "Manahil-e-Quran Academy" },
  },
  Review: {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "EducationalOrganization", name: "Manahil-e-Quran Academy" },
    author: { "@type": "Person", name: "Name of the real reviewer" },
    reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
    reviewBody: "The reviewer's own words.",
  },
};

export function check(text: string): string {
  const t = text.trim();
  if (!t) return "";
  try {
    const v = JSON.parse(t);
    if (typeof v !== "object" || v === null) return "Schema markup must be a JSON object or a list of objects.";
    for (const item of Array.isArray(v) ? v : [v]) if (typeof item !== "object" || item === null || !("@type" in item || "@graph" in item)) return 'Each schema object needs an "@type".';
    return "";
  } catch (e) {
    return `Not valid JSON yet: ${(e as Error).message}`;
  }
}

export function SchemaField({ defaultValue = "", error, hint }: { defaultValue?: string; error?: string; hint?: string }) {
  const [value, setValue] = useState(defaultValue);
  const problem = check(value);
  return (
    <div>
      <label className="label" htmlFor="schemaJson">
        Extra schema markup (JSON-LD) <span className="font-normal text-muted">(optional)</span>
      </label>
      <p className="mb-2 text-[0.88rem] text-muted">{hint ?? "Added to the page on top of the schema the site already writes. Start from an example:"}</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {Object.keys(EXAMPLES).map((k) => (
          <button key={k} type="button" className="rounded-full border border-line bg-white px-3 py-1 text-[0.85rem] hover:border-emerald" onClick={() => setValue(JSON.stringify(EXAMPLES[k], null, 2))}>
            {k}
          </button>
        ))}
        {value && (
          <button type="button" className="rounded-full border border-line bg-white px-3 py-1 text-[0.85rem] text-bad hover:border-bad" onClick={() => setValue("")}>
            Clear
          </button>
        )}
      </div>
      <textarea
        id="schemaJson"
        name="schemaJson"
        className="field font-mono text-[0.85rem] leading-relaxed"
        rows={value ? 12 : 3}
        dir="ltr"
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={Boolean(problem || error)}
        aria-describedby="schema-status"
        placeholder='{ "@context": "https://schema.org", "@type": "..." }'
      />
      <p id="schema-status" role="status" className={`mt-1.5 text-[0.88rem] ${problem || error ? "text-bad" : "text-ok"}`}>
        {problem || error || (value.trim() ? "Valid JSON." : "")}
      </p>
    </div>
  );
}
