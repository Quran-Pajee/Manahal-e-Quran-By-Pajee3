import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { listUsers } from "@/lib/users";
import { billingCounts, invoiceNo, isOverdue, listInvoices, monthlyFeeOf, paidIn, paySettings } from "@/lib/billing";
import { cash, shortDate } from "@/lib/format";
import { confirmPaid, monthlyInvoices, newInvoice, saveWaysToPay, savePricingRates } from "../../billing-actions";
import { storageMode, q } from "@/lib/db";
import { plans, groupTiers, currencies } from "@/content/pricing";
import { InvoiceFields, InvoiceStatus, METHOD } from "./InvoiceFields";

export const metadata = { title: "Fees" };

const FILTERS = [
  ["", "All"],
  ["claimed", "To confirm"],
  ["due", "To pay"],
  ["paid", "Paid"],
  ["void", "Cancelled"],
] as const;

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ msg?: string; n?: string; status?: string; account?: string }> }) {
  await requireAdmin();
  const { msg, n, status = "", account = "" } = await searchParams;
  const month = new Date().toISOString().slice(0, 7);
  const nextMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString().slice(0, 7);
  const [invoices, counts, received, ways, users] = await Promise.all([listInvoices(status), billingCounts(), paidIn(month), paySettings(), listUsers()]);
  const families = users.filter((u) => u.role !== "teacher");
  const chosen = families.find((u) => u.id === account);
  const fee = chosen ? await monthlyFeeOf(chosen.id) : null;
  const storedRates = storageMode() === "none" ? [] : await q<{ planId: string; currency: string; monthlyAmount: number }>(
    `select plan_id, currency, monthly_amount::float8 as monthly_amount from pricing_rates`,
  );
  const rates = new Map(storedRates.map((r) => [`${r.planId}:${r.currency}`, r.monthlyAmount]));
  const rateRows = [
    ...plans.map((plan) => ({ plan, kind: "One-to-one" })),
    ...groupTiers.flatMap((g) => g.plans.map((plan) => ({ plan, kind: `${g.name} · per learner` }))),
  ];
  const toConfirm = invoices.filter((i) => i.status === "claimed");
  const waysSet = Boolean(ways.cardUrl || ways.payoneer || ways.bank);

  const notice: Record<string, string> = {
    made: `${Number(n) || 0} invoice${Number(n) === 1 ? "" : "s"} created. Families with no monthly fee set, or who already have an invoice for that month, were skipped.`,
    paid: "Payment confirmed. The family now sees the invoice as paid, with a receipt.",
    deleted: "Invoice deleted.",
    ways: "Saved. Families see these details on their Fees page.",
    bad: "Check the account, the description and the amount.",
    prices: "Monthly pricing rates saved to Neon. The public price components must be connected in the next frontend upgrade before these rates appear on the website.",
    "price-bad": "All prices must be numeric, 0 to 100000, with at most two decimal places.",
  };

  return (
    <>
      <h1 className="text-[1.9rem]">Fees</h1>
      <p className="mt-2 max-w-[72ch] text-muted">
        Send each family an invoice, tell them how to pay, and confirm payments when the money arrives. The site never holds card details: card payments go through the link you paste (Payoneer or your card gateway).
      </p>
      {msg && Object.hasOwn(notice, msg) && (
        <p role="status" className={`mt-5 rounded-lg border px-4 py-3 font-medium ${msg === "bad" || msg === "price-bad" ? "border-bad/40 bg-bad/10 text-bad" : "border-ok/40 bg-ok/10 text-ok"}`}>
          {notice[msg]}
        </p>
      )}
      {!waysSet && (
        <p role="status" className="mt-5 rounded-lg border border-gold bg-white px-4 py-3">
          You have not said how families can pay yet.{" "}
          <a className="link font-semibold" href="#ways">
            Add your payment details
          </a>
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Payments to confirm", String(counts.toConfirm), counts.toConfirm ? "Families who say they have paid" : "Nothing waiting"],
          ["Invoices to pay", String(counts.due), counts.overdue ? `${counts.overdue} past the due date` : "None overdue"],
          ["Received this month", received.length ? received.map((r) => cash(r.total, r.currency)).join(" + ") : "0", received.length ? `${received.reduce((a, r) => a + r.n, 0)} payments confirmed` : "No payments confirmed yet"],
          ["Families with a monthly fee", String(counts.withFee), "Set the fee on each account under People"],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border border-line bg-white p-5">
            <p className="text-[0.95rem] text-muted">{label}</p>
            <p className="mt-1 font-display text-[2rem] font-semibold leading-none tabular-nums text-emerald">{value}</p>
            <p className="mt-2 text-sm text-muted">{sub}</p>
          </div>
        ))}
      </div>

      {toConfirm.length > 0 && (
        <section className="mt-8 rounded-xl border border-gold bg-white p-5 sm:p-6">
          <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Payments to confirm</h2>
          <p className="mt-1 text-[0.95rem] text-muted">Check your Payoneer or bank account first. Confirm only when the money has arrived.</p>
          <ul className="mt-3 divide-y divide-line">
            {toConfirm.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
                <div>
                  <Link className="link font-semibold" href={`/admin/billing/${i.id}`}>
                    {i.accountName}: {i.title}
                  </Link>
                  <p className="text-[0.92rem] text-muted">
                    {cash(i.amount, i.currency)} · says paid by {METHOD[i.claimMethod] ?? i.claimMethod} on {shortDate(i.claimedAt)}
                    {i.claimRef && ` · reference ${i.claimRef}`}
                  </p>
                </div>
                <form action={confirmPaid}>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="back" value="list" />
                  <button type="submit" className="btn btn-emerald min-h-[2.5rem]">
                    Confirm payment
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="pricing-rates" className="mt-9 rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Monthly pricing rates</h2>
            <p className="mt-1 text-sm text-muted">Edit the master rate list in Neon. One-to-one prices are per student; group rates are per learner, flat across class frequencies.</p>
          </div>
          <Link href="/admin/content?path=%2Fpricing&lang=en" className="link font-semibold">Edit pricing page text</Link>
        </div>
        <p className="mt-3 text-sm text-muted">These prices are persisted to the Step 1 <code>pricing_rates</code> table. Current public pricing tables and automatic invoice quotes still use TypeScript price constants; Step 3 must connect them before a rate change is shown to families. Existing invoices are not retroactively altered.</p>
        <form action={savePricingRates} className="mt-5">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th scope="col">Plan</th>{currencies.map(({ code }) => <th key={code} scope="col">{code}</th>)}</tr></thead>
              <tbody>
                {rateRows.map(({ plan, kind }) => (
                  <tr key={plan.id}>
                    <th scope="row" className="min-w-[13rem]">{plan.name}<span className="block text-[0.82rem] font-normal text-muted">{kind}</span></th>
                    {currencies.map(({ code }) => (
                      <td key={code}>
                        <label className="sr-only" htmlFor={`price_${plan.id}_${code}`}>{plan.name} · {kind} · {code}</label>
                        <input id={`price_${plan.id}_${code}`} name={`price_${plan.id}_${code}`} className="field min-w-[5.5rem] max-w-[8rem]" type="number" min="0" max="100000" step="0.01" inputMode="decimal" required defaultValue={rates.get(`${plan.id}:${code}`) ?? plan.prices[code]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-emerald mt-5" type="submit">Save all rates to Neon</button>
        </form>
      </section>

      <section className="mt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Invoices</h2>
          <ul className="flex flex-wrap gap-1.5">
            {FILTERS.map(([value, label]) => (
              <li key={value}>
                <Link href={value ? `/admin/billing?status=${value}` : "/admin/billing"} aria-current={status === value ? "true" : undefined} className={`block rounded-full border px-3 py-1 text-[0.9rem] ${status === value ? "border-emerald bg-emerald text-white" : "border-line bg-white hover:border-emerald"}`}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {invoices.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-5 text-muted">No invoices here yet. Create one below.</p>
        ) : (
          <div className="tbl-wrap mt-4">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col">Account</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                  <th scope="col">Paid</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <th scope="row">
                      <Link className="link" href={`/admin/billing/${i.id}`}>
                        {invoiceNo(i)}
                      </Link>
                      <span className="block text-[0.9rem] font-normal text-muted">{i.title}</span>
                    </th>
                    <td>
                      <Link className="link" href={`/admin/people/${i.userId}`}>
                        {i.accountName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap tabular-nums">{cash(i.amount, i.currency)}</td>
                    <td className="whitespace-nowrap">
                      {i.dueOn ? shortDate(i.dueOn) : "—"}
                      {isOverdue(i) && <span className="block text-[0.85rem] font-semibold text-bad">Overdue</span>}
                    </td>
                    <td>
                      <InvoiceStatus status={i.status} />
                    </td>
                    <td className="whitespace-nowrap">{i.paidAt ? `${shortDate(i.paidAt)} · ${METHOD[i.paidMethod] ?? i.paidMethod}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <section id="new" className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">New invoice</h2>
          <form action={newInvoice} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="userId">
                Account
              </label>
              <select className="field" id="userId" name="userId" required defaultValue={chosen?.id ?? ""}>
                <option value="" />
                {families.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <InvoiceFields defaults={{ amount: fee?.monthlyFee, currency: fee?.feeCurrency }} />
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-emerald">
                Create invoice
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-5 self-start">
          <section id="monthly" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Create this month’s invoices in one go</h2>
            <p className="mt-1 text-[0.95rem] text-muted">Makes one invoice for every family that has a monthly fee set on its account. A family that already has an invoice for that month is skipped, so it is safe to press twice.</p>
            <form action={monthlyInvoices} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="period">
                  Month
                </label>
                <input className="field" id="period" name="period" type="month" required defaultValue={nextMonth} />
              </div>
              <div>
                <label className="label" htmlFor="monthlyDue">
                  Due date <span className="font-normal text-muted">(optional)</span>
                </label>
                <input className="field" id="monthlyDue" name="dueOn" type="date" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn btn-line">
                  Create invoices
                </button>
              </div>
            </form>
          </section>

          <section id="ways" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">How families can pay</h2>
            <p className="mt-1 text-[0.95rem] text-muted">Shown to every family on their Fees page. Leave a box empty to hide that way of paying.</p>
            <form action={saveWaysToPay} className="mt-4 grid gap-4">
              <div>
                <label className="label" htmlFor="cardUrl">
                  General card payment page <span className="font-normal text-muted">(optional)</span>
                </label>
                <input className="field" id="cardUrl" name="cardUrl" type="url" maxLength={500} pattern="https://.*" placeholder="https://" defaultValue={ways.cardUrl} />
                <p className="mt-1.5 text-[0.9rem] text-muted">Used for invoices that have no payment link of their own. Leave empty if you send a separate link for each invoice.</p>
              </div>
              <div>
                <label className="label" htmlFor="cardNote">
                  Line under the “Pay by card” button <span className="font-normal text-muted">(optional)</span>
                </label>
                <input className="field" id="cardNote" name="cardNote" maxLength={300} defaultValue={ways.cardNote} placeholder="Opens a secure Payoneer page. Visa and Mastercard are accepted." />
              </div>
              <div>
                <label className="label" htmlFor="payoneer">
                  Payoneer
                </label>
                <textarea className="field" id="payoneer" name="payoneer" rows={3} maxLength={800} defaultValue={ways.payoneer} placeholder="We send a Payoneer payment request to your email. You can pay it with Visa, Mastercard or a bank transfer." />
              </div>
              <div>
                <label className="label" htmlFor="bank">
                  Bank transfer details
                </label>
                <textarea className="field" id="bank" name="bank" rows={4} maxLength={1200} defaultValue={ways.bank} placeholder={"Account name:\nBank:\nAccount number / IBAN:\nPlease put your invoice number in the reference."} />
              </div>
              <div>
                <button type="submit" className="btn btn-emerald">
                  Save
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
