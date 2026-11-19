import type { Metadata } from "next";
import { SignupView } from "@/components/app/SignupView";

export const metadata: Metadata = { title: "Create your account" };

// Old links used /signup?as=teacher. They still work.
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  return <SignupView as={(await searchParams).as} />;
}
