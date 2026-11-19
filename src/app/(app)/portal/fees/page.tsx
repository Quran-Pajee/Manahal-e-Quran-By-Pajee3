import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app/Shell";
import { Card, Notice } from "@/components/app/ui";
import { Submit } from "@/components/app/Submit";
import { appLang, requireUser } from "@/lib/users";
import { invoiceNo, invoicesOfUser, isOverdue, PAY_METHODS, paySettings, type Invoice } from "@/lib/billing";
import { cash, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";
import { whatsappLink } from "@/content/site";
import { reportPayment } from "../actions";

export const metadata: Metadata = { title: "Fees" };

function StatusPill({ status, label }: { status: string; label: string }) {
  const style = status === "paid" ? "border-ok/40 bg-ok/10 text-ok" : status === "claimed" ? "border-gold bg-gold/20 text-emerald" : "border-line bg-wash text-emerald";
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${style}`}>{label}</span>;
}

export default async function FeesPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const user = await requireUser("portal");
  const lang = await appLang();
  const t = app[lang];
  const f = t.fees;
  const [invoices, ways] = await Promise.all([invoicesOfUser(user.id), paySettings()]);
  const open = invoices.filter((i) => i.status !== "paid");
  const paid = invoices.filter((i) => i.status === "paid");
  const wa = whatsappLink("Assalamu alaikum, I have a question about my fees.");
  const { msg } = await searchParams;
  const hasWays = Boolean(ways.payoneer || ways.bank);

  const invoiceCard = (inv: Invoice) => {
    const link = inv.payUrl || ways.cardUrl;
    return (
      <li key={inv.id} className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div>
            <h3 className="font-sans text-[1.15rem] font-semibold tracking-normal" dir="auto">
              {inv.title}
            </h3>
            <p className="mt-0.5 text-[0.92rem] text-muted">
              <bdi dir="ltr">{invoiceNo(inv)}</bdi>
              {inv.dueOn && <> · {f.due(shortDate(inv.dueOn, lang))}</>}
              {isOverdue(inv) && <strong className="ms-2 font-semibold text-bad">{f.overdue}</strong>}
            </p>
          </div>
          <div className="text-end">
            <p className="font-display text-[2rem] font-semibold leading-none tabular-nums text-emerald">
              <bdi dir="ltr">{cash(inv.amount, inv.currency)}</bdi>
            </p>
            <p className="mt-2">
              <StatusPill status={inv.status} label={f.status[inv.status]} />
            </p>
          </div>
        </div>
        {inv.note && (
          <p className="mt-3 text-[0.97rem]" dir="auto">
            {inv.note}
          </p>
        )}

        {inv.status === "claimed" ? (
          <p className="mt-4 rounded-lg bg-wash px-4 py-3 text-[0.97rem]">{f.claimedNote(shortDate(inv.claimedAt, lang))}</p>
        ) : (
          <ol className="mt-5 grid gap-5 border-t border-line pt-5">
            {/* Step 1: one button for card, with the other ways tucked underneath */}
            <li>
              <p className="font-semibold text-emerald">
                <span className="me-2 inline-grid h-6 w-6 place-items-center rounded-full bg-emerald text-[0.85rem] text-white">1</span>
                {f.step1}
              </p>
              <div className="mt-3">
                {link && (
                  <>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full sm:w-auto">
                      {f.payCard} · <bdi dir="ltr">{cash(inv.amount, inv.currency)}</bdi>
                    </a>
                    <p className="mt-2 text-[0.9rem] text-muted">{ways.cardNote || f.cardHint}</p>
                  </>
                )}
                {hasWays ? (
                  <details className={link ? "mt-3" : ""} open={!link}>
                    <summary className="cursor-pointer font-medium text-leaf underline underline-offset-4">{f.waysH}</summary>
                    <dl className="mt-3 grid gap-3 rounded-lg bg-wash p-4 text-[0.97rem] sm:grid-cols-2">
                      {ways.payoneer && (
                        <div>
                          <dt className="font-semibold">{f.payoneerH}</dt>
                          <dd className="whitespace-pre-line break-words" dir="auto">
                            {ways.payoneer}
                          </dd>
                        </div>
                      )}
                      {ways.bank && (
                        <div>
                          <dt className="font-semibold">{f.bankH}</dt>
                          <dd className="whitespace-pre-line break-words" dir="auto">
                            {ways.bank}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </details>
                ) : (
                  !link && (
                    <p className="text-[0.97rem] text-muted">
                      {f.noWays}{" "}
                      {wa && (
                        <a className="link" href={wa} rel="noopener">
                          WhatsApp
                        </a>
                      )}
                    </p>
                  )
                )}
              </div>
            </li>

            {/* Step 2: one line to tell the academy, so the payment can be matched */}
            <li>
              <p className="font-semibold text-emerald">
                <span className="me-2 inline-grid h-6 w-6 place-items-center rounded-full bg-emerald text-[0.85rem] text-white">2</span>
                {f.step2}
              </p>
              <form action={reportPayment} className="mt-3 grid items-end gap-3 sm:grid-cols-[12rem_1fr_auto]">
                <input type="hidden" name="id" value={inv.id} />
                <div>
                  <label className="label" htmlFor={`m-${inv.id}`}>
                    {f.method}
                  </label>
                  <select className="field" id={`m-${inv.id}`} name="method" defaultValue={link ? "card" : ways.payoneer ? "payoneer" : "bank"}>
                    {PAY_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {f.methods[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`r-${inv.id}`}>
                    {f.reference} <span className="font-normal text-muted">({t.common.optional})</span>
                  </label>
                  <input className="field" id={`r-${inv.id}`} name="reference" maxLength={120} dir="ltr" placeholder={f.referencePh} />
                </div>
                <Submit className="btn btn-emerald w-full sm:w-auto">{f.paidBtn}</Submit>
              </form>
            </li>
          </ol>
        )}
      </li>
    );
  };

  return (
    <AppShell lang={lang} user={user}>
      <h1 className="text-[1.9rem]">{f.title}</h1>
      <p className="mt-2 text-muted">{f.lead}</p>
      <div className="mt-6">{msg === "claimed" && <Notice>{f.claimed}</Notice>}</div>

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-5 text-muted">{f.none}</p>
      ) : (
        <div className="grid gap-8">
          {open.length > 0 && (
            <section>
              <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">{f.toPayH}</h2>
              <ul className="mt-4 grid gap-4">{open.map(invoiceCard)}</ul>
            </section>
          )}
          {paid.length > 0 && (
            <Card title={f.historyH}>
              <ul className="divide-y divide-line">
                {paid.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
                    <div>
                      <p className="font-semibold" dir="auto">
                        {inv.title}
                      </p>
                      <p className="text-[0.92rem] text-muted">
                        <bdi dir="ltr">{invoiceNo(inv)}</bdi> · {f.paidOn(shortDate(inv.paidAt, lang))}
                      </p>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="font-semibold tabular-nums">
                        <bdi dir="ltr">{cash(inv.amount, inv.currency)}</bdi>
                      </span>
                      <Link className="link" href={`/portal/fees/${inv.id}`}>
                        {f.receipt}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
