import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta, longDate } from "@/lib/seo";
import { site } from "@/content/site";
import { courses, coursesFor, getCourse } from "@/content/courses";
import { plans, moneyFor } from "@/content/pricing";
import { courseSchema, faqSchema } from "@/lib/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/Faq";
import { Table } from "@/components/Blocks";
import { TrialCard } from "@/components/TrialForm";
import { HeroCta, SideNav, TrialSection } from "@/components/Sections";
import { trialHref } from "@/lib/trial-link";
import { asLang, href } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

export const generateStaticParams = () => courses.map((c) => ({ slug: c.slug }));

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await params;
  const lang = asLang(p.lang);
  const c = getCourse(p.slug, lang);
  if (!c) return {};
  return pageMeta({ lang, title: c.metaTitle, description: c.metaDescription, path: `/courses/${c.slug}` });
}

const h2 = "text-[clamp(1.5rem,1.2rem+1.2vw,2rem)]";
const dot = <span aria-hidden="true" className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" />;

export default async function CoursePage({ params }: Props) {
  const p = await params;
  const lang = asLang(p.lang);
  const t = ui[lang];
  const cp = t.coursePage;
  const c = getCourse(p.slug, lang);
  if (!c) notFound();
  const en = getCourse(p.slug)!; // English name is what gets saved with the lead
  const next = c.next ? getCourse(c.next, lang) : undefined;
  const others = coursesFor(lang)
    .filter((x) => x.slug !== c.slug && x.slug !== c.next)
    .slice(0, 3);
  const facts = [c.ages, c.level, c.duration, `${c.schedule}`];

  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="wrap grid gap-10 py-7 sm:py-10 lg:grid-cols-[1fr_29rem] lg:items-start">
          <div className="lg:pt-4">
            <Breadcrumbs
              lang={lang}
              items={[
                { name: t.coursesPage.crumb, path: "/courses" },
                { name: c.name, path: `/courses/${c.slug}` },
              ]}
            />
            <h1 className="mt-3 text-[clamp(1.9rem,1.3rem+2.8vw,3.1rem)] leading-[1.1]">{c.h1}</h1>
            <HeroCta lang={lang} to={trialHref(lang, { defaultCourse: en.name })} className="mt-5 lg:hidden" />
            <p className="mt-5 max-w-2xl text-[1.08rem] leading-relaxed text-muted sm:text-[1.17rem]">{c.answer}</p>

            <dl className="mt-8 grid max-w-2xl gap-x-8 gap-y-4 sm:grid-cols-2">
              {cp.facts.map((k, i) => (
                <div key={k} className="border-s-2 border-gold ps-4">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="font-semibold leading-snug">{facts[i]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <TrialCard lang={lang} source={`course:${c.slug}`} defaultCourse={en.name} />
        </div>
      </div>

      <div className="wrap grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:py-20">
        <article className="max-w-[56rem]">
          <section>
            <h2 id="who" className={h2}>
              {cp.whoH}
            </h2>
            <ul className="mt-5 grid gap-3">
              {c.forWho.map((f) => (
                <li key={f} className="flex gap-3">
                  {dot}
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-5">
                <h3 className="font-sans text-sm font-semibold tracking-normal text-muted">{cp.before}</h3>
                <p className="mt-1.5">{c.before}</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-5">
                <h3 className="font-sans text-sm font-semibold tracking-normal text-muted">{cp.after}</h3>
                <p className="mt-1.5">{c.after}</p>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <h2 id="syllabus" className={h2}>
              {cp.syllabusH}
            </h2>
            <ol className="mt-6 border-t border-line">
              {c.syllabus.map((s, i) => (
                <li key={s.title} className="grid gap-x-6 gap-y-1 border-b border-line py-5 md:grid-cols-[2.5rem_1fr_1.4fr]">
                  <span className="font-sans text-xl font-semibold text-gold-deep">{i + 1}</span>
                  <h3 className="font-sans text-[1.08rem] font-semibold tracking-normal">{s.title}</h3>
                  <p className="text-muted">{s.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-14">
            <h2 id="method" className={h2}>
              {cp.methodH}
            </h2>
            <ul className="mt-5 grid gap-3">
              {c.howTaught.map((f) => (
                <li key={f} className="flex gap-3">
                  {dot}
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 id="fees" className={h2}>
              {cp.feesH(c.name)}
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              {cp.feesSub(site.classMinutes, site.trial.classes)}{" "}
              <Link href={href(lang, "/pricing")} className="link">
                {cp.feesLink}
              </Link>
              .
            </p>
            <div className="mt-5">
              <Table
                label={cp.feesH(c.name)}
                head={[cp.feesHead, t.countries.US, t.countries.GB, t.countries.AU, t.countries.CA]}
                rows={plans.map((pl) => [t.plan.perWeek(pl.perWeek), moneyFor(lang)("USD", pl.prices.USD), moneyFor(lang)("GBP", pl.prices.GBP), moneyFor(lang)("AUD", pl.prices.AUD), moneyFor(lang)("CAD", pl.prices.CAD)])}
              />
            </div>
          </section>

          <section className="mt-14">
            <h2 id="questions" className={h2}>
              {cp.questionsH(c.name)}
            </h2>
            <div className="mt-5">
              <FaqList faqs={c.faqs} lang={lang} />
            </div>
          </section>

          <section className="mt-14">
            {next && (
              <>
                <h2 className={h2}>{cp.nextH}</h2>
                <p className="mb-12 mt-4 max-w-2xl border-s-2 border-gold ps-5">
                  <Link href={href(lang, `/courses/${next.slug}`)} className="font-display text-[1.2rem] font-semibold underline-offset-4 hover:underline">
                    {next.name}
                  </Link>
                  <span className="mt-1 block text-muted">{next.summary}</span>
                </p>
              </>
            )}
            <h2 className={h2}>{cp.othersH}</h2>
            <ul className="mt-5 grid gap-6 md:grid-cols-3">
              {others.map((x) => (
                <li key={x.slug} className="border-s-2 border-gold ps-5">
                  <Link href={href(lang, `/courses/${x.slug}`)} className="font-display text-[1.2rem] font-semibold underline-offset-4 hover:underline">
                    {x.name}
                  </Link>
                  <p className="mt-1 text-muted">{x.summary}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm text-muted">{t.common.lastReviewed(longDate(site.lastUpdated, lang))}</p>
          </section>
        </article>
        <SideNav
          lang={lang}
          items={[
            { id: "who", label: cp.whoH },
            { id: "syllabus", label: cp.syllabusH },
            { id: "method", label: cp.methodNav },
            { id: "fees", label: cp.feesNav },
            { id: "questions", label: t.common.questions },
          ]}
        />
      </div>

      <JsonLd data={[courseSchema(c, lang), faqSchema(c.faqs)]} />
      <PageSchema lang={lang} path={`/courses/${c.slug}`} />
      <TrialSection lang={lang} source={`course:${c.slug}`} defaultCourse={en.name} />
    </>
  );
}
