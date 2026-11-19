import { redirect } from "next/navigation";
import { adminConfigured, session } from "@/lib/auth";
import { storageMode } from "@/lib/db";
import { setupStatus } from "@/lib/setup";
import { login } from "../actions";
import { Mark } from "@/components/Logo";
import { site } from "@/content/site";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; staff?: string }> }) {
  const me = await session();
  if (me) redirect(me.role === "admin" ? "/admin" : "/admin/content");
  const { error, staff } = await searchParams;
  const ownerLogin = adminConfigured();
  const staffLogin = storageMode() !== "none";
  // Anything the live site still needs is listed here, with the exact steps, instead of forms quietly failing.
  const missing = (await setupStatus()).filter((i) => !i.ok && i.key !== "alerts" && i.key !== "accounts");

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_18px_50px_rgb(18_61_50/0.1)]">
          <Mark className="h-12 w-12" />
          <h1 className="mt-5 text-[1.8rem]">{site.shortName} admin</h1>
          <p className="mt-1 text-muted">For the owner, admins and editors.</p>

          {(ownerLogin || staffLogin) && (
            <form action={login} className="mt-6 grid gap-4">
              {staffLogin && (
                <div>
                  <label htmlFor="email" className="label">
                    Email {ownerLogin && <span className="font-normal text-muted">(staff accounts only)</span>}
                  </label>
                  <input id="email" name="email" type="email" className="field" autoComplete="username" maxLength={200} defaultValue="" aria-describedby="email-hint" required={!ownerLogin} />
                  {ownerLogin && (
                    <p id="email-hint" className="mt-1 text-[0.88rem] text-muted">
                      Leave empty to sign in with the owner password.
                    </p>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input id="password" name="password" type="password" className="field" autoComplete="current-password" required aria-describedby={error ? "login-error" : undefined} />
              </div>
              {error && (
                <p id="login-error" role="alert" className="rounded-md bg-bad/10 px-3 py-2 text-[0.95rem] text-bad">
                  {error === "locked" ? "Too many attempts. Wait 15 minutes and try again." : staff ? "That email and password do not match an active staff account." : "That password is not correct."}
                </p>
              )}
              <button type="submit" className="btn btn-emerald w-full">
                Sign in
              </button>
            </form>
          )}
        </div>

        {missing.length > 0 && (
          <section className="mt-5 rounded-2xl border border-gold bg-white p-6" aria-labelledby="setup-heading">
            <h2 id="setup-heading" className="font-sans text-[1.05rem] font-semibold text-emerald">
              {missing.length === 1 ? "One setup step is left" : `${missing.length} setup steps are left`}
            </h2>
            <p className="mt-1 text-[0.95rem] text-muted">Until these are done, parts of the site will not work.</p>
            <ol className="mt-4 grid gap-4">
              {missing.map((item) => (
                <li key={item.key} className="border-t border-line pt-4">
                  <p className="font-semibold text-bad">{item.title}</p>
                  <p className="mt-1 text-[0.95rem]">{item.fix}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
