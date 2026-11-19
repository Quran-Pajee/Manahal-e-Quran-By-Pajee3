"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/users";
import { addStudent, assignmentDone, assignmentFor, canSeeStudent, CLASS_KINDS, getQuiz, LEVELS, openAssignment, saveAttempt, studentsOfUser } from "@/lib/lms";
import { clean } from "@/lib/validate";
import { claimInvoice, PAY_METHODS } from "@/lib/billing";
import { courses } from "@/content/courses";

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);

export async function addLearner(fd: FormData) {
  const user = await requireUser("portal");
  if (user.status !== "active") redirect("/portal");
  const existing = (await studentsOfUser(user.id)).length;
  // A student account holds one learner (the student). Parents and organisers can add up to 20.
  if (user.role === "student" ? existing >= 1 : existing >= 20) redirect("/portal");
  const name = text(fd, "name", 80);
  if (name.length < 2) redirect("/portal?added=bad#add");

  const year = Number(text(fd, "birthYear", 4));
  const gender = text(fd, "gender", 10);
  const course = text(fd, "course", 80);
  const kind = text(fd, "classKind", 12);
  const pref = text(fd, "teacherPref", 10);
  const level = text(fd, "level", 12);
  await addStudent(user.id, {
    name,
    birthYear: Number.isInteger(year) && year >= 1925 && year <= new Date().getFullYear() ? year : null,
    gender: gender === "male" || gender === "female" ? gender : "",
    course: courses.some((c) => c.slug === course) ? course : "",
    classKind: (CLASS_KINDS as readonly string[]).includes(kind) ? kind : "one",
    teacherPref: pref === "female" || pref === "male" ? pref : "",
    level: (LEVELS as readonly string[]).includes(level) ? level : "",
    notes: text(fd, "notes", 600),
  });
  redirect("/portal?added=1");
}

/** Marks a quiz on the server. The correct answers are never sent to the browser before this point. */
export async function submitQuiz(fd: FormData) {
  const user = await requireUser("portal");
  if (user.status !== "active") redirect("/portal");
  const student = await canSeeStudent(user, text(fd, "learner", 60));
  const quiz = await getQuiz(text(fd, "quiz", 60));
  if (!student || !quiz) redirect("/portal");

  const assignmentId = text(fd, "assignment", 60);
  let assignment = assignmentId ? await assignmentFor(student.id, assignmentId) : null;
  if (assignment && assignment.quizId !== quiz.id) assignment = null;
  // A teacher's own quiz can only be taken by a learner it was set for.
  if (quiz.source === "teacher" && !assignment) redirect(`/portal/learner/${student.id}`);
  // Only the first try counts for the teacher. A second try, after the answers have been shown, is saved as practice.
  if (assignment && (await assignmentDone(student.id, assignment.id))) assignment = null;
  // Started from the practice list while the same quiz is waiting from the teacher: count it for the teacher.
  if (!assignment && !assignmentId) assignment = await openAssignment(student.id, quiz.id);

  const answers = quiz.questions.map((question, i) => {
    const n = Number(fd.get(`q${i}`) ?? -1);
    return Number.isInteger(n) && n >= 0 && n < question.options.length ? n : -1;
  });
  const id = await saveAttempt({ quiz, studentId: student.id, assignmentId: assignment?.id ?? null, answers });
  redirect(`/portal/result/${id}`);
}

/** "I have paid": the family reports a payment on one of their own invoices. The admin then checks and confirms it. */
export async function reportPayment(fd: FormData) {
  const user = await requireUser("portal");
  if (user.status !== "active") redirect("/portal");
  const method = text(fd, "method", 12);
  const done = await claimInvoice(user.id, text(fd, "id", 60), (PAY_METHODS as readonly string[]).includes(method) ? method : "other", text(fd, "reference", 120));
  redirect(`/portal/fees${done ? "?msg=claimed" : ""}`);
}
