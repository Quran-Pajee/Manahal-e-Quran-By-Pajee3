import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { QuizReview } from "@/components/app/Progress";
import { appLang, requireUser } from "@/lib/users";
import { canSeeStudent, getAttempt, getQuiz, teacherCanSeeAttempt } from "@/lib/lms";
import { pct, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";

export const metadata: Metadata = { title: "Quiz result" };

export default async function TeacherResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  const attempt = await getAttempt((await params).id);
  const student = attempt ? await canSeeStudent(user, attempt.studentId) : null;
  if (!attempt || !student || !(await teacherCanSeeAttempt(user.id, attempt.id))) notFound();
  const quiz = await getQuiz(attempt.quizId);
  const lang = await appLang();
  const t = app[lang];

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href={`/teach/student/${student.id}`}>
          <span dir="auto">{student.name}</span>
        </Link>
      </p>
      <p className="text-sm font-semibold text-muted">{t.quiz.resultTitle}</p>
      <h1 className="mt-1 text-[1.9rem]" dir="auto">
        {quiz?.title ?? t.learner.quizzesH}
      </h1>
      <p className="mt-1 text-muted">
        {shortDate(attempt.takenAt, lang)} · {t.quiz.scoreLine(attempt.score, attempt.total)} · <bdi dir="ltr">{pct((attempt.score / Math.max(attempt.total, 1)) * 100)}</bdi>
      </p>
      {quiz && quiz.questions.length === attempt.total && (
        <div className="mt-6 max-w-[46rem]">
          <QuizReview t={t} quiz={quiz} attempt={attempt} />
        </div>
      )}
    </AppShell>
  );
}
