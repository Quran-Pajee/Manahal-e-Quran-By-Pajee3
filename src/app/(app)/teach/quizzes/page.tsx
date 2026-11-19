import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Card, Notice } from "@/components/app/ui";
import { appLang, requireUser } from "@/lib/users";
import { practiceQuizzes, quizzesOfTeacher } from "@/lib/lms";
import { courseName } from "@/lib/format";
import { app } from "@/i18n/app";
import { removeQuiz } from "../actions";

export const metadata: Metadata = { title: "Quizzes" };

export default async function QuizzesPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  const lang = await appLang();
  const t = app[lang];
  const x = t.teach;
  const own = await quizzesOfTeacher(user.id);
  const { msg } = await searchParams;

  return (
    <AppShell lang={lang} user={user}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem]">{t.nav.quizzes}</h1>
          <p className="mt-2 max-w-[60ch] text-muted">{x.quizzesLead}</p>
        </div>
        <Link href="/teach/quizzes/new" className="btn btn-primary">
          {x.newQuiz}
        </Link>
      </div>
      <div className="mt-6">
        {msg === "removed" && <Notice>{x.removed}</Notice>}
        {msg === "inuse" && <Notice tone="info">{x.quizInUse}</Notice>}
        {msg === "notremoved" && <Notice tone="info">{x.notRemoved}</Notice>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={x.ownH}>
          {own.length === 0 ? (
            <p className="text-muted">{x.noOwn}</p>
          ) : (
            <ul className="divide-y divide-line">
              {own.map((quiz) => (
                <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link className="link font-semibold" href={`/teach/quizzes/${quiz.id}`} dir="auto">
                      {quiz.title}
                    </Link>
                    <p className="text-[0.92rem] text-muted">{[courseName(quiz.course, lang), t.common.questionsN(quiz.questions.length)].filter(Boolean).join(" · ")}</p>
                  </div>
                  <form action={removeQuiz}>
                    <input type="hidden" name="id" value={quiz.id} />
                    <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                      {t.common.remove}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={x.bankH}>
          <ul className="divide-y divide-line">
            {practiceQuizzes().map((quiz) => (
              <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold" lang="en" dir="ltr">
                    {quiz.title}
                  </p>
                  <p className="text-[0.92rem] text-muted">{[courseName(quiz.course, lang), t.common.questionsN(quiz.questions.length)].filter(Boolean).join(" · ")}</p>
                </div>
                <Link className="link" href={`/teach/quizzes/${quiz.id}`}>
                  {x.view}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
