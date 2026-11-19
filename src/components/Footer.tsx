import Link from "next/link";
import { Logo } from "./Logo";
import { phoneLabel, site, whatsappLink } from "@/content/site";
import { coursesFor } from "@/content/courses";
import { landingsFor } from "@/content/pages";
import { href, type Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

const socials = Object.entries(site.social).filter(([, v]) => v);

export function Footer({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const f = t.footer;
  const wa = whatsappLink();
  const landings = landingsFor(lang);
  return (
    <footer className="on-emerald bg-emerald text-white">
      <div className="wrap grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-white/75">{f.description}</p>
          <Link href={href(lang, "/free-trial")} className="btn btn-primary mt-6">
            {t.common.trialCta(site.trial.classes)}
          </Link>
          <ul className="mt-6 space-y-1.5 text-white/85">
            {wa && (
              <li>
                <a href={wa} className="underline-offset-2 hover:underline" rel="noopener">
                  {t.common.whatsapp}: <bdi dir="ltr">{phoneLabel()}</bdi>
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="underline-offset-2 hover:underline">
                  {site.email}
                </a>
              </li>
            )}
            {site.address && <li>{site.address}</li>}
          </ul>
        </div>

        <FooterList title={f.courses} links={coursesFor(lang).map((c) => ({ href: href(lang, `/courses/${c.slug}`), label: c.name }))} />
        <FooterList
          title={f.byCountry}
          links={landings.filter((l) => l.kind === "country").map((l) => ({ href: href(lang, `/${l.slug}`), label: f.classesIn(l.nav) }))}
          second={{ title: f.classesFor, links: landings.filter((l) => l.kind === "audience").map((l) => ({ href: href(lang, `/${l.slug}`), label: l.nav })) }}
        />
        <FooterList
          title={f.academy}
          links={[
            { href: href(lang, "/about"), label: f.about },
            { href: href(lang, "/pricing"), label: f.fees },
            { href: href(lang, "/faq"), label: f.questions },
            { href: "/blog", label: f.guides },
            { href: href(lang, "/contact"), label: f.contact },
            { href: "/login", label: f.login, plain: true },
            { href: "/signup/teacher", label: f.teachWithUs, plain: true },
            { href: "/privacy-policy", label: f.privacy },
            { href: "/terms", label: f.terms },
            { href: "/refund-policy", label: f.refund },
          ]}
        />
      </div>
      <div className="border-t border-white/15">
        <div className="wrap flex flex-col gap-3 py-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {f.projectOf}{" "}
            <a href={site.organisation.url} className="underline underline-offset-2 hover:text-white">
              {site.organisation.name}
            </a>
            . {f.rights}
          </p>
          {socials.length > 0 && (
            <ul className="flex gap-4">
              {socials.map(([k, v]) => (
                <li key={k}>
                  <a href={v} rel="noopener me" className="capitalize underline-offset-2 hover:text-white hover:underline">
                    {k}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

type L = { href: string; label: string; plain?: boolean };
function Links({ links }: { links: L[] }) {
  return (
    <ul className="mt-3 space-y-2 text-white/85">
      {links.map((l) => (
        <li key={l.href}>
          {l.plain ? (
            <a href={l.href} className="underline-offset-2 hover:text-white hover:underline">
              {l.label}
            </a>
          ) : (
            <Link href={l.href} className="underline-offset-2 hover:text-white hover:underline">
              {l.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
function FooterList({ title, links, second }: { title: string; links: L[]; second?: { title: string; links: L[] } }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-sans text-base font-semibold tracking-normal text-gold">{title}</h2>
      <Links links={links} />
      {second && (
        <>
          <h2 className="mt-7 font-sans text-base font-semibold tracking-normal text-gold">{second.title}</h2>
          <Links links={second.links} />
        </>
      )}
    </nav>
  );
}
