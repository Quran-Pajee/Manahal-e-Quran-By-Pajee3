import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { QuizReview } from "@/components/app/Progress";
import { appLang, requireUser } from "@/lib/users";
import { canSeeStudent, getAttempt, getQuiz } from "@/lib/lms";
import { pct, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";

export const metadata: Metadata = { title: "Quiz result" };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("portal");
  if (user.status !== "active") redirect("/portal");
  const attempt = await getAttempt((await params).id);
  const student = attempt ? await canSeeStudent(user, attempt.studentId) : null;
  if (!attempt || !student) notFound();
  const quiz = await getQuiz(attempt.quizId);
  const lang = await appLang();
  const t = app[lang];
  const again = quiz ? `/portal/quiz/${quiz.id}?learner=${student.id}${attempt.assignmentId ? `&a=${attempt.assignmentId}` : ""}` : null;

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href={`/portal/learner/${student.id}#quizzes`}>
          {t.quiz.backToProgress}
        </Link>
      </p>
      <p className="text-sm font-semibold text-muted">{t.quiz.resultTitle}</p>
      <h1 className="mt-1 text-[1.9rem]" dir="auto">
        {quiz?.title ?? t.learner.quizzesH}
      </h1>
      <p className="mt-1 text-muted">
        <span dir="auto">{t.quiz.learner(student.name)}</span> · {shortDate(attempt.takenAt, lang)}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-line bg-white p-5 sm:p-6">
        <div>
          <p className="font-display text-[2.6rem] font-semibold leading-none tabular-nums">
            <bdi dir="ltr">{pct((attempt.score / Math.max(attempt.total, 1)) * 100)}</bdi>
          </p>
          <p className="mt-2 text-muted">{t.quiz.scoreLine(attempt.score, attempt.total)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {again && (
            <Link href={again} className="btn btn-line">
              {t.quiz.again}
            </Link>
          )}
          <Link href={`/portal/learner/${student.id}`} className="btn btn-emerald">
            {t.quiz.backToProgress}
          </Link>
        </div>
      </div>

      {quiz && quiz.questions.length === attempt.total && (
        <div className="mt-6 max-w-[46rem]">
          <QuizReview t={t} quiz={quiz} attempt={attempt} />
        </div>
      )}
    </AppShell>
  );
}
