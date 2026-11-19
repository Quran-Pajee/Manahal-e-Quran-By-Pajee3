import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Notice } from "@/components/app/ui";
import { appLang, requireUser } from "@/lib/users";
import { QUIZ_SLOTS } from "@/lib/lms";
import { app } from "@/i18n/app";
import { coursesFor } from "@/content/courses";
import { saveQuiz } from "../../actions";
import { Submit } from "@/components/app/Submit";

export const metadata: Metadata = { title: "Write a quiz" };

const LETTERS = ["A", "B", "C", "D"];

export default async function NewQuizPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  const lang = await appLang();
  const t = app[lang];
  const x = t.teach;

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href="/teach/quizzes">
          {t.nav.quizzes}
        </Link>
      </p>
      <h1 className="text-[1.9rem]">{x.newQuiz}</h1>
      <p className="mt-2 max-w-[62ch] text-muted">{x.newLead}</p>
      <div className="mt-6 max-w-[46rem]">
        {(await searchParams).msg === "need" && <Notice tone="bad">{x.needQuestion}</Notice>}
        <form action={saveQuiz} className="grid gap-4">
          <div className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="title">
                {x.quizTitle}
              </label>
              <input className="field" id="title" name="title" required maxLength={120} dir="auto" />
            </div>
            <div>
              <label className="label" htmlFor="course">
                {t.common.course}
              </label>
              <select className="field" id="course" name="course" defaultValue="">
                <option value="">{t.common.anyCourse}</option>
                {coursesFor(lang).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {Array.from({ length: QUIZ_SLOTS }, (_, i) => (
            <fieldset key={i} className="rounded-xl border border-line bg-white p-5">
              <legend className="float-start mb-3 w-full text-sm font-semibold text-muted">{x.question(i + 1)}</legend>
              <div className="clear-both grid gap-3">
                <input className="field" name={`q${i}`} maxLength={400} dir="auto" aria-label={x.question(i + 1)} required={i === 0} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {LETTERS.map((letter, n) => (
                    <div key={letter}>
                      <label className="label" htmlFor={`o${i}_${n}`}>
                        {x.option(letter)}
                      </label>
                      <input className="field" id={`o${i}_${n}`} name={`o${i}_${n}`} maxLength={200} dir="auto" required={i === 0 && n < 2} />
                    </div>
                  ))}
                </div>
                <div className="max-w-[12rem]">
                  <label className="label" htmlFor={`a${i}`}>
                    {x.correctOpt}
                  </label>
                  <select className="field" id={`a${i}`} name={`a${i}`} defaultValue="" required={i === 0} dir="ltr">
                    <option value="" />
                    {LETTERS.map((letter, n) => (
                      <option key={letter} value={n}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>
          ))}
          <div>
            <Submit className="btn btn-primary">{x.saveQuiz}</Submit>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
