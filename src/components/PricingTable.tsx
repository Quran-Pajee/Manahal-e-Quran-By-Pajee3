"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Currency } from "@/content/types";
import { currencies, groupClass, groupTiers, moneyFor, perClass, plans, type GroupKind } from "@/content/pricing";
import { href, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

function guess(): Currency | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London") return "GBP";
    if (tz.startsWith("Australia/")) return "AUD";
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton)/.test(tz)) return "CAD";
  } catch {}
  return null;
}

type Kind = "one" | GroupKind;

/** Fee table with a currency switch and a class-type switch (one-to-one, family group, community group). */
export function PricingTable({ lang, fixed, minutes, initial = "one", kinds = ["one", "family", "community"] }: { lang: Lang; fixed?: Currency; minutes: number; initial?: Kind; kinds?: Kind[] }) {
  const t = ui[lang];
  const [cur, setCur] = useState<Currency>(fixed ?? "USD");
  const [kind, setKind] = useState<Kind>(initial);
  useEffect(() => {
    if (fixed) return;
    const g = guess();
    if (g) setCur(g);
  }, [fixed]);

  const tier = kind === "one" ? null : groupTiers.find((g) => g.kind === kind)!;
  const list = tier ? tier.plans : plans;
  const mins = tier ? groupClass.minutes : minutes;
  const tab = (active: boolean) => `min-h-[2.5rem] rounded-lg px-3.5 text-[0.95rem] font-semibold ${active ? "bg-emerald text-white" : "text-emerald hover:bg-wash"}`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        {kinds.length > 1 && (
          <div role="radiogroup" aria-label={t.plan.classType} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
            {kinds.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={tab(kind === k)}>
                {t.classTypes[k]}
              </button>
            ))}
          </div>
        )}
        {!fixed && (
          <div role="radiogroup" aria-label={t.plan.currency} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
            {currencies.map((c) => (
              <button key={c.code} type="button" role="radio" aria-checked={cur === c.code} onClick={() => setCur(c.code)} className={tab(cur === c.code)}>
                {t.countries[{ USD: "US", GBP: "GB", AUD: "AU", CAD: "CA" }[c.code]]} <span className={cur === c.code ? "text-white/70" : "text-muted"}>{c.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-4 text-sm font-semibold text-emerald">Starting at $25 · £18 · C$33 · A$35 per month</p>
      {tier && <p className="mb-3 text-muted">{t.plan.groupSize(tier.min, tier.max)}</p>}

      <ul className="overflow-hidden rounded-2xl border border-line bg-white">
        {list.map((p, i) => (
          <li key={p.id} className={`grid items-center gap-x-6 gap-y-3 p-5 sm:p-6 md:grid-cols-[1.5fr_auto_auto] ${i > 0 ? "border-t border-line" : ""}`}>
            <div>
              <h3 className="text-[1.3rem]">{t.plan.perWeek(p.perWeek)}</h3>
              <p className="mt-1 text-muted">
                {t.plan.detail(p.classesPerMonth, mins)} {t.plan.bestFor[p.id]}.
              </p>
            </div>
            <p className="md:text-end">
              <span className="font-display text-[2rem] font-semibold leading-none">{moneyFor(lang)(cur, p.prices[cur])}</span>
              <span className="text-muted"> {t.common.aMonth}</span>
              <span className="block text-sm text-muted">
                {tier ? t.common.perLearner : `${moneyFor(lang)(cur, Math.round(perClass(p, cur) * 100) / 100)} ${t.common.aClass}`}
              </span>
            </p>
            <Link href={href(lang, "/free-trial")} className={`btn ${i === 1 ? "btn-primary" : "btn-line"}`}>
              {t.common.tryFree}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-2 text-sm text-muted">
        <p><strong className="text-emerald">20% Sibling Discount for 2nd Child</strong> on one-to-one plans.</p>
        <p><strong className="text-emerald">Payment options:</strong> Stripe (Cards), PayPal, Wise, Zelle, Interac.</p>
      </div>
    </div>
  );
}
