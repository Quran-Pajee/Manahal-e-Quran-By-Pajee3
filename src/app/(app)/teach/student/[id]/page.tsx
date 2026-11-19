import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Card } from "@/components/app/ui";
import { LessonRecord, OralTests, QuizResults, StatTiles } from "@/components/app/Progress";
import { appLang, requireUser } from "@/lib/users";
import { assessmentsOfStudent, attemptsOfStudent, canSeeStudent, lessonsOfStudent, statsFor, teacherClass } from "@/lib/lms";
import { courseName } from "@/lib/format";
import { app } from "@/i18n/app";
import { removeTest } from "../../actions";

export const metadata: Metadata = { title: "Learner" };

/** A learner's progress as the teacher sees it. Family contact details are not shown here. */
export default async function TeacherStudentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ class?: string }> }) {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  const student = await canSeeStudent(user, (await params).id);
  if (!student) notFound();
  const lang = await appLang();
  const t = app[lang];
  const x = t.teach;
  const classId = (await searchParams).class ?? "";
  const cls = classId ? await teacherClass(user.id, classId) : null;
  const here = `/teach/student/${student.id}${cls ? `?class=${cls.id}` : ""}`;

  // A teacher sees their own classes' records for this learner, not those of the learner's other teachers.
  const [stats, lessons, attempts, tests] = await Promise.all([statsFor([student.id], user.id), lessonsOfStudent(student.id, user.id), attemptsOfStudent(student.id, user.id), assessmentsOfStudent(student.id, user.id)]);
  const facts = [courseName(student.course, lang), t.common.kinds[student.classKind], student.birthYear ? x.born(student.birthYear) : "", student.gender === "male" ? t.common.male : student.gender === "female" ? t.common.female : ""].filter(Boolean);

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href={cls ? `/teach/class/${cls.id}` : "/teach"}>
          {cls ? x.backToClass : x.classesH}
        </Link>
      </p>
      <h1 className="text-[1.9rem]" dir="auto">
        {student.name}
      </h1>
      <p className="mt-1 text-muted">{facts.join(" · ")}</p>
      {(student.level || student.notes) && (
        <dl className="mt-4 grid max-w-[46rem] grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.97rem]">
          {student.level && (
            <>
              <dt className="text-muted">{x.level}</dt>
              <dd>{t.common.levels[student.level] ?? student.level}</dd>
            </>
          )}
          {student.notes && (
            <>
              <dt className="text-muted">{x.notesFromFamily}</dt>
              <dd dir="auto">{student.notes}</dd>
            </>
          )}
        </dl>
      )}

      <div className="mt-6 grid gap-5">
        <StatTiles t={t} lang={lang} stats={stats.get(student.id)!} />
        <Card title={t.learner.lessonsH}>
          <LessonRecord t={t} lang={lang} lessons={lessons} />
        </Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title={t.learner.resultsH}>
            <QuizResults t={t} lang={lang} attempts={attempts} reviewHref={(id) => `/teach/result/${id}`} />
          </Card>
          <Card title={t.learner.testsH}>
            <OralTests
              t={t}
              lang={lang}
              tests={tests}
              remove={(test) => (
                <form action={removeTest}>
                  <input type="hidden" name="id" value={test.id} />
                  <input type="hidden" name="back" value={here} />
                  <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                    {t.common.remove}
                  </button>
                </form>
              )}
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
