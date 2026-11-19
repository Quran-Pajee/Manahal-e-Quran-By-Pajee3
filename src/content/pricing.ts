import type { Currency } from "./types";
import { site } from "./site";

/** This policy is kept here during Step 1 so untouched site.ts copy uses the new rate. */
export const SIBLING_DISCOUNT_PERCENT = 20 as const;
site.siblingDiscountPercent = SIBLING_DISCOUNT_PERCENT;

/** Only the second child on a one-to-one plan receives the sibling discount. */
export const siblingPrice = (monthlyPrice: number, childPosition: number): number =>
  Math.round(monthlyPrice * (childPosition === 2 ? 1 - SIBLING_DISCOUNT_PERCENT / 100 : 1) * 100) / 100;

/**
 * Monthly fees for one-to-one classes of 30 minutes.
 * These are starting figures set against what online Quran academies charge in 2026.
 * Change them here and every page, FAQ and schema block updates.
 */
export type Plan = {
  id: string;
  name: string;
  perWeek: number;
  classesPerMonth: number;
  bestFor: string;
  prices: Record<Currency, number>;
};

export const plans: Plan[] = [
  {
    id: "two",
    name: "2 classes a week",
    perWeek: 2,
    classesPerMonth: 8,
    bestFor: "Busy adults and children who also attend a weekend madrasah",
    prices: { USD: 25, GBP: 18, AUD: 35, CAD: 33 },
  },
  {
    id: "three",
    name: "3 classes a week",
    perWeek: 3,
    classesPerMonth: 12,
    bestFor: "Noorani Qaida, Quran reading and Tajweed. The plan most families start on",
    prices: { USD: 35, GBP: 25, AUD: 49, CAD: 46 },
  },
  {
    id: "five",
    name: "5 classes a week",
    perWeek: 5,
    classesPerMonth: 20,
    bestFor: "Hifz and Ijazah students, and anyone who wants to finish faster",
    prices: { USD: 52, GBP: 38, AUD: 72, CAD: 68 },
  },
];

export const currencies: { code: Currency; symbol: string; label: string; country: string }[] = [
  { code: "USD", symbol: "$", label: "US dollars", country: "USA" },
  { code: "GBP", symbol: "£", label: "British pounds", country: "UK" },
  { code: "AUD", symbol: "A$", label: "Australian dollars", country: "Australia" },
  { code: "CAD", symbol: "C$", label: "Canadian dollars", country: "Canada" },
];

export const money = (currency: Currency, amount: number) => {
  const c = currencies.find((x) => x.code === currency)!;
  const rounded = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${c.symbol}${rounded}`;
};

/**
 * Prices inside Urdu and Arabic sentences. Without the invisible left-to-right mark, right-to-left text flips "$18" into "18$".
 * English gets the plain string.
 */
export const moneyFor = (lang: string) => (currency: Currency, amount: number) => (lang === "en" ? "" : "\u200E") + money(currency, amount);

export const lowest = (currency: Currency) => Math.min(...plans.map((p) => p.prices[currency]));
export const highest = (currency: Currency) => Math.max(...plans.map((p) => p.prices[currency]));

export const perClass = (plan: Plan, currency: Currency) => plan.prices[currency] / plan.classesPerMonth;


/**
 * Group classes. Fees are per learner, per month, for classes of 45 minutes.
 *  - Family group: 2 to 4 learners from one household (brothers, sisters, cousins, a parent with a child).
 *  - Community group: 3 to 6 learners gathered by one organiser (neighbours, a mosque, a homeschool group).
 * The Step 1 offer is a single flat monthly price per learner, at every frequency
 * and for both family/community groups. No additional sibling discount stacks with group fees.
 */
export type GroupKind = "family" | "community";
export const groupClass = { minutes: 45 };

export type GroupTier = { kind: GroupKind; name: string; min: number; max: number; who: string; plans: Plan[] };

export const groupTiers: GroupTier[] = [
  {
    kind: "family",
    name: "Family group",
    min: 2,
    max: 4,
    who: "Brothers, sisters and cousins from one household, or a parent learning with a child",
    plans: [
      { id: "family-two", name: "2 classes a week", perWeek: 2, classesPerMonth: 8, bestFor: "A gentle start for young siblings", prices: { USD: 15, GBP: 12, AUD: 22, CAD: 20 } },
      { id: "family-three", name: "3 classes a week", perWeek: 3, classesPerMonth: 12, bestFor: "Noorani Qaida and Quran reading for siblings at the same level", prices: { USD: 15, GBP: 12, AUD: 22, CAD: 20 } },
      { id: "family-five", name: "5 classes a week", perWeek: 5, classesPerMonth: 20, bestFor: "Families who want a daily Quran routine", prices: { USD: 15, GBP: 12, AUD: 22, CAD: 20 } },
    ],
  },
  {
    kind: "community",
    name: "Community group",
    min: 3,
    max: 6,
    who: "Children from the same street, mosque, school or homeschool group, brought together by one organiser",
    plans: [
      { id: "community-two", name: "2 classes a week", perWeek: 2, classesPerMonth: 8, bestFor: "A top-up beside the weekend madrasah", prices: { USD: 15, GBP: 12, AUD: 22, CAD: 20 } },
      { id: "community-three", name: "3 classes a week", perWeek: 3, classesPerMonth: 12, bestFor: "A neighbourhood Qaida or Tajweed class", prices: { USD: 15, GBP: 12, AUD: 22, CAD: 20 } },
      { id: "community-five", name: "5 classes a week", perWeek: 5, classesPerMonth: 20, bestFor: "Juz Amma memorization circles and daily Islamic studies", prices: { USD: 15, GBP: 12, AUD: 22, CAD: 20 } },
    ],
  },
];

export const groupTier = (kind: GroupKind) => groupTiers.find((t) => t.kind === kind)!;
export const lowestGroup = (currency: Currency) => Math.min(...groupTiers.flatMap((t) => t.plans.map((p) => p.prices[currency])));
export const lowestIn = (kind: GroupKind, currency: Currency) => Math.min(...groupTier(kind).plans.map((p) => p.prices[currency]));
