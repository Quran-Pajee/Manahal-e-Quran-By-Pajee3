import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { storageMode } from "@/lib/db";
import { EditorPage } from "../EditorPage";

export const metadata = { title: "New page" };

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  await requireStaff();
  if (storageMode() === "none") redirect("/admin/content");
  return <EditorPage post={null} kind={(await searchParams).kind ?? "article"} canDelete={false} />;
}
