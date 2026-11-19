import { statusLabel } from "@/lib/lead-types";

const style: Record<string, string> = {
  new: "bg-gold/30 text-emerald border-gold-deep/40",
  contacted: "bg-wash text-emerald border-line",
  trial_booked: "bg-wash text-emerald border-leaf/40",
  trial_done: "bg-white text-emerald border-leaf/60",
  enrolled: "bg-ok/10 text-ok border-ok/40",
  lost: "bg-white text-muted border-line",
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.82rem] font-semibold ${style[status] ?? style.contacted}`}>{statusLabel(status)}</span>;
}
