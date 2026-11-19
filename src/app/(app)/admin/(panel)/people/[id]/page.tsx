import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, fmtDateTime, localTimeIn } from "@/lib/admin";
import { getUser } from "@/lib/users";
import { attendancePct, classesOfStudent, classesOfTeacher, statsFor, studentsOfUser, teacherTable } from "@/lib/lms";
import { courseName, pct } from "@/lib/format";
import { removeLearner, removeUser, setPassword, setStatus } from "../../../lms-actions";
import { saveMonthlyFee } from "../../../billing-actions";
import { INVOICE_CURRENCIES, invoiceNo, invoicesOfUser, monthlyFeeOf } from "@/lib/billing";
import { cash } from "@/lib/format";
import { InvoiceStatus } from "../../billing/InvoiceFields";
import { UserStatus } from "../UserStatus";

export const metadata = { title: "Account" };

const MSG: Record<string, [string, boolean]> = {
  status: ["Status updated.", true],
  password: ["New password saved. Send it to the person yourself; it is not emailed.", true],
  short: ["The password must be at least 8 characters.", false],
  confirm: ["Type DELETE in the box to delete this account.", false],
  learner: ["Learner removed.", true],
  fee: ["Monthly fee saved. It is used when you create the month’s invoices under Fees.", true],
};

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const user = await getUser((await params).id);
  if (!user) notFound();
  const teacher = user.role === "teacher";
  const key = (await searchParams).msg ?? "";
  const msg = Object.hasOwn(MSG, key) ? MSG[key] : undefined;
  const local = localTimeIn(user.timezone);

  const learners = teacher ? [] : await studentsOfUser(user.id);
  const stats = await statsFor(learners.map((l) => l.id));
  const placed = await Promise.all(learners.map((l) => classesOfStudent(l.id)));
  const classes = teacher ? await classesOfTeacher(user.id) : [];
  const [numbers] = teacher ? await teacherTable(user.id) : [];
  const fee = teacher ? null : await monthlyFeeOf(user.id);
  const invoices = teacher ? [] : await invoicesOfUser(user.id);

  const facts: [string, string][] = [
    ["Account", teacher ? "Teacher" : user.role === "student" ? "Student (16+)" : user.accountKind === "community" ? "Community group organiser" : "Parent"],
    ["Email", user.email],
    ["Phone / WhatsApp", user.phone],
    ["Country", user.country],
    ["Time zone", [user.timezone, local && `now ${local}`].filter(Boolean).join(" · ")],
    ["Gender", user.gender === "female" ? "Female" : user.gender === "male" ? "Male" : ""],
    ["Dashboard language", { en: "English", ur: "Urdu", ar: "Arabic" }[user.lang] ?? user.lang],
    [teacher ? "Hours available" : "Preferred time", user.preferredTime],
    ["Can teach", user.teaches.split(",").filter(Boolean).map((s) => courseName(s)).join(", ")],
    ["Qualifications and experience", user.about],
    ["Joined", fmtDateTime(user.createdAt)],
  ];

  return (
    <>
      <p className="mb-3">
        <Link className="link" href="/admin/people">
          People
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[1.9rem]">{user.name}</h1>
        <UserStatus status={user.status} />
      </div>
      {msg && (
        <p role="status" className={`mt-5 rounded-lg border px-4 py-3 font-medium ${msg[1] ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>
          {msg[0]}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-5 self-start">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[13rem_1fr]">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className="whitespace-pre-line break-words">{v}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {teacher ? (
            <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Classes ({classes.length})</h2>
              {numbers && (
                <p className="mt-1 text-[0.95rem] text-muted">
                  {numbers.learners} learners · {numbers.lessons30} lessons in the last 30 days · attendance {pct(numbers.attendance) ?? "—"} · learners’ quiz average {pct(numbers.quizAvg) ?? "—"}
                </p>
              )}
              {classes.length === 0 ? (
                <p className="mt-3 text-muted">
                  No classes yet.{" "}
                  {user.status === "active" ? (
                    <Link className="link" href="/admin/classes#new">
                      Create a class
                    </Link>
                  ) : (
                    "Approve the teacher first."
                  )}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {classes.map((c) => (
                    <li key={c.id} className="flex flex-wrap justify-between gap-3 py-2.5">
                      <Link className="link font-semibold" href={`/admin/classes/${c.id}`}>
                        {c.name}
                      </Link>
                      <span className="text-muted">
                        {c.learners} learners · {c.schedule || "no schedule"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Learners ({learners.length})</h2>
              {learners.length === 0 ? (
                <p className="mt-3 text-muted">This account has not added a learner yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {learners.map((l, i) => {
                    const s = stats.get(l.id)!;
                    const att = attendancePct(s);
                    return (
                      <li key={l.id} className="py-3.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <Link className="link font-semibold" href={`/admin/learners/${l.id}`}>
                            {l.name}
                          </Link>
                          <span className="text-[0.95rem] text-muted">
                            {[l.birthYear && `born ${l.birthYear}`, l.gender, courseName(l.course), l.classKind === "one" ? "1-on-1" : `${l.classKind} group`, l.teacherPref && `${l.teacherPref} teacher`].filter(Boolean).join(" · ")}
                          </span>
                        </div>
                        {l.notes && <p className="mt-1 text-[0.95rem]">{l.notes}</p>}
                        <p className="mt-1 text-[0.95rem]">
                          {placed[i].length ? (
                            placed[i].map((c, n) => (
                              <span key={c.id}>
                                {n > 0 && ", "}
                                <Link className="link" href={`/admin/classes/${c.id}`}>
                                  {c.name}
                                </Link>
                              </span>
                            ))
                          ) : (
                            <Link className="link" href={`/admin/classes?learner=${l.id}#new`}>
                              Not in a class yet. Create a class for this learner
                            </Link>
                          )}
                          <span className="text-muted">
                            {" "}
                            · attendance {att === null ? "—" : `${att}%`} · quiz average {pct(s.quizAvg) ?? "—"}
                          </span>
                        </p>
                        <form action={removeLearner} className="mt-1">
                          <input type="hidden" name="id" value={l.id} />
                          <button type="submit" className="cursor-pointer text-[0.9rem] text-bad underline underline-offset-2">
                            Remove learner and their records
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="grid gap-5 self-start">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">{teacher && user.status === "pending" ? "Approve this teacher" : "Account status"}</h2>
            {teacher && user.status === "pending" && <p className="mt-2 text-[0.95rem] text-muted">Approve only after you have checked identity and qualifications, interviewed the teacher and watched a sample lesson.</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              {user.status !== "active" && (
                <form action={setStatus}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="status" value="active" />
                  <button type="submit" className="btn btn-emerald">
                    {user.status === "pending" ? "Approve" : "Switch back on"}
                  </button>
                </form>
              )}
              {user.status !== "suspended" && (
                <form action={setStatus}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="status" value="suspended" />
                  <button type="submit" className="btn btn-line">
                    {user.status === "pending" ? "Decline" : "Pause account"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {fee && (
            <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Fees</h2>
              <form action={saveMonthlyFee} className="mt-3 grid grid-cols-[1fr_7rem] gap-3">
                <input type="hidden" name="id" value={user.id} />
                <div>
                  <label className="label" htmlFor="monthlyFee">
                    Monthly fee for this account
                  </label>
                  <input className="field" id="monthlyFee" name="monthlyFee" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={fee.monthlyFee ?? ""} placeholder="Not set" />
                </div>
                <div>
                  <label className="label" htmlFor="feeCurrency">
                    Currency
                  </label>
                  <select className="field" id="feeCurrency" name="feeCurrency" defaultValue={fee.feeCurrency}>
                    {INVOICE_CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <button type="submit" className="btn btn-line">
                    Save fee
                  </button>
                </div>
              </form>
              <div className="mt-5 border-t border-line pt-4">
                {invoices.length === 0 ? (
                  <p className="text-[0.95rem] text-muted">No invoices yet.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {invoices.slice(0, 8).map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <Link className="link" href={`/admin/billing/${i.id}`}>
                          {invoiceNo(i)} · {cash(i.amount, i.currency)}
                        </Link>
                        <InvoiceStatus status={i.status} />
                      </li>
                    ))}
                  </ul>
                )}
                <Link className="link mt-3 inline-block font-semibold" href={`/admin/billing?account=${user.id}#new`}>
                  New invoice for this account
                </Link>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Set a new password</h2>
            <p className="mt-2 text-[0.95rem] text-muted">For someone who has forgotten theirs. Check it is really them, then send the new password yourself.</p>
            <form action={setPassword} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={user.id} />
              <label className="label" htmlFor="password">
                New password
              </label>
              <input className="field -mt-3" id="password" name="password" type="text" autoComplete="off" required minLength={8} maxLength={200} />
              <div>
                <button type="submit" className="btn btn-line">
                  Save password
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Delete account</h2>
            <p className="mt-2 text-[0.95rem] text-muted">{teacher ? "The teacher’s classes stay, without a teacher." : "This also deletes the learners and all their lesson and quiz records."} It cannot be undone.</p>
            <form action={removeUser} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={user.id} />
              <label className="label" htmlFor="confirm">
                Type DELETE to confirm
              </label>
              <input className="field -mt-3" id="confirm" name="confirm" autoComplete="off" required />
              <div>
                <button type="submit" className="btn border-[1.5px] border-bad text-bad hover:bg-bad/10">
                  Delete account
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
