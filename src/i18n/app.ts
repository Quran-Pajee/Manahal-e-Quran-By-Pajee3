import type { Lang } from "./index";
import { en, type App } from "./app.en";
import { ur } from "./app.ur";
import { ar } from "./app.ar";

/** Dashboard and account screens, in each language. The admin panel is English only. */
export const app: Record<Lang, App> = { en, ur, ar };
export type { App };
