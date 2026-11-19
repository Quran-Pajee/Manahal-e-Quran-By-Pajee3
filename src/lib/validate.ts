import type { LeadInput } from "./lead-types";

/** Trims, cuts to length and removes control characters (the database refuses some of them). */
export const clean = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim()
        .slice(0, max)
    : "";

export type LeadErrors = Partial<Record<"name" | "phone" | "email", string>>;

export function parseLead(body: Record<string, unknown>): { data: LeadInput; errors: LeadErrors } {
  const data: LeadInput = {
    name: clean(body.name, 80),
    phone: clean(body.phone, 30),
    email: clean(body.email, 120).toLowerCase(),
    country: clean(body.country, 60),
    course: clean(body.course, 80),
    studentFor: clean(body.studentFor, 40),
    studentAge: clean(body.studentAge, 20),
    teacherPref: clean(body.teacherPref, 30),
    classType: clean(body.classType, 40),
    studentCount: clean(body.studentCount, 10),
    preferredTime: clean(body.preferredTime, 120),
    timezone: clean(body.timezone, 60),
    message: clean(body.message, 1000),
    sourcePage: clean(body.sourcePage, 200),
    landingPage: clean(body.landingPage, 300),
    referrer: clean(body.referrer, 300),
    utmSource: clean(body.utmSource, 100),
    utmMedium: clean(body.utmMedium, 100),
    utmCampaign: clean(body.utmCampaign, 150),
    utmTerm: clean(body.utmTerm, 150),
    utmContent: clean(body.utmContent, 150),
    gclid: clean(body.gclid, 200),
    fbclid: clean(body.fbclid, 200),
  };

  const errors: LeadErrors = {};
  if (data.name.length < 2) errors.name = "Enter your name.";
  const digits = data.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15 || !/^[+\d\s().-]+$/.test(data.phone))
    errors.phone = "Enter a phone or WhatsApp number with the country code, for example +1 415 555 0123.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = "Check the email address.";
  return { data, errors };
}

// Small in-memory limiter. Good enough to slow a script; each serverless instance keeps its own count.
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  // Drop the oldest entries rather than everything, so filling the table cannot wipe other people's counts.
  if (hits.size > 5000) for (const k of hits.keys()) if (hits.size > 4000) hits.delete(k);
  return list.length > max;
}
