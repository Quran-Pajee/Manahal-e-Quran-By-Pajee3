import { notFound } from "next/navigation";
import { meta } from "@/lib/seo";
import { library } from "@/content/library";
import { family, publishedPost, publishedPosts } from "@/lib/cms";
import { PostView } from "@/components/PostView";
import { TrialSection } from "@/components/Sections";

/** The built-in guides are prepared when the site is built. Guides added later in the admin panel are prepared on their first visit. */
export const generateStaticParams = ({ params }: { params: { lang: string } }) => (params.lang === "en" ? library.map((p) => ({ slug: p.slug })) : []);

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await publishedPost((await params).slug);
  if (!p) return {};
  return meta({
    translated: false,
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.excerpt,
    path: `/blog/${p.slug}`,
    type: "article",
    published: (p.publishedAt ?? p.createdAt).slice(0, 10),
    modified: p.updatedAt.slice(0, 10),
    noindex: p.noindex,
    canonical: p.canonical || undefined,
    image: p.ogImage || undefined,
  });
}

export default async function PostPage({ params }: Props) {
  const prm = await params;
  // Guides are written in English. Other languages do not have this page.
  if (prm.lang !== "en") notFound();
  const all = await publishedPosts();
  const p = all.find((x) => x.slug === prm.slug);
  if (!p) notFound();
  const { pillar, clusters } = family(all, p);

  return (
    <>
      <PostView post={p} pillar={pillar} clusters={clusters} />
      <TrialSection lang="en" source={`blog:${p.slug}`} />
    </>
  );
}
