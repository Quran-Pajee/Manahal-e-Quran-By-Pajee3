import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta, longDate } from "@/lib/seo";
import { site } from "@/content/site";
import { publishedPosts, type Post } from "@/lib/cms";
import { readingMinutes } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHead, TrialSection } from "@/components/Sections";
import { PageSchema } from "@/components/PageSchema";

export const generateMetadata = () =>
  pageMeta({
    translated: false,
    title: "Quran Learning Guides for Parents and Adults",
    description: `Practical guides to learning the Quran online: Tajweed rules, Hifz and revision, what classes cost, when to start and how to choose a teacher.`,
    path: "/blog",
  });

function Item({ p }: { p: Post }) {
  return (
    <li className="border-t border-line py-5">
      <h3 className="text-[1.4rem]">
        <Link href={`/blog/${p.slug}`} className="underline-offset-4 hover:underline">
          {p.title}
        </Link>
      </h3>
      <p className="mt-1.5 max-w-[68ch] text-muted">{p.excerpt}</p>
      <p className="mt-1.5 text-sm text-muted">
        Updated {longDate(p.updatedAt.slice(0, 10))}, {readingMinutes(p.body)} minute read
      </p>
    </li>
  );
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  // Guides are written in English. Other languages do not have this page.
  if ((await params).lang !== "en") notFound();
  const all = await publishedPosts();
  const pillars = all.filter((p) => p.kind === "pillar").sort((a, b) => a.title.localeCompare(b.title));
  const inSeries = new Set(pillars.flatMap((pl) => all.filter((p) => p.parentId === pl.id).map((p) => p.id)));
  const others = all.filter((p) => p.kind !== "pillar" && !inSeries.has(p.id));

  return (
    <>
      <PageHead
        lang="en"
        crumbs={<Breadcrumbs lang="en" items={[{ name: "Guides", path: "/blog" }]} />}
        title="Guides for parents and learners"
        lead="Straight answers to the questions families ask before and during Quran study. Each subject has one complete guide, with shorter guides that go into each question in depth."
      />
      <div className="wrap max-w-[60rem] py-10 lg:py-14">
        {pillars.map((pl) => {
          const clusters = all.filter((p) => p.parentId === pl.id).sort((a, b) => a.title.localeCompare(b.title));
          return (
            <section key={pl.id} className="mb-14" aria-labelledby={`s-${pl.slug}`}>
              <h2 id={`s-${pl.slug}`} className="text-[clamp(1.7rem,1.4rem+1.3vw,2.2rem)]">
                <Link href={`/blog/${pl.slug}`} className="underline-offset-4 hover:underline">
                  {pl.title}
                </Link>
              </h2>
              <p className="mt-2 max-w-[68ch] text-lg text-muted">{pl.excerpt}</p>
              <Link href={`/blog/${pl.slug}`} className="link mt-3 inline-block font-semibold">
                Read the complete guide
              </Link>
              {clusters.length > 0 && <ul className="mt-6 border-b border-line">{clusters.map((p) => <Item key={p.id} p={p} />)}</ul>}
            </section>
          );
        })}
        {others.length > 0 && (
          <section aria-labelledby="s-more">
            <h2 id="s-more" className="text-[clamp(1.7rem,1.4rem+1.3vw,2.2rem)]">
              {pillars.length ? "More guides" : "All guides"}
            </h2>
            <ul className="mt-5 border-b border-line">{others.map((p) => <Item key={p.id} p={p} />)}</ul>
          </section>
        )}
      </div>
      <PageSchema lang="en" path="/blog" />
      <TrialSection lang="en" source="blog" />
    </>
  );
}
