"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { whatsappLink } from "@/content/site";
import { href, splitPath, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

/**
 * Fixed bar on phones so the trial is always one tap away. Hidden on the form pages themselves.
 * Pages whose first screen already has the main button show the bar after a scroll;
 * guides and policy pages, which open with text, show it straight away.
 */
export function MobileCta({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const [, plain] = splitPath(usePathname());
  const reading = plain.startsWith("/blog/") || /^\/(privacy-policy|terms|refund-policy)$/.test(plain);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!(scrolled || reading) || plain.startsWith("/free-trial") || plain.startsWith("/contact")) return null;
  const wa = whatsappLink();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-2.5 backdrop-blur sm:hidden">
      <div className="flex gap-2">
        <Link href={href(lang, "/free-trial")} className="btn btn-primary flex-1">
          {t.nav.trial}
        </Link>
        {wa && (
          <a href={wa} rel="noopener" className="btn btn-line px-4">
            {t.common.whatsapp}
          </a>
        )}
      </div>
    </div>
  );
}
