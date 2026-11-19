import { AppShell, LangSwitch } from "./Shell";
import { Card, Notice } from "./ui";
import { PasswordField } from "./PasswordField";
import type { Lang } from "@/i18n";
import { app } from "@/i18n/app";
import type { User } from "@/lib/users";
import { COUNTRIES } from "@/lib/lead-types";
import { coursesFor } from "@/content/courses";
import { saveProfile, savePassword } from "@/app/(app)/actions";

/** Profile, language and password. The same screen for families, students and teachers. */
export function SettingsView({ lang, user, query }: { lang: Lang; user: User; query: { profile?: string; pw?: string } }) {
  const t = app[lang];
  const s = t.settings;
  const teacher = user.role === "teacher";
  const taught = user.teaches.split(",");

  return (
    <AppShell lang={lang} user={user}>
      <h1 className="text-[1.9rem]">{s.title}</h1>
      <div className="mt-6 grid max-w-[46rem] gap-5">
        <Card title={s.profileH}>
          {query.profile === "saved" && <Notice>{t.common.saved}</Notice>}
          {query.profile === "bad" && <Notice tone="bad">{t.auth.errPhone}</Notice>}
          <form action={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                {s.name}
              </label>
              <input className="field" id="name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                {s.phone}
              </label>
              <input className="field" id="phone" name="phone" type="tel" dir="ltr" required defaultValue={user.phone} autoComplete="tel" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                {t.auth.email}
              </label>
              <input className="field bg-ivory" id="email" type="email" dir="ltr" value={user.email} readOnly />
            </div>
            <div>
              <label className="label" htmlFor="country">
                {s.country}
              </label>
              <select className="field" id="country" name="country" defaultValue={user.country} dir="ltr">
                <option value="">{t.auth.chooseCountry}</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="timezone">
                {s.timezone}
              </label>
              <input className="field" id="timezone" name="timezone" dir="ltr" maxLength={60} defaultValue={user.timezone} placeholder={s.timezonePh} />
            </div>
            <div>
              <label className="label" htmlFor="preferredTime">
                {teacher ? t.auth.availability : s.preferredTime}
              </label>
              <input className="field" id="preferredTime" name="preferredTime" maxLength={160} defaultValue={user.preferredTime} />
            </div>
            {teacher && (
              <>
                <fieldset className="sm:col-span-2">
                  <legend className="label">{s.teaches}</legend>
                  <div className="mt-1 grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
                    {coursesFor(lang).map((c) => (
                      <label key={c.slug} className="flex items-center gap-2.5 py-1">
                        <input type="checkbox" name="teaches" value={c.slug} defaultChecked={taught.includes(c.slug)} className="h-[1.15rem] w-[1.15rem] accent-[#123D32]" />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="about">
                    {s.about}
                  </label>
                  <textarea className="field" id="about" name="about" rows={4} maxLength={1500} defaultValue={user.about} />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-emerald">
                {t.common.save}
              </button>
            </div>
          </form>
        </Card>

        <Card title={s.langH}>
          <LangSwitch lang={lang} />
        </Card>

        <Card title={s.passwordH} id="password">
          {query.pw === "changed" && <Notice>{s.changed}</Notice>}
          {query.pw === "wrong" && <Notice tone="bad">{s.wrongCurrent}</Notice>}
          {query.pw === "short" && <Notice tone="bad">{s.tooShort}</Notice>}
          <form action={savePassword} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="current">
                {s.current}
              </label>
              <PasswordField className="field" id="current" name="current" dir="ltr" autoComplete="current-password" required />
            </div>
            <div>
              <label className="label" htmlFor="next">
                {s.next}
              </label>
              <PasswordField className="field" id="next" name="next" dir="ltr" autoComplete="new-password" required minLength={8} maxLength={200} aria-describedby="next-hint" />
              <p id="next-hint" className="mt-1.5 text-[0.9rem] text-muted">
                {t.auth.passwordHint}
              </p>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-emerald">
                {s.change}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
