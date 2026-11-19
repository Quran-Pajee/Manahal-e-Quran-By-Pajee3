import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/app/Shell";
import { appLang } from "@/lib/users";
import { ForgotPasswordForm } from "@/components/app/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage() {
  const lang = await appLang();
  return (
    <AuthShell lang={lang}>
      <h1 className="text-[2rem]">Forgot your password?</h1>
      <p className="mt-2 text-muted">Students, parents and teachers can request help recovering their account.</p>
      <div className="mt-7 rounded-xl border border-line bg-white p-5 sm:p-6">
        <ForgotPasswordForm />
      </div>
      <div className="mt-5 rounded-xl border border-line bg-white p-5">
        <h2 className="font-semibold">Administrator access</h2>
        <p className="mt-2 text-muted">Super Admin credentials are managed securely in Vercel Environment Variables (ADMIN_EMAIL and ADMIN_PASSWORD). Contact the site owner to update them. Staff accounts require assistance from an authorized administrator.</p>
      </div>
      <p className="mt-5"><Link className="link" href="/login">Back to login</Link></p>
    </AuthShell>
  );
}
