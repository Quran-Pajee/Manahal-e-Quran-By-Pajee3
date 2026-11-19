import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { listUsers } from "@/lib/users";
import { allStudents, listClasses } from "@/lib/lms";
import { courseName, shortDate } from "@/lib/format";
import { newClass } from "../../lms-actions";
import { ClassFields } from "./ClassFields";

export const metadata = { title: "Classes" };

const KIND: Record<string, string> = { one: "One-to-one", family: "Family group", community: "Community group" };

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ msg?: string; learner?: string }> }) {
  await requireAdmin();
  const [classes, teachers, students] = await Promise.all([listClasses(), listUsers("teacher"), allStudents()]);
  const active = teachers.filter((t) => t.status === "active");
  const { msg, learner } = await searchParams;
  const first = students.find((s) => s.id === learner);
  const unplaced = students.filter((s) => !s.classNames);

  return (
    <>
      <h1 className="text-[1.9rem]">Classes</h1>
      <p className="mt-2 max-w-[70ch] text-muted">A class is one teacher with one learner, or with a small family or community group. Create the class, choose the teacher, then add the learners. The class then appears on the teacher’s and the family’s dashboards.</p>
      {msg === "deleted" && (
        <p role="status" className="mt-5 rounded-lg border border-ok/40 bg-ok/10 px-4 py-3 font-medium text-ok">
          Class deleted.
        </p>
      )}
      {msg === "name" && (
        <p role="status" className="mt-5 rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 font-medium text-bad">
          Give the class a name.
        </p>
      )}

      {classes.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-white p-5 text-muted">No classes yet. Create the first one below.</p>
      ) : (
        <div className="tbl-wrap mt-6">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Type</th>
                <th scope="col">Teacher</th>
                <th scope="col">Learners</th>
                <th scope="col">Days and time</th>
                <th scope="col">Last lesson</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className={c.status === "active" ? "" : "text-muted"}>
                  <th scope="row">
                    <Link className="link" href={`/admin/classes/${c.id}`}>
                      {c.name}
                    </Link>
                    {c.status !== "active" && <span className="ms-2 text-[0.85rem] font-normal">ended</span>}
                    <span className="block text-[0.9rem] font-normal text-muted">{courseName(c.course)}</span>
                  </th>
                  <td>{KIND[c.kind] ?? c.kind}</td>
                  <td>{c.teacherName ?? <span className="font-semibold text-bad">No teacher</span>}</td>
                  <td className="tabular-nums">{c.learners}</td>
                  <td>{c.schedule || "—"}</td>
                  <td className="whitespace-nowrap">{c.lastLesson ? shortDate(c.lastLesson) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section id="new" className="mt-8 max-w-[52rem] rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Create a class</h2>
        {active.length === 0 && (
          <p className="mt-2 text-[0.95rem] text-muted">
            No approved teacher yet. You can still create the class and choose the teacher later.{" "}
            <Link className="link" href="/admin/people">
              See teacher applications
            </Link>
          </p>
        )}
        <form action={newClass} className="mt-4 grid gap-4 sm:grid-cols-2">
          <ClassFields teachers={active} kind={first?.classKind} course={first?.course} />
          <div className="sm:col-span-2">
            <label className="label" htmlFor="studentId">
              First learner
            </label>
            <select className="field" id="studentId" name="studentId" defaultValue={first?.id ?? ""}>
              <option value="">Add learners later</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.accountName}){s.classNames ? "" : " · not in a class"}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-emerald">
              Create class
            </button>
          </div>
        </form>
      </section>

      {unplaced.length > 0 && (
        <section className="mt-8">
          <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Learners not in a class ({unplaced.length})</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((s) => (
              <li key={s.id} className="rounded-lg border border-line bg-white px-4 py-3">
                <Link className="link font-semibold" href={`/admin/classes?learner=${s.id}#new`}>
                  {s.name}
                </Link>
                <span className="block text-[0.92rem] text-muted">
                  {[s.accountName, courseName(s.course), KIND[s.classKind], s.teacherPref && `${s.teacherPref} teacher`].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
