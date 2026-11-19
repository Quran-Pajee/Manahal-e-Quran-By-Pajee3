import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/Shell";
import { PrintButton } from "@/components/app/PrintButton";
import { Mark } from "@/components/Logo";
import { appLang, requireUser } from "@/lib/users";
import { getInvoice, invoiceNo } from "@/lib/billing";
import { cash, shortDate } from "@/lib/format";
import { app } from "@/i18n/app";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Receipt" };

/** A receipt for a paid invoice. The family can print it or save it as a PDF from the browser. */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("portal");
  const inv = await getInvoice((await params).id);
  if (!inv || inv.userId !== user.id || inv.status !== "paid") notFound();
  const lang = await appLang();
  const t = app[lang];
  const f = t.fees;
  const rows: [string, React.ReactNode][] = [
    [f.invoiceNo, <bdi key="n" dir="ltr">{invoiceNo(inv)}</bdi>],
    [f.billedTo, <span key="b" dir="auto">{user.name}</span>],
    [f.amount, <bdi key="a" dir="ltr">{cash(inv.amount, inv.currency)}</bdi>],
    [f.method, f.methods[inv.paidMethod] ?? inv.paidMethod],
    ...(inv.paidRef ? ([[f.reference, <bdi key="r" dir="ltr">{inv.paidRef}</bdi>]] as [string, React.ReactNode][]) : []),
    [t.common.date, shortDate(inv.paidAt, lang)],
  ];

  return (
    <AppShell lang={lang} user={user}>
      <p className="mb-4 print:hidden">
        <Link className="link" href="/portal/fees">
          {f.back}
        </Link>
      </p>
      <article className="max-w-[40rem] rounded-xl border border-line bg-white p-7 sm:p-9">
        <div className="flex items-center gap-3" lang="en" dir="ltr">
          <Mark className="h-12 w-12" />
          <div>
            <p className="font-display text-[1.5rem] font-semibold leading-none text-emerald">{site.name}</p>
            <p className="mt-1 text-[0.85rem] text-muted">by {site.organisation.name} · {site.url.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
        <h1 className="mt-8 text-[1.9rem]">{f.receiptTitle}</h1>
        <p className="mt-1 text-[1.05rem]" dir="auto">
          {inv.title}
        </p>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-line pt-6">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-7 inline-block rounded-full border border-ok/40 bg-ok/10 px-3 py-1 text-[0.9rem] font-semibold text-ok">{f.status.paid}</p>
      </article>
      <div className="mt-5">
        <PrintButton>{f.print}</PrintButton>
      </div>
    </AppShell>
  );
}
