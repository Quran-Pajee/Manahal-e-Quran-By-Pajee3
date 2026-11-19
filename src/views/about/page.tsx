import Link from "next/link";
import { pageMeta, abs } from "@/lib/seo";
import { site } from "@/content/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHead, TrialSection } from "@/components/Sections";
import { JsonLd } from "@/components/JsonLd";
import { asLang, href } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].aboutPage;
  return pageMeta({ lang, title: t.metaTitle(site.name), description: t.metaDescription(site.name), path: "/about" });
}

const h2 = "text-[clamp(1.5rem,1.2rem+1.2vw,2rem)]";
const list = "mt-5 max-w-[68ch] list-disc space-y-3 ps-5 marker:text-gold-deep";

export default async function AboutPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].aboutPage;
  return (
    <>
      <PageHead lang={lang} crumbs={<Breadcrumbs lang={lang} items={[{ name: t.crumb, path: "/about" }]} />} title={t.h1(site.name)} lead={t.lead(site.name, site.organisation.name)} />

      <div className="wrap max-w-[56rem] py-12 lg:py-16">
        {site.story && (
          <section className="mb-14">
            <h2 className={h2}>{t.storyH}</h2>
            <p className="mt-4 max-w-[68ch] text-lg">{site.story}</p>
          </section>
        )}

        <section>
          <h2 className={h2}>{t.believeH}</h2>
          <blockquote className="mt-5 border-s-4 border-gold bg-white px-6 py-5">
            <p className="font-display text-[1.3rem] leading-snug">{t.hadith}</p>
            <footer className="mt-2 text-sm text-muted">{t.hadithSource}</footer>
          </blockquote>
          <ul className={list}>
            {t.believe.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className={h2}>{t.teachersH}</h2>
          <ol className="mt-5 max-w-[68ch] list-decimal space-y-3 ps-5 marker:font-semibold marker:text-gold-deep">
            {t.teachers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ol>
        </section>

        {site.teachers.length > 0 && (
          <section className="mt-14">
            <h2 className={h2}>{t.meetH}</h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {site.teachers.map((x) => (
                <li key={x.name} className="border-s-2 border-gold ps-5">
                  <h3 className="text-[1.25rem]">{x.name}</h3>
                  <p className="text-muted">{x.role}</p>
                  <p className="mt-2">{x.qualification}</p>
                  <p className="mt-1 text-sm text-muted">{t.teachesIn(x.languages)}</p>
                </li>
              ))}
            </ul>
            <JsonLd
              data={site.teachers.map((x) => ({
                "@context": "https://schema.org",
                "@type": "Person",
                name: x.name,
                jobTitle: x.role,
                description: x.qualification,
                knowsLanguage: x.languages,
                worksFor: { "@id": `${site.url}/#organization` },
                url: abs("/about"),
              }))}
            />
          </section>
        )}

        <section className="mt-14">
          <h2 className={h2}>{t.safeH}</h2>
          <ul className={list}>
            {t.safe.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className={h2}>{t.teachH}</h2>
          <p className="mt-4 max-w-[68ch]">
            {t.teach}{" "}
            <Link href={href(lang, "/courses")} className="link">
              {t.allCourses}
            </Link>
            .
          </p>
        </section>
      </div>

      <PageSchema lang={lang} path="/about" />
      <TrialSection lang={lang} source="about" />
    </>
  );
}
