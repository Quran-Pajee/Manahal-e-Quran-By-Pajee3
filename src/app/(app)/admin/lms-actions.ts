"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { adminSetPassword, deleteUser, getUser, setUserStatus } from "@/lib/users";
import { CLASS_KINDS, createClass, deleteClass, deleteStudent, enrol, getClass, getStudent, unenrol, updateClass, type ClassInput } from "@/lib/lms";
import { clean } from "@/lib/validate";
import { courses } from "@/content/courses";

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);
async function admin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function setStatus(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  const status = text(fd, "status", 12);
  if (id && (status === "active" || status === "pending" || status === "suspended")) await setUserStatus(id, status);
  revalidatePath("/admin", "layout");
  redirect(`/admin/people/${id}?msg=status`);
}

export async function setPassword(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  const password = String(fd.get("password") ?? "");
  if (password.length < 8 || password.length > 200) redirect(`/admin/people/${id}?msg=short`);
  await adminSetPassword(id, password);
  redirect(`/admin/people/${id}?msg=password`);
}

export async function removeUser(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  if (text(fd, "confirm", 10).toUpperCase() !== "DELETE") redirect(`/admin/people/${id}?msg=confirm`);
  await deleteUser(id);
  revalidatePath("/admin", "layout");
  redirect("/admin/people?msg=deleted");
}

export async function removeLearner(fd: FormData) {
  await admin();
  const student = await getStudent(text(fd, "id", 60));
  if (student) await deleteStudent(student.id);
  redirect(student ? `/admin/people/${student.userId}?msg=learner` : "/admin/people");
}

async function classInput(fd: FormData): Promise<ClassInput | null> {
  const name = text(fd, "name", 100);
  if (!name) return null;
  const kind = text(fd, "kind", 12);
  const course = text(fd, "course", 80);
  const teacherId = text(fd, "teacherId", 60);
  const teacher = teacherId ? await getUser(teacherId) : null;
  const url = text(fd, "meetingUrl", 400);
  return {
    name,
    kind: (CLASS_KINDS as readonly string[]).includes(kind) ? kind : "one",
    course: courses.some((c) => c.slug === course) ? course : "",
    teacherId: teacher?.role === "teacher" ? teacher.id : null,
    schedule: text(fd, "schedule", 200),
    meetingUrl: /^https:\/\/[^\s]+$/i.test(url) ? url : "", // only real web links, so nothing unsafe can be saved as a "join" button
    status: text(fd, "status", 10) === "ended" ? "ended" : "active",
  };
}

export async function newClass(fd: FormData) {
  await admin();
  const input = await classInput(fd);
  if (!input) redirect("/admin/classes?msg=name#new");
  const id = await createClass(input);
  const first = text(fd, "studentId", 60);
  if (first && (await getStudent(first))) await enrol(id, first);
  redirect(`/admin/classes/${id}?msg=created`);
}

export async function saveClass(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  if (!(await getClass(id))) redirect("/admin/classes");
  const input = await classInput(fd);
  if (!input) redirect(`/admin/classes/${id}?msg=name`);
  await updateClass(id, input);
  redirect(`/admin/classes/${id}?msg=saved`);
}

export async function removeClass(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  if (text(fd, "confirm", 10).toUpperCase() !== "DELETE") redirect(`/admin/classes/${id}?msg=confirm`);
  await deleteClass(id);
  redirect("/admin/classes?msg=deleted");
}

export async function addToClass(fd: FormData) {
  await admin();
  const id = text(fd, "classId", 60);
  const studentId = text(fd, "studentId", 60);
  if (!(await getClass(id))) redirect("/admin/classes");
  if (studentId && (await getStudent(studentId))) await enrol(id, studentId);
  redirect(`/admin/classes/${id}?msg=enrolled`);
}

export async function removeFromClass(fd: FormData) {
  await admin();
  const id = text(fd, "classId", 60);
  await unenrol(id, text(fd, "studentId", 60));
  redirect(`/admin/classes/${id}?msg=removed`);
}
