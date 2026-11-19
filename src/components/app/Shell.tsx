import Link from "next/link";
import { Mark } from "@/components/Logo";
import { LANGS, href, langName, type Lang } from "@/i18n";
import { app } from "@/i18n/app";
import { site } from "@/content/site";
import type { User } from "@/lib/users";
import { logOut, setLang } from "@/app/(app)/actions";

/** EN / اردو / العربية buttons. Remembers the choice for the public site and the dashboards. */
export function LangSwitch({ lang, onInk = false }: { lang: Lang; onInk?: boolean }) {
  return (
    <form action={setLang} className="flex items-center gap-1" aria-label={app[lang].nav.language}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="submit"
          name="lang"
          value={l}
          lang={l}
          aria-pressed={l === lang}
          className={`cursor-pointer rounded-md px-2 py-1.5 text-[0.9rem] leading-none ${
            l === lang ? (onInk ? "bg-white text-emerald" : "bg-emerald text-white") : onInk ? "text-white hover:bg-white/10" : "text-emerald hover:bg-wash"
          } ${l === "en" ? "font-sans font-semibold" : ""}`}
        >
          {l === "en" ? "EN" : langName[l]}
        </button>
      ))}
    </form>
  );
}

/** Frame for the student, parent and teacher dashboards. */
export function AppShell({ lang, user, children }: { lang: Lang; user: User; children: React.ReactNode }) {
  const t = app[lang].nav;
  const teacher = user.role === "teacher";
  const base = teacher ? "/teach" : "/portal";
  const links = teacher
    ? user.status === "active"
      ? [
          { href: "/teach", label: t.classes },
          { href: "/teach/quizzes", label: t.quizzes },
          { href: "/teach/settings", label: t.settings },
        ]
      : [{ href: "/teach/settings", label: t.settings }]
    : [
        { href: "/portal", label: t.overview },
        { href: "/portal/fees", label: t.fees },
        { href: "/portal/settings", label: t.settings },
      ];

  return (
    <>
      <header className="on-emerald bg-emerald text-white print:hidden">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <Link href={base} className="flex items-center gap-2.5 font-semibold">
            <Mark light className="h-8 w-8" />
            <span lang="en" dir="ltr">
              {site.shortName}
            </span>
          </Link>
          <nav aria-label={app[lang].portal.title} className="flex flex-wrap items-center gap-1 text-[0.97rem]">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 hover:bg-white/10">
                {l.label}
              </Link>
            ))}
            <a href={href(lang, "/")} className="rounded-md px-3 py-2 hover:bg-white/10">
              {t.site}
            </a>
            <form action={logOut}>
              <button type="submit" className="cursor-pointer rounded-md px-3 py-2 hover:bg-white/10">
                {t.logout}
              </button>
            </form>
            <LangSwitch lang={lang} onInk />
          </nav>
        </div>
      </header>
      <main id="main" className="wrap py-8 lg:py-10">
        {children}
      </main>
    </>
  );
}

/** Frame for the log-in and sign-up pages. */
export function AuthShell({ lang, children, wide = false }: { lang: Lang; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-ivory">
        <div className="wrap flex items-center justify-between gap-4 py-3">
          <a href={href(lang, "/")} className="flex items-center gap-2.5 font-semibold" aria-label={site.name}>
            <Mark className="h-9 w-9" />
            <span lang="en" dir="ltr" className="font-display text-[1.2rem]">
              {site.shortName}
            </span>
          </a>
          <LangSwitch lang={lang} />
        </div>
      </header>
      <main id="main" className={`mx-auto w-full px-5 py-10 sm:py-14 ${wide ? "max-w-[46rem]" : "max-w-[27rem]"}`}>
        {children}
      </main>
    </div>
  );
}
