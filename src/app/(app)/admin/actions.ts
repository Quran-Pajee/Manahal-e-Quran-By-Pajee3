"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPassword, createSession, destroySession, isAdmin, staffLogIn } from "@/lib/auth";
import { deleteLead, updateLead } from "@/lib/leads";
import { STATUSES, type LeadStatus } from "@/lib/lead-types";
import { blocked, strike } from "@/lib/limits";

export async function login(formData: FormData) {
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const key = `admin-login-ip:${ip}`;
  if (await blocked(key, 8, 15)) redirect("/admin/login?error=locked");

  const password = String(formData.get("password") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  // With an email: a staff account (admin or editor). Without: the owner password.
  const staffId = email ? await staffLogIn(email, password).catch(() => null) : null;
  if (email ? !staffId : !checkPassword(password)) {
    await Promise.all([strike(key), new Promise((r) => setTimeout(r, 700))]); // the pause slows guessing
    redirect(`/admin/login?error=wrong${email ? "&staff=1" : ""}`);
  }
  await createSession(staffId ?? "owner");
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function saveLead(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = formData.get("notes");
  if (!id) return;
  await updateLead(id, {
    status: STATUSES.some((s) => s.id === status) ? (status as LeadStatus) : undefined,
    notes: typeof notes === "string" ? notes.slice(0, 5000) : undefined,
  });
  revalidatePath("/admin", "layout");
  const back = String(formData.get("back") ?? "");
  redirect(back.startsWith("/admin") ? back : `/admin/leads/${id}?saved=1`);
}

export async function removeLead(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (id) await deleteLead(id);
  revalidatePath("/admin", "layout");
  redirect("/admin/leads?deleted=1");
}
