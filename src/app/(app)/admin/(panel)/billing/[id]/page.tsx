import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, fmtDateTime } from "@/lib/admin";
import { getInvoice, invoiceNo, isOverdue, PAY_METHODS } from "@/lib/billing";
import { cash, shortDate } from "@/lib/format";
import { cancelInvoice, confirmPaid, removeInvoice, reopen, saveInvoice } from "../../../billing-actions";
import { InvoiceFields, InvoiceStatus, METHOD } from "../InvoiceFields";

export const metadata = { title: "Invoice" };

const MSG: Record<string, [string, boolean]> = {
  created: ["Invoice created. The family can see it on their Fees page now.", true],
  saved: ["Saved.", true],
  paid: ["Payment confirmed. The family sees a receipt.", true],
  reopened: ["Invoice is back to “to pay”.", true],
  void: ["Invoice cancelled. The family no longer sees it.", true],
  bad: ["Check the description and the amount.", false],
};

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const inv = await getInvoice((await params).id);
  if (!inv) notFound();
  const key = (await searchParams).msg ?? "";
  const msg = Object.hasOwn(MSG, key) ? MSG[key] : undefined;
  const open = inv.status === "due" || inv.status === "claimed";

  return (
    <>
      <p className="mb-3">
        <Link className="link" href="/admin/billing">
          Fees
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[1.9rem]">
          {invoiceNo(inv)} · {cash(inv.amount, inv.currency)}
        </h1>
        <InvoiceStatus status={inv.status} />
        {isOverdue(inv) && <span className="font-semibold text-bad">Overdue</span>}
      </div>
      <p className="mt-1 text-muted">
        {inv.title} · for{" "}
        <Link className="link" href={`/admin/people/${inv.userId}`}>
          {inv.accountName}
        </Link>{" "}
        ({inv.accountPhone}, {inv.accountEmail}) · created {fmtDateTime(inv.createdAt)}
      </p>
      {msg && (
        <p role="status" className={`mt-5 rounded-lg border px-4 py-3 font-medium ${msg[1] ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>
          {msg[0]}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="self-start rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Invoice details</h2>
          <form action={saveInvoice} className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={inv.id} />
            <InvoiceFields inv={inv} />
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-line">
                Save changes
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-5 self-start">
          {open && (
            <section className={`rounded-xl border bg-white p-5 sm:p-6 ${inv.status === "claimed" ? "border-gold" : "border-line"}`}>
              <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">{inv.status === "claimed" ? "Confirm this payment" : "Mark as paid"}</h2>
              {inv.status === "claimed" ? (
                <p className="mt-2 text-[0.95rem]">
                  The family says they paid by <strong>{METHOD[inv.claimMethod] ?? inv.claimMethod}</strong> on {shortDate(inv.claimedAt)}
                  {inv.claimRef ? (
                    <>
                      , reference <strong>{inv.claimRef}</strong>
                    </>
                  ) : null}
                  . Check that the money has arrived before you confirm.
                </p>
              ) : (
                <p className="mt-2 text-[0.95rem] text-muted">Use this when the money has arrived and the family has not pressed “I have paid”.</p>
              )}
              <form action={confirmPaid} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={inv.id} />
                <div>
                  <label className="label" htmlFor="method">
                    Paid by
                  </label>
                  <select className="field" id="method" name="method" defaultValue={inv.claimMethod || "card"}>
                    {PAY_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {METHOD[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="reference">
                    Reference <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input className="field" id="reference" name="reference" maxLength={120} defaultValue={inv.claimRef} />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn btn-emerald">
                    Confirm payment
                  </button>
                </div>
              </form>
              {inv.status === "claimed" && (
                <form action={reopen} className="mt-3">
                  <input type="hidden" name="id" value={inv.id} />
                  <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                    The money did not arrive: set back to “to pay”
                  </button>
                </form>
              )}
            </section>
          )}

          {inv.status === "paid" && (
            <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Paid</h2>
              <p className="mt-2 text-[0.95rem]">
                Confirmed {inv.paidAt ? fmtDateTime(inv.paidAt) : ""} · {METHOD[inv.paidMethod] ?? inv.paidMethod}
                {inv.paidRef && ` · reference ${inv.paidRef}`}
              </p>
              <form action={reopen} className="mt-3">
                <input type="hidden" name="id" value={inv.id} />
                <button type="submit" className="cursor-pointer text-[0.92rem] text-bad underline underline-offset-2">
                  Marked paid by mistake: set back to “to pay”
                </button>
              </form>
            </section>
          )}

          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">Cancel or delete</h2>
            <p className="mt-2 text-[0.95rem] text-muted">Cancel hides the invoice from the family and keeps it in your records. Delete removes it completely.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {inv.status !== "void" && (
                <form action={cancelInvoice}>
                  <input type="hidden" name="id" value={inv.id} />
                  <button type="submit" className="btn btn-line">
                    Cancel invoice
                  </button>
                </form>
              )}
              {inv.status === "void" && (
                <form action={reopen}>
                  <input type="hidden" name="id" value={inv.id} />
                  <button type="submit" className="btn btn-line">
                    Restore invoice
                  </button>
                </form>
              )}
              <form action={removeInvoice}>
                <input type="hidden" name="id" value={inv.id} />
                <button type="submit" className="btn border-[1.5px] border-bad text-bad hover:bg-bad/10">
                  Delete
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
