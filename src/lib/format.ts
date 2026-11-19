import type { Lang } from "@/i18n";
import { getCourse } from "@/content/courses";

const locale: Record<Lang, string> = { en: "en-GB", ur: "ur-PK-u-nu-latn", ar: "ar-u-nu-latn" };

/** "2026-10-09" or a full timestamp -> "9 Oct 2026", in the reader's language. */
export function shortDate(day: string | null | undefined, lang: Lang = "en"): string {
  if (!day) return "";
  const d = new Date(day.slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(locale[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export const pct = (n: number | null | undefined) => (n === null || n === undefined ? null : `${Math.round(n)}%`);
export const oneDp = (n: number | null | undefined) => (n === null || n === undefined ? null : (Math.round(n * 10) / 10).toString());

/** Course name for a stored course id, in the reader's language. */
export const courseName = (slug: string, lang: Lang = "en") => (slug ? (getCourse(slug, lang)?.name ?? slug) : "");

/** "USD", 45 -> "$45.00". Right-to-left pages get an invisible mark in front so the amount is not flipped to "45$". */
export function cash(amount: number, currency: string, lang: Lang = "en"): string {
  let text: string;
  try {
    text = new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
  } catch {
    text = `${currency} ${amount}`;
  }
  return (lang === "en" ? "" : "‎") + text;
}
