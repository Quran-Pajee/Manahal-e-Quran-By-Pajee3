import { q, one, storageMode } from "./db";
import { rateLimited } from "./validate";

/**
 * Limits on log-in, sign-up and password changes.
 * Counts are kept in the database, so the limit holds even when the site runs on several servers at once.
 * Without a database the count falls back to this server's memory.
 */

/** True when this key already has `max` strikes inside the last `minutes`. Does not add one. */
export async function blocked(key: string, max: number, minutes: number): Promise<boolean> {
  if (storageMode() === "none") return false;
  try {
    const since = new Date(Date.now() - minutes * 60000).toISOString();
    const row = await one<{ n: number }>(`select count(*)::int as n from attempts where key = $1 and at > $2`, [key, since]);
    return (row?.n ?? 0) >= max;
  } catch {
    return false;
  }
}

/** Records one strike against a key. */
export async function strike(key: string): Promise<void> {
  if (storageMode() === "none") return;
  try {
    await q(`insert into attempts (key) values ($1)`, [key.slice(0, 200)]);
    // Now and then, clear out strikes older than a day.
    if (Math.random() < 0.02) await q(`delete from attempts where at < $1`, [new Date(Date.now() - 86400000).toISOString()]);
  } catch {
    // Rate limiting must never be the reason a log-in fails.
  }
}

/** Check and count in one step, for actions where every try counts (sign-up). */
export async function limited(key: string, max: number, minutes: number): Promise<boolean> {
  if (storageMode() === "none") return rateLimited(key, max, minutes * 60000);
  if (await blocked(key, max, minutes)) return true;
  await strike(key);
  return false;
}
