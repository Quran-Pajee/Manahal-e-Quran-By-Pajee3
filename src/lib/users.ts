import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { q, one, storageMode, dbUrl } from "./db";
import { LANG_COOKIE, asLang, isLang, type Lang } from "@/i18n";

/**
 * Accounts for the dashboards.
 *  - student:  an older learner (16+) who signs up for themselves.
 *  - guardian: a parent, or the organiser of a community group, who signs up learners (accountKind "family" or "community").
 *  - teacher:  signs up, then waits. The account is "pending" until an admin approves it.
 * The admin panel keeps its own separate password (see auth.ts).
 */
export type Role = "student" | "guardian" | "teacher";
export type UserStatus = "active" | "pending" | "suspended";
export type User = {
  id: string;
  createdAt: string;
  role: Role;
  status: UserStatus;
  name: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  gender: string;
  lang: string;
  accountKind: string;
  preferredTime: string;
  about: string;
  teaches: string;
};
type UserRow = User & { passHash: string };

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, options: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;
// Work factor for new passwords. It is stored inside each hash, so it can be raised later without breaking old ones.
const COST = 32768;
const derive = (password: string, salt: Buffer, len: number, N: number) => scrypt(password.normalize("NFKC"), salt, len, { N, r: 8, p: 1, maxmem: 256 * N * 8 });

/** Compares two values without leaking where they differ. Unequal lengths are simply "not equal". */
function same(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, 64, COST);
  return `s2$${COST}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  const [N, salt, key] = parts[0] === "s2" ? [Number(parts[1]), parts[2], parts[3]] : parts[0] === "s1" ? [16384, parts[1], parts[2]] : [0, "", ""];
  if (!salt || !key || !Number.isInteger(N) || N < 16384 || N > 1048576) return false;
  const want = Buffer.from(key, "base64url");
  return same(await derive(password, Buffer.from(salt, "base64url"), want.length, N), want);
}

/* ---------- Session cookie ---------- */

const COOKIE = "qa_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The key that signs log-in cookies.
 *  - AUTH_SECRET when it is set (best: you control it).
 *  - Otherwise a key derived from the database address. That address holds the database password and never leaves the server,
 *    so it is just as secret, and it means accounts work as soon as a database is connected, with nothing else to set up.
 *  - On your own computer, with neither, a fixed value.
 */
function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const url = dbUrl();
  if (url) return createHash("sha256").update(`manahil-auth:${url}`).digest("hex");
  return process.env.NODE_ENV === "production" ? "" : "development-only-secret";
}

/** Accounts need a database to live in and a secret to sign the login cookie with. */
export const authSecretMissing = () => secret() === "";
export const accountsReady = () => storageMode() !== "none" && secret() !== "";

// The password hash is part of what is signed, so changing a password signs every other device out.
const sign = (id: string, exp: string, passHash: string) => createHmac("sha256", secret()).update(`${id}.${exp}.${passHash}`).digest("base64url");

const strip = ({ passHash: _omit, ...user }: UserRow): User => user;

async function startSession(user: UserRow) {
  const exp = String(Date.now() + MAX_AGE * 1000);
  const jar = await cookies();
  jar.set(COOKIE, `${user.id}.${exp}.${sign(user.id, exp, user.passHash)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  if (!jar.get(LANG_COOKIE)?.value && isLang(user.lang)) await setLangCookie(user.lang);
}

export async function endSession() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function setLangCookie(lang: Lang) {
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

/** The language the visitor last chose, on the public site or in a dashboard. */
export async function appLang(): Promise<Lang> {
  return asLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** The logged-in user, or null. Looked up once per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  if (!accountsReady()) return null;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [id, exp, sig] = value.split(".");
  if (!id || !exp || !sig || !(Number(exp) > Date.now())) return null;
  const row = await one<UserRow>(`select * from users where id = $1`, [id]);
  if (!row) return null;
  if (!same(Buffer.from(sig), Buffer.from(sign(id, exp, row.passHash)))) return null;
  return strip(row);
});

export const homeFor = (user: Pick<User, "role">) => (user.role === "teacher" ? "/teach" : "/portal");

/** For dashboard pages: sends visitors to the login page, and people in the wrong dashboard to their own. */
export async function requireUser(area: "portal" | "teach" | "any" = "any"): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (area === "teach" && user.role !== "teacher") redirect("/portal");
  if (area === "portal" && user.role === "teacher") redirect("/teach");
  return user;
}

/* ---------- Sign-up, log-in, profile ---------- */

export type NewUser = {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  timezone: string;
  gender: string;
  lang: Lang;
  accountKind: string;
  preferredTime: string;
  about: string;
  teaches: string;
};

export async function emailTaken(email: string): Promise<boolean> {
  return Boolean(await one(`select id from users where email = $1`, [email]));
}

export async function createUser(input: NewUser): Promise<User> {
  const id = randomUUID();
  const passHash = await hashPassword(input.password);
  const status: UserStatus = input.role === "teacher" ? "pending" : "active";
  await q(
    `insert into users (id, role, status, name, email, pass_hash, phone, country, timezone, gender, lang, account_kind, preferred_time, about, teaches)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [id, input.role, status, input.name, input.email, passHash, input.phone, input.country, input.timezone, input.gender, input.lang, input.accountKind, input.preferredTime, input.about, input.teaches],
  );
  const row = (await one<UserRow>(`select * from users where id = $1`, [id]))!;
  await startSession(row);
  return strip(row);
}

export async function logIn(email: string, password: string): Promise<User | null> {
  const row = await one<UserRow>(`select * from users where email = $1`, [email]);
  if (!row) {
    await hashPassword(password); // same amount of work whether or not the account exists
    return null;
  }
  if (!(await verifyPassword(password, row.passHash))) return null;
  await startSession(row);
  return strip(row);
}

export async function changePassword(userId: string, current: string, next: string): Promise<boolean> {
  const row = await one<UserRow>(`select * from users where id = $1`, [userId]);
  if (!row || !(await verifyPassword(current, row.passHash))) return false;
  const passHash = await hashPassword(next);
  await q(`update users set pass_hash = $1 where id = $2`, [passHash, userId]);
  await startSession({ ...row, passHash }); // keep this device signed in
  return true;
}

export async function updateProfile(userId: string, p: { name: string; phone: string; country: string; timezone: string; preferredTime: string; about?: string; teaches?: string }) {
  await q(`update users set name = $1, phone = $2, country = $3, timezone = $4, preferred_time = $5 where id = $6`, [p.name, p.phone, p.country, p.timezone, p.preferredTime, userId]);
  if (p.about !== undefined) await q(`update users set about = $1, teaches = $2 where id = $3`, [p.about, p.teaches ?? "", userId]);
}

export async function setUserLang(userId: string, lang: Lang) {
  await q(`update users set lang = $1 where id = $2`, [lang, userId]);
}

/* ---------- Used by the admin panel ---------- */

export async function listUsers(role?: Role): Promise<User[]> {
  if (storageMode() === "none") return [];
  const rows = role ? await q<UserRow>(`select * from users where role = $1 order by created_at desc`, [role]) : await q<UserRow>(`select * from users order by created_at desc`);
  return rows.map(strip);
}

export async function getUser(id: string): Promise<User | null> {
  if (storageMode() === "none") return null;
  const row = await one<UserRow>(`select * from users where id = $1`, [id]);
  return row ? strip(row) : null;
}

export async function setUserStatus(id: string, status: UserStatus) {
  await q(`update users set status = $1 where id = $2`, [status, id]);
}

export async function adminSetPassword(id: string, password: string) {
  await q(`update users set pass_hash = $1 where id = $2`, [await hashPassword(password), id]);
}

export async function deleteUser(id: string) {
  await q(`delete from users where id = $1`, [id]);
}
