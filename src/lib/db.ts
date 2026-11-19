import postgres from "postgres";
import path from "path";

/**
 * Shared read/write database access. Schema creation and content seeding run ONLY through
 * migrations/0001_neon_bootstrap.sql, never on a request, serverless cold start, or render.
 *
 * Production: DATABASE_URL must contain the Neon *pooled* (-pooler) connection URL.
 * Development without DATABASE_URL: optional on-disk PGlite at .data/pg; initialise it
 * with the same migration before testing forms or the admin panel.
 */
type Row = Record<string, unknown>;
type Lite = { query: (text: string, params?: unknown[]) => Promise<{ rows: Row[] }> };
const g = globalThis as unknown as {
  __qaPg?: ReturnType<typeof postgres>;
  __qaPgUrl?: string;
  __qaLite?: Promise<Lite>;
  __qaLiteMemory?: boolean;
};

export type StorageMode = "postgres" | "local" | "none";

/** Keep the existing exported API; production uses DATABASE_URL, not a direct Neon URL. */
export function dbUrl(): string {
  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (direct) return direct;
  // Keep support for prefixed Vercel integration variables used by older installs.
  for (const [key, value] of Object.entries(process.env)) {
    if (value && /_(DATABASE|POSTGRES)_URL$/.test(key) && /^postgres(ql)?:\/\//.test(value)) return value;
  }
  return "";
}

/** Remove driver-incompatible connection query options while retaining TLS settings. */
export function connectionFor(url: string): { url: string; ssl: boolean } {
  try {
    const u = new URL(url);
    const sslmode = u.searchParams.get("sslmode");
    const options = u.searchParams.get("options");
    u.search = "";
    if (options) u.searchParams.set("options", options);
    const local = ["localhost", "127.0.0.1", "::1", "[::1]", ""].includes(u.hostname);
    return { url: u.toString(), ssl: sslmode === "disable" ? false : !local };
  } catch {
    return { url, ssl: false };
  }
}

export function storageMode(): StorageMode {
  if (dbUrl()) return "postgres";
  return process.env.VERCEL ? "none" : "local";
}

export class NoStorageError extends Error {}

/** Read-only health check; it also reports when the migration has not been run. */
export async function databaseProblem(): Promise<string> {
  if (storageMode() === "none") return "not connected";
  try {
    await raw("select 1 from settings limit 1");
    return "";
  } catch (e) {
    const code = String((e as { code?: string })?.code ?? "");
    const known: Record<string, string> = {
      ENOTFOUND: "the database address was not found",
      ECONNREFUSED: "the database refused the connection",
      CONNECT_TIMEOUT: "the database did not answer in time",
      ETIMEDOUT: "the database did not answer in time",
      "28P01": "the database password is wrong",
      "28000": "the database rejected the log-in",
      "3D000": "that database does not exist",
      "42704": "the database refused a setting in its address",
      "42P01": "database bootstrap migration has not been run",
      "42501": "the database user cannot access the tables",
    };
    return known[code] ?? `could not connect${/^[A-Z0-9_]{3,20}$/.test(code) ? `, code ${code}` : ""}`;
  }
}

async function raw(text: string, params: unknown[] = []): Promise<Row[]> {
  const mode = storageMode();
  if (mode === "none") throw new NoStorageError("No database is connected. Set DATABASE_URL.");
  if (mode === "postgres") {
    const { url, ssl } = connectionFor(dbUrl());
    if (!g.__qaPg || g.__qaPgUrl !== url) {
      // A single serverless worker opens at most one pooled connection. Neon scales down
      // when idle; prepared statements are disabled for transaction pooling compatibility.
      g.__qaPg = postgres(url, {
        max: 1,
        idle_timeout: 10,
        connect_timeout: 10,
        prepare: false,
        onnotice: () => {},
        ...(ssl ? { ssl: "require" as const } : {}),
      });
      g.__qaPgUrl = url;
    }
    return (await g.__qaPg.unsafe(text, params as never[])) as unknown as Row[];
  }

  g.__qaLite ??= (async () => {
    const { mkdir } = await import("fs/promises");
    const dir = path.join(process.cwd(), ".data");
    await mkdir(dir, { recursive: true });
    const { PGlite } = await import("@electric-sql/pglite");
    try {
      const lite = new PGlite(path.join(dir, "pg"));
      await lite.query("select 1");
      return lite as unknown as Lite;
    } catch (e) {
      console.warn("[db] could not open .data/pg, using an in-memory local database:", (e as Error)?.message);
      g.__qaLiteMemory = true;
      return new PGlite() as unknown as Lite;
    }
  })();
  return (await (await g.__qaLite).query(text, params)).rows;
}

const camelKey = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
function camel(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[camelKey(k)] = v instanceof Date ? v.toISOString() : v;
  return out;
}

/** Parameterised read/write SQL, with camelCase keys and ISO date strings. No implicit DDL. */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await raw(text, params)).map(camel) as T[];
}
export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}
