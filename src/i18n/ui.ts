import type { Lang } from "./index";
import { en, type UI } from "./ui.en";
import { ur } from "./ui.ur";
import { ar } from "./ui.ar";

export type { UI };
export const ui: Record<Lang, UI> = { en, ur, ar };
