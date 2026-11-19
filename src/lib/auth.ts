import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import { dbUrl, one, q, storageMode } from "./db";
import { hashPassword, verifyPassword } from "./users";

/**
 * Who can use the admin panel.
 *
 *  - The owner signs in with ADMIN_PASSWORD alone and can do everything.
 *  - Staff sign in with their own email and password. An "admin" can do everything; an "editor" can only write,
 *    preview and publish content (articles, pillar pages and cluster pages).
 */
const COOKIE = "qa_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type StaffRole = "admin" | "editor";
export type Staff = { id: string; name: string; email: string; role: StaffRole; status: "active" | "suspended"; createdAt: string; lastLogin: string | null };
export type Session = { id: string; name: string; role: StaffRole; owner: boolean };

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

const sha = (s: string) => createHash("sha256").update(s).digest();
const secret = () => process.env.AUTH_SECRET || (dbUrl() ? sha(`manahil-admin:${dbUrl()}`).toString("hex") : `pw:${process.env.ADMIN_PASSWORD ?? ""}`);
// The owner password is part of what is signed, so changing ADMIN_PASSWORD signs every admin session out.
const sign = (payload: string) => createHmac("sha256", secret()).update(`${payload}.${sha(process.env.ADMIN_PASSWORD ?? "").toString("hex")}`).digest("base64url");

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return timingSafeEqual(sha(input), sha(pw));
}

/** `who` is "owner" or a staff id. */
export async function createSession(who = "owner") {
  const payload = `${Date.now() + MAX_AGE * 1000}.${who}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).set(COOKIE, "", { path: "/admin", maxAge: 0 });
}

/** The signed-in person, or null. Looked up once per page. */
export const session = cache(async (): Promise<Session | null> => {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [exp, who, sig] = value.split(".");
  if (!exp || !who || !sig || !(Number(exp) > Date.now())) return null;
  const got = Buffer.from(sig);
  const expected = Buffer.from(sign(`${exp}.${who}`));
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  if (who === "owner") return adminConfigured() ? { id: "owner", name: "Owner", role: "admin", owner: true } : null;
  if (storageMode() === "none") return null;
  // Staff are checked against the database on every page, so pausing or removing someone takes effect at once.
  const row = await one<Staff>(`select id, name, role, status from staff where id = $1`, [who]).catch(() => null);
  if (!row || row.status !== "active") return null;
  return { id: row.id, name: row.name, role: row.role === "admin" ? "admin" : "editor", owner: false };
});

/** True for the owner and for staff with the admin role. Editors are not admins. */
export async function isAdmin(): Promise<boolean> {
  return (await session())?.role === "admin";
}

/* ---------- staff accounts ---------- */

const off = () => storageMode() === "none";

export async function listStaff(): Promise<Staff[]> {
  if (off()) return [];
  return q<Staff>(`select id, name, email, role, status, created_at, last_login from staff order by created_at`);
}
export async function getStaff(id: string): Promise<Staff | null> {
  if (off()) return null;
  return one<Staff>(`select id, name, email, role, status, created_at, last_login from staff where id = $1`, [id]);
}
export async function staffEmailTaken(email: string): Promise<boolean> {
  return Boolean(await one(`select 1 as x from staff where email = $1`, [email.toLowerCase()]));
}
export async function createStaff(n: { name: string; email: string; password: string; role: StaffRole }): Promise<string> {
  const id = randomUUID();
  await q(`insert into staff (id, name, email, password_hash, role) values ($1,$2,$3,$4,$5)`, [id, n.name, n.email.toLowerCase(), await hashPassword(n.password), n.role]);
  return id;
}
export async function updateStaff(id: string, patch: { role?: StaffRole; status?: "active" | "suspended"; password?: string; name?: string }) {
  if (patch.role) await q(`update staff set role = $1 where id = $2`, [patch.role, id]);
  if (patch.status) await q(`update staff set status = $1 where id = $2`, [patch.status, id]);
  if (patch.name) await q(`update staff set name = $1 where id = $2`, [patch.name, id]);
  if (patch.password) await q(`update staff set password_hash = $1 where id = $2`, [await hashPassword(patch.password), id]);
}
export async function deleteStaff(id: string) {
  await q(`delete from staff where id = $1`, [id]);
}
/** Checks a staff email and password. Returns the staff id, or null. */
export async function staffLogIn(email: string, password: string): Promise<string | null> {
  if (off()) return null;
  const row = await one<{ id: string; passwordHash: string; status: string }>(`select id, password_hash, status from staff where email = $1`, [email.toLowerCase()]);
  // A check is still run when the email is unknown, so the time taken does not reveal which emails exist.
  const ok = await verifyPassword(password, row?.passwordHash ?? "s2$16384$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  if (!row || !ok || row.status !== "active") return null;
  await q(`update staff set last_login = $1 where id = $2`, [new Date().toISOString(), row.id]);
  return row.id;
}
