import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { appLang, requireUser } from "@/lib/users";
import { assignmentFor, canSeeStudent, getQuiz } from "@/lib/lms";
import { app } from "@/i18n/app";
import { submitQuiz } from "../../actions";
import { Submit } from "@/components/app/Submit";

export const metadata: Metadata = { title: "Quiz" };

export default async function TakeQuiz({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ learner?: string; a?: string }> }) {
  const user = await requireUser("portal");
  if (user.status !== "active") redirect("/portal");
  const { learner = "", a = "" } = await searchParams;
  const [student, quiz] = await Promise.all([canSeeStudent(user, learner), getQuiz((await params).id)]);
  if (!student || !quiz) notFound();
  const assignment = a ? await assignmentFor(student.id, a) : null;
  if (quiz.source === "teacher" && (!assignment || assignment.quizId !== quiz.id)) notFound();
  const lang = await appLang();
  const t = app[lang];
  // Ready-made quizzes are written in English; a teacher's own quiz may be in any language.
  const quizLang = quiz.source === "bank" ? { lang: "en", dir: "ltr" as const } : { dir: "auto" as const };

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href={`/portal/learner/${student.id}`}>
          {t.quiz.backToProgress}
        </Link>
      </p>
      <h1 className="text-[1.9rem]" {...quizLang}>
        {quiz.title}
      </h1>
      <p className="mt-1 text-muted">
        <span dir="auto">{t.quiz.learner(student.name)}</span> · {t.common.questionsN(quiz.questions.length)}
      </p>
      <p className="mt-4">{t.quiz.intro}</p>

      <form action={submitQuiz} className="mt-6 grid max-w-[46rem] gap-4">
        <input type="hidden" name="quiz" value={quiz.id} />
        <input type="hidden" name="learner" value={student.id} />
        {assignment && <input type="hidden" name="assignment" value={assignment.id} />}
        {quiz.questions.map((question, i) => (
          <fieldset key={i} className="rounded-xl border border-line bg-white p-5">
            <legend className="float-start mb-3 w-full">
              <span className="block text-sm font-semibold text-muted">{t.quiz.question(i + 1)}</span>
              <span className="mt-1 block text-[1.1rem] font-semibold" {...quizLang}>
                {question.q}
              </span>
            </legend>
            <div className="clear-both grid gap-2">
              {question.options.map((option, n) => (
                <label key={n} {...quizLang} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3.5 py-2.5 hover:border-emerald has-checked:border-leaf has-checked:bg-wash">
                  <input type="radio" name={`q${i}`} value={n} className="h-[1.15rem] w-[1.15rem] shrink-0 accent-[#123D32]" />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div>
          <Submit className="btn btn-primary">{t.quiz.finish}</Submit>
        </div>
      </form>
    </AppShell>
  );
}
