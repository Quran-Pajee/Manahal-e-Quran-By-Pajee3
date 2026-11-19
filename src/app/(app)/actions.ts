"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountsReady, appLang, changePassword, createUser, emailTaken, endSession, homeFor, logIn, requireUser, setLangCookie, setUserLang, updateProfile, currentUser, type Role } from "@/lib/users";
import { addStudent } from "@/lib/lms";
import { createLead } from "@/lib/leads";
import { notifyNewLead } from "@/lib/notify";
import { one } from "@/lib/db";
import { clean } from "@/lib/validate";
import { blocked, limited, strike } from "@/lib/limits";
import { COUNTRIES } from "@/lib/lead-types";
import { courses } from "@/content/courses";
import { isLang } from "@/i18n";

/** Error codes are keys of the `auth` block in src/i18n/app.*.ts, so messages appear in the reader's language. */
export type FormState = { errors?: Record<string, string>; values?: Record<string, string>; stamp?: number };

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);
const ip = async () => ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const validPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[+\d\s().-]+$/.test(phone);
};
const courseSlug = (v: string) => (courses.some((c) => c.slug === v) ? v : "");

export async function logInAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email", 120).toLowerCase();
  const password = typeof fd.get("password") === "string" ? String(fd.get("password")).slice(0, 200) : "";
  const values = { email };
  if (!accountsReady()) return { errors: { form: "errUnavailable" }, values, stamp: Date.now() };
  // Only wrong passwords are counted, so a shared connection (a masjid, a school) is not locked out by people logging in normally.
  const from = `user-login-ip:${await ip()}`;
  const who = `user-login-email:${email}`;
  if ((await blocked(from, 30, 15)) || (await blocked(who, 10, 15))) return { errors: { form: "errLocked" }, values, stamp: Date.now() };

  const user = EMAIL.test(email) && password ? await logIn(email, password) : null;
  if (!user) {
    await Promise.all([strike(from), strike(who), new Promise((r) => setTimeout(r, 600))]); // the pause slows guessing
    return { errors: { form: "errWrong" }, values, stamp: Date.now() };
  }
  redirect(homeFor(user));
}

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const roleIn = text(fd, "role", 20);
  const role: Role = roleIn === "teacher" ? "teacher" : roleIn === "student" ? "student" : "guardian";
  const v = {
    role,
    name: text(fd, "name", 80),
    email: text(fd, "email", 120).toLowerCase(),
    phone: text(fd, "phone", 30),
    country: text(fd, "country", 60),
    timezone: text(fd, "timezone", 60),
    gender: text(fd, "gender", 10),
    accountKind: text(fd, "accountKind", 20),
    learners: text(fd, "learners", 4),
    course: courseSlug(text(fd, "course", 80)),
    teacherPref: text(fd, "teacherPref", 10),
    preferredTime: text(fd, "preferredTime", 160),
    about: text(fd, "about", 1500),
    teaches: fd
      .getAll("teaches")
      .map((x) => courseSlug(String(x)))
      .filter(Boolean)
      .join(","),
    age16: fd.get("age16") ? "1" : "",
  };
  const password = typeof fd.get("password") === "string" ? String(fd.get("password")) : "";
  const values: Record<string, string> = { ...v };

  if (!accountsReady()) return { errors: { form: "errUnavailable" }, values, stamp: Date.now() };
  if (text(fd, "company", 100)) return { errors: { form: "errGeneric" }, values, stamp: Date.now() }; // hidden field that only scripts fill in
  if (await limited(`signup-ip:${await ip()}`, 12, 60)) return { errors: { form: "errLocked" }, values, stamp: Date.now() };

  const errors: Record<string, string> = {};
  if (v.name.length < 2) errors.name = "errName";
  if (!EMAIL.test(v.email)) errors.email = "errEmail";
  if (password.length < 8 || password.length > 200) errors.password = "errPassword";
  if (!validPhone(v.phone)) errors.phone = "errPhone";
  if (role === "student" && !v.age16) errors.age16 = "errAge";
  if (role === "teacher" && v.gender !== "male" && v.gender !== "female") errors.gender = "errGender";
  if (!errors.email && (await emailTaken(v.email))) errors.email = "errEmailTaken";
  if (Object.keys(errors).length) return { errors, values, stamp: Date.now() };

  const gender = v.gender === "male" || v.gender === "female" ? v.gender : "";
  const accountKind = role === "guardian" ? (v.accountKind === "community" ? "community" : "family") : "";
  const teacherPref = v.teacherPref === "female" || v.teacherPref === "male" ? v.teacherPref : "";
  const country = COUNTRIES.includes(v.country) ? v.country : "";
  const lang = await appLang();

  let user;
  try {
    user = await createUser({
      role,
      name: v.name,
      email: v.email,
      password,
      phone: v.phone,
      country,
      timezone: v.timezone,
      gender,
      lang,
      accountKind,
      preferredTime: v.preferredTime,
      about: role === "teacher" ? v.about : "",
      teaches: role === "teacher" ? v.teaches : "",
    });
  } catch (e) {
    const taken = /unique|duplicate/i.test(String((e as Error)?.message));
    return { errors: taken ? { email: "errEmailTaken" } : { form: "errGeneric" }, values, stamp: Date.now() };
  }

  if (role === "student") {
    // A student account has one learner: the student.
    await addStudent(user.id, { name: v.name, birthYear: null, gender, course: v.course, classKind: "one", teacherPref, level: "", notes: "" });
  }

  if (role !== "teacher") {
    // Families who sign up without using the trial form still need a call back, so they are added to the leads list once.
    try {
      const known = await one(`select id from leads where (email <> '' and email = $1) or phone = $2 limit 1`, [v.email, v.phone]);
      if (!known) {
        const lead = await createLead({
          name: v.name,
          phone: v.phone,
          email: v.email,
          country,
          course: courses.find((c) => c.slug === v.course)?.name ?? "",
          studentFor: role === "student" ? "Myself" : "My child",
          studentAge: "",
          teacherPref: teacherPref === "female" ? "Female teacher" : teacherPref === "male" ? "Male teacher" : "",
          classType: accountKind === "community" ? "Community group" : accountKind === "family" && Number(v.learners) > 1 ? "Family group" : "1-on-1",
          studentCount: role === "guardian" ? v.learners : "1",
          preferredTime: v.preferredTime,
          timezone: v.timezone,
          message: "Created a dashboard account.",
          sourcePage: `signup:${role === "guardian" ? accountKind : role}`,
          landingPage: "",
          referrer: "",
          utmSource: "",
          utmMedium: "",
          utmCampaign: "",
          utmTerm: "",
          utmContent: "",
          gclid: "",
          fbclid: "",
        });
        await notifyNewLead(lead);
      }
    } catch {
      // The account exists; a missed alert must not stop the person reaching their dashboard.
    }
  }

  redirect(homeFor(user));
}

export async function logOut() {
  await endSession();
  redirect("/login");
}

/** Language buttons. Sends the person back to the page they were on. */
export async function setLang(fd: FormData) {
  const lang = fd.get("lang");
  let back = "/";
  const h = await headers();
  try {
    const from = new URL(h.get("referer") ?? "");
    if (from.host === h.get("host")) back = from.pathname + from.search;
  } catch {
    // no referrer: fall through to the default below
  }
  if (isLang(lang)) {
    await setLangCookie(lang);
    const user = await currentUser();
    if (user) await setUserLang(user.id, lang);
    if (back === "/") back = user ? homeFor(user) : "/login";
  }
  redirect(back.startsWith("/") && !back.startsWith("//") ? back : "/login");
}

export async function saveProfile(fd: FormData) {
  const user = await requireUser();
  const name = text(fd, "name", 80);
  const phone = text(fd, "phone", 30);
  const home = homeFor(user);
  if (name.length < 2 || !validPhone(phone)) redirect(`${home}/settings?profile=bad`);
  const country = text(fd, "country", 60);
  await updateProfile(user.id, {
    name,
    phone,
    country: COUNTRIES.includes(country) ? country : "",
    timezone: text(fd, "timezone", 60),
    preferredTime: text(fd, "preferredTime", 160),
    ...(user.role === "teacher"
      ? {
          about: text(fd, "about", 1500),
          teaches: fd
            .getAll("teaches")
            .map((x) => courseSlug(String(x)))
            .filter(Boolean)
            .join(","),
        }
      : {}),
  });
  redirect(`${home}/settings?profile=saved`);
}

export async function savePassword(fd: FormData) {
  const user = await requireUser();
  const home = homeFor(user);
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8 || next.length > 200) redirect(`${home}/settings?pw=short`);
  const key = `password-change:${user.id}`;
  if (await blocked(key, 8, 15)) redirect(`${home}/settings?pw=wrong`);
  if (!(await changePassword(user.id, current, next))) {
    await strike(key);
    redirect(`${home}/settings?pw=wrong`);
  }
  redirect(`${home}/settings?pw=changed`);
}
