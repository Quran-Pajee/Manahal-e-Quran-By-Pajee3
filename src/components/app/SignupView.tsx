import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/app/Shell";
import { SignupForm } from "@/components/app/AuthForms";
import { accountsReady, appLang, currentUser, homeFor } from "@/lib/users";
import { whatsappLink } from "@/content/site";
import { app } from "@/i18n/app";
import { coursesFor } from "@/content/courses";
import { COUNTRIES } from "@/lib/lead-types";

const ROLES = ["guardian", "student", "teacher"] as const;

/** The sign-up screen. /signup is for parents and group organisers, /signup/student and /signup/teacher for the other two. */
export async function SignupView({ as }: { as?: string }) {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  const lang = await appLang();
  const t = app[lang].auth;
  const role = as === "teacher" ? "teacher" : as === "student" ? "student" : "guardian";
  const ready = accountsReady();
  const label = { guardian: t.roleParent, student: t.roleStudent, teacher: t.roleTeacher };
  const note = { guardian: t.roleParentNote, student: t.roleStudentNote, teacher: t.roleTeacherNote };

  return (
    <AuthShell lang={lang} wide>
      <h1 className="text-[2rem]">{t.signupTitle}</h1>
      <p className="mt-2 max-w-[60ch] text-muted">{t.signupLead}</p>

      <nav aria-label={t.iAm} className="mt-7">
        <p className="label">{t.iAm}</p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <li key={r}>
              <Link
                href={r === "guardian" ? "/signup" : `/signup/${r}`}
                aria-current={r === role ? "true" : undefined}
                className={`flex h-full items-center justify-center rounded-lg border-[1.5px] px-3 py-2.5 text-center text-[0.97rem] font-semibold ${r === role ? "border-emerald bg-emerald text-white" : "border-line bg-white hover:border-emerald"}`}
              >
                {label[r]}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.97rem] text-muted">{note[role]}</p>
      </nav>

      {!ready && (
        <p role="status" className="mt-6 rounded-lg border border-gold bg-white px-4 py-3">
          {t.errUnavailable}{" "}
          {whatsappLink() && (
            <a className="link font-semibold" href={whatsappLink()} rel="noopener">
              WhatsApp
            </a>
          )}
        </p>
      )}
      <div className="mt-6 rounded-xl border border-line bg-white p-5 sm:p-6">
        <SignupForm t={t} role={role} courses={coursesFor(lang).map((c) => ({ value: c.slug, label: c.name }))} countries={COUNTRIES} legal={{ terms: "/terms", privacy: "/privacy-policy" }} />
      </div>
      <p className="mt-5">
        {t.haveAccount}{" "}
        <Link className="link font-semibold" href="/login">
          {t.loginBtn}
        </Link>
      </p>
    </AuthShell>
  );
}
