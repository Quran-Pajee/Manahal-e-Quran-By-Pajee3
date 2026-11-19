import { INVOICE_CURRENCIES, type Invoice } from "@/lib/billing";

/** Fields shared by "new invoice" and "edit invoice". */
export function InvoiceFields({ inv, defaults }: { inv?: Invoice; defaults?: { amount?: number | null; currency?: string; title?: string } }) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">
          What the invoice is for
        </label>
        <input className="field" id="title" name="title" required maxLength={120} defaultValue={inv?.title ?? defaults?.title ?? ""} placeholder="Fees for November 2026" />
      </div>
      <div>
        <label className="label" htmlFor="amount">
          Amount
        </label>
        <input className="field" id="amount" name="amount" type="number" inputMode="decimal" min={0.01} step="0.01" required defaultValue={inv?.amount ?? defaults?.amount ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="currency">
          Currency
        </label>
        <select className="field" id="currency" name="currency" defaultValue={inv?.currency ?? defaults?.currency ?? "USD"}>
          {INVOICE_CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="dueOn">
          Due date <span className="font-normal text-muted">(optional)</span>
        </label>
        <input className="field" id="dueOn" name="dueOn" type="date" defaultValue={inv?.dueOn ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="payUrl">
          Card payment link <span className="font-normal text-muted">(optional)</span>
        </label>
        <input className="field" id="payUrl" name="payUrl" type="url" maxLength={500} pattern="https://.*" placeholder="https://" defaultValue={inv?.payUrl ?? ""} aria-describedby="payurl-hint" />
      </div>
      <p id="payurl-hint" className="-mt-1 text-[0.9rem] text-muted sm:col-span-2">
        Paste the link for this payment: a Payoneer payment request, or the checkout link from your card gateway. The family sees it as a “Pay by card” button. Must start with https://.
      </p>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="note">
          Note for the family <span className="font-normal text-muted">(optional)</span>
        </label>
        <input className="field" id="note" name="note" maxLength={400} defaultValue={inv?.note ?? ""} placeholder="For example: 12 classes, Yusuf and Maryam, family group" />
      </div>
    </>
  );
}

export function InvoiceStatus({ status }: { status: string }) {
  const style = status === "paid" ? "border-ok/40 bg-ok/10 text-ok" : status === "claimed" ? "border-gold bg-gold/25 text-emerald" : status === "void" ? "border-line bg-white text-muted" : "border-line bg-wash text-emerald";
  const label = status === "paid" ? "Paid" : status === "claimed" ? "Family says paid" : status === "void" ? "Cancelled" : "To pay";
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${style}`}>{label}</span>;
}

export const METHOD: Record<string, string> = { card: "Card", payoneer: "Payoneer", bank: "Bank transfer", other: "Other" };
