import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { listUsers } from "@/lib/users";
import { allStudents, attendancePct, getClass, lessonsOfClass, roster, statsFor } from "@/lib/lms";
import { pct, shortDate } from "@/lib/format";
import { addToClass, removeClass, removeFromClass, saveClass } from "../../../lms-actions";
import { ClassFields } from "../ClassFields";

export const metadata = { title: "Class" };

const MSG: Record<string, [string, boolean]> = {
  created: ["Class created. Add the learners below.", true],
  saved: ["Saved.", true],
  enrolled: ["Learner added to the class.", true],
  removed: ["Learner removed from the class. Their past records are kept.", true],
  name: ["Give the class a name.", false],
  confirm: ["Type DELETE in the box to delete this class.", false],
};

export default async function AdminClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const cls = await getClass((await params).id);
  if (!cls) notFound();
  const [teachers, learners, lessons, students] = await Promise.all([listUsers("teacher"), roster(cls.id), lessonsOfClass(cls.id, 10), allStudents()]);
  const stats = await statsFor(learners.map((l) => l.id));
  const inClass = new Set(learners.map((l) => l.id));
  const others = students.filter((s) => !inClass.has(s.id));
  const key = (await searchParams).msg ?? "";
  const msg = Object.hasOwn(MSG, key) ? MSG[key] : undefined;
  // Keep the current teacher in the list even if their account has since been paused.
  const choices = teachers.filter((t) => t.status === "active" || t.id === cls.teacherId);
  const limit = cls.kind === "one" ? 1 : cls.kind === "family" ? 4 : 6;

  return (
    <>
      <p className="mb-3">
        <Link className="link" href="/admin/classes">
          Classes
        </Link>
      </p>
      <h1 className="text-[1.9rem]">{cls.name}</h1>
      {msg && (
        <p role="status" className={`mt-5 rounded-lg border px-4 py-3 font-medium ${msg[1] ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>
          {msg[0]}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-5 self-start">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">
              Learners ({learners.length})
              {learners.length > limit && <span className="ms-2 text-[0.9rem] font-semibold text-bad">More than the usual {limit} for this class type</span>}
            </h2>
            {learners.length === 0 ? (
              <p className="mt-3 text-muted">Nobody in this class yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {learners.map((l) => {
                  const s = stats.get(l.id)!;
                  const att = attendancePct(s);
                  return (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <Link className="link font-semibold" href={`/admin/learners/${l.id}`}>
                          {l.name}
                        </Link>
                        <span className="block text-[0.92rem] text-muted">
                          attendance {att === null ? "—" : `${att}%`} · {s.lessons} lessons · quiz average {pct(s.quizAvg) ?? "—"}
                        </span>
                      </div>
                      <form action={removeFromClass}>
                        <input type="hidden" name="classId" value={cls.id} />
                        <input type="hidden" name="studentId" value={l.id} />
                        <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                          Remove from class
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
            <form action={addToClass} className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
              <input type="hidden" name="classId" value={cls.id} />
              <div className="min-w-[14rem] flex-1">
                <label className="label" htmlFor="studentId">
                  Add a learner
                </label>
                <select className="field" id="studentId" name="studentId" required defaultValue="">
                  <option value="" />
                  {others.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.accountName}){s.classNames ? ` · already in ${s.classNames}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-emerald">
                Add
              </button>
            </form>
            {others.length === 0 && <p className="mt-3 text-[0.95rem] text-muted">Every learner with an account is already in this class. Families add learners from their own dashboard.</p>}
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Recent lessons</h2>
            {lessons.length === 0 ? (
              <p className="mt-3 text-muted">The teacher has not recorded a lesson yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {lessons.map((l) => (
                  <li key={l.id} className="py-2.5">
                    <span className="font-semibold">{shortDate(l.heldOn)}</span> · <span dir="auto">{l.topic}</span>
                    <span className="block text-[0.92rem] text-muted">
                      {l.attended} of {l.marked} present{l.homework && ` · homework: ${l.homework}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-5 self-start">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Class details</h2>
            <form action={saveClass} className="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={cls.id} />
              <ClassFields teachers={choices} cls={cls} />
              <div className="sm:col-span-2">
                <label className="label" htmlFor="status">
                  Status
                </label>
                <select className="field" id="status" name="status" defaultValue={cls.status}>
                  <option value="active">Running</option>
                  <option value="ended">Ended (hidden from dashboards, records kept)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn btn-emerald">
                  Save
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Delete class</h2>
            <p className="mt-2 text-[0.95rem] text-muted">Deletes the class with its lesson and attendance records. To keep the records, set the status to “Ended” instead.</p>
            <form action={removeClass} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={cls.id} />
              <label className="label" htmlFor="confirm">
                Type DELETE to confirm
              </label>
              <input className="field -mt-3" id="confirm" name="confirm" autoComplete="off" required />
              <div>
                <button type="submit" className="btn border-[1.5px] border-bad text-bad hover:bg-bad/10">
                  Delete class
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
