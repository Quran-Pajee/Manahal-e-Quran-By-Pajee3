import Link from "next/link";
import { requireStaff } from "@/lib/admin";
import { storageMode } from "@/lib/leads";
import { counts } from "@/lib/lms";
import { billingCounts } from "@/lib/billing";
import { logout } from "../actions";
import { Mark } from "@/components/Logo";
import { site } from "@/content/site";

const ADMIN_NAV = [
  ["/admin", "Overview"],
  ["/admin/leads", "Leads"],
  ["/admin/people", "People"],
  ["/admin/classes", "Classes"],
  ["/admin/performance", "Performance"],
  ["/admin/billing", "Billing & pricing"],
  ["/admin/content", "Page editor"],
  ["/admin/seo", "SEO"],
  ["/admin/staff", "Staff"],
] as const;
// Editors write and publish content. They do not see leads, families, classes, fees or settings.
const EDITOR_NAV = [["/admin/content", "Page editor"]] as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  const admin = me.role === "admin";
  const mode = storageMode();
  const waiting = admin ? (await counts()).pendingTeachers : 0;
  const toConfirm = admin ? (await billingCounts()).toConfirm : 0;
  const alerts = Boolean((process.env.RESEND_API_KEY && process.env.LEAD_ALERT_TO && process.env.LEAD_ALERT_FROM) || process.env.LEAD_WEBHOOK_URL);

  return (
    <>
      <header className="on-emerald bg-emerald text-white print:hidden">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <Link href={admin ? "/admin" : "/admin/content"} className="flex items-center gap-2.5 font-semibold">
            <Mark light className="h-8 w-8" />
            {site.shortName} {admin ? "admin" : "editor"}
          </Link>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-x-0.5 gap-y-1 text-[0.95rem]">
            {(admin ? ADMIN_NAV : EDITOR_NAV).map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-2.5 py-2 hover:bg-white/10">
                {label}
              </Link>
            ))}
            {admin && (
              <a href="/admin/export" className="rounded-md px-2.5 py-2 hover:bg-white/10">
                Download CSV
              </a>
            )}
            <Link href="/" className="rounded-md px-2.5 py-2 hover:bg-white/10">
              View site
            </Link>
            <form action={logout}>
              <button type="submit" className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-white/10" title={`Signed in as ${me.name}`}>
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {mode !== "postgres" && (
        <div role="status" className={`border-b px-5 py-3 text-center text-[0.95rem] ${mode === "none" ? "border-bad/30 bg-bad/10 text-bad" : "border-line bg-wash"}`}>
          {mode === "none"
            ? "No database is connected, so trial requests, accounts and classes cannot be saved. Add DATABASE_URL in your hosting settings and redeploy."
            : "Development mode: everything is saved in a small database on this computer (the .data folder). Add DATABASE_URL before going live."}
        </div>
      )}
      {toConfirm > 0 && (
        <div role="status" className="border-b border-gold/40 bg-gold/20 px-5 py-2.5 text-center text-[0.95rem]">
          {toConfirm === 1 ? "1 family says it has paid." : `${toConfirm} families say they have paid.`}{" "}
          <Link href="/admin/billing?status=claimed" className="font-semibold underline underline-offset-2">
            Check and confirm
          </Link>
        </div>
      )}
      {waiting > 0 && (
        <div role="status" className="border-b border-gold-deep/30 bg-gold/25 px-5 py-2.5 text-center text-[0.95rem]">
          {waiting === 1 ? "1 teacher application is" : `${waiting} teacher applications are`} waiting for your approval.{" "}
          <Link href="/admin/people" className="font-semibold underline underline-offset-2">
            Review
          </Link>
        </div>
      )}
      {admin && mode !== "none" && !alerts && (
        <div role="status" className="border-b border-line bg-white px-5 py-2.5 text-center text-sm text-muted">
          New-lead alerts are off. Add the Resend or webhook settings to be told the moment a request arrives.
        </div>
      )}

      <main className="wrap py-8 lg:py-10">{children}</main>
    </>
  );
}
