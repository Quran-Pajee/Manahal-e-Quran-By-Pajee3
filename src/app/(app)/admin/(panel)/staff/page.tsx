import { requireAdmin, fmtDateTime } from "@/lib/admin";
import { listStaff } from "@/lib/auth";
import { storageMode } from "@/lib/db";
import { addStaff, changeStaff } from "../../staff-actions";

export const metadata = { title: "Staff" };

const MSG: Record<string, [string, boolean]> = {
  added: ["Account created. Give the person their email and password; they sign in at /admin/login.", true],
  changed: ["Saved.", true],
  password: ["Password changed.", true],
  bad: ["Enter a name and a valid email address.", false],
  short: ["The password needs at least 10 characters.", false],
  taken: ["That email already has a staff account.", false],
  self: ["You cannot change your own role or remove yourself. Ask another admin or the owner.", false],
  nodb: ["Staff accounts need a database. Connect one first.", false],
};

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const me = await requireAdmin();
  const staff = await listStaff();
  const key = (await searchParams).msg ?? "";
  const note = Object.hasOwn(MSG, key) ? MSG[key] : undefined;
  const off = storageMode() === "none";

  return (
    <>
      <h1 className="text-[1.9rem]">Staff</h1>
      <p className="mt-2 max-w-[72ch] text-muted">People who can sign in to this panel with their own email and password.</p>
      {note && (
        <p role="status" className={`mt-5 rounded-lg border px-4 py-3 font-medium ${note[1] ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>
          {note[0]}
        </p>
      )}

      <div className="tbl-wrap mt-6">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Role</th>
              <th scope="col">What they can do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Owner</th>
              <td>Signs in with the owner password alone (ADMIN_PASSWORD). Everything.</td>
            </tr>
            <tr>
              <th scope="row">Admin</th>
              <td>Everything: leads, people, classes, fees, content, SEO and staff.</td>
            </tr>
            <tr>
              <th scope="row">Editor</th>
              <td>Content only: write, preview, publish and unpublish articles, pillar pages and cluster pages, with their search settings and schema. Cannot see leads, families, classes, fees, page SEO or staff. Cannot delete a published page.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="mt-8">
        <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Accounts</h2>
        {staff.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line bg-white p-5 text-muted">No staff accounts yet. Add an editor below.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {staff.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {s.name} {s.id === me.id && <span className="font-normal text-muted">(you)</span>}
                    </p>
                    <p className="text-[0.92rem] text-muted" dir="ltr">
                      {s.email}
                    </p>
                    <p className="mt-1 text-[0.88rem] text-muted">{s.lastLogin ? `Last signed in ${fmtDateTime(s.lastLogin)}` : "Has not signed in yet"}</p>
                  </div>
                  <p className="flex gap-2">
                    <span className="rounded-full border border-line bg-wash px-2.5 py-0.5 text-[0.82rem] font-semibold capitalize text-emerald">{s.role}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${s.status === "active" ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>{s.status === "active" ? "Active" : "Paused"}</span>
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-3 border-t border-line pt-4">
                  <form action={changeStaff}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="what" value="role" />
                    <button type="submit" className="btn btn-line min-h-[2.5rem]">
                      Make {s.role === "admin" ? "editor" : "admin"}
                    </button>
                  </form>
                  <form action={changeStaff}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="what" value="status" />
                    <button type="submit" className="btn btn-line min-h-[2.5rem]">
                      {s.status === "active" ? "Pause" : "Activate"}
                    </button>
                  </form>
                  <form action={changeStaff} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="what" value="password" />
                    <div>
                      <label className="label" htmlFor={`pw-${s.id}`}>
                        New password
                      </label>
                      <input className="field min-h-[2.5rem] w-48" id={`pw-${s.id}`} name="password" type="text" minLength={10} maxLength={200} required autoComplete="off" />
                    </div>
                    <button type="submit" className="btn btn-line min-h-[2.5rem]">
                      Set
                    </button>
                  </form>
                  <form action={changeStaff} className="ms-auto">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="what" value="remove" />
                    <button type="submit" className="btn min-h-[2.5rem] border-[1.5px] border-bad text-bad hover:bg-bad/10">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 max-w-[44rem] rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Add a person</h2>
        {off ? (
          <p className="mt-3 text-muted">Staff accounts need a database. Connect one first.</p>
        ) : (
          <form action={addStaff} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input className="field" id="name" name="name" required maxLength={80} autoComplete="off" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input className="field" id="email" name="email" type="email" required maxLength={200} autoComplete="off" dir="ltr" />
            </div>
            <div>
              <label className="label" htmlFor="role">
                Role
              </label>
              <select className="field" id="role" name="role" defaultValue="editor">
                <option value="editor">Editor (content only)</option>
                <option value="admin">Admin (everything)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password <span className="font-normal text-muted">(10 characters or more)</span>
              </label>
              <input className="field" id="password" name="password" type="text" required minLength={10} maxLength={200} autoComplete="off" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-emerald">
                Create account
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
