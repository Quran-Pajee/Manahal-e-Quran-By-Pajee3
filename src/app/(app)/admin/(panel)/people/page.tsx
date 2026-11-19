import Link from "next/link";
import { requireAdmin, fmtDay } from "@/lib/admin";
import { listUsers, type User } from "@/lib/users";
import { q } from "@/lib/db";
import { storageMode } from "@/lib/leads";
import { UserStatus } from "./UserStatus";

export const metadata = { title: "People" };

const ROLE: Record<string, string> = { teacher: "Teacher", guardian: "Parent / organiser", student: "Student" };

function Table({ rows, learners, empty }: { rows: User[]; learners?: Map<string, number>; empty: string }) {
  if (!rows.length) return <p className="mt-3 text-muted">{empty}</p>;
  return (
    <div className="tbl-wrap mt-4">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">{learners ? "Account" : "Gender"}</th>
            {learners && <th scope="col">Learners</th>}
            <th scope="col">Country</th>
            <th scope="col">Contact</th>
            <th scope="col">Joined</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <th scope="row">
                <Link className="link" href={`/admin/people/${u.id}`}>
                  {u.name}
                </Link>
              </th>
              <td>{learners ? (u.role === "student" ? ROLE.student : u.accountKind === "community" ? "Community group" : "Family") : u.gender === "female" ? "Female" : u.gender === "male" ? "Male" : "—"}</td>
              {learners && <td className="tabular-nums">{learners.get(u.id) ?? 0}</td>}
              <td>{u.country || "—"}</td>
              <td>
                {u.phone}
                <span className="block text-[0.9rem] text-muted">{u.email}</span>
              </td>
              <td className="whitespace-nowrap">{fmtDay(u.createdAt)}</td>
              <td>
                <UserStatus status={u.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const users = await listUsers();
  const counts = storageMode() === "none" ? [] : await q<{ userId: string; n: number }>(`select user_id, count(*)::int as n from students group by user_id`);
  const learners = new Map(counts.map((c) => [c.userId, c.n]));
  const teachers = users.filter((u) => u.role === "teacher").sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  const families = users.filter((u) => u.role !== "teacher");
  const waiting = teachers.filter((u) => u.status === "pending").length;
  const { msg } = await searchParams;

  return (
    <>
      <h1 className="text-[1.9rem]">People</h1>
      <p className="mt-2 max-w-[70ch] text-muted">Everyone who has created a dashboard account. Teachers cannot see any class or learner until you approve them here.</p>
      {msg === "deleted" && (
        <p role="status" className="mt-5 rounded-lg border border-ok/40 bg-ok/10 px-4 py-3 font-medium text-ok">
          Account deleted.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">
          Teachers <span className="font-normal text-muted">({teachers.length}{waiting ? `, ${waiting} waiting for approval` : ""})</span>
        </h2>
        <Table rows={teachers} empty="No teacher has applied yet. Teachers apply from the “Teach with us” link in the website footer." />
      </section>

      <section className="mt-10">
        <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">
          Families, groups and students <span className="font-normal text-muted">({families.length})</span>
        </h2>
        <Table rows={families} learners={learners} empty="No family or student has created an account yet." />
      </section>
    </>
  );
}
