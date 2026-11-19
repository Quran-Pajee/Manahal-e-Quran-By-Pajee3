import { randomUUID } from "crypto";
import { q, one, storageMode } from "./db";
import { bankQuiz, quizBank, type Question, type Quiz } from "@/content/quizzes";
import type { User } from "./users";

/** Learners, classes, lessons, quizzes and the numbers shown on the dashboards. */

export const CLASS_KINDS = ["one", "family", "community"] as const;
export type ClassKind = (typeof CLASS_KINDS)[number];
export const ATTENDANCE = ["present", "late", "absent"] as const;
export type Attendance = (typeof ATTENDANCE)[number];
export const LEVELS = ["new", "qaida", "reading", "fluent", "hifz"] as const;
/** How many question boxes the "write a quiz" form shows. */
export const QUIZ_SLOTS = 12;

export type Student = {
  id: string;
  createdAt: string;
  userId: string;
  name: string;
  birthYear: number | null;
  gender: string;
  course: string;
  classKind: string;
  teacherPref: string;
  level: string;
  notes: string;
};
export type ClassRow = {
  id: string;
  createdAt: string;
  name: string;
  kind: string;
  course: string;
  teacherId: string | null;
  schedule: string;
  meetingUrl: string;
  status: string;
};

const off = () => storageMode() === "none";
const marks = (n: number, from = 1) => Array.from({ length: n }, (_, i) => `$${i + from}`).join(",");
const json = <T,>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;
export const today = () => new Date().toISOString().slice(0, 10);
/** Today's date where the person is, e.g. "Asia/Karachi". Falls back to UTC when the time zone is unknown. */
export function todayIn(timezone: string): string {
  try {
    if (timezone) return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    // not a time zone name the server knows
  }
  return today();
}
export const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
/** A real calendar date written YYYY-MM-DD ("2026-02-31" is refused). */
export function isDay(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// What a teacher may see of a learner's quiz attempts: ready-made quizzes, quizzes the teacher wrote, and quizzes set in the teacher's classes.
const attemptVisible = (alias: string, p: string) =>
  `(${alias}.quiz_id like 'qb-%' or ${alias}.quiz_id in (select id from quizzes where created_by = ${p})
    or ${alias}.assignment_id in (select qa.id from quiz_assignments qa join classes qc on qc.id = qa.class_id where qc.teacher_id = ${p}))`;

/* ---------- Learners ---------- */

export async function studentsOfUser(userId: string): Promise<Student[]> {
  return q<Student>(`select * from students where user_id = $1 order by created_at`, [userId]);
}

export async function getStudent(id: string): Promise<Student | null> {
  if (off()) return null;
  return one<Student>(`select * from students where id = $1`, [id]);
}

export type NewStudent = Omit<Student, "id" | "createdAt" | "userId">;
export async function addStudent(userId: string, s: NewStudent): Promise<string> {
  const id = randomUUID();
  await q(
    `insert into students (id, user_id, name, birth_year, gender, course, class_kind, teacher_pref, level, notes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, userId, s.name, s.birthYear, s.gender, s.course, s.classKind, s.teacherPref, s.level, s.notes],
  );
  return id;
}

export async function deleteStudent(id: string) {
  await q(`delete from students where id = $1`, [id]);
}

/** A family sees its own learners. A teacher sees learners in the classes they teach. */
export async function canSeeStudent(user: User, studentId: string): Promise<Student | null> {
  const s = await getStudent(studentId);
  if (!s) return null;
  if (user.role !== "teacher") return s.userId === user.id ? s : null;
  if (user.status !== "active") return null;
  const hit = await one(`select 1 as ok from enrollments e join classes c on c.id = e.class_id where e.student_id = $1 and c.teacher_id = $2 and c.status = 'active' limit 1`, [studentId, user.id]);
  return hit ? s : null;
}

/* ---------- Classes ---------- */

export type ClassListRow = ClassRow & { teacherName: string | null; learners: number; lastLesson: string | null };
const CLASS_LIST = `select c.*, u.name as teacher_name,
    (select count(*)::int from enrollments e where e.class_id = c.id) as learners,
    (select max(l.held_on) from lessons l where l.class_id = c.id) as last_lesson
  from classes c left join users u on u.id = c.teacher_id`;

export async function listClasses(): Promise<ClassListRow[]> {
  if (off()) return [];
  return q<ClassListRow>(`${CLASS_LIST} order by (c.status = 'active') desc, c.created_at desc`);
}

export async function classesOfTeacher(teacherId: string): Promise<ClassListRow[]> {
  return q<ClassListRow>(`${CLASS_LIST} where c.teacher_id = $1 and c.status = 'active' order by c.name`, [teacherId]);
}

export async function getClass(id: string): Promise<ClassRow | null> {
  if (off()) return null;
  return one<ClassRow>(`select * from classes where id = $1`, [id]);
}

export async function teacherClass(teacherId: string, classId: string): Promise<ClassRow | null> {
  return one<ClassRow>(`select * from classes where id = $1 and teacher_id = $2 and status = 'active'`, [classId, teacherId]);
}

export async function roster(classId: string): Promise<Student[]> {
  return q<Student>(`select s.* from students s join enrollments e on e.student_id = s.id where e.class_id = $1 order by s.name`, [classId]);
}

export type StudentClass = ClassRow & { teacherName: string | null; teacherGender: string | null };
export async function classesOfStudent(studentId: string): Promise<StudentClass[]> {
  return q<StudentClass>(
    `select c.*, u.name as teacher_name, u.gender as teacher_gender from classes c
       join enrollments e on e.class_id = c.id left join users u on u.id = c.teacher_id
      where e.student_id = $1 and c.status = 'active' order by c.name`,
    [studentId],
  );
}

export type ClassInput = { name: string; kind: string; course: string; teacherId: string | null; schedule: string; meetingUrl: string; status: string };
export async function createClass(c: ClassInput): Promise<string> {
  const id = randomUUID();
  await q(`insert into classes (id, name, kind, course, teacher_id, schedule, meeting_url, status) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, c.name, c.kind, c.course, c.teacherId, c.schedule, c.meetingUrl, c.status]);
  return id;
}
export async function updateClass(id: string, c: ClassInput) {
  await q(`update classes set name = $1, kind = $2, course = $3, teacher_id = $4, schedule = $5, meeting_url = $6, status = $7 where id = $8`, [c.name, c.kind, c.course, c.teacherId, c.schedule, c.meetingUrl, c.status, id]);
}
export async function deleteClass(id: string) {
  await q(`delete from classes where id = $1`, [id]);
}
export async function enrol(classId: string, studentId: string) {
  await q(`insert into enrollments (class_id, student_id) values ($1, $2) on conflict do nothing`, [classId, studentId]);
}
export async function unenrol(classId: string, studentId: string) {
  await q(`delete from enrollments where class_id = $1 and student_id = $2`, [classId, studentId]);
}

/* ---------- Lessons ---------- */

export type Lesson = { id: string; createdAt: string; classId: string; teacherId: string | null; heldOn: string; topic: string; homework: string };
export type LessonMark = { studentId: string; attendance: Attendance; rating: number | null; note: string };

export async function logLesson(l: { classId: string; teacherId: string; heldOn: string; topic: string; homework: string; marks: LessonMark[] }): Promise<string> {
  const id = randomUUID();
  await q(`insert into lessons (id, class_id, teacher_id, held_on, topic, homework) values ($1,$2,$3,$4,$5,$6)`, [id, l.classId, l.teacherId, l.heldOn, l.topic, l.homework]);
  for (const m of l.marks) {
    await q(`insert into lesson_marks (lesson_id, student_id, attendance, rating, note) values ($1,$2,$3,$4,$5)`, [id, m.studentId, m.attendance, m.rating, m.note]);
  }
  return id;
}

/** Deletes a lesson of one class. Returns false when there was no such lesson in that class. */
export async function deleteLesson(id: string, classId: string): Promise<boolean> {
  return (await q(`delete from lessons where id = $1 and class_id = $2 returning id`, [id, classId])).length > 0;
}

export type ClassLesson = Lesson & { marked: number; attended: number };
export async function lessonsOfClass(classId: string, limit = 12): Promise<ClassLesson[]> {
  return q<ClassLesson>(
    `select l.*, (select count(*)::int from lesson_marks m where m.lesson_id = l.id) as marked,
        (select count(*)::int from lesson_marks m where m.lesson_id = l.id and m.attendance <> 'absent') as attended
       from lessons l where l.class_id = $1 order by l.held_on desc, l.created_at desc limit ${Math.floor(limit)}`,
    [classId],
  );
}

export type StudentLesson = { id: string; heldOn: string; topic: string; homework: string; attendance: Attendance; rating: number | null; note: string; className: string };
/** A learner's lessons. With a teacher id, only lessons from that teacher's classes. */
export async function lessonsOfStudent(studentId: string, teacherId?: string, limit = 40): Promise<StudentLesson[]> {
  return q<StudentLesson>(
    `select l.id, l.held_on, l.topic, l.homework, m.attendance, m.rating, m.note, c.name as class_name
       from lesson_marks m join lessons l on l.id = m.lesson_id join classes c on c.id = l.class_id
      where m.student_id = $1 ${teacherId ? "and c.teacher_id = $2" : ""} order by l.held_on desc, l.created_at desc limit ${Math.floor(limit)}`,
    teacherId ? [studentId, teacherId] : [studentId],
  );
}

/* ---------- Quizzes ---------- */

type QuizRow = { id: string; createdBy: string | null; title: string; course: string; questions: unknown };
const fromRow = (r: QuizRow): Quiz => ({ id: r.id, title: r.title, course: r.course, about: "", questions: json<Question[]>(r.questions), source: "teacher", createdBy: r.createdBy });

export async function getQuiz(id: string): Promise<Quiz | null> {
  const ready = bankQuiz(id);
  if (ready) return ready;
  if (off() || id.startsWith("qb-")) return null;
  const row = await one<QuizRow>(`select * from quizzes where id = $1`, [id]);
  return row ? fromRow(row) : null;
}

export async function quizzesOfTeacher(teacherId: string): Promise<Quiz[]> {
  return (await q<QuizRow>(`select * from quizzes where created_by = $1 order by created_at desc`, [teacherId])).map(fromRow);
}

export async function createQuiz(teacherId: string, quiz: { title: string; course: string; questions: Question[] }): Promise<string> {
  const id = randomUUID();
  await q(`insert into quizzes (id, created_by, title, course, questions) values ($1,$2,$3,$4,$5::text::jsonb)`, [id, teacherId, quiz.title, quiz.course, JSON.stringify(quiz.questions)]);
  return id;
}

/** Deletes a teacher's own quiz and takes it off any class it was set for. A quiz that learners have already taken is kept, so their results still open. */
export async function deleteQuiz(id: string, teacherId: string): Promise<"deleted" | "in-use" | "missing"> {
  const quiz = await one(`select id from quizzes where id = $1 and created_by = $2`, [id, teacherId]);
  if (!quiz) return "missing";
  if (await one(`select id from quiz_attempts where quiz_id = $1 limit 1`, [id])) return "in-use";
  await q(`delete from quiz_assignments where quiz_id = $1`, [id]);
  await q(`delete from quizzes where id = $1`, [id]);
  return "deleted";
}

/** Titles for a mixed list of quiz ids (ready-made and teacher-written). */
async function titles(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const own = [...new Set(ids)].filter((id) => {
    const ready = bankQuiz(id);
    if (ready) out.set(id, ready.title);
    return !ready;
  });
  if (own.length) {
    const rows = await q<{ id: string; title: string }>(`select id, title from quizzes where id in (${marks(own.length)})`, own);
    rows.forEach((r) => out.set(r.id, r.title));
  }
  return out;
}

export async function assignQuiz(a: { quizId: string; classId: string; assignedBy: string; dueOn: string }) {
  await q(`insert into quiz_assignments (id, quiz_id, class_id, assigned_by, due_on) values ($1,$2,$3,$4,$5)`, [randomUUID(), a.quizId, a.classId, a.assignedBy, a.dueOn]);
}

export async function deleteAssignment(id: string, classId: string): Promise<boolean> {
  return (await q(`delete from quiz_assignments where id = $1 and class_id = $2 returning id`, [id, classId])).length > 0;
}

export type ClassAssignment = { id: string; quizId: string; dueOn: string; createdAt: string; done: number; title: string };
export async function assignmentsOfClass(classId: string): Promise<ClassAssignment[]> {
  const rows = await q<Omit<ClassAssignment, "title">>(
    `select a.id, a.quiz_id, a.due_on, a.created_at,
        (select count(distinct t.student_id)::int from quiz_attempts t join enrollments e on e.student_id = t.student_id and e.class_id = a.class_id where t.assignment_id = a.id) as done
       from quiz_assignments a where a.class_id = $1 order by a.created_at desc limit 30`,
    [classId],
  );
  const names = await titles(rows.map((r) => r.quizId));
  return rows.map((r) => ({ ...r, title: names.get(r.quizId) ?? "Quiz" }));
}

export type PendingQuiz = { id: string; quizId: string; dueOn: string; className: string; title: string };
/** Quizzes a teacher has set for this learner's classes that the learner has not taken yet. */
export async function pendingQuizzes(studentId: string): Promise<PendingQuiz[]> {
  const rows = await q<Omit<PendingQuiz, "title">>(
    `select a.id, a.quiz_id, a.due_on, c.name as class_name
       from quiz_assignments a join classes c on c.id = a.class_id join enrollments e on e.class_id = a.class_id
      where e.student_id = $1 and c.status = 'active'
        and not exists (select 1 from quiz_attempts t where t.assignment_id = a.id and t.student_id = $1)
      order by a.created_at desc`,
    [studentId],
  );
  const names = await titles(rows.map((r) => r.quizId));
  return rows.filter((r) => names.has(r.quizId)).map((r) => ({ ...r, title: names.get(r.quizId)! }));
}

export async function assignmentFor(studentId: string, assignmentId: string): Promise<{ id: string; quizId: string } | null> {
  return one(
    `select a.id, a.quiz_id from quiz_assignments a join enrollments e on e.class_id = a.class_id join classes c on c.id = a.class_id
      where a.id = $1 and e.student_id = $2 and c.status = 'active'`,
    [assignmentId, studentId],
  );
}

/** The oldest quiz set for this learner, for this quiz, that they have not done yet. Used when they start it from the practice list. */
export async function openAssignment(studentId: string, quizId: string): Promise<{ id: string; quizId: string } | null> {
  return one(
    `select a.id, a.quiz_id from quiz_assignments a join enrollments e on e.class_id = a.class_id join classes c on c.id = a.class_id
      where a.quiz_id = $2 and e.student_id = $1 and c.status = 'active'
        and not exists (select 1 from quiz_attempts t where t.assignment_id = a.id and t.student_id = $1)
      order by a.created_at limit 1`,
    [studentId, quizId],
  );
}

export async function assignmentDone(studentId: string, assignmentId: string): Promise<boolean> {
  return Boolean(await one(`select id from quiz_attempts where assignment_id = $1 and student_id = $2 limit 1`, [assignmentId, studentId]));
}

export type Attempt = { id: string; takenAt: string; quizId: string; assignmentId: string | null; studentId: string; score: number; total: number; answers: number[] };

/** Marks the answers on the server and saves the result. */
export async function saveAttempt(a: { quiz: Quiz; studentId: string; assignmentId: string | null; answers: number[] }): Promise<string> {
  const id = randomUUID();
  const score = a.quiz.questions.reduce((n, question, i) => n + (a.answers[i] === question.answer ? 1 : 0), 0);
  await q(`insert into quiz_attempts (id, quiz_id, assignment_id, student_id, score, total, answers) values ($1,$2,$3,$4,$5,$6,$7::text::jsonb)`, [id, a.quiz.id, a.assignmentId, a.studentId, score, a.quiz.questions.length, JSON.stringify(a.answers)]);
  return id;
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  const row = await one<Attempt>(`select * from quiz_attempts where id = $1`, [id]);
  return row ? { ...row, answers: json<number[]>(row.answers) } : null;
}

export type AttemptRow = { id: string; takenAt: string; quizId: string; assignmentId: string | null; score: number; total: number; title: string };
/** A learner's quiz results. With a teacher id, only the ones that teacher may see. */
export async function attemptsOfStudent(studentId: string, teacherId?: string, limit = 30): Promise<AttemptRow[]> {
  const rows = await q<Omit<AttemptRow, "title">>(
    `select t.id, t.taken_at, t.quiz_id, t.assignment_id, t.score, t.total from quiz_attempts t
      where t.student_id = $1 ${teacherId ? `and ${attemptVisible("t", "$2")}` : ""} order by t.taken_at desc limit ${Math.floor(limit)}`,
    teacherId ? [studentId, teacherId] : [studentId],
  );
  const names = await titles(rows.map((r) => r.quizId));
  return rows.map((r) => ({ ...r, title: names.get(r.quizId) ?? "Quiz" }));
}

export async function teacherCanSeeAttempt(teacherId: string, attemptId: string): Promise<boolean> {
  return Boolean(await one(`select t.id from quiz_attempts t where t.id = $2 and ${attemptVisible("t", "$1")}`, [teacherId, attemptId]));
}

export const practiceQuizzes = () => quizBank;

/* ---------- Oral tests and other marks the teacher enters ---------- */

export type Assessment = { id: string; studentId: string; teacherId: string | null; classId: string | null; heldOn: string; title: string; score: number; maxScore: number; note: string };
// A teacher sees the tests they recorded and the tests recorded in classes that are now theirs.
const testVisible = (p: string) => `(teacher_id = ${p} or class_id in (select id from classes where teacher_id = ${p}))`;
export async function addAssessment(a: Omit<Assessment, "id">) {
  await q(`insert into assessments (id, student_id, teacher_id, class_id, held_on, title, score, max_score, note) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [randomUUID(), a.studentId, a.teacherId, a.classId, a.heldOn, a.title, a.score, a.maxScore, a.note]);
}
/** A teacher may delete a test they recorded, or one recorded in a class that is now theirs. */
export async function deleteAssessment(id: string, teacherId: string): Promise<boolean> {
  return (await q(`delete from assessments where id = $2 and ${testVisible("$1")} returning id`, [teacherId, id])).length > 0;
}
export async function assessmentsOfStudent(studentId: string, teacherId?: string): Promise<Assessment[]> {
  return q<Assessment>(
    `select id, student_id, teacher_id, class_id, held_on, title, score::float8 as score, max_score::float8 as max_score, note from assessments
      where student_id = $1 ${teacherId ? `and ${testVisible("$2")}` : ""} order by held_on desc, created_at desc limit 40`,
    teacherId ? [studentId, teacherId] : [studentId],
  );
}

/* ---------- Numbers ---------- */

export type StudentStats = {
  lessons: number; // lessons the learner was marked in
  attended: number; // present or late
  rating: number | null; // average of the teacher's 1-5 lesson rating
  lastLesson: string | null;
  quizzes: number; // different quizzes taken
  quizAvg: number | null; // percent, from the first try at each quiz, so retaking after seeing the answers does not lift it
  tests: number;
  testAvg: number | null; // percent
};
const NO_STATS: StudentStats = { lessons: 0, attended: 0, rating: null, lastLesson: null, quizzes: 0, quizAvg: null, tests: 0, testAvg: null };
export const attendancePct = (s: Pick<StudentStats, "lessons" | "attended">) => (s.lessons ? Math.round((s.attended / s.lessons) * 100) : null);

/** Numbers for a list of learners. With a teacher id, only what that teacher may see is counted (their classes, their tests, their quizzes). */
export async function statsFor(studentIds: string[], teacherId?: string): Promise<Map<string, StudentStats>> {
  const out = new Map<string, StudentStats>(studentIds.map((id) => [id, NO_STATS]));
  if (!studentIds.length) return out;
  const from = teacherId ? 2 : 1;
  const rows = await q<StudentStats & { id: string }>(
    `select s.id,
        coalesce(m.lessons, 0)::int as lessons, coalesce(m.attended, 0)::int as attended, m.rating::float8 as rating, m.last_lesson,
        coalesce(a.quizzes, 0)::int as quizzes, a.quiz_avg::float8 as quiz_avg,
        coalesce(t.tests, 0)::int as tests, t.test_avg::float8 as test_avg
       from students s
       left join (select lm.student_id, count(*) as lessons, count(*) filter (where lm.attendance <> 'absent') as attended,
                         avg(lm.rating) as rating, max(l.held_on) as last_lesson
                    from lesson_marks lm join lessons l on l.id = lm.lesson_id ${teacherId ? "join classes c on c.id = l.class_id where c.teacher_id = $1" : ""}
                   group by lm.student_id) m on m.student_id = s.id
       left join (select f.student_id, count(*) as quizzes, avg(f.score * 100.0 / greatest(f.total, 1)) as quiz_avg
                    from (select distinct on (qt.student_id, qt.quiz_id) qt.student_id, qt.score, qt.total from quiz_attempts qt
                           ${teacherId ? `where ${attemptVisible("qt", "$1")}` : ""} order by qt.student_id, qt.quiz_id, qt.taken_at) f
                   group by f.student_id) a on a.student_id = s.id
       left join (select student_id, count(*) as tests, avg(score * 100.0 / greatest(max_score, 1)) as test_avg from assessments
                   ${teacherId ? `where ${testVisible("$1")}` : ""} group by student_id) t on t.student_id = s.id
      where s.id in (${marks(studentIds.length, from)})`,
    teacherId ? [teacherId, ...studentIds] : studentIds,
  );
  rows.forEach(({ id, ...stats }) => out.set(id, stats));
  return out;
}

export type TeacherRow = {
  id: string;
  name: string;
  email: string;
  gender: string;
  status: string;
  country: string;
  classes: number;
  learners: number;
  lessons30: number;
  attendance: number | null; // percent, over every lesson this teacher recorded
  quizAvg: number | null; // percent, over the learners this teacher has now
  lastLesson: string | null;
};
/** One row per teacher. Pass an id for a single teacher's own numbers. */
export async function teacherTable(teacherId?: string): Promise<TeacherRow[]> {
  if (off()) return [];
  const params: unknown[] = [daysAgo(30)];
  if (teacherId) params.push(teacherId);
  return q<TeacherRow>(
    `select u.id, u.name, u.email, u.gender, u.status, u.country,
        (select count(*)::int from classes c where c.teacher_id = u.id and c.status = 'active') as classes,
        (select count(distinct e.student_id)::int from enrollments e join classes c on c.id = e.class_id where c.teacher_id = u.id and c.status = 'active') as learners,
        (select count(*)::int from lessons l where l.teacher_id = u.id and l.held_on >= $1) as lessons30,
        (select (count(*) filter (where lm.attendance <> 'absent') * 100.0 / nullif(count(*), 0))::float8
           from lesson_marks lm join lessons l on l.id = lm.lesson_id where l.teacher_id = u.id) as attendance,
        (select avg(f.score * 100.0 / greatest(f.total, 1))::float8
           from (select distinct on (t.student_id, t.quiz_id) t.score, t.total from quiz_attempts t
                  where t.student_id in (select e.student_id from enrollments e join classes c on c.id = e.class_id where c.teacher_id = u.id and c.status = 'active')
                  order by t.student_id, t.quiz_id, t.taken_at) f) as quiz_avg,
        (select max(l.held_on) from lessons l where l.teacher_id = u.id) as last_lesson
       from users u where u.role = 'teacher' ${teacherId ? "and u.id = $2" : ""}
      order by (u.status = 'pending') desc, u.name`,
    params,
  );
}

export type AdminStudent = Student & { accountName: string; accountEmail: string; accountPhone: string; accountKind: string; classNames: string | null };
export async function allStudents(): Promise<AdminStudent[]> {
  if (off()) return [];
  return q<AdminStudent>(
    `select s.*, u.name as account_name, u.email as account_email, u.phone as account_phone, u.account_kind,
        (select string_agg(c.name, ', ' order by c.name) from enrollments e join classes c on c.id = e.class_id where e.student_id = s.id and c.status = 'active') as class_names
       from students s join users u on u.id = s.user_id order by s.created_at desc limit 2000`,
  );
}

export async function counts(): Promise<{ pendingTeachers: number; unplaced: number; accounts: number; activeClasses: number }> {
  if (off()) return { pendingTeachers: 0, unplaced: 0, accounts: 0, activeClasses: 0 };
  return (await one<{ pendingTeachers: number; unplaced: number; accounts: number; activeClasses: number }>(
    `select (select count(*)::int from users where role = 'teacher' and status = 'pending') as pending_teachers,
        (select count(*)::int from students s where not exists (select 1 from enrollments e join classes c on c.id = e.class_id where e.student_id = s.id and c.status = 'active')) as unplaced,
        (select count(*)::int from users) as accounts,
        (select count(*)::int from classes where status = 'active') as active_classes`,
  ))!;
}
