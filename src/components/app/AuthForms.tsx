"use client";

import { useActionState, useEffect, useState } from "react";
import { logInAction, signUpAction, type FormState } from "@/app/(app)/actions";
import type { App } from "@/i18n/app";
import Link from "next/link";
import { PasswordField } from "./PasswordField";

type T = App["auth"];
type Option = { value: string; label: string };

function Err({ id, code, t }: { id: string; code?: string; t: T }) {
  if (!code) return null;
  return (
    <p id={id} className="mt-1.5 text-[0.9rem] font-medium text-bad">
      {(t as Record<string, string>)[code] ?? t.errGeneric}
    </p>
  );
}

function FormError({ code, t }: { code?: string; t: T }) {
  if (!code) return null;
  return (
    <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-[0.97rem] font-medium text-bad">
      {(t as Record<string, string>)[code] ?? t.errGeneric}
    </p>
  );
}

export function LoginForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logInAction, {});
  return (
    <form action={action} className="grid gap-4" key={state.stamp ?? 0}>
      <FormError code={state.errors?.form} t={t} />
      <div>
        <label className="label" htmlFor="email">
          {t.email}
        </label>
        <input className="field" id="email" name="email" type="email" dir="ltr" autoComplete="email" required defaultValue={state.values?.email ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t.password}
        </label>
        <PasswordField className="field" id="password" name="password" dir="ltr" autoComplete="current-password" required />
      </div>
      <p><Link className="link" href="/forgot-password">Forgot password?</Link></p>
      <button type="submit" className="btn btn-emerald w-full" disabled={pending}>
        {t.loginBtn}
      </button>
    </form>
  );
}

export function SignupForm({ t, role, courses, countries, legal }: { t: T; role: "guardian" | "student" | "teacher"; courses: Option[]; countries: string[]; legal: { terms: string; privacy: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const [tz, setTz] = useState("");
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    } catch {
      // older browsers: the time zone stays empty and the academy asks instead
    }
  }, []);
  const taught = (v.teaches ?? "").split(",");

  return (
    <form action={action} className="grid gap-4" key={`${role}${state.stamp ?? ""}`}>
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="timezone" value={tz || v.timezone || ""} />
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <FormError code={e.form} t={t} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            {t.name}
          </label>
          <input className="field" id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} defaultValue={v.name ?? ""} aria-invalid={e.name ? true : undefined} aria-describedby={e.name ? "e-name" : undefined} />
          <Err id="e-name" code={e.name} t={t} />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            {t.phone}
          </label>
          <input className="field" id="phone" name="phone" type="tel" dir="ltr" autoComplete="tel" inputMode="tel" placeholder="+1 415 555 0123" required defaultValue={v.phone ?? ""} aria-invalid={e.phone ? true : undefined} aria-describedby={e.phone ? "e-phone" : undefined} />
          <Err id="e-phone" code={e.phone} t={t} />
        </div>
        <div>
          <label className="label" htmlFor="email">
            {t.email}
          </label>
          <input className="field" id="email" name="email" type="email" dir="ltr" autoComplete="email" required defaultValue={v.email ?? ""} aria-invalid={e.email ? true : undefined} aria-describedby={e.email ? "e-email" : undefined} />
          <Err id="e-email" code={e.email} t={t} />
        </div>
        <div>
          <label className="label" htmlFor="password">
            {t.password}
          </label>
          <PasswordField className="field" id="password" name="password" dir="ltr" autoComplete="new-password" required minLength={8} maxLength={200} aria-invalid={e.password ? true : undefined} aria-describedby="h-password" />
          {e.password ? (
            <Err id="h-password" code={e.password} t={t} />
          ) : (
            <p id="h-password" className="mt-1.5 text-[0.9rem] text-muted">
              {t.passwordHint}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="country">
            {t.country}
          </label>
          <select className="field" id="country" name="country" autoComplete="country-name" defaultValue={v.country ?? ""} dir="ltr">
            <option value="">{t.chooseCountry}</option>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {role === "guardian" && (
          <>
            <div>
              <label className="label" htmlFor="accountKind">
                {t.accountKind}
              </label>
              <select className="field" id="accountKind" name="accountKind" defaultValue={v.accountKind || "family"}>
                <option value="family">{t.kindFamily}</option>
                <option value="community">{t.kindCommunity}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="learners">
                {t.learners}
              </label>
              <select className="field" id="learners" name="learners" defaultValue={v.learners || "1"} dir="ltr">
                {["1", "2", "3", "4", "5", "6", "6+"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {role === "teacher" && (
          <div>
            <label className="label" htmlFor="gender">
              {t.gender}
            </label>
            <select className="field" id="gender" name="gender" required defaultValue={v.gender ?? ""} aria-invalid={e.gender ? true : undefined} aria-describedby={e.gender ? "e-gender" : undefined}>
              <option value="" />
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
            </select>
            <Err id="e-gender" code={e.gender} t={t} />
          </div>
        )}

        {role !== "teacher" && (
          <>
            <div>
              <label className="label" htmlFor="course">
                {t.course}
              </label>
              <select className="field" id="course" name="course" defaultValue={v.course ?? ""}>
                <option value="">{t.anyCourse}</option>
                {courses.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="teacherPref">
                {t.teacherPref}
              </label>
              <select className="field" id="teacherPref" name="teacherPref" defaultValue={v.teacherPref ?? ""}>
                <option value="">{t.prefNone}</option>
                <option value="female">{t.prefFemale}</option>
                <option value="male">{t.prefMale}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {role === "teacher" && (
        <>
          <fieldset>
            <legend className="label">{t.teaches}</legend>
            <div className="mt-1 grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
              {courses.map((c) => (
                <label key={c.value} className="flex items-center gap-2.5 py-1">
                  <input type="checkbox" name="teaches" value={c.value} defaultChecked={taught.includes(c.value)} className="h-[1.15rem] w-[1.15rem] accent-[#123D32]" />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="about">
              {t.about}
            </label>
            <textarea className="field" id="about" name="about" rows={4} maxLength={1500} placeholder={t.aboutPh} defaultValue={v.about ?? ""} />
          </div>
        </>
      )}

      <div>
        <label className="label" htmlFor="preferredTime">
          {role === "teacher" ? t.availability : t.preferredTime}
        </label>
        <input className="field" id="preferredTime" name="preferredTime" maxLength={160} placeholder={role === "teacher" ? t.availabilityPh : t.preferredTimePh} defaultValue={v.preferredTime ?? ""} />
      </div>

      {role === "student" && (
        <div>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="age16" required defaultChecked={Boolean(v.age16)} className="mt-1.5 h-[1.15rem] w-[1.15rem] accent-[#123D32]" aria-describedby={e.age16 ? "e-age16" : undefined} />
            <span>{t.age16}</span>
          </label>
          <Err id="e-age16" code={e.age16} t={t} />
        </div>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {t.signupBtn}
      </button>
      <p className="text-[0.9rem] text-muted">
        {t.agree}{" "}
        <a className="link" href={legal.terms}>
          {t.terms}
        </a>{" "}
        {t.and}{" "}
        <a className="link" href={legal.privacy}>
          {t.privacy}
        </a>
        .
      </p>
    </form>
  );
}
