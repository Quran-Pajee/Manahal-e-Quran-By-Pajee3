export function UserStatus({ status }: { status: string }) {
  const style = status === "active" ? "border-ok/40 bg-ok/10 text-ok" : status === "pending" ? "border-gold-deep/40 bg-gold/30 text-emerald" : "border-bad/40 bg-bad/10 text-bad";
  const label = status === "active" ? "Active" : status === "pending" ? "Waiting for approval" : "Paused";
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${style}`}>{label}</span>;
}
