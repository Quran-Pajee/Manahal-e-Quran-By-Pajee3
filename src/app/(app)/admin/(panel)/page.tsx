import Link from "next/link";
import { requireAdmin, dayKey, fmtDateTime, fmtDay, adminTimezone } from "@/lib/admin";
import { listLeads } from "@/lib/leads";
import { STATUSES, leadChannel, type Lead } from "@/lib/lead-types";
import { StatusPill } from "@/components/StatusPill";
import { billingCounts, paidIn } from "@/lib/billing";
import { one, q, storageMode } from "@/lib/db";
import { cash } from "@/lib/format";

const DAY = 86400000;

function tally(leads: Lead[], key: (l: Lead) => string, limit = 6) {
  const m = new Map<string, number>();
  leads.forEach((l) => {
    const k = key(l) || "Not given";
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

/** Horizontal bars: one hue because the bars show amount, with the number written beside each bar. */
function BarList({ title, rows, total, href }: { title: string; rows: [string, number][]; total: number; href?: (label: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-muted">Nothing to show yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {rows.map(([label, n]) => (
            <li key={label} title={`${label}: ${n} of ${total} leads`}>
              <div className="flex items-baseline justify-between gap-3 text-[0.95rem]">
                {href ? (
                  <Link href={href(label)} className="truncate underline-offset-2 hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className="truncate">{label}</span>
                )}
                <span className="shrink-0 tabular-nums">
                  <strong>{n}</strong> <span className="text-muted">{total ? Math.round((n / total) * 100) : 0}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-wash">
                <div className="h-2 rounded-full bg-leaf" style={{ width: `${Math.max(2, (n / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-[0.95rem] text-muted">{label}</p>
      <p className="mt-1 font-display text-[2.3rem] font-semibold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </div>
  );
}

export default async function Overview() {
  await requireAdmin();
  const offline = storageMode() === "none";
  const now = Date.now();
  const month = new Date(now).toISOString().slice(0, 7);
  const [leads, billing, monthlyRevenue, active] = await Promise.all([
    listLeads(),
    billingCounts(),
    paidIn(month),
    offline ? Promise.resolve({ count: 0 }) : one<{ count: number }>(
      `select count(distinct e.student_id)::int as count from enrollments e join classes c on c.id = e.class_id where c.status = 'active'`,
    ),
  ]);
  // A paid account is matched to a trial lead by its email. This is a transparent
  // conversion proxy: it cannot identify the same person when emails differ.
  const paidAccounts = offline ? [] : await q<{ email: string }>(
    `select distinct lower(trim(u.email)) as email from invoices i join users u on u.id = i.user_id where i.status = 'paid' and trim(u.email) <> ''`,
  );
  const paidEmails = new Set(paidAccounts.map((row) => row.email));
  const trialEmails = [...new Set(leads.filter((l) => ["trial_booked", "trial_done", "enrolled"].includes(l.status)).map((l) => l.email.trim().toLowerCase()).filter(Boolean))];
  const paidTrialEmails = trialEmails.filter((email) => paidEmails.has(email)).length;
  const trialRate = trialEmails.length ? `${((paidTrialEmails / trialEmails.length) * 100).toFixed(1)}%` : "—";
  const currencies = ["USD", "GBP", "CAD", "AUD"] as const;
  const totals = currencies.map((code) => ({ code, amount: Number(monthlyRevenue.find((r) => r.currency === code)?.total ?? 0) }));
  const newTrialLeads = leads.filter((l) => l.status === "new" && new Date(l.createdAt).getTime() >= now - 30 * DAY).length;
  const within = (from: number, to: number) => leads.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t >= now - from * DAY && t < now - to * DAY;
  }).length;

  const last7 = within(7, 0);
  const prev7 = within(14, 7);
  const last30 = within(30, 0);
  const count = (s: string) => leads.filter((l) => l.status === s).length;
  const trials = count("trial_booked") + count("trial_done") + count("enrolled");
  const enrolled = count("enrolled");
  const rate = leads.length ? Math.round((enrolled / leads.length) * 100) : 0;
  const trend = prev7 === 0 ? (last7 > 0 ? "none the week before" : "none the week before either") : `${last7 >= prev7 ? "up" : "down"} from ${prev7} the week before`;

  // Leads per day, last 14 days
  const days = Array.from({ length: 14 }, (_, i) => new Date(now - (13 - i) * DAY));
  const perDay = days.map((d) => ({ d, n: leads.filter((l) => dayKey(l.createdAt) === dayKey(d)).length }));
  const maxDay = Math.max(1, ...perDay.map((x) => x.n));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[2rem]">Overview</h1>
        <p className="text-sm text-muted">Times shown in {adminTimezone}</p>
      </div>

      <section className="mt-6">
        <h2 className="font-sans text-[1.15rem] font-semibold tracking-normal">Academy at a glance</h2>
        <p className="mt-1 text-sm text-muted">Monthly revenue reflects confirmed paid invoices for {month} (UTC). Currencies are not converted or added together.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Active learners" value={String(active?.count ?? 0)} sub="Distinct students in active classes" />
          <Tile label="Pending invoices" value={String(billing.due + billing.toConfirm)} sub={`${billing.due} due · ${billing.toConfirm} awaiting payment confirmation`} />
          <Tile label="New trial leads" value={String(newTrialLeads)} sub="New requests in the past 30 days" />
          <Tile label="Trial-to-paid conversion" value={trialRate} sub={`${paidTrialEmails} of ${trialEmails.length} trial leads matched to a paid family by email (all time)`} />
        </div>
        <h3 className="mt-6 font-sans text-base font-semibold tracking-normal">Monthly revenue by currency</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {totals.map(({ code, amount }) => <Tile key={code} label={`Revenue · ${code}`} value={cash(amount, code)} sub="Paid invoices this month" />)}
        </div>
        <p className="mt-3 text-sm text-muted">Conversion is an email-matched metric; unpaid enrollments and trial leads using a different email are not counted as paid. It is not an identity-verified attribution rate.</p>
      </section>

      <h2 className="mt-9 font-sans text-[1.15rem] font-semibold tracking-normal">Trial request pipeline</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Tile label="Waiting for a reply" value={String(count("new"))} sub="Status: New" />
        <Tile label="Leads, last 7 days" value={String(last7)} sub={trend} />
        <Tile label="Leads, last 30 days" value={String(last30)} sub={`${leads.length} in total`} />
        <Tile label="Reached a trial" value={String(trials)} sub={leads.length ? `${Math.round((trials / leads.length) * 100)}% of all leads` : "of all leads"} />
        <Tile label="Enrolled" value={String(enrolled)} sub={`${rate}% of all leads`} />
      </div>

      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="font-sans text-base font-semibold tracking-normal">Leads per day, last 14 days</h2>
        <div className="mt-5 flex h-40 items-end gap-[2px] border-b border-line" role="img" aria-label={`Leads per day for the last 14 days: ${perDay.map((x) => `${fmtDay(x.d.toISOString())} ${x.n}`).join(", ")}`}>
          {perDay.map((x) => (
            <div key={x.d.toISOString()} className="group relative flex h-full flex-1 flex-col justify-end" title={`${fmtDay(x.d.toISOString())}: ${x.n} ${x.n === 1 ? "lead" : "leads"}`}>
              <span className="mb-1 text-center text-[0.78rem] tabular-nums text-muted">{x.n > 0 ? x.n : ""}</span>
              <div className="mx-auto w-full max-w-9 rounded-t-[4px] bg-leaf group-hover:bg-emerald" style={{ height: x.n ? `${Math.max(4, (x.n / maxDay) * 78)}%` : "0%" }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted">
          <span>{fmtDay(days[0].toISOString())}</span>
          <span>Today</span>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BarList title="Pipeline" total={leads.length} rows={STATUSES.map((s) => [s.label, count(s.id)] as [string, number])} href={(label) => `/admin/leads?status=${STATUSES.find((s) => s.label === label)?.id ?? ""}`} />
        <BarList title="Where leads come from" total={leads.length} rows={tally(leads, leadChannel)} />
        <BarList title="Country" total={leads.length} rows={tally(leads, (l) => l.country)} href={(label) => `/admin/leads?country=${encodeURIComponent(label)}`} />
        <BarList title="Course" total={leads.length} rows={tally(leads, (l) => l.course)} />
        <BarList title="Class type" total={leads.length} rows={tally(leads, (l) => l.classType || "1-on-1")} />
        <BarList title="Campaign (utm_campaign)" total={leads.length} rows={tally(leads.filter((l) => l.utmCampaign), (l) => l.utmCampaign)} />
        <BarList title="Page the form was sent from" total={leads.length} rows={tally(leads, (l) => l.sourcePage)} />
      </div>

      <section className="mt-6 rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between gap-3 p-5">
          <h2 className="font-sans text-base font-semibold tracking-normal">Latest requests</h2>
          <Link href="/admin/leads" className="link text-[0.95rem] font-semibold">
            All leads
          </Link>
        </div>
        {leads.length === 0 ? (
          <p className="border-t border-line p-5 text-muted">
            No trial requests yet. Send one yourself from the{" "}
            <Link href="/free-trial" className="link">
              free trial page
            </Link>{" "}
            to check the form reaches this dashboard.
          </p>
        ) : (
          <ul>
            {leads.slice(0, 8).map((l) => (
              <li key={l.id} className="border-t border-line">
                <Link href={`/admin/leads/${l.id}`} className="grid items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-ivory sm:grid-cols-[8.5rem_1fr_1fr_auto]">
                  <span className="text-sm text-muted">{fmtDateTime(l.createdAt)}</span>
                  <span className="font-semibold">{l.name}</span>
                  <span className="text-muted">
                    {l.country || "Country not given"}, {l.course}
                  </span>
                  <StatusPill status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
