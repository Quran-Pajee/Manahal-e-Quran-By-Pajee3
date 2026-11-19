"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { phoneLabel, site, whatsappLink } from "@/content/site";
import { LANGS, englishOnly, href, langName, splitPath, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

export function Header({ lang }: { lang: Lang }) {
  const t = ui[lang].nav;
  const pathname = usePathname();
  const [, plain] = splitPath(pathname);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const wa = whatsappLink();

  const nav = [
    { path: "/courses", label: t.courses },
    { path: "/online-quran-classes-for-kids", label: t.kids },
    { path: "/online-quran-classes-for-adults", label: t.adults },
    { path: "/female-quran-teacher-online", label: t.female },
    { path: "/group-quran-classes", label: t.group },
    { path: "/pricing", label: t.fees },
  ];

  const switcher = (onDark: boolean) => (
    <ul className="flex items-center gap-0.5" aria-label={t.language}>
      {LANGS.map((l) => {
        // Pages that exist in English only send other languages to that language's home page.
        const target = l !== "en" && englishOnly(plain) ? href(l, "/") : href(l, plain);
        const active = l === lang;
        const look = onDark ? (active ? "bg-white/15 text-white" : "text-white/80 hover:text-white") : active ? "bg-emerald text-white" : "text-emerald hover:bg-wash";
        return (
          <li key={l}>
            <a href={target} lang={l} hrefLang={l} aria-current={active ? "true" : undefined} className={`block rounded px-2 py-1 text-[0.86rem] leading-none ${look} ${l === "en" ? "font-semibold" : ""}`}>
              {l === "en" ? "EN" : langName[l]}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-emerald focus:px-3 focus:py-2 focus:text-white">
        {t.skip}
      </a>

      {/* Slim top bar: how to reach us on one side, language and log-in on the other. It scrolls away; the main bar stays. */}
      <div className="on-emerald hidden bg-emerald text-white md:block">
        <div className="wrap flex h-9 items-center justify-between gap-4 text-[0.86rem]">
          <p className="flex items-center gap-5 text-white/85">
            {wa && (
              <a href={wa} rel="noopener" className="hover:text-white">
                {ui[lang].common.whatsapp} <bdi dir="ltr">{phoneLabel()}</bdi>
              </a>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="hidden hover:text-white lg:inline" dir="ltr">
                {site.email}
              </a>
            )}
          </p>
          <div className="flex items-center gap-4">
            {switcher(true)}
            <a href="/login" className="font-medium text-gold hover:text-white">
              {t.login}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="wrap flex h-[4.5rem] items-center justify-between gap-4">
          <Link href={href(lang, "/")} aria-label={ui[lang].common.home} className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label={t.main} className="hidden items-center lg:flex">
            {nav.map((n) => {
              const active = plain === n.path || plain.startsWith(n.path + "/");
              return (
                <Link
                  key={n.path}
                  href={href(lang, n.path)}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-[0.95rem] font-medium text-emerald hover:border-gold xl:px-3.5 ${active ? "border-gold" : "border-transparent"}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href={href(lang, "/free-trial")} className="btn btn-primary hidden min-h-[2.75rem] whitespace-nowrap sm:inline-flex">
              {t.trial}
            </Link>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-md border border-line text-emerald lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
              <span className="sr-only">{open ? t.menuClose : t.menuOpen}</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

      {open && (
        <nav id="mobile-nav" aria-label={t.main} className="border-b border-line bg-ivory lg:hidden">
          <ul className="wrap grid gap-1 py-3">
            {nav.map((n) => (
              <li key={n.path}>
                <Link href={href(lang, n.path)} className="block rounded-md px-3 py-3 text-lg font-medium text-emerald hover:bg-wash">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/login" className="block rounded-md px-3 py-3 text-lg font-medium text-emerald hover:bg-wash">
                {t.login}
              </a>
            </li>
            <li className="flex items-center justify-between gap-3 px-3 py-2 md:hidden">
              <span className="text-muted">{t.language}</span>
              {switcher(false)}
            </li>
            <li className="pt-2 sm:hidden">
              <Link href={href(lang, "/free-trial")} className="btn btn-primary w-full">
                {t.trial}
              </Link>
            </li>
          </ul>
        </nav>
      )}
      </header>
    </>
  );
}
