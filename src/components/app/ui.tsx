/** Small building blocks shared by the dashboards. */

export function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-[0.95rem] text-muted">{label}</p>
      <p className="mt-1 font-display text-[2.1rem] font-semibold leading-none tabular-nums">
        <bdi dir="ltr">{value}</bdi>
      </p>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function Notice({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "bad" | "info" }) {
  const style = tone === "ok" ? "border-ok/40 bg-ok/10 text-ok" : tone === "bad" ? "border-bad/40 bg-bad/10 text-bad" : "border-line bg-wash text-emerald";
  return (
    <p role="status" className={`mb-6 rounded-lg border px-4 py-3 text-[0.97rem] font-medium ${style}`}>
      {children}
    </p>
  );
}

export function Card({ title, children, id, aside }: { title?: string; children: React.ReactNode; id?: string; aside?: React.ReactNode }) {
  return (
    <section id={id} className="rounded-xl border border-line bg-white p-5 sm:p-6">
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          {title && <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** A thin bar for a percentage. One colour: it shows an amount, and the number is always written next to it. */
export function Meter({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full rounded-full bg-wash" role="img" aria-label={`${label}: ${v}%`}>
      <div className="h-2 rounded-full bg-leaf" style={{ width: `${Math.max(v, 2)}%` }} />
    </div>
  );
}

export function AttendancePill({ value, label }: { value: string; label: string }) {
  const style = value === "present" ? "border-ok/40 bg-ok/10 text-ok" : value === "late" ? "border-gold-deep/40 bg-gold/25 text-emerald" : "border-bad/40 bg-bad/10 text-bad";
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${style}`}>{label}</span>;
}
