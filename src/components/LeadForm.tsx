"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { CLASS_TYPES, COUNTRIES, STUDENT_FOR, TEACHER_PREFS } from "@/lib/lead-types";
import { readAttribution } from "./Attribution";
import { whatsappLink } from "@/content/site";
import { href, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

type Props = {
  lang: Lang;
  source: string;
  /** value is the English course name saved with the lead; label is what the visitor reads. */
  courses: { value: string; label: string }[];
  trialClasses: number;
  /**
   * quick: name, phone, country and course. Everything else sits behind "Add more details". Used in every hero and closing section.
   * trial: the same, with class type and teacher also on show. Used on the free-trial page.
   * full: every field, including the message. Used on the contact page.
   */
  variant?: "quick" | "trial" | "full";
  defaultCountry?: string;
  defaultCourse?: string;
  defaultStudent?: string;
  defaultTeacher?: string;
  defaultClassType?: string;
  submitLabel?: string;
};

const NOT_SURE = "Not sure yet";

function countryFromTimezone(tz: string): string {
  if (tz === "Europe/London" || tz === "Europe/Belfast") return "United Kingdom";
  if (tz.startsWith("Australia/")) return "Australia";
  if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit)/.test(tz)) return "Canada";
  if (tz.startsWith("America/") || tz.startsWith("US/") || tz === "Pacific/Honolulu") return "United States";
  if (tz === "Pacific/Auckland") return "New Zealand";
  if (tz === "Europe/Dublin") return "Ireland";
  if (tz === "Asia/Dubai") return "United Arab Emirates";
  if (tz === "Asia/Karachi") return "Pakistan";
  return "";
}

export function LeadForm({ lang, source, courses, trialClasses, variant = "quick", defaultCountry = "", defaultCourse = "", defaultStudent = "", defaultTeacher = "", defaultClassType = "", submitLabel }: Props) {
  const t = ui[lang];
  const f = t.form;
  const router = useRouter();
  const uid = useId();
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  // If the server cannot keep the request, the visitor can send the same details on WhatsApp, so no request is lost.
  const [waLink, setWaLink] = useState("");
  const [timezone, setTimezone] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [course, setCourse] = useState(defaultCourse || NOT_SURE);
  const [classType, setClassType] = useState<string>(defaultClassType || CLASS_TYPES[0]);
  const [teacher, setTeacher] = useState<string>(defaultTeacher || TEACHER_PREFS[0]);
  const [studentFor, setStudentFor] = useState<string>(defaultStudent || STUDENT_FOR[0]);
  const [more, setMore] = useState(false);
  const isGroup = classType !== CLASS_TYPES[0];
  const [startedAt] = useState(() => Date.now());
  const classLabels = [t.classTypes.one, t.classTypes.family, t.classTypes.community];
  const showChoice = variant !== "quick" || more;
  const showRest = variant === "full" || more;

  useEffect(() => {
    let fromLink = "";
    try {
      // A button on a course or landing page links here with its choices in the address, e.g. /free-trial?teacher=Female+teacher.
      const q = new URLSearchParams(window.location.search);
      const pick = (key: string, allowed: readonly string[]) => {
        const v = q.get(key) ?? "";
        return allowed.includes(v) ? v : "";
      };
      const c = pick("course", courses.map((x) => x.value));
      if (c) setCourse(c);
      const ty = pick("type", CLASS_TYPES);
      if (ty) setClassType(ty);
      const te = pick("teacher", TEACHER_PREFS);
      if (te) setTeacher(te);
      const who = pick("for", STUDENT_FOR);
      if (who) setStudentFor(who);
      fromLink = pick("country", COUNTRIES);
      if (fromLink) setCountry(fromLink);
    } catch {}
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      setTimezone(tz);
      if (!defaultCountry && !fromLink) setCountry((c) => c || countryFromTimezone(tz));
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const fd = new FormData(e.currentTarget);
    const attr = readAttribution();
    const payload = {
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email") ?? "",
      country,
      course,
      classType,
      studentCount: isGroup ? (fd.get("studentCount") ?? "") : "",
      studentFor,
      studentAge: fd.get("studentAge") ?? "",
      teacherPref: teacher,
      preferredTime: fd.get("preferredTime") ?? "",
      message: fd.get("message") ?? "",
      website: fd.get("website"), // honeypot
      elapsed: Date.now() - startedAt,
      timezone,
      lang,
      sourcePage: source,
      landingPage: attr.landingPage ?? "",
      referrer: attr.referrer ?? "",
      utmSource: attr.utm_source ?? "",
      utmMedium: attr.utm_medium ?? "",
      utmCampaign: attr.utm_campaign ?? "",
      utmTerm: attr.utm_term ?? "",
      utmContent: attr.utm_content ?? "",
      gclid: attr.gclid ?? "",
      fbclid: attr.fbclid ?? "",
    };

    const handOver = () => {
      const lines = [
        "Assalamu alaikum. I would like to book free trial Quran classes.",
        `Name: ${payload.name ?? ""}`,
        `Phone: ${payload.phone ?? ""}`,
        payload.country && `Country: ${payload.country}`,
        payload.course && `Course: ${payload.course}`,
        payload.classType && `Class type: ${payload.classType}${payload.studentCount ? `, ${payload.studentCount} learners` : ""}`,
        payload.studentAge && `Age: ${payload.studentAge}`,
        payload.teacherPref && `Teacher: ${payload.teacherPref}`,
        payload.preferredTime && `Best time: ${payload.preferredTime}${timezone ? ` (${timezone})` : ""}`,
        payload.message && `Message: ${payload.message}`,
      ];
      setWaLink(whatsappLink(lines.filter(Boolean).join("\n")));
    };

    setState("sending");
    setErrors({});
    setFormError("");
    setWaLink("");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string>; message?: string };
      if (res.ok && json.ok) {
        try {
          window.sessionStorage.setItem("qa_lead_sent", "1");
        } catch {}
        router.push(href(lang, "/free-trial/thank-you"));
        return;
      }
      // The server answers in English. Field errors are shown in the visitor's language.
      const local: Record<string, string> = {};
      if (json.errors?.name) local.name = f.errName;
      if (json.errors?.phone) local.phone = f.errPhone;
      if (json.errors?.email) local.email = f.errEmail;
      setErrors(local);
      if (res.status >= 500) handOver();
      setFormError(json.errors ? f.errCheck : res.status >= 500 ? f.waFallback : lang === "en" && json.message ? json.message : f.errSend);
      setState("error");
    } catch {
      setFormError(f.errOffline);
      setState("error");
    }
  }

  const id = (n: string) => `${uid}-${n}`;
  const err = (n: string) =>
    errors[n] ? (
      <p id={id(n + "-err")} className="mt-1 text-sm text-bad">
        {errors[n]}
      </p>
    ) : null;
  const opt = <span className="font-normal text-muted">{f.optional}</span>;

  const two = "grid gap-3 min-[480px]:grid-cols-2";

  return (
    <form onSubmit={onSubmit} method="post" action="/api/leads" className="grid gap-3 text-charcoal">
      <input type="hidden" name="sourcePage" value={source} />
      <input type="hidden" name="lang" value={lang} />
      {/* Choices that are not on show still travel with the form if the browser sends it without scripts. */}
      {!showChoice && <input type="hidden" name="classType" value={classType} />}
      {!showChoice && <input type="hidden" name="teacherPref" value={teacher} />}
      {!showRest && <input type="hidden" name="studentFor" value={studentFor} />}

      <div className={variant === "quick" ? "grid gap-3" : two}>
        <div>
          <label htmlFor={id("name")} className="label">
            {f.name}
          </label>
          <input id={id("name")} name="name" className="field" autoComplete="name" required maxLength={80} aria-invalid={!!errors.name} aria-describedby={errors.name ? id("name-err") : undefined} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={id("phone")} className="label">
            {f.phone}
          </label>
          <input id={id("phone")} name="phone" type="tel" inputMode="tel" dir="ltr" className="field text-start" autoComplete="tel" placeholder="+1 415 555 0123" required maxLength={30} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? id("phone-err") : undefined} />
          {err("phone")}
        </div>
      </div>

      <div className={two}>
        <div>
          <label htmlFor={id("country")} className="label">
            {f.country}
          </label>
          <select id={id("country")} name="country" className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{f.chooseCountry}</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("course")} className="label">
            {f.course}
          </label>
          <select id={id("course")} name="course" className="field" value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value={NOT_SURE}>{f.notSure}</option>
            {courses.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showChoice && (
        <div className={two}>
          <div>
            <label htmlFor={id("classType")} className="label">
              {f.classType}
            </label>
            <select id={id("classType")} name="classType" className="field" value={classType} onChange={(e) => setClassType(e.target.value)}>
              {CLASS_TYPES.map((c, i) => (
                <option key={c} value={c}>
                  {classLabels[i]}
                </option>
              ))}
            </select>
          </div>
          {isGroup && (
            <div className="min-[480px]:col-span-2">
              <label htmlFor={id("studentCount")} className="label">
                {f.studentCount}
              </label>
              <select id={id("studentCount")} name="studentCount" className="field" defaultValue="2">
                {["2", "3", "4", "5", "6"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
                <option value="More than 6">{f.moreThan(6)}</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <label htmlFor={id("teacherPref")} className="label">Preferred Teacher</label>
        <select id={id("teacherPref")} name="teacherPref" className="field" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
          <option value="Female teacher">Female Teacher</option>
          <option value="Male teacher">Male Teacher</option>
          <option value="No preference">Either</option>
        </select>
      </div>

      {showRest && (
        <>
          <div className={two}>
            <div>
              <label htmlFor={id("studentFor")} className="label">
                {f.studentFor}
              </label>
              <select id={id("studentFor")} name="studentFor" className="field" value={studentFor} onChange={(e) => setStudentFor(e.target.value)}>
                {STUDENT_FOR.map((s, i) => (
                  <option key={s} value={s}>
                    {f.studentForOptions[i]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={id("studentAge")} className="label">
                {f.age} {opt}
              </label>
              <input id={id("studentAge")} name="studentAge" className="field" maxLength={20} placeholder={f.agePh} />
            </div>
          </div>
          <div className={two}>
            <div>
              <label htmlFor={id("email")} className="label">
                {f.email} {opt}
              </label>
              <input id={id("email")} name="email" type="email" dir="ltr" className="field text-start" autoComplete="email" maxLength={120} aria-invalid={!!errors.email} aria-describedby={errors.email ? id("email-err") : undefined} />
              {err("email")}
            </div>
            <div>
              <label htmlFor={id("preferredTime")} className="label">
                {f.time} {opt}
              </label>
              <input id={id("preferredTime")} name="preferredTime" className="field" maxLength={120} placeholder={f.timePh} />
            </div>
          </div>
          <div>
            <label htmlFor={id("message")} className="label">
              {f.message} {opt}
            </label>
            <textarea id={id("message")} name="message" className="field min-h-20" maxLength={1000} rows={variant === "full" ? 3 : 2} />
          </div>
        </>
      )}

      {variant !== "full" && !more && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.92rem]">
          {/* On the group and female-teacher pages the choice is already made; say so, so nobody wonders where it went. */}
          {variant === "quick" && (isGroup || teacher !== TEACHER_PREFS[0]) ? (
            <span className="text-muted">{[isGroup ? classLabels[CLASS_TYPES.indexOf(classType as (typeof CLASS_TYPES)[number])] : "", teacher !== TEACHER_PREFS[0] ? f.teacherOptions[TEACHER_PREFS.indexOf(teacher as (typeof TEACHER_PREFS)[number])] : ""].filter(Boolean).join(" · ")}</span>
          ) : (
            <span />
          )}
          <button type="button" className="link py-0.5 font-medium" aria-expanded={false} onClick={() => setMore(true)}>
            {f.more}
          </button>
        </div>
      )}

      {/* Honeypot: hidden from people, tempting to bots */}
      <div aria-hidden="true" className="hidden" tabIndex={-1} autoComplete="off">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {(formError || waLink) && (
        <div role="alert">
          {formError && <p className={`rounded-md px-3 py-2 text-[0.95rem] ${waLink ? "bg-wash text-charcoal" : "bg-bad/10 text-bad"}`}>{formError}</p>}
          {waLink && (
            <a href={waLink} rel="noopener" className="btn btn-primary mt-3 w-full text-[1.05rem]">
              {f.waSend}
            </a>
          )}
        </div>
      )}

      <button type="submit" className={`btn w-full text-[1.05rem] ${waLink ? "btn-line" : "btn-primary"}`} disabled={state === "sending"}>
        {state === "sending" ? f.sending : (submitLabel ?? t.common.trialCta(trialClasses))}
      </button>

      <p className="text-[0.82rem] leading-snug text-muted">
        {f.note}{" "}
        <Link href="/privacy-policy" className="link">
          {f.privacy}
        </Link>
        .
      </p>
    </form>
  );
}
