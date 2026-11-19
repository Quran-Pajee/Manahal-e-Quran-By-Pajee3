import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { getPost } from "@/lib/cms";
import { EditorPage } from "../EditorPage";

export const metadata = { title: "Edit page" };

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const me = await requireStaff();
  const post = await getPost((await params).id);
  if (!post) notFound();
  // Editors may delete their drafts. Deleting a live page is for admins.
  return <EditorPage post={post} kind={post.kind} msg={(await searchParams).msg} canDelete={me.role === "admin" || post.status === "draft"} />;
}
