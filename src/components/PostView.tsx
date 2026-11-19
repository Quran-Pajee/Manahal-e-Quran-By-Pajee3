import Link from "next/link";
import { site } from "@/content/site";
import type { Post } from "@/lib/cms";
import { mdToBlocks, readingMinutes } from "@/lib/markdown";
import { faqSchema, guideSchema, howToSchema } from "@/lib/schema";
import { checkSchemaJson } from "@/lib/cms";
import { longDate } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Blocks, slugify } from "@/components/Blocks";
import { FaqList } from "@/components/Faq";

/**
 * One guide, as visitors see it. The public page and the preview in the admin panel both use this,
 * so a preview looks exactly like the published page.
 */
export function PostView({ post: p, pillar, clusters }: { post: Post; pillar: Post | null; clusters: Post[] }) {
  const blocks = mdToBlocks(p.body);
  const toc = blocks.filter((b) => b.type === "h2").map((b) => (b as { text: string }).text);
  const isPillar = p.kind === "pillar";
  const custom = checkSchemaJson(p.schemaJson);
  const steps = blocks.flatMap((b) => (b.type === "ol" ? b.items : []));
  const updated = p.updatedAt.slice(0, 10);

  const schema: object[] = [];
  if (p.schemaType !== "None") schema.push(guideSchema(p, pillar && !isPillar ? pillar : null, clusters, isPillar));
  if (p.schemaType === "HowTo" && steps.length >= 2) schema.push(howToSchema(p, steps));
  if (p.faqs.length) schema.push(faqSchema(p.faqs));
  if (custom.ok && custom.value) schema.push(...(Array.isArray(custom.value) ? (custom.value as object[]) : [custom.value as object]));

  return (
    <article className="wrap max-w-[52rem] py-8 lg:py-14">
      <Breadcrumbs
        lang="en"
        items={[{ name: "Guides", path: "/blog" }, ...(pillar && !isPillar ? [{ name: pillar.title, path: `/blog/${pillar.slug}` }] : []), { name: p.title, path: `/blog/${p.slug}` }]}
      />
      <h1 className="mt-5 text-[clamp(1.9rem,1.4rem+2.6vw,3.1rem)]">{p.title}</h1>
      <p className="mt-4 text-sm text-muted">
        By the {site.name} teaching team. Updated <time dateTime={updated}>{longDate(updated)}</time>, {readingMinutes(p.body)} minute read.
      </p>

      {/* The short answer comes first so people and AI assistants get it without scrolling */}
      {p.answer && (
        <div className="mt-7 rounded-xl border-s-4 border-gold bg-white px-6 py-5">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">The short answer</h2>
          <p className="mt-1.5 text-[1.12rem] leading-relaxed">{p.answer}</p>
        </div>
      )}

      {pillar && !isPillar && (
        <p className="mt-6 text-[0.97rem]">
          Part of the guide:{" "}
          <Link href={`/blog/${pillar.slug}`} className="link font-semibold">
            {pillar.title}
          </Link>
        </p>
      )}

      {toc.length > 2 && (
        <nav aria-label="In this guide" className="mt-7">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">In this guide</h2>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {toc.map((t) => (
              <li key={t}>
                <a href={`#${slugify(t)}`} className="link">
                  {t}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-4">
        <Blocks blocks={blocks} md />
      </div>

      {clusters.length > 0 && (
        <section className="mt-14" aria-labelledby="series-heading">
          <h2 id="series-heading" className="text-[1.8rem]">
            {isPillar ? "Every guide in this series" : "More in this series"}
          </h2>
          <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {clusters.map((c) => (
              <li key={c.id} className="border-t border-gold pt-4">
                <h3 className="text-[1.3rem]">
                  <Link href={`/blog/${c.slug}`} className="underline-offset-4 hover:underline">
                    {c.title}
                  </Link>
                </h3>
                <p className="mt-1.5 text-[0.97rem] text-muted">{c.excerpt}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.faqs.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[1.8rem]">Related questions</h2>
          <div className="mt-5">
            <FaqList faqs={p.faqs} />
          </div>
        </section>
      )}

      {schema.length > 0 && <JsonLd data={schema} />}
    </article>
  );
}
