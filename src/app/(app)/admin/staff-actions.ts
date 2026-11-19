"use server";

import { redirect } from "next/navigation";
import { createStaff, deleteStaff, getStaff, session, staffEmailTaken, updateStaff } from "@/lib/auth";
import { storageMode } from "@/lib/db";
import { clean } from "@/lib/validate";

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);
async function admin() {
  const me = await session();
  if (!me) redirect("/admin/login");
  if (me.role !== "admin") redirect("/admin/content");
  return me;
}

export async function addStaff(fd: FormData) {
  await admin();
  if (storageMode() === "none") redirect("/admin/staff?msg=nodb");
  const name = text(fd, "name", 80);
  const email = text(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = text(fd, "role", 10) === "admin" ? "admin" : "editor";
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/admin/staff?msg=bad");
  if (password.length < 10) redirect("/admin/staff?msg=short");
  if (await staffEmailTaken(email)) redirect("/admin/staff?msg=taken");
  await createStaff({ name, email, password, role });
  redirect("/admin/staff?msg=added");
}

export async function changeStaff(fd: FormData) {
  const me = await admin();
  const id = text(fd, "id", 60);
  const what = text(fd, "what", 12);
  const person = await getStaff(id);
  if (!person) redirect("/admin/staff");
  // Nobody can lock themselves out by mistake: changes to your own account are made by another admin or the owner.
  if (person.id === me.id && what !== "password") redirect("/admin/staff?msg=self");
  if (what === "role") await updateStaff(id, { role: person.role === "admin" ? "editor" : "admin" });
  else if (what === "status") await updateStaff(id, { status: person.status === "active" ? "suspended" : "active" });
  else if (what === "password") {
    const password = String(fd.get("password") ?? "");
    if (password.length < 10) redirect("/admin/staff?msg=short");
    await updateStaff(id, { password });
    redirect("/admin/staff?msg=password");
  } else if (what === "remove") await deleteStaff(id);
  redirect("/admin/staff?msg=changed");
}
