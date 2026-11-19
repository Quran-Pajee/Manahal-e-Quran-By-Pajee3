import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Card } from "@/components/app/ui";
import { LessonRecord, OralTests, QuizResults, StatTiles } from "@/components/app/Progress";
import { appLang, requireUser } from "@/lib/users";
import { assessmentsOfStudent, attemptsOfStudent, canSeeStudent, classesOfStudent, lessonsOfStudent, pendingQuizzes, practiceQuizzes, statsFor } from "@/lib/lms";
import { courseName, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";

export const metadata: Metadata = { title: "Progress" };

export default async function LearnerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("portal");
  if (user.status !== "active") redirect("/portal");
  const student = await canSeeStudent(user, (await params).id);
  if (!student) notFound();
  const lang = await appLang();
  const t = app[lang];
  const l = t.learner;

  const [classes, stats, lessons, waiting, attempts, tests] = await Promise.all([
    classesOfStudent(student.id),
    statsFor([student.id]),
    lessonsOfStudent(student.id),
    pendingQuizzes(student.id),
    attemptsOfStudent(student.id),
    assessmentsOfStudent(student.id),
  ]);
  const lastWithHomework = lessons.find((x) => x.homework);
  // Practice quizzes for the learner's own course come first.
  const practice = [...practiceQuizzes()].sort((a, b) => Number(b.course === student.course) - Number(a.course === student.course));

  return (
    <AppShell lang={lang} user={user}>
      {user.role === "guardian" && (
        <p className="mb-3">
          <Link className="link" href="/portal">
            {l.all}
          </Link>
        </p>
      )}
      <h1 className="text-[1.9rem]" dir="auto">
        {student.name}
      </h1>
      <p className="mt-1 text-muted">{[courseName(student.course, lang), t.common.kinds[student.classKind]].filter(Boolean).join(" · ")}</p>

      <div className="mt-6 grid gap-5">
        <StatTiles t={t} lang={lang} stats={stats.get(student.id)!} />

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title={l.classH}>
            {classes.length === 0 ? (
              <p className="text-muted">{t.portal.noClass}</p>
            ) : (
              <ul className="grid gap-5">
                {classes.map((c) => (
                  <li key={c.id}>
                    <p className="text-[1.05rem] font-semibold" dir="auto">
                      {c.name}
                    </p>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.97rem]">
                      <dt className="text-muted">{l.teacher}</dt>
                      <dd dir="auto">{c.teacherName ?? t.common.none}</dd>
                      <dt className="text-muted">{l.schedule}</dt>
                      <dd dir="auto">{c.schedule || t.common.none}</dd>
                    </dl>
                    {c.meetingUrl ? (
                      <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">
                        {l.join}
                      </a>
                    ) : (
                      <p className="mt-3 text-[0.95rem] text-muted">{l.noLink}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={l.homeworkH}>
            {lastWithHomework ? (
              <>
                <p className="text-[1.05rem]" dir="auto">
                  {lastWithHomework.homework}
                </p>
                <p className="mt-2 text-[0.92rem] text-muted">{shortDate(lastWithHomework.heldOn, lang)}</p>
              </>
            ) : (
              <p className="text-muted">{l.noHomework}</p>
            )}
          </Card>
        </div>

        <Card title={l.quizzesH} id="quizzes">
          <div className="grid gap-7 lg:grid-cols-2">
            <div>
              <h3 className="font-sans text-base font-semibold tracking-normal">{l.assignedH}</h3>
              {waiting.length === 0 ? (
                <p className="mt-2 text-muted">{l.noAssigned}</p>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {waiting.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold" dir="auto">
                          {w.title}
                        </p>
                        {w.dueOn && <p className="text-[0.92rem] text-muted">{l.due(shortDate(w.dueOn, lang))}</p>}
                      </div>
                      <Link href={`/portal/quiz/${w.quizId}?learner=${student.id}&a=${w.id}`} className="btn btn-primary">
                        {l.start}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-7 font-sans text-base font-semibold tracking-normal">{l.resultsH}</h3>
              <div className="mt-2">
                <QuizResults t={t} lang={lang} attempts={attempts} reviewHref={(id) => `/portal/result/${id}`} />
              </div>
            </div>

            <div>
              <h3 className="font-sans text-base font-semibold tracking-normal">{l.practiceH}</h3>
              <p className="mt-1 text-[0.95rem] text-muted">{l.practiceLead}</p>
              <ul className="mt-2 divide-y divide-line">
                {practice.map((quiz) => (
                  <li key={quiz.id} className="flex items-center justify-between gap-4 py-3">
                    <div lang="en" dir="ltr" className="min-w-0 flex-1">
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="text-[0.92rem] text-muted">{quiz.about}</p>
                    </div>
                    <Link href={`/portal/quiz/${quiz.id}?learner=${student.id}`} className="btn btn-line shrink-0">
                      {l.start}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card title={l.lessonsH}>
          <LessonRecord t={t} lang={lang} lessons={lessons} />
        </Card>

        <Card title={l.testsH}>
          <OralTests t={t} lang={lang} tests={tests} />
        </Card>
      </div>
    </AppShell>
  );
}
