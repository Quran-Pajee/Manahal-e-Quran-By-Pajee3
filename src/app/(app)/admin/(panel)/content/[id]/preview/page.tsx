import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { allPosts, family, getPost } from "@/lib/cms";
import { PostView } from "@/components/PostView";

export const metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Shows a guide exactly as visitors will see it, whether or not it is published. Staff only. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const post = await getPost((await params).id);
  if (!post) notFound();
  // Other pages are listed in the preview only if they are published, as they would be on the live site.
  const others = (await allPosts()).filter((p) => p.status === "published" || p.id === post.id);
  const { pillar, clusters } = family(others, post);
  return (
    <div className="-mx-5 -my-8 sm:-mx-8 lg:-my-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold bg-gold/20 px-5 py-3 sm:px-8">
        <p className="font-semibold text-emerald">{post.status === "published" ? "Preview of a published page" : "Preview of a draft: visitors cannot see this page yet"}</p>
        <Link href={`/admin/content/${post.id}`} className="btn btn-emerald min-h-[2.5rem]">
          Back to editing
        </Link>
      </div>
      <div className="bg-ivory">
        <PostView post={post} pillar={pillar} clusters={clusters} />
      </div>
    </div>
  );
}
