"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/users";
import {
  addAssessment,
  assignQuiz,
  ATTENDANCE,
  createQuiz,
  deleteAssessment,
  deleteAssignment,
  deleteLesson,
  deleteQuiz,
  getQuiz,
  isDay,
  logLesson,
  QUIZ_SLOTS,
  roster,
  teacherClass,
  todayIn,
  type Attendance,
} from "@/lib/lms";
import { clean } from "@/lib/validate";
import { courses } from "@/content/courses";
import type { Question } from "@/content/quizzes";

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);

/** Only an approved teacher may change anything, and only in a running class that is theirs. */
async function teacher() {
  const user = await requireUser("teach");
  if (user.status !== "active") redirect("/teach");
  return user;
}
async function ownClass(fd: FormData) {
  const user = await teacher();
  const cls = await teacherClass(user.id, text(fd, "classId", 60));
  if (!cls) redirect("/teach");
  return { user, cls };
}
/** A lesson or test date: a real date, not after today where the teacher is. Anything else becomes today. */
function day(v: string, timezone: string): string {
  const now = todayIn(timezone);
  return isDay(v) && v <= now ? v : now;
}

export async function saveLesson(fd: FormData) {
  const { user, cls } = await ownClass(fd);
  const topic = text(fd, "topic", 300);
  if (!topic) redirect(`/teach/class/${cls.id}?msg=topic#log`);
  const learners = await roster(cls.id);
  await logLesson({
    classId: cls.id,
    teacherId: user.id,
    heldOn: day(text(fd, "heldOn", 10), user.timezone),
    topic,
    homework: text(fd, "homework", 400),
    marks: learners.map((s) => {
      const att = text(fd, `att_${s.id}`, 10);
      const attendance: Attendance = (ATTENDANCE as readonly string[]).includes(att) ? (att as Attendance) : "present";
      const rating = Number(text(fd, `rate_${s.id}`, 2));
      return {
        studentId: s.id,
        attendance,
        rating: attendance !== "absent" && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
        note: text(fd, `note_${s.id}`, 400),
      };
    }),
  });
  redirect(`/teach/class/${cls.id}?msg=lesson`);
}

export async function removeLesson(fd: FormData) {
  const { cls } = await ownClass(fd);
  const done = await deleteLesson(text(fd, "id", 60), cls.id);
  redirect(`/teach/class/${cls.id}?msg=${done ? "removed" : "notremoved"}`);
}

export async function setQuiz(fd: FormData) {
  const { user, cls } = await ownClass(fd);
  const quiz = await getQuiz(text(fd, "quizId", 60));
  // Ready-made quizzes, or ones this teacher wrote.
  if (!quiz || (quiz.source === "teacher" && quiz.createdBy !== user.id)) redirect(`/teach/class/${cls.id}`);
  const due = text(fd, "dueOn", 10);
  await assignQuiz({ quizId: quiz.id, classId: cls.id, assignedBy: user.id, dueOn: isDay(due) ? due : "" });
  redirect(`/teach/class/${cls.id}?msg=assigned`);
}

export async function removeAssignment(fd: FormData) {
  const { cls } = await ownClass(fd);
  const done = await deleteAssignment(text(fd, "id", 60), cls.id);
  redirect(`/teach/class/${cls.id}?msg=${done ? "removed" : "notremoved"}`);
}

export async function saveTest(fd: FormData) {
  const { user, cls } = await ownClass(fd);
  const studentId = text(fd, "studentId", 60);
  const title = text(fd, "title", 120);
  const score = Number(text(fd, "score", 8));
  const maxScore = Number(text(fd, "maxScore", 8));
  const inClass = (await roster(cls.id)).some((s) => s.id === studentId);
  if (!inClass || !title || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore < 1 || maxScore > 1000 || score < 0 || score > maxScore) redirect(`/teach/class/${cls.id}?msg=testbad#test`);
  await addAssessment({ studentId, teacherId: user.id, classId: cls.id, heldOn: day(text(fd, "heldOn", 10), user.timezone), title, score, maxScore, note: text(fd, "note", 400) });
  redirect(`/teach/class/${cls.id}?msg=test`);
}

export async function removeTest(fd: FormData) {
  const user = await teacher();
  await deleteAssessment(text(fd, "id", 60), user.id);
  const back = text(fd, "back", 200);
  redirect(back.startsWith("/teach/") ? back : "/teach");
}

export async function saveQuiz(fd: FormData) {
  const user = await teacher();
  const title = text(fd, "title", 120);
  const course = text(fd, "course", 80);
  const questions: Question[] = [];
  let dropped = 0;
  for (let i = 0; i < QUIZ_SLOTS; i++) {
    const q = text(fd, `q${i}`, 400);
    if (!q) continue;
    // Empty options are dropped, so the position of the correct one has to be worked out again.
    const filled = [0, 1, 2, 3].map((n) => ({ n, value: text(fd, `o${i}_${n}`, 200) })).filter((o) => o.value);
    const answer = filled.findIndex((o) => String(o.n) === text(fd, `a${i}`, 1));
    if (filled.length < 2 || answer < 0) {
      dropped++;
      continue;
    }
    questions.push({ q, options: filled.map((o) => o.value), answer });
  }
  if (!title || questions.length === 0) redirect("/teach/quizzes/new?msg=need");
  const id = await createQuiz(user.id, { title, course: courses.some((c) => c.slug === course) ? course : "", questions });
  redirect(`/teach/quizzes/${id}?msg=saved${dropped ? `&dropped=${dropped}` : ""}`);
}

export async function removeQuiz(fd: FormData) {
  const user = await teacher();
  const result = await deleteQuiz(text(fd, "id", 60), user.id);
  redirect(`/teach/quizzes?msg=${result === "deleted" ? "removed" : result === "in-use" ? "inuse" : "notremoved"}`);
}
