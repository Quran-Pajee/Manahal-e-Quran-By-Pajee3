import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignupView } from "@/components/app/SignupView";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role !== "teacher" && role !== "student") notFound();
  return <SignupView as={role} />;
}
