import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Card, Meter, Notice } from "@/components/app/ui";
import { appLang, requireUser } from "@/lib/users";
import { attendancePct, classesOfStudent, LEVELS, pendingQuizzes, statsFor, studentsOfUser } from "@/lib/lms";
import { courseName, pct } from "@/lib/format";
import { app } from "@/i18n/app";
import { href } from "@/i18n";
import { coursesFor } from "@/content/courses";
import { addLearner } from "./actions";
import { dueCount } from "@/lib/billing";
import { Submit } from "@/components/app/Submit";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PortalHome({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const user = await requireUser("portal");
  const lang = await appLang();
  const t = app[lang];
  const p = t.portal;

  if (user.status !== "active") {
    return (
      <AppShell lang={lang} user={user}>
        <h1 className="text-[1.9rem]">{t.teach.suspendedH}</h1>
        <p className="mt-3 text-muted">{t.teach.suspended}</p>
      </AppShell>
    );
  }

  const learners = await studentsOfUser(user.id);
  // A student account has one learner, so go straight to their own progress page.
  if (user.role === "student" && learners.length === 1) redirect(`/portal/learner/${learners[0].id}`);

  const stats = await statsFor(learners.map((l) => l.id));
  const extra = await Promise.all(learners.map(async (l) => ({ classes: await classesOfStudent(l.id), waiting: (await pendingQuizzes(l.id)).length })));
  const { added } = await searchParams;
  const toPay = await dueCount(user.id);
  const year = new Date().getFullYear();
  const defaultKind = user.accountKind === "community" ? "community" : learners.length >= 1 ? "family" : "one";

  return (
    <AppShell lang={lang} user={user}>
      <h1 className="text-[1.9rem]">{p.hello(user.name)}</h1>
      <p className="mt-2 text-muted">{p.lead}</p>
      <div className="mt-6">
        {added === "1" && <Notice>{p.added}</Notice>}
        {toPay > 0 && (
          <p className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold bg-white px-4 py-3">
            <span className="font-semibold text-emerald">{t.fees.dueBanner(toPay)}</span>
            <Link href="/portal/fees" className="btn btn-primary min-h-[2.5rem]">
              {t.fees.viewFees}
            </Link>
          </p>
        )}
      </div>

      <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">{p.learnersH}</h2>
      {learners.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line bg-white p-5 text-muted">{p.noLearners}</p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {learners.map((l, i) => {
            const s = stats.get(l.id)!;
            const att = attendancePct(s);
            const { classes, waiting } = extra[i];
            return (
              <li key={l.id} className="flex flex-col rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-sans text-[1.2rem] font-semibold tracking-normal" dir="auto">
                    {l.name}
                  </h3>
                  {waiting > 0 && <span className="rounded-full border border-gold-deep/40 bg-gold/30 px-2.5 py-0.5 text-[0.82rem] font-semibold">{p.quizzesWaiting(waiting)}</span>}
                </div>
                <p className="mt-0.5 text-[0.95rem] text-muted">{[courseName(l.course, lang), t.common.kinds[l.classKind]].filter(Boolean).join(" · ")}</p>

                {classes.length === 0 ? (
                  <p className="mt-3 text-[0.97rem] text-muted">{p.noClass}</p>
                ) : (
                  <ul className="mt-3 grid gap-1 text-[0.97rem]">
                    {classes.map((c) => (
                      <li key={c.id}>
                        <span className="block font-semibold" dir="auto">
                          {c.name}
                        </span>
                        {c.schedule && (
                          <span className="block text-muted" dir="auto">
                            {c.schedule}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted">{t.stats.attendance}</dt>
                    <dd className="font-display text-[1.5rem] font-semibold tabular-nums">{att === null ? t.common.none : <bdi dir="ltr">{att}%</bdi>}</dd>
                    <Meter value={att} label={t.stats.attendance} />
                  </div>
                  <div>
                    <dt className="text-sm text-muted">{t.stats.quizAvg}</dt>
                    <dd className="font-display text-[1.5rem] font-semibold tabular-nums">{s.quizAvg === null ? t.common.none : <bdi dir="ltr">{pct(s.quizAvg)}</bdi>}</dd>
                    <Meter value={s.quizAvg} label={t.stats.quizAvg} />
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-3 pt-1">
                  <Link href={`/portal/learner/${l.id}`} className="btn btn-emerald">
                    {p.view}
                  </Link>
                  {classes[0]?.meetingUrl && (
                    <a href={classes[0].meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line">
                      {t.learner.join}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {(user.role === "guardian" || learners.length === 0) && (
          <Card title={p.addH} id="add">
            <p className="-mt-2 mb-4 text-[0.97rem] text-muted">{p.addLead}</p>
            {added === "bad" && <Notice tone="bad">{t.auth.errName}</Notice>}
            <form action={addLearner} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  {p.learnerName}
                </label>
                <input className="field" id="name" name="name" required minLength={2} maxLength={80} />
              </div>
              <div>
                <label className="label" htmlFor="birthYear">
                  {p.birthYear} <span className="font-normal text-muted">({t.common.optional})</span>
                </label>
                <input className="field" id="birthYear" name="birthYear" type="number" dir="ltr" inputMode="numeric" min={1925} max={year} placeholder={String(year - 8)} />
              </div>
              <div>
                <label className="label" htmlFor="gender">
                  {p.gender}
                </label>
                <select className="field" id="gender" name="gender" defaultValue="">
                  <option value="" />
                  <option value="male">{t.common.male}</option>
                  <option value="female">{t.common.female}</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="course">
                  {t.common.course}
                </label>
                <select className="field" id="course" name="course" defaultValue="">
                  <option value="">{t.auth.anyCourse}</option>
                  {coursesFor(lang).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="level">
                  {p.level}
                </label>
                <select className="field" id="level" name="level" defaultValue="">
                  <option value="" />
                  {LEVELS.map((v) => (
                    <option key={v} value={v}>
                      {t.common.levels[v]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="classKind">
                  {p.classKind}
                </label>
                <select className="field" id="classKind" name="classKind" defaultValue={defaultKind}>
                  {(["one", "family", "community"] as const).map((v) => (
                    <option key={v} value={v}>
                      {t.common.kinds[v]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="teacherPref">
                  {t.auth.teacherPref}
                </label>
                <select className="field" id="teacherPref" name="teacherPref" defaultValue="">
                  <option value="">{t.auth.prefNone}</option>
                  <option value="female">{t.auth.prefFemale}</option>
                  <option value="male">{t.auth.prefMale}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">
                  {p.notes} <span className="font-normal text-muted">({t.common.optional})</span>
                </label>
                <textarea className="field" id="notes" name="notes" rows={2} maxLength={600} />
              </div>
              <div className="sm:col-span-2">
                <Submit>{p.addBtn}</Submit>
              </div>
            </form>
          </Card>
        )}
        <div className="self-start rounded-xl border border-line bg-wash p-5 sm:p-6">
          <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">{p.trialH}</h2>
          <a href={href(lang, "/free-trial")} className="btn btn-primary mt-4">
            {p.trialCta}
          </a>
        </div>
      </div>
    </AppShell>
  );
}
