"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { getUser } from "@/lib/users";
import { q } from "@/lib/db";
import { plans, groupTiers, currencies } from "@/content/pricing";
import { clean } from "@/lib/validate";
import { isDay } from "@/lib/lms";
import { createInvoice, createMonthlyInvoices, deleteInvoice, getInvoice, INVOICE_CURRENCIES, markPaid, PAY_METHODS, reopenInvoice, safeUrl, savePaySettings, setMonthlyFee, updateInvoice, voidInvoice } from "@/lib/billing";

const text = (fd: FormData, key: string, max: number) => clean(fd.get(key), max);
async function admin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
const currency = (v: string) => ((INVOICE_CURRENCIES as readonly string[]).includes(v) ? v : "USD");
const amount = (v: string) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 && n <= 1000000 ? n : null;
};

export async function newInvoice(fd: FormData) {
  await admin();
  const user = await getUser(text(fd, "userId", 60));
  const value = amount(text(fd, "amount", 12));
  const title = text(fd, "title", 120);
  if (!user || user.role === "teacher" || value === null || !title) redirect("/admin/billing?msg=bad#new");
  const due = text(fd, "dueOn", 10);
  const id = await createInvoice({ userId: user.id, title, period: "", amount: value, currency: currency(text(fd, "currency", 3)), dueOn: isDay(due) ? due : "", payUrl: safeUrl(text(fd, "payUrl", 500)), note: text(fd, "note", 400) });
  revalidatePath("/", "layout");
  redirect(`/admin/billing/${id}?msg=created`);
}

export async function monthlyInvoices(fd: FormData) {
  await admin();
  const period = text(fd, "period", 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) redirect("/admin/billing?msg=bad#monthly");
  const [year, month] = period.split("-").map(Number);
  const title = text(fd, "title", 120) || `Fees for ${new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}`;
  const due = text(fd, "dueOn", 10);
  const made = await createMonthlyInvoices(period, title, isDay(due) ? due : "");
  revalidatePath("/", "layout");
  redirect(`/admin/billing?msg=made&n=${made}`);
}

export async function saveInvoice(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  const value = amount(text(fd, "amount", 12));
  const title = text(fd, "title", 120);
  if (!(await getInvoice(id))) redirect("/admin/billing");
  if (value === null || !title) redirect(`/admin/billing/${id}?msg=bad`);
  const due = text(fd, "dueOn", 10);
  await updateInvoice(id, { title, amount: value, currency: currency(text(fd, "currency", 3)), dueOn: isDay(due) ? due : "", payUrl: safeUrl(text(fd, "payUrl", 500)), note: text(fd, "note", 400) });
  revalidatePath("/", "layout");
  redirect(`/admin/billing/${id}?msg=saved`);
}

/** Confirm that the money arrived. `back` says which page to return to. */
export async function confirmPaid(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  const inv = await getInvoice(id);
  if (!inv) redirect("/admin/billing");
  const method = text(fd, "method", 12) || inv.claimMethod;
  await markPaid(id, (PAY_METHODS as readonly string[]).includes(method) ? method : "other", text(fd, "reference", 120) || inv.claimRef);
  revalidatePath("/", "layout");
  redirect(text(fd, "back", 40) === "list" ? "/admin/billing?msg=paid" : `/admin/billing/${id}?msg=paid`);
}

export async function reopen(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  await reopenInvoice(id);
  revalidatePath("/", "layout");
  redirect(`/admin/billing/${id}?msg=reopened`);
}

export async function cancelInvoice(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  await voidInvoice(id);
  revalidatePath("/", "layout");
  redirect(`/admin/billing/${id}?msg=void`);
}

export async function removeInvoice(fd: FormData) {
  await admin();
  await deleteInvoice(text(fd, "id", 60));
  revalidatePath("/", "layout");
  redirect("/admin/billing?msg=deleted");
}

export async function saveWaysToPay(fd: FormData) {
  await admin();
  await savePaySettings({ cardUrl: safeUrl(text(fd, "cardUrl", 500)), cardNote: text(fd, "cardNote", 300), payoneer: text(fd, "payoneer", 800), bank: text(fd, "bank", 1200) });
  revalidatePath("/", "layout");
  redirect("/admin/billing?msg=ways#ways");
}

export async function saveMonthlyFee(fd: FormData) {
  await admin();
  const id = text(fd, "id", 60);
  const raw = text(fd, "monthlyFee", 12);
  await setMonthlyFee(id, raw === "" ? null : amount(raw), currency(text(fd, "feeCurrency", 3)));
  revalidatePath("/", "layout");
  redirect(`/admin/people/${id}?msg=fee`);
}


/** Save every plan/currency rate in one Neon UPSERT. A rate may be zero (a free plan). */
export async function savePricingRates(fd: FormData): Promise<void> {
  await admin();
  const rows = [
    ...plans.map((p) => ({ plan: p, kind: "one" as const, perLearner: false })),
    ...groupTiers.flatMap((g) => g.plans.map((p) => ({ plan: p, kind: g.kind, perLearner: true }))),
  ];
  const codes = currencies.map((currency) => currency.code);
  const params: (string | number | boolean)[] = [];
  const values: string[] = [];
  for (const entry of rows) {
    for (const code of codes) {
      const submitted = fd.get(`price_${entry.plan.id}_${code}`);
      if (typeof submitted !== "string" || !/^\d{1,6}(?:\.\d{1,2})?$/.test(submitted.trim())) {
        redirect("/admin/billing?msg=price-bad#pricing-rates");
      }
      const amount = Number(submitted);
      if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
        redirect("/admin/billing?msg=price-bad#pricing-rates");
      }
      const start = params.length;
      params.push(entry.plan.id, code, entry.kind, entry.plan.perWeek, entry.plan.classesPerMonth, amount, entry.perLearner);
      values.push(`(${Array.from({ length: 7 }, (_, i) => `$${start + i + 1}`).join(",")})`);
    }
  }
  await q(
    `insert into pricing_rates (plan_id, currency, class_type, classes_per_week, classes_per_month, monthly_amount, per_learner)
     values ${values.join(",")}
     on conflict (plan_id, currency) do update set
       class_type = excluded.class_type, classes_per_week = excluded.classes_per_week,
       classes_per_month = excluded.classes_per_month, monthly_amount = excluded.monthly_amount,
       per_learner = excluded.per_learner, updated_at = now()`,
    params,
  );
  revalidatePath("/", "layout");
  redirect("/admin/billing?msg=prices#pricing-rates");
}
