import { randomUUID } from "crypto";
import { q, one, storageMode } from "./db";
import { plans, siblingPrice, groupTiers, type GroupKind } from "@/content/pricing";
import type { Currency } from "@/content/types";

/**
 * Fees and invoices.
 *
 * How money moves: the site does not take card numbers. Each invoice can carry a payment link (a Payoneer payment request,
 * or a hosted checkout page from any card gateway), and the family can also pay by Payoneer or bank transfer using the details
 * the admin enters under Fees. After paying, the family presses "I have paid"; the admin checks the money arrived and confirms.
 */

export const INVOICE_CURRENCIES = ["USD", "GBP", "AUD", "CAD", "EUR", "AED", "PKR"] as const;
export type InvoiceStatus = "due" | "claimed" | "paid" | "void";
export const PAY_METHODS = ["card", "payoneer", "bank", "other"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export type Invoice = {
  id: string;
  number: number;
  createdAt: string;
  userId: string;
  title: string;
  period: string;
  amount: number;
  currency: string;
  dueOn: string;
  status: InvoiceStatus;
  payUrl: string;
  note: string;
  claimedAt: string | null;
  claimMethod: string;
  claimRef: string;
  paidAt: string | null;
  paidMethod: string;
  paidRef: string;
};
export type AdminInvoice = Invoice & { accountName: string; accountEmail: string; accountPhone: string };

/** A 1-on-1 plan for each child, in birth/enrolment order. Group fees are per learner. */
export type HouseholdPlan = { planId: string; kind?: "one" | GroupKind };
export type HouseholdQuote = { currency: Currency; subtotal: number; siblingDiscount: number; total: number; lines: { planId: string; kind: "one" | GroupKind; base: number; discount: number; due: number }[] };

/**
 * The second 1-on-1 child gets 20% off their own plan, with no stacking onto
 * already discounted group rates. No discount applies to the third or later child.
 * Quote first; an admin can choose to persist the result as the family's monthly fee.
 */
export function quoteHousehold(items: readonly HouseholdPlan[], currency: Currency): HouseholdQuote {
  let individualPosition = 0;
  const lines = items.map((item) => {
    const kind = item.kind ?? "one";
    const plan = kind === "one" ? plans.find((p) => p.id === item.planId) : groupTiers.find((t) => t.kind === kind)?.plans.find((p) => p.id === item.planId);
    if (!plan) throw new Error(`Unknown ${kind} pricing plan: ${item.planId}`);
    const base = plan.prices[currency];
    const due = kind === "one" ? siblingPrice(base, ++individualPosition) : base;
    return { planId: item.planId, kind, base, discount: Math.round((base - due) * 100) / 100, due };
  });
  const subtotal = Math.round(lines.reduce((n, line) => n + line.base, 0) * 100) / 100;
  const siblingDiscount = Math.round(lines.reduce((n, line) => n + line.discount, 0) * 100) / 100;
  return { currency, subtotal, siblingDiscount, total: Math.round((subtotal - siblingDiscount) * 100) / 100, lines };
}

/** Optional admin service: store an already-reviewed household quote for invoicing. */
export async function setHouseholdPlansFee(userId: string, items: readonly HouseholdPlan[], currency: Currency): Promise<HouseholdQuote> {
  const quote = quoteHousehold(items, currency);
  await setMonthlyFee(userId, quote.total, currency);
  return quote;
}

const off = () => storageMode() === "none";
const COLS = `i.id, i.number::int as number, i.created_at, i.user_id, i.title, i.period, i.amount::float8 as amount, i.currency, i.due_on, i.status, i.pay_url, i.note,
  i.claimed_at, i.claim_method, i.claim_ref, i.paid_at, i.paid_method, i.paid_ref`;

export const invoiceNo = (inv: Pick<Invoice, "number">) => `INV-${String(inv.number).padStart(4, "0")}`;
export const isOverdue = (inv: Pick<Invoice, "status" | "dueOn">) => inv.status === "due" && inv.dueOn !== "" && inv.dueOn < new Date().toISOString().slice(0, 10);
/** Only real web links are saved as payment links, so nothing unsafe can sit behind the "Pay" button. */
export const safeUrl = (v: string) => (/^https:\/\/[^\s]+$/i.test(v) ? v : "");

export async function invoicesOfUser(userId: string): Promise<Invoice[]> {
  if (off()) return [];
  return q<Invoice>(`select ${COLS} from invoices i where i.user_id = $1 and i.status <> 'void' order by (i.status = 'paid'), i.created_at desc limit 200`, [userId]);
}

export async function getInvoice(id: string): Promise<AdminInvoice | null> {
  if (off()) return null;
  return one<AdminInvoice>(`select ${COLS}, u.name as account_name, u.email as account_email, u.phone as account_phone from invoices i join users u on u.id = i.user_id where i.id = $1`, [id]);
}

export async function listInvoices(status?: string): Promise<AdminInvoice[]> {
  if (off()) return [];
  const where = status && ["due", "claimed", "paid", "void"].includes(status) ? `where i.status = $1` : "";
  return q<AdminInvoice>(
    `select ${COLS}, u.name as account_name, u.email as account_email, u.phone as account_phone from invoices i join users u on u.id = i.user_id ${where}
      order by (i.status = 'claimed') desc, (i.status = 'due') desc, i.created_at desc limit 500`,
    where ? [status] : [],
  );
}

export type NewInvoice = { userId: string; title: string; period: string; amount: number; currency: string; dueOn: string; payUrl: string; note: string };
export async function createInvoice(n: NewInvoice): Promise<string> {
  const id = randomUUID();
  await q(`insert into invoices (id, user_id, title, period, amount, currency, due_on, pay_url, note) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id, n.userId, n.title, n.period, n.amount, n.currency, n.dueOn, n.payUrl, n.note]);
  return id;
}

export async function updateInvoice(id: string, n: Omit<NewInvoice, "userId" | "period">) {
  await q(`update invoices set title = $1, amount = $2, currency = $3, due_on = $4, pay_url = $5, note = $6 where id = $7`, [n.title, n.amount, n.currency, n.dueOn, n.payUrl, n.note, id]);
}

/** The family says they have paid. Only their own unpaid invoice can be reported. */
export async function claimInvoice(userId: string, id: string, method: string, ref: string): Promise<boolean> {
  const rows = await q(`update invoices set status = 'claimed', claimed_at = $1, claim_method = $2, claim_ref = $3 where id = $4 and user_id = $5 and status = 'due' returning id`, [new Date().toISOString(), method, ref, id, userId]);
  return rows.length > 0;
}

export async function markPaid(id: string, method: string, ref: string) {
  await q(`update invoices set status = 'paid', paid_at = $1, paid_method = $2, paid_ref = $3 where id = $4 and status <> 'void'`, [new Date().toISOString(), method, ref, id]);
}
/** Back to "to pay": used when a reported payment did not arrive, or an invoice was marked paid by mistake. */
export async function reopenInvoice(id: string) {
  await q(`update invoices set status = 'due', claimed_at = null, claim_method = '', claim_ref = '', paid_at = null, paid_method = '', paid_ref = '' where id = $1`, [id]);
}
export async function voidInvoice(id: string) {
  await q(`update invoices set status = 'void' where id = $1`, [id]);
}
export async function deleteInvoice(id: string) {
  await q(`delete from invoices where id = $1`, [id]);
}

/** Creates one invoice for every family that has a monthly fee set and has no invoice for that month yet. Returns how many were made. */
export async function createMonthlyInvoices(period: string, title: string, dueOn: string): Promise<number> {
  const accounts = await q<{ id: string; monthlyFee: number; feeCurrency: string }>(
    `select u.id, u.monthly_fee::float8 as monthly_fee, u.fee_currency from users u
      where u.role <> 'teacher' and u.status = 'active' and u.monthly_fee is not null and u.monthly_fee > 0
        and not exists (select 1 from invoices i where i.user_id = u.id and i.period = $1 and i.status <> 'void')`,
    [period],
  );
  for (const a of accounts) await createInvoice({ userId: a.id, title, period, amount: a.monthlyFee, currency: a.feeCurrency, dueOn, payUrl: "", note: "" });
  return accounts.length;
}

export async function setMonthlyFee(userId: string, amount: number | null, currency: string) {
  await q(`update users set monthly_fee = $1, fee_currency = $2 where id = $3`, [amount, currency, userId]);
}
export async function monthlyFeeOf(userId: string): Promise<{ monthlyFee: number | null; feeCurrency: string }> {
  return (await one<{ monthlyFee: number | null; feeCurrency: string }>(`select monthly_fee::float8 as monthly_fee, fee_currency from users where id = $1`, [userId])) ?? { monthlyFee: null, feeCurrency: "USD" };
}

export async function billingCounts(): Promise<{ toConfirm: number; due: number; overdue: number; withFee: number }> {
  if (off()) return { toConfirm: 0, due: 0, overdue: 0, withFee: 0 };
  return (await one<{ toConfirm: number; due: number; overdue: number; withFee: number }>(
    `select (select count(*)::int from invoices where status = 'claimed') as to_confirm,
        (select count(*)::int from invoices where status = 'due') as due,
        (select count(*)::int from invoices where status = 'due' and due_on <> '' and due_on < $1) as overdue,
        (select count(*)::int from users where role <> 'teacher' and monthly_fee is not null and monthly_fee > 0) as with_fee`,
    [new Date().toISOString().slice(0, 10)],
  ))!;
}

/** Money received in a month, per currency. */
export async function paidIn(month: string): Promise<{ currency: string; total: number; n: number }[]> {
  if (off()) return [];
  return q(`select currency, sum(amount)::float8 as total, count(*)::int as n from invoices where status = 'paid' and to_char(paid_at, 'YYYY-MM') = $1 group by currency order by currency`, [month]);
}

export async function dueCount(userId: string): Promise<number> {
  if (off()) return 0;
  return (await one<{ n: number }>(`select count(*)::int as n from invoices where user_id = $1 and status = 'due'`, [userId]))?.n ?? 0;
}

/* ---------- How to pay: text the admin edits under Fees ---------- */

export type PaySettings = {
  cardUrl: string; // one general card payment page, used when an invoice has no link of its own
  cardNote: string;
  payoneer: string;
  bank: string;
};
const KEYS: Record<keyof PaySettings, string> = { cardUrl: "pay_card_url", cardNote: "pay_card_note", payoneer: "pay_payoneer", bank: "pay_bank" };

export async function paySettings(): Promise<PaySettings> {
  const out: PaySettings = { cardUrl: "", cardNote: "", payoneer: "", bank: "" };
  if (off()) return out;
  const rows = await q<{ key: string; value: string }>(`select key, value from settings where key like 'pay_%'`);
  for (const [field, key] of Object.entries(KEYS) as [keyof PaySettings, string][]) out[field] = rows.find((r) => r.key === key)?.value ?? "";
  return out;
}

export async function savePaySettings(s: PaySettings) {
  for (const [field, key] of Object.entries(KEYS) as [keyof PaySettings, string][]) {
    await q(`insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value`, [key, s[field]]);
  }
}
