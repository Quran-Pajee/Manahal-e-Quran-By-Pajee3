import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/app/Shell";
import { LoginForm } from "@/components/app/AuthForms";
import { accountsReady, appLang, currentUser, homeFor } from "@/lib/users";
import { app } from "@/i18n/app";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  const lang = await appLang();
  const t = app[lang].auth;

  return (
    <AuthShell lang={lang}>
      <h1 className="text-[2rem]">{t.loginTitle}</h1>
      <p className="mt-2 text-muted">{t.loginLead}</p>
      {!accountsReady() && (
        <p role="status" className="mt-6 rounded-lg border border-gold bg-white px-4 py-3">
          {t.errUnavailable}
        </p>
      )}
      <div className="mt-7 rounded-xl border border-line bg-white p-5 sm:p-6">
        <LoginForm t={t} />
      </div>
      <p className="mt-5">
        {t.noAccount}{" "}
        <Link className="link font-semibold" href="/signup">
          {t.createOne}
        </Link>
      </p>
      <p className="mt-3 text-[0.95rem] text-muted">{t.forgot}</p>
    </AuthShell>
  );
}
