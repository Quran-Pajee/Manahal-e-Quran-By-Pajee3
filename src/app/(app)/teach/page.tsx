import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app/Shell";
import { Tile } from "@/components/app/ui";
import { appLang, requireUser } from "@/lib/users";
import { classesOfTeacher, teacherTable } from "@/lib/lms";
import { courseName, pct, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";

export const metadata: Metadata = { title: "Teacher dashboard" };

export default async function TeachHome() {
  const user = await requireUser("teach");
  const lang = await appLang();
  const t = app[lang];
  const x = t.teach;

  if (user.status !== "active") {
    const pending = user.status === "pending";
    return (
      <AppShell lang={lang} user={user}>
        <div className="max-w-[44rem]">
          <h1 className="text-[1.9rem]">{pending ? x.pendingH : x.suspendedH}</h1>
          <p className="mt-3 text-[1.05rem] text-muted">{pending ? x.pending : x.suspended}</p>
        </div>
      </AppShell>
    );
  }

  const [classes, [mine]] = await Promise.all([classesOfTeacher(user.id), teacherTable(user.id)]);

  return (
    <AppShell lang={lang} user={user}>
      <h1 className="text-[1.9rem]">{t.portal.hello(user.name)}</h1>
      <p className="mt-2 text-muted">{x.lead}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Tile label={x.tiles.classes} value={String(mine?.classes ?? 0)} />
        <Tile label={x.tiles.learners} value={String(mine?.learners ?? 0)} />
        <Tile label={x.tiles.lessons30} value={String(mine?.lessons30 ?? 0)} />
        <Tile label={x.tiles.attendance} value={pct(mine?.attendance) ?? t.common.none} />
        <Tile label={x.tiles.quizAvg} value={pct(mine?.quizAvg) ?? t.common.none} />
      </div>

      <h2 className="mt-9 font-sans text-[1.15rem] font-semibold tracking-normal">{x.classesH}</h2>
      {classes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line bg-white p-5 text-muted">{x.noClasses}</p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id} className="flex flex-col rounded-xl border border-line bg-white p-5">
              <h3 className="font-sans text-[1.15rem] font-semibold tracking-normal" dir="auto">
                {c.name}
              </h3>
              <p className="mt-0.5 text-[0.95rem] text-muted">{[t.common.kinds[c.kind], courseName(c.course, lang), t.common.learnersN(c.learners)].filter(Boolean).join(" · ")}</p>
              {c.schedule && (
                <p className="mt-2 text-[0.97rem]" dir="auto">
                  {c.schedule}
                </p>
              )}
              <p className="mt-2 text-[0.92rem] text-muted">{c.lastLesson ? x.lastLesson(shortDate(c.lastLesson, lang)) : x.noLessonYet}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-4">
                <Link href={`/teach/class/${c.id}`} className="btn btn-emerald">
                  {x.open}
                </Link>
                {c.meetingUrl && (
                  <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line">
                    {t.learner.join}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
