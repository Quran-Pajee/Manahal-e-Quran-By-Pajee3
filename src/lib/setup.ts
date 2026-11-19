import { databaseProblem, storageMode } from "./db";
import { adminConfigured } from "./auth";
import { accountsReady } from "./users";
import { site } from "@/content/site";

export type SetupItem = { key: string; ok: boolean; title: string; fix: string };

/**
 * What the live site needs before forms, sign-up and log-in work. Shown on the admin log-in page and at /api/health,
 * so a missing setting is named instead of showing up as "the form does not work". No secret values are ever included.
 */
export async function setupStatus(): Promise<SetupItem[]> {
  const problem = await databaseProblem();
  const mode = storageMode();
  const alerts = Boolean((process.env.RESEND_API_KEY && process.env.LEAD_ALERT_TO && process.env.LEAD_ALERT_FROM) || process.env.LEAD_WEBHOOK_URL);
  return [
    {
      key: "database",
      ok: problem === "",
      title: problem === "" ? (mode === "local" ? "Database: saved on this computer" : "Database: connected") : mode === "none" ? "Database: not connected" : `Database: cannot connect (${problem})`,
      fix: "In Vercel open your project, go to Storage, choose Create Database, pick Neon (Postgres) and connect it to this project. Then open Deployments and press Redeploy. Trial requests, sign-up and log-in all need it.",
    },
    {
      key: "adminPassword",
      ok: adminConfigured(),
      title: adminConfigured() ? "Admin password: set" : "Admin password: not set",
      fix: "In Vercel open Settings, then Environment Variables. Add ADMIN_PASSWORD with a long password of your choice, then Redeploy. This is the password for this page.",
    },
    {
      key: "accounts",
      ok: accountsReady(),
      title: accountsReady() ? "Student, parent and teacher accounts: ready" : "Student, parent and teacher accounts: waiting for the database",
      fix: "Accounts switch on by themselves once the database is connected.",
    },
    {
      key: "alerts",
      ok: alerts,
      title: alerts ? "New-request alerts: on" : "New-request alerts: off (optional)",
      fix: "Optional. Add RESEND_API_KEY, LEAD_ALERT_TO and LEAD_ALERT_FROM (or LEAD_WEBHOOK_URL) to be emailed the moment a trial request arrives. Without it, requests still appear in this panel.",
    },
    {
      key: "whatsapp",
      ok: Boolean(site.whatsapp),
      title: site.whatsapp ? "WhatsApp number: set" : "WhatsApp number: not set",
      fix: "Set the number in src/content/site.ts or add NEXT_PUBLIC_WHATSAPP (digits only, with country code).",
    },
  ];
}
