import { redirect } from "next/navigation";
import { session, type Session } from "./auth";

/** For pages only the owner and admins may open. Editors are sent to the Content section. */
export async function requireAdmin(): Promise<Session> {
  const me = await session();
  if (!me) redirect("/admin/login");
  if (me.role !== "admin") redirect("/admin/content");
  return me;
}

/** For pages any signed-in staff member may open (the Content section). */
export async function requireStaff(): Promise<Session> {
  const me = await session();
  if (!me) redirect("/admin/login");
  return me;
}

const TZ = process.env.ADMIN_TIMEZONE || "UTC";

export const adminTimezone = TZ;

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short" });

/** YYYY-MM-DD in the admin's time zone, for grouping leads by day. */
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export function localTimeIn(tz: string): string {
  if (!tz) return "";
  try {
    return new Date().toLocaleString("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}
