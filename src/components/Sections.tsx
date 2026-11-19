import Link from "next/link";
import type { ReactNode } from "react";
import { site, whatsappLink } from "@/content/site";
import { groupClass } from "@/content/pricing";
import { TrialCard } from "./TrialForm";
import { href, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";
import type { TrialDefaults } from "@/lib/trial-link";

type Defaults = TrialDefaults;

/** Closing section used across the site: what happens after you send the form, with the form beside it. */
export function TrialSection({ lang, source, ...defaults }: { lang: Lang; source: string } & Defaults) {
  const t = ui[lang].trialSection;
  const wa = whatsappLink();
  const isGroup = Boolean(defaults.defaultClassType && defaults.defaultClassType !== "One-to-one");
  return (
    <section className="on-emerald lattice bg-emerald text-white" aria-labelledby="trial-heading">
      <div className="wrap grid items-center gap-10 py-14 lg:grid-cols-[1fr_29rem] lg:py-20">
        <div>
          <h2 id="trial-heading" className="text-[clamp(1.9rem,1.3rem+2.4vw,2.9rem)]">
            {t.heading(site.trial.classes)}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-white/80">{t.sub}</p>
          <ol className="mt-8 max-w-xl space-y-5">
            {t.steps(site.trial.classes, isGroup ? groupClass.minutes : site.trial.minutes).map(([title, d], i) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold font-sans text-lg text-gold">{i + 1}</span>
                <span>
                  <strong className="block text-[1.1rem] font-semibold">{title}</strong>
                  <span className="text-white/75">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          {wa && (
            <p className="mt-8 text-white/80">
              {t.chat}{" "}
              <a href={wa} rel="noopener" className="font-semibold text-gold underline underline-offset-4">
                {t.chatLink}
              </a>
            </p>
          )}
        </div>
        <TrialCard lang={lang} source={source} {...defaults} />
      </div>
    </section>
  );
}

/**
 * Standard page header for inner pages: heading, one line of introduction and the main button, all in the first screen.
 * Pass `lang` to show the button row. Policy pages leave it out.
 */
export function PageHead({ crumbs, title, lead, lang, children }: { crumbs: ReactNode; title: string; lead?: string; lang?: Lang; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-white">
      <div className="wrap py-6 sm:py-10">
        {crumbs}
        <h1 className="mt-3 max-w-4xl text-[clamp(1.85rem,1.3rem+2.6vw,3rem)] leading-[1.1]">{title}</h1>
        {lead && <p className="mt-4 max-w-3xl text-[1.08rem] leading-relaxed text-muted sm:text-[1.17rem]">{lead}</p>}
        {lang && <HeroCta lang={lang} className="mt-5 sm:mt-6" />}
        {children}
      </div>
    </div>
  );
}

/** The main button with the WhatsApp link beside it. Every page shows this, or the form itself, in its first screen. */
export function HeroCta({ lang, to, className = "", light = false }: { lang: Lang; to?: string; className?: string; light?: boolean }) {
  const t = ui[lang];
  const wa = whatsappLink();
  return (
    <div className={`flex flex-col gap-x-5 gap-y-2 min-[480px]:flex-row min-[480px]:items-center ${className}`}>
      <Link href={to ?? href(lang, "/free-trial")} className="btn btn-primary text-[1.05rem]">
        {t.common.trialCta(site.trial.classes)}
      </Link>
      {wa && (
        <a href={wa} rel="noopener" className={`py-1 text-center font-semibold underline underline-offset-4 ${light ? "text-gold" : "text-leaf"}`}>
          {t.trialSection.chatLink}
        </a>
      )}
    </div>
  );
}

export function Facts({ items, light = false }: { items: { label: string; value: string }[]; light?: boolean }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((f) => (
        <div key={f.label} className="border-s-2 border-gold ps-4">
          <dt className={`text-sm ${light ? "text-white/70" : "text-muted"}`}>{f.label}</dt>
          <dd className="font-semibold leading-snug">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Reviews({ lang }: { lang: Lang }) {
  if (!site.reviews.length) return null;
  return (
    <section className="bg-white" aria-labelledby="reviews-heading">
      <div className="wrap py-16 lg:py-20">
        <h2 id="reviews-heading" className="text-[clamp(1.7rem,1.3rem+1.6vw,2.4rem)]">
          {ui[lang].home.reviewsH}
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {site.reviews.map((r) => (
            <li key={r.name + r.date} className="border-s-2 border-gold ps-5" lang="en" dir="ltr">
              <p aria-label={`${r.rating} out of 5`} className="text-gold-deep">
                {"★".repeat(r.rating)}
              </p>
              <blockquote className="mt-2">{r.text}</blockquote>
              <p className="mt-3 text-sm text-muted">
                {r.name}, {r.location}. {r.course}.
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Sticky "On this page" list beside long pages. Jump links also help search engines show section links. */
export function SideNav({ lang, items }: { lang: Lang; items: { id: string; label: string }[] }) {
  const t = ui[lang];
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <h2 className="font-sans text-sm font-semibold tracking-normal text-muted">{t.common.onThisPage}</h2>
        <ul className="mt-3 border-s border-line">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="-ms-px block border-s-2 border-transparent py-1.5 ps-4 text-[0.95rem] leading-snug hover:border-gold hover:text-leaf">
                {i.label}
              </a>
            </li>
          ))}
        </ul>
        <Link href={href(lang, "/free-trial")} className="btn btn-primary mt-6 w-full">
          {t.nav.trial}
        </Link>
      </div>
    </aside>
  );
}

/** Small tick list used for "what is included" notes. */
export function Ticks({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((n) => (
        <li key={n} className="flex gap-3">
          <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0 text-ok" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
          <span>{n}</span>
        </li>
      ))}
    </ul>
  );
}
