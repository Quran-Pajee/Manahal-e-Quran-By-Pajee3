import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { allStudents, attendancePct, counts, statsFor, teacherTable } from "@/lib/lms";
import { courseName, oneDp, pct, shortDate } from "@/lib/format";

export const metadata = { title: "Performance" };

function Tile({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-[0.95rem] text-muted">{label}</p>
      <p className="mt-1 font-display text-[2.1rem] font-semibold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-xl border border-line bg-white p-5 hover:border-emerald">
      {body}
    </Link>
  ) : (
    <div className="rounded-xl border border-line bg-white p-5">{body}</div>
  );
}

/** Flags that need the admin's attention are written in words, not only coloured. */
const low = (n: number | null, under: number) => n !== null && n < under;

export default async function PerformancePage() {
  await requireAdmin();
  const [teachers, students, totals] = await Promise.all([teacherTable(), allStudents(), counts()]);
  const stats = await statsFor(students.map((s) => s.id));
  const active = teachers.filter((t) => t.status === "active");
  const stale = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

  return (
    <>
      <h1 className="text-[1.9rem]">Performance</h1>
      <p className="mt-2 max-w-[72ch] text-muted">
        These numbers come from what teachers record after each lesson and from quizzes learners take. Attendance counts “present” and “late”. A teacher’s quiz average is the average of their current learners’ quiz scores.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Running classes" value={String(totals.activeClasses)} href="/admin/classes" />
        <Tile label="Learners" value={String(students.length)} sub={`${totals.accounts} accounts in total`} />
        <Tile label="Learners not in a class" value={String(totals.unplaced)} sub={totals.unplaced ? "Place them with a teacher" : "Everyone is placed"} href="/admin/classes" />
        <Tile label="Teachers waiting for approval" value={String(totals.pendingTeachers)} href="/admin/people" />
      </div>

      <section className="mt-9">
        <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Teachers</h2>
        {active.length === 0 ? (
          <p className="mt-3 text-muted">No approved teacher yet.</p>
        ) : (
          <div className="tbl-wrap mt-4">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Teacher</th>
                  <th scope="col">Classes</th>
                  <th scope="col">Learners</th>
                  <th scope="col">Lessons, 30 days</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">Learners’ quiz average</th>
                  <th scope="col">Last lesson</th>
                </tr>
              </thead>
              <tbody>
                {active.map((t) => {
                  const quiet = t.classes > 0 && (!t.lastLesson || t.lastLesson < stale);
                  return (
                    <tr key={t.id}>
                      <th scope="row">
                        <Link className="link" href={`/admin/people/${t.id}`}>
                          {t.name}
                        </Link>
                        <span className="block text-[0.9rem] font-normal text-muted">{t.gender === "female" ? "Female" : t.gender === "male" ? "Male" : ""}</span>
                      </th>
                      <td className="tabular-nums">{t.classes}</td>
                      <td className="tabular-nums">{t.learners}</td>
                      <td className="tabular-nums">{t.lessons30}</td>
                      <td className="tabular-nums">
                        {pct(t.attendance) ?? "—"}
                        {low(t.attendance, 75) && <span className="block text-[0.85rem] font-semibold text-bad">Low</span>}
                      </td>
                      <td className="tabular-nums">{pct(t.quizAvg) ?? "—"}</td>
                      <td className="whitespace-nowrap">
                        {t.lastLesson ? shortDate(t.lastLesson) : "—"}
                        {quiet && <span className="block text-[0.85rem] font-semibold text-bad">Nothing recorded for 14 days</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-9">
        <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Learners</h2>
        {students.length === 0 ? (
          <p className="mt-3 text-muted">No learner has been added yet. Families add learners from their dashboard after creating an account.</p>
        ) : (
          <div className="tbl-wrap mt-4">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Learner</th>
                  <th scope="col">Account</th>
                  <th scope="col">Class</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">Lessons</th>
                  <th scope="col">Teacher’s mark</th>
                  <th scope="col">Quiz average</th>
                  <th scope="col">Oral tests</th>
                  <th scope="col">Last lesson</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const n = stats.get(s.id)!;
                  const att = attendancePct(n);
                  return (
                    <tr key={s.id}>
                      <th scope="row">
                        <Link className="link" href={`/admin/learners/${s.id}`}>
                          {s.name}
                        </Link>
                        <span className="block text-[0.9rem] font-normal text-muted">{courseName(s.course)}</span>
                      </th>
                      <td>
                        <Link className="link" href={`/admin/people/${s.userId}`}>
                          {s.accountName}
                        </Link>
                      </td>
                      <td>{s.classNames ?? <span className="font-semibold text-bad">Not in a class</span>}</td>
                      <td className="tabular-nums">
                        {att === null ? "—" : `${att}%`}
                        {low(att, 75) && <span className="block text-[0.85rem] font-semibold text-bad">Low</span>}
                      </td>
                      <td className="tabular-nums">{n.lessons}</td>
                      <td className="tabular-nums">{n.rating === null ? "—" : `${oneDp(n.rating)} / 5`}</td>
                      <td className="tabular-nums">{pct(n.quizAvg) ?? "—"}</td>
                      <td className="tabular-nums">{pct(n.testAvg) ?? "—"}</td>
                      <td className="whitespace-nowrap">{n.lastLesson ? shortDate(n.lastLesson) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
