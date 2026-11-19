import Link from "next/link";
import type { Lang } from "@/i18n";
import type { App } from "@/i18n/app";
import type { Quiz } from "@/content/quizzes";
import { attendancePct, type Assessment, type Attempt, type AttemptRow, type StudentLesson, type StudentStats } from "@/lib/lms";
import { oneDp, pct, shortDate } from "@/lib/format";
import { AttendancePill, Meter, Tile } from "./ui";

/** The four numbers at the top of every progress page: attendance, lessons, teacher's mark, quiz average. */
export function StatTiles({ t, lang, stats }: { t: App; lang: Lang; stats: StudentStats }) {
  const s = t.stats;
  const att = attendancePct(stats);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-line bg-white p-5">
        <p className="text-[0.95rem] text-muted">{s.attendance}</p>
        <p className="mt-1 font-display text-[2.1rem] font-semibold leading-none tabular-nums">
          <bdi dir="ltr">{att === null ? t.common.none : `${att}%`}</bdi>
        </p>
        <div className="mt-3">
          <Meter value={att} label={s.attendance} />
        </div>
        <p className="mt-2 text-sm text-muted">{stats.lessons ? s.attendanceSub(stats.attended, stats.lessons) : s.noData}</p>
      </div>
      <Tile label={s.lessons} value={String(stats.lessons)} sub={stats.lastLesson ? s.lastLesson(shortDate(stats.lastLesson, lang)) : s.noData} />
      <Tile label={s.rating} value={oneDp(stats.rating) ?? t.common.none} sub={s.ratingSub} />
      <Tile label={s.quizAvg} value={pct(stats.quizAvg) ?? t.common.none} sub={stats.quizzes ? s.quizSub(stats.quizzes) : s.noData} />
    </div>
  );
}

export function LessonRecord({ t, lang, lessons }: { t: App; lang: Lang; lessons: StudentLesson[] }) {
  const l = t.learner;
  if (!lessons.length) return <p className="text-muted">{l.noLessons}</p>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">{t.common.date}</th>
            <th scope="col">{l.topic}</th>
            <th scope="col">{l.attendance}</th>
            <th scope="col">{l.rating}</th>
            <th scope="col">{l.note}</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((x) => (
            <tr key={x.id}>
              <th scope="row" className="whitespace-nowrap">
                {shortDate(x.heldOn, lang)}
              </th>
              <td dir="auto" className="min-w-[14rem]">
                {x.topic}
                {x.homework && (
                  <span className="mt-1 block text-[0.92rem] text-muted">
                    {l.homework}: {x.homework}
                  </span>
                )}
              </td>
              <td>
                <AttendancePill value={x.attendance} label={t.common.attendance[x.attendance] ?? x.attendance} />
              </td>
              <td className="tabular-nums">{x.rating ? <bdi dir="ltr">{x.rating} / 5</bdi> : t.common.none}</td>
              <td dir="auto" className="min-w-[12rem]">
                {x.note || t.common.none}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function QuizResults({ t, lang, attempts, reviewHref }: { t: App; lang: Lang; attempts: AttemptRow[]; reviewHref: (id: string) => string }) {
  const l = t.learner;
  if (!attempts.length) return <p className="text-muted">{l.noResults}</p>;
  return (
    <ul className="divide-y divide-line">
      {attempts.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
          <div>
            <p className="font-semibold" dir="auto">
              {a.title}
            </p>
            <p className="text-[0.92rem] text-muted">
              {shortDate(a.takenAt, lang)} · {a.assignmentId ? l.setByTeacher : l.practice}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold tabular-nums">
              <bdi dir="ltr">
                {a.score} / {a.total}
              </bdi>{" "}
              <span className="font-normal text-muted">
                <bdi dir="ltr">{pct((a.score / Math.max(a.total, 1)) * 100)}</bdi>
              </span>
            </span>
            <Link className="link" href={reviewHref(a.id)}>
              {l.review}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OralTests({ t, lang, tests, remove }: { t: App; lang: Lang; tests: Assessment[]; remove?: (test: Assessment) => React.ReactNode }) {
  const l = t.learner;
  if (!tests.length) return <p className="text-muted">{l.noTests}</p>;
  return (
    <ul className="divide-y divide-line">
      {tests.map((x) => (
        <li key={x.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
          <div>
            <p className="font-semibold" dir="auto">
              {x.title}
            </p>
            <p className="text-[0.92rem] text-muted">{shortDate(x.heldOn, lang)}</p>
            {x.note && (
              <p className="mt-1 max-w-[60ch]" dir="auto">
                {x.note}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold tabular-nums">
              <bdi dir="ltr">
                {x.score} / {x.maxScore}
              </bdi>
            </span>
            {remove?.(x)}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Every question with the correct answer marked. With an attempt, also shows what the learner chose. */
export function QuizReview({ t, quiz, attempt }: { t: App; quiz: Quiz; attempt?: Attempt }) {
  const z = t.quiz;
  // Ready-made quizzes are in English; a teacher's own quiz can be in any language.
  const text = quiz.source === "bank" ? { lang: "en", dir: "ltr" as const } : { dir: "auto" as const };
  return (
    <ol className="grid gap-4">
      {quiz.questions.map((question, i) => {
        const chosen = attempt ? attempt.answers[i] : undefined;
        const right = chosen === question.answer;
        return (
          <li key={i} className="rounded-xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-muted">{z.question(i + 1)}</p>
              {attempt && <span className={`rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${right ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>{right ? z.correct : z.wrong}</span>}
            </div>
            <p className="mt-1.5 text-[1.08rem] font-semibold" {...text}>
              {question.q}
            </p>
            <ul className="mt-3 grid gap-2">
              {question.options.map((option, n) => {
                const isRight = n === question.answer;
                const isChosen = n === chosen;
                return (
                  <li key={n} className={`rounded-lg border px-3.5 py-2 ${isRight ? "border-ok/50 bg-ok/10" : isChosen ? "border-bad/50 bg-bad/10" : "border-line"}`}>
                    <bdi {...text}>{option}</bdi>
                    {(isRight || isChosen) && (
                      <span className={`ms-2 text-[0.85rem] font-semibold ${isRight ? "text-ok" : "text-bad"}`}>
                        {isRight && isChosen ? `${z.yourAnswer} · ${z.rightAnswer}` : isRight ? z.rightAnswer : z.yourAnswer}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {attempt && (chosen === undefined || chosen < 0) && <p className="mt-2 text-[0.92rem] text-muted">{z.notAnswered}</p>}
            {question.explain && (
              <p className="mt-3 text-[0.97rem] text-muted" {...text}>
                {question.explain}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
