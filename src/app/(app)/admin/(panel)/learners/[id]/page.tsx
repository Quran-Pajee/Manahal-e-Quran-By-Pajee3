import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getUser } from "@/lib/users";
import { assessmentsOfStudent, attemptsOfStudent, classesOfStudent, getStudent, lessonsOfStudent, statsFor } from "@/lib/lms";
import { LessonRecord, OralTests, StatTiles } from "@/components/app/Progress";
import { courseName, pct, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";

export const metadata = { title: "Learner" };

export default async function AdminLearnerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const student = await getStudent((await params).id);
  if (!student) notFound();
  const t = app.en;
  const [account, classes, stats, lessons, attempts, tests] = await Promise.all([
    getUser(student.userId),
    classesOfStudent(student.id),
    statsFor([student.id]),
    lessonsOfStudent(student.id),
    attemptsOfStudent(student.id),
    assessmentsOfStudent(student.id),
  ]);

  return (
    <>
      <p className="mb-3">
        <Link className="link" href="/admin/performance">
          Performance
        </Link>
      </p>
      <h1 className="text-[1.9rem]">{student.name}</h1>
      <p className="mt-1 text-muted">
        {[courseName(student.course), t.common.kinds[student.classKind], student.birthYear && `born ${student.birthYear}`, t.common.levels[student.level]].filter(Boolean).join(" · ")}
        {account && (
          <>
            {" · account: "}
            <Link className="link" href={`/admin/people/${account.id}`}>
              {account.name}
            </Link>
          </>
        )}
      </p>
      <p className="mt-2">
        {classes.length ? (
          classes.map((c, n) => (
            <span key={c.id}>
              {n > 0 && ", "}
              <Link className="link" href={`/admin/classes/${c.id}`}>
                {c.name}
              </Link>
              {c.teacherName && <span className="text-muted"> with {c.teacherName}</span>}
            </span>
          ))
        ) : (
          <Link className="link" href={`/admin/classes?learner=${student.id}#new`}>
            Not in a class yet. Create a class for this learner
          </Link>
        )}
      </p>

      <div className="mt-6 grid gap-5">
        <StatTiles t={t} lang="en" stats={stats.get(student.id)!} />
        <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-sans text-[1.1rem] font-semibold tracking-normal">Lesson record</h2>
          <LessonRecord t={t} lang="en" lessons={lessons} />
        </section>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-2 font-sans text-[1.1rem] font-semibold tracking-normal">Quiz results</h2>
            {attempts.length === 0 ? (
              <p className="text-muted">No quizzes taken yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {attempts.map((a) => (
                  <li key={a.id} className="flex flex-wrap justify-between gap-3 py-2.5">
                    <span>
                      <span className="font-semibold" dir="auto">
                        {a.title}
                      </span>
                      <span className="text-muted">
                        {" "}
                        · {shortDate(a.takenAt)} · {a.assignmentId ? "set by teacher" : "practice"}
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {a.score} / {a.total} <span className="text-muted">{pct((a.score / Math.max(a.total, 1)) * 100)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="mb-2 font-sans text-[1.1rem] font-semibold tracking-normal">Oral tests</h2>
            <OralTests t={t} lang="en" tests={tests} />
          </section>
        </div>
      </div>
    </>
  );
}
