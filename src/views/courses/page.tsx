import Link from "next/link";
import { pageMeta, absIn } from "@/lib/seo";
import { site } from "@/content/site";
import { coursesFor, pathCourses, sideCourses } from "@/content/courses";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHead, TrialSection } from "@/components/Sections";
import { Table } from "@/components/Blocks";
import { JsonLd } from "@/components/JsonLd";
import { asLang, href } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].coursesPage;
  return pageMeta({ lang, title: t.metaTitle, description: t.metaDescription(coursesFor(lang).length, site.name, site.trial.classes), path: "/courses" });
}

const h2 = "text-[clamp(1.6rem,1.3rem+1.4vw,2.2rem)]";

export default async function CoursesPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].coursesPage;
  const all = coursesFor(lang);
  return (
    <>
      <PageHead lang={lang} crumbs={<Breadcrumbs lang={lang} items={[{ name: t.crumb, path: "/courses" }]} />} title={t.h1} lead={t.lead(site.name, all.length)} />

      <section className="wrap py-14 lg:py-20">
        <h2 className={h2}>{t.pathH}</h2>
        <ol className="mt-8 grid gap-0 border-t border-line">
          {pathCourses(lang).map((c) => (
            <li key={c.slug} className="grid gap-x-8 gap-y-3 border-b border-line py-7 md:grid-cols-[3.5rem_1.1fr_1.5fr_auto] md:items-start">
              <span className="font-sans text-[2.4rem] font-semibold leading-none text-gold-deep">{c.step}</span>
              <div>
                <h3 className="text-[1.45rem]">
                  <Link href={href(lang, `/courses/${c.slug}`)} className="underline-offset-4 hover:underline">
                    {c.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {c.level}. {t.ages(c.ages)}.
                </p>
              </div>
              <p className="text-muted">{c.summary}</p>
              <Link href={href(lang, `/courses/${c.slug}`)} className="btn btn-line min-h-[2.6rem] justify-self-start">
                {t.details}
              </Link>
            </li>
          ))}
        </ol>

        <h2 className={`mt-16 ${h2}`}>{t.alongsideH}</h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {sideCourses(lang).map((c) => (
            <li key={c.slug} className="border-s-2 border-gold ps-5">
              <h3 className="text-[1.3rem]">
                <Link href={href(lang, `/courses/${c.slug}`)} className="underline-offset-4 hover:underline">
                  {c.name}
                </Link>
              </h3>
              <p className="mt-2 text-muted">{c.summary}</p>
              <p className="mt-2 text-sm text-muted">{t.ages(c.ages)}</p>
            </li>
          ))}
        </ul>

        <h2 className={`mt-16 ${h2}`}>{t.compareH}</h2>
        <div className="mt-6">
          <Table
            label={t.compareH}
            head={t.compareHead}
            rows={all.map((c) => [
              <Link key={c.slug} href={href(lang, `/courses/${c.slug}`)} className="link">
                {c.name}
              </Link>,
              c.level,
              c.ages,
              c.duration,
              c.schedule,
            ])}
          />
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${site.name}: ${t.crumb}`,
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: absIn(lang, `/courses/${c.slug}`) })),
        }}
      />
      <PageSchema lang={lang} path="/courses" />
      <TrialSection lang={lang} source="courses" />
    </>
  );
}
