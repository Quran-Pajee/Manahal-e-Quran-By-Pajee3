import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { Card, Notice } from "@/components/app/ui";
import { appLang, requireUser } from "@/lib/users";
import { assignmentsOfClass, ATTENDANCE, attendancePct, lessonsOfClass, practiceQuizzes, quizzesOfTeacher, roster, statsFor, teacherClass, todayIn } from "@/lib/lms";
import { Submit } from "@/components/app/Submit";
import { courseName, pct, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";
import { removeAssignment, removeLesson, saveLesson, saveTest, setQuiz } from "../../actions";

export const metadata: Metadata = { title: "Class" };

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  const cls = await teacherClass(user.id, (await params).id);
  if (!cls) notFound();
  const lang = await appLang();
  const t = app[lang];
  const x = t.teach;
  const { msg } = await searchParams;

  const [learners, lessons, assignments, own] = await Promise.all([roster(cls.id), lessonsOfClass(cls.id), assignmentsOfClass(cls.id), quizzesOfTeacher(user.id)]);
  // The numbers here are for this teacher's classes only, even if a learner also studies with someone else.
  const stats = await statsFor(learners.map((s) => s.id), user.id);
  const bank = practiceQuizzes();
  const today = todayIn(user.timezone);
  const notice = new Map([
    ["lesson", x.lessonSaved],
    ["assigned", x.assigned],
    ["test", x.testSaved],
    ["removed", x.removed],
    ["notremoved", x.notRemoved],
  ]);

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-3">
        <Link className="link" href="/teach">
          {x.classesH}
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem]" dir="auto">
            {cls.name}
          </h1>
          <p className="mt-1 text-muted">{[t.common.kinds[cls.kind], courseName(cls.course, lang)].filter(Boolean).join(" · ")}</p>
          {cls.schedule && (
            <p className="text-muted" dir="auto">
              {cls.schedule}
            </p>
          )}
        </div>
        {cls.meetingUrl ? (
          <a href={cls.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {x.joinLink}
          </a>
        ) : (
          <p className="text-[0.95rem] text-muted">{x.noLink}</p>
        )}
      </div>

      <div className="mt-6">
        {msg && notice.has(msg) && <Notice tone={msg === "notremoved" ? "info" : "ok"}>{notice.get(msg)}</Notice>}
        {msg === "testbad" && <Notice tone="bad">{t.auth.errGeneric}</Notice>}
      </div>

      <div className="grid gap-5">
        <Card title={x.rosterH}>
          {learners.length === 0 ? (
            <p className="text-muted">{x.noRoster}</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">{x.learner}</th>
                    <th scope="col">{t.stats.attendance}</th>
                    <th scope="col">{t.stats.lessons}</th>
                    <th scope="col">{t.stats.rating}</th>
                    <th scope="col">{t.stats.quizAvg}</th>
                    <th scope="col">{t.stats.tests}</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((s) => {
                    const n = stats.get(s.id)!;
                    const att = attendancePct(n);
                    return (
                      <tr key={s.id}>
                        <th scope="row">
                          <Link className="link" href={`/teach/student/${s.id}?class=${cls.id}`} dir="auto">
                            {s.name}
                          </Link>
                        </th>
                        <td className="tabular-nums">{att === null ? t.common.none : <bdi dir="ltr">{att}%</bdi>}</td>
                        <td className="tabular-nums">{n.lessons}</td>
                        <td className="tabular-nums">{n.rating === null ? t.common.none : <bdi dir="ltr">{(Math.round(n.rating * 10) / 10).toString()} / 5</bdi>}</td>
                        <td className="tabular-nums">{n.quizAvg === null ? t.common.none : <bdi dir="ltr">{pct(n.quizAvg)}</bdi>}</td>
                        <td className="tabular-nums">{n.testAvg === null ? t.common.none : <bdi dir="ltr">{pct(n.testAvg)}</bdi>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {learners.length > 0 && (
          <Card title={x.logH} id="log">
            {msg === "topic" && <Notice tone="bad">{x.topic}</Notice>}
            <form action={saveLesson} className="grid gap-5">
              <input type="hidden" name="classId" value={cls.id} />
              <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
                <div>
                  <label className="label" htmlFor="heldOn">
                    {t.common.date}
                  </label>
                  <input className="field" id="heldOn" name="heldOn" type="date" dir="ltr" defaultValue={today} max={today} required />
                </div>
                <div>
                  <label className="label" htmlFor="topic">
                    {x.topic}
                  </label>
                  <input className="field" id="topic" name="topic" required maxLength={300} placeholder={x.topicPh} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="homework">
                    {x.homework} <span className="font-normal text-muted">({t.common.optional})</span>
                  </label>
                  <input className="field" id="homework" name="homework" maxLength={400} placeholder={x.homeworkPh} />
                </div>
              </div>

              <div>
                <ul className="grid gap-3">
                  {learners.map((s) => (
                    <li key={s.id} className="grid items-end gap-3 rounded-lg border border-line p-4 sm:grid-cols-[minmax(8rem,1fr)_9rem_7rem_2fr]">
                      <p className="self-center font-semibold" dir="auto">
                        {s.name}
                      </p>
                      <div>
                        <label className="label" htmlFor={`att_${s.id}`}>
                          {t.learner.attendance}
                        </label>
                        <select className="field" id={`att_${s.id}`} name={`att_${s.id}`} defaultValue="present">
                          {ATTENDANCE.map((a) => (
                            <option key={a} value={a}>
                              {t.common.attendance[a]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label" htmlFor={`rate_${s.id}`}>
                          {x.mark}
                        </label>
                        <select className="field" id={`rate_${s.id}`} name={`rate_${s.id}`} defaultValue="" dir="ltr">
                          <option value="">{t.common.none}</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label" htmlFor={`note_${s.id}`}>
                          {x.note} <span className="font-normal text-muted">({t.common.optional})</span>
                        </label>
                        <input className="field" id={`note_${s.id}`} name={`note_${s.id}`} maxLength={400} />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.9rem] text-muted">{x.markHint}</p>
              </div>
              <div>
                <Submit>{x.saveLesson}</Submit>
              </div>
            </form>
          </Card>
        )}

        <Card title={x.recentH}>
          {lessons.length === 0 ? (
            <p className="text-muted">{x.noLessons}</p>
          ) : (
            <ul className="divide-y divide-line">
              {lessons.map((l) => (
                <li key={l.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
                  <div>
                    <p className="text-[0.92rem] text-muted">
                      {shortDate(l.heldOn, lang)} · {x.presentN(l.attended, l.marked)}
                    </p>
                    <p className="font-semibold" dir="auto">
                      {l.topic}
                    </p>
                    {l.homework && (
                      <p className="text-[0.95rem] text-muted" dir="auto">
                        {x.homework}: {l.homework}
                      </p>
                    )}
                  </div>
                  <form action={removeLesson}>
                    <input type="hidden" name="classId" value={cls.id} />
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                      {t.common.remove}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title={x.assignH} id="quiz">
            <form action={setQuiz} className="grid gap-4">
              <input type="hidden" name="classId" value={cls.id} />
              <div>
                <label className="label" htmlFor="quizId">
                  {x.chooseQuiz}
                </label>
                <select className="field" id="quizId" name="quizId" required defaultValue={bank.find((b) => b.course === cls.course)?.id ?? ""}>
                  <option value="" />
                  {own.length > 0 && (
                    <optgroup label={x.ownGroup}>
                      {own.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={x.readyGroup}>
                    {bank.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="dueOn">
                  {x.due} <span className="font-normal text-muted">({t.common.optional})</span>
                </label>
                <input className="field" id="dueOn" name="dueOn" type="date" dir="ltr" min={today} />
              </div>
              <div>
                <Submit>{x.assignBtn}</Submit>
              </div>
            </form>

            {assignments.length > 0 && (
              <>
                <h3 className="mt-7 font-sans text-base font-semibold tracking-normal">{x.assignedH}</h3>
                <ul className="mt-2 divide-y divide-line">
                  {assignments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
                      <div>
                        <Link className="link font-semibold" href={`/teach/quizzes/${a.quizId}`} dir="auto">
                          {a.title}
                        </Link>
                        <p className="text-[0.92rem] text-muted">
                          {x.doneN(a.done, learners.length)}
                          {a.dueOn && ` · ${t.learner.due(shortDate(a.dueOn, lang))}`}
                        </p>
                      </div>
                      <form action={removeAssignment}>
                        <input type="hidden" name="classId" value={cls.id} />
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                          {t.common.remove}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {learners.length > 0 && (
            <Card title={x.testH} id="test">
              <form action={saveTest} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="classId" value={cls.id} />
                <div>
                  <label className="label" htmlFor="studentId">
                    {x.learner}
                  </label>
                  <select className="field" id="studentId" name="studentId" required defaultValue={learners.length === 1 ? learners[0].id : ""}>
                    {learners.length > 1 && <option value="" />}
                    {learners.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="testDate">
                    {t.common.date}
                  </label>
                  <input className="field" id="testDate" name="heldOn" type="date" dir="ltr" defaultValue={today} max={today} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="title">
                    {x.testTitle}
                  </label>
                  <input className="field" id="title" name="title" required maxLength={120} placeholder={x.testTitlePh} />
                </div>
                <div>
                  <label className="label" htmlFor="score">
                    {x.score}
                  </label>
                  <input className="field" id="score" name="score" type="number" dir="ltr" inputMode="decimal" min={0} max={1000} step="0.5" required />
                </div>
                <div>
                  <label className="label" htmlFor="maxScore">
                    {x.outOf}
                  </label>
                  <input className="field" id="maxScore" name="maxScore" type="number" dir="ltr" inputMode="decimal" min={1} max={1000} step="0.5" defaultValue={10} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="testNote">
                    {x.comment} <span className="font-normal text-muted">({t.common.optional})</span>
                  </label>
                  <input className="field" id="testNote" name="note" maxLength={400} />
                </div>
                <div className="sm:col-span-2">
                  <Submit>{x.saveTest}</Submit>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
