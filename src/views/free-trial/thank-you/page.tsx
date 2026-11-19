import Link from "next/link";
import { meta } from "@/lib/seo";
import { site, whatsappLink } from "@/content/site";
import { posts } from "@/content/blog";
import { Fire } from "./Fire";
import { asLang } from "@/i18n";
import { ui } from "@/i18n/ui";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  return meta({ lang, title: ui[lang].thanks.title, description: ui[lang].thanks.title, path: "/free-trial/thank-you", noindex: true, translated: false });
}

export default async function ThankYouPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].thanks;
  const wa = whatsappLink("Assalamu alaikum, I have just sent the free trial form.");
  return (
    <div className="wrap max-w-[46rem] py-14 lg:py-24">
      <Fire />
      <p className="grid h-14 w-14 place-items-center rounded-full bg-ok/10 text-ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </p>
      <h1 className="mt-6 text-[clamp(2rem,1.4rem+2.6vw,3rem)]">{t.h1}</h1>
      <p className="mt-5 text-[1.2rem] leading-relaxed text-muted">{t.lead}</p>

      {wa && (
        <p className="mt-8">
          <a href={wa} rel="noopener" className="btn btn-emerald">
            {t.wa}
          </a>
        </p>
      )}

      <div className="mt-10 rounded-xl border border-line bg-white p-6">
        <h2 className="text-[1.3rem]">{t.accountH}</h2>
        <p className="mt-2 text-muted">{t.account}</p>
        <a href="/signup" className="btn btn-primary mt-4">
          {t.accountCta}
        </a>
      </div>

      <h2 className="mt-12 text-[1.4rem]">{t.readyH}</h2>
      <ul className="mt-4 list-disc space-y-2 ps-5 text-muted marker:text-gold-deep">
        {t.ready(site.classApps).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      {lang === "en" && (
        <>
          <h2 className="mt-12 text-[1.4rem]">{t.waitH}</h2>
          <ul className="mt-4 space-y-2">
            {posts.slice(0, 3).map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="link">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
