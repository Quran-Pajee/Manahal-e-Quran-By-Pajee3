import { NextResponse } from "next/server";
import { setupStatus } from "@/lib/setup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Open /api/health in a browser to see which parts of the setup are done. It shows yes/no only, never a password or address. */
export async function GET() {
  const items = await setupStatus();
  const required = items.filter((i) => ["database", "adminPassword", "accounts"].includes(i.key));
  return NextResponse.json(
    { ready: required.every((i) => i.ok), checks: items.map((i) => ({ check: i.title, ok: i.ok, ...(i.ok ? {} : { todo: i.fix }) })) },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
