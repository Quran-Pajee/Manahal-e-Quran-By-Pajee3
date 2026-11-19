import { href, type Lang } from "@/i18n";

/** What a page already knows about the visitor's request, so the trial form opens with it filled in. */
export type TrialDefaults = {
  defaultCountry?: string;
  defaultCourse?: string;
  defaultStudent?: string;
  defaultTeacher?: string;
  defaultClassType?: string;
};

/**
 * Link to the free-trial page that carries a page's choices with it,
 * for example /free-trial?teacher=Female+teacher from the female-teacher page.
 * The form reads these in the browser, so the trial page itself stays one fast, cacheable page.
 */
export function trialHref(lang: Lang, d: TrialDefaults = {}): string {
  const q = new URLSearchParams();
  if (d.defaultCourse) q.set("course", d.defaultCourse);
  if (d.defaultCountry) q.set("country", d.defaultCountry);
  if (d.defaultTeacher) q.set("teacher", d.defaultTeacher);
  if (d.defaultClassType) q.set("type", d.defaultClassType);
  if (d.defaultStudent) q.set("for", d.defaultStudent);
  const s = q.toString();
  return href(lang, "/free-trial") + (s ? `?${s}` : "");
}
