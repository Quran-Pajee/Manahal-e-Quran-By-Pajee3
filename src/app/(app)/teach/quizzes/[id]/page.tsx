import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Notice } from "@/components/app/ui";
import { QuizReview } from "@/components/app/Progress";
import { appLang, requireUser } from "@/lib/users";
import { getQuiz } from "@/lib/lms";
import { courseName } from "@/lib/format";
import { app } from "@/i18n/app";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizKeyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; dropped?: string }> }) {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  const quiz = await getQuiz((await params).id);
  if (!quiz || (quiz.source === "teacher" && quiz.createdBy !== user.id)) notFound();
  const lang = await appLang();
  const t = app[lang];
  const { msg, dropped } = await searchParams;
  const left = Math.min(Math.max(Math.floor(Number(dropped)) || 0, 0), 99);

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href="/teach/quizzes">
          {t.nav.quizzes}
        </Link>
      </p>
      {msg === "saved" && <Notice>{t.teach.quizSaved}</Notice>}
      {msg === "saved" && left > 0 && <Notice tone="bad">{t.teach.dropped(left)}</Notice>}
      <p className="text-sm font-semibold text-muted">{t.quiz.answerKey}</p>
      <h1 className="mt-1 text-[1.9rem]" dir="auto">
        {quiz.title}
      </h1>
      <p className="mt-1 text-muted">{[courseName(quiz.course, lang), t.common.questionsN(quiz.questions.length)].filter(Boolean).join(" · ")}</p>
      <div className="mt-6 max-w-[46rem]">
        <QuizReview t={t} quiz={quiz} />
      </div>
    </AppShell>
  );
}
