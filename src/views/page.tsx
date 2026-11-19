import Link from "next/link";
import { pageMeta, longDate } from "@/lib/seo";
import { site, whatsappLink } from "@/content/site";
import { pathCourses, sideCourses } from "@/content/courses";
import { landingsFor } from "@/content/pages";
import { faqsFor } from "@/content/faqs";
import { publishedPosts, resolvePageContent } from "@/lib/cms";
import { unstable_cache } from "next/cache";
import { groupClass, lowest, lowestGroup, moneyFor } from "@/content/pricing";
import { faqSchema } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";
import { LessonBoard } from "@/components/LessonBoard";
import { PricingTable } from "@/components/PricingTable";
import { FaqList } from "@/components/Faq";
import { Table } from "@/components/Blocks";
import { Reviews, Ticks, TrialSection } from "@/components/Sections";
import { TrialCard } from "@/components/TrialForm";
import { asLang, href } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

export const revalidate = 3600;
const cachedHomeContent = unstable_cache((lang: "en" | "ur" | "ar") => resolvePageContent("/", lang, { h1: "" }), ["public-home-cms"], { revalidate: 3600, tags: ["cms-home"] });
const cachedPosts = unstable_cache(() => publishedPosts(), ["public-home-posts"], { revalidate: 3600 });

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].home;
  return pageMeta({ lang, title: t.metaTitle(site.name), absoluteTitle: true, description: t.metaDescription(moneyFor(lang)("USD", lowestGroup("USD")), site.trial.classes), path: "/" });
}

const h2 = "text-[clamp(2rem,1.45rem+2.2vw,3rem)]";
const band = "wrap py-16 lg:py-24";
const whoPaths = ["/online-quran-classes-for-kids", "/online-quran-classes-for-adults", "/female-quran-teacher-online", "/group-quran-classes"];

/**
 * Home page. The order follows what a parent wants to know, one question at a time:
 * what is this and can I try it (hero + form) → what happens next (three steps) → what will my child learn (courses)
 * → is it for us (who) → what does a class look like (lesson) → what does it cost (fees) → my country → questions → book.
 */
export default async function Home({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang];
  const override = await cachedHomeContent(lang);
  const h = t.home;
  const heroTitle = typeof override.h1 === "string" && override.h1.trim() ? override.h1 : "1-on-1 Online Quran Classes for Kids & Adults – Certified Tutors";
  const faqs = faqsFor(lang).home;
  const countries = landingsFor(lang).filter((l) => l.kind === "country");
  const wa = whatsappLink();
  const steps = t.trialSection.steps(site.trial.classes, site.trial.minutes);
  const money = moneyFor(lang);
  // The three complete guides lead the list; anything published from the dashboard since then follows.
  const all = lang === "en" ? await cachedPosts() : [];
  const guides = [...all.filter((p) => p.kind === "pillar"), ...all.filter((p) => p.kind !== "pillar")].slice(0, 3);

  return (
    <>
      {/* Hero: the promise on one side, the free-trial form inside the mihrab arch on the other */}
      <section className="border-b border-line">
        <div className="wrap grid items-start gap-x-14 gap-y-10 py-7 sm:py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-10">
          <div className="lg:pt-6">
            <h1 className="text-[clamp(2.05rem,1.4rem+3.2vw,3.5rem)] leading-[1.05]">{heroTitle}</h1>
            <div className="gold-rule mt-5 lg:mt-7" aria-hidden="true">
              <span />
            </div>
            <p className="mt-5 max-w-xl text-[1.08rem] leading-relaxed sm:text-[1.13rem] lg:mt-7">{h.sub(site.name, site.trial.classes)}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-8">
              <Link href={href(lang, "/free-trial")} className="btn btn-primary text-[1.05rem]">Book 3 Free Trial Classes</Link>
              {wa && <a href={wa} className="btn btn-line text-[1.05rem]" rel="noopener noreferrer">WhatsApp (+92 315 6540714)</a>}
            </div>
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
              {h.facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="font-semibold leading-snug text-emerald">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <TrialCard lang={lang} source="home-hero" />
        </div>
      </section>

      <section aria-label="Why families choose us" className="border-b border-line bg-white">
        <ul className="wrap grid gap-4 py-5 text-center text-sm font-semibold text-emerald sm:grid-cols-2 lg:grid-cols-4">
          {["4.9/5 Parent Rating", "Ijazah & Al-Azhar Certified Tutors", "DBS-Checked Male & Female Teachers", "No Credit Card Needed"].map((item) => <li key={item} className="rounded-lg bg-wash px-3 py-3">{item}</li>)}
        </ul>
      </section>

      {/* What happens after the form: three steps */}
      <section className="border-b border-line bg-white" aria-label={t.trialSection.heading(site.trial.classes)}>
        <ol className="wrap grid gap-x-10 gap-y-6 py-9 md:grid-cols-3">
          {steps.map(([title, d], i) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold font-display text-[1.35rem] font-semibold leading-none text-gold-deep" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong className="block font-semibold text-emerald">{title}</strong>
                <span className="text-[0.97rem] text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Learning path */}
      <section aria-labelledby="path-heading">
        <div className={band}>
          <div className="max-w-3xl">
            <h2 id="path-heading" className={h2}>
              {h.pathH}
            </h2>
            <p className="mt-4 text-lg text-muted">{h.pathSub}</p>
          </div>

          <ol className="mt-12 grid gap-y-8 lg:grid-cols-5 lg:gap-x-0">
            {pathCourses(lang).map((c) => (
              <li key={c.slug} className="group relative ps-14 lg:pe-6 lg:ps-0">
                {/* connecting line: vertical on phones, horizontal on desktop */}
                <span aria-hidden="true" className="absolute start-[1.2rem] top-11 h-[calc(100%-0.6rem)] w-px bg-gold/60 group-last:hidden lg:start-12 lg:top-5 lg:h-px lg:w-[calc(100%-3.5rem)]" />
                <span className="absolute start-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-emerald font-display text-[1.35rem] font-semibold leading-none text-gold lg:static" aria-hidden="true">
                  {c.step}
                </span>
                <h3 className="text-[1.5rem] lg:mt-5">
                  <Link href={href(lang, `/courses/${c.slug}`)} className="underline-offset-4 hover:underline">
                    {c.name}
                  </Link>
                </h3>
                <p className="mt-2 text-[0.98rem] text-muted">{c.summary}</p>
                <p className="mt-3 text-sm font-medium text-emerald">{c.ages}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 border-t border-line pt-8">
            <p className="font-semibold text-muted">{h.alongside}</p>
            <ul className="mt-4 grid gap-6 md:grid-cols-3">
              {sideCourses(lang).map((c) => (
                <li key={c.slug}>
                  <h3 className="text-[1.4rem]">
                    <Link href={href(lang, `/courses/${c.slug}`)} className="underline-offset-4 hover:underline">
                      {c.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-[0.98rem] text-muted">{c.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section className="border-y border-line bg-white" aria-labelledby="who-heading">
        <div className={`${band} grid gap-10 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <h2 id="who-heading" className={h2}>
              {h.whoH}
            </h2>
            <p className="mt-4 text-lg text-muted">{h.whoSub}</p>
          </div>
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {h.who.map((w, i) => (
              <li key={w.t} className="border-t border-gold pt-5">
                <h3 className="text-[1.55rem]">{w.t}</h3>
                <p className="mt-2 text-muted">{w.d}</p>
                <Link href={href(lang, whoPaths[i])} className="link mt-3 inline-block font-semibold">
                  {w.link}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How a class works: the one emerald section in the middle of the page, with the marked-up lesson */}
      <section className="on-emerald lattice bg-emerald text-white" aria-labelledby="how-heading">
        <div className={`${band} grid items-center gap-x-14 gap-y-12 lg:grid-cols-[0.9fr_1.1fr]`}>
          <LessonBoard lang={lang} />
          <div>
            <h2 id="how-heading" className={h2}>
              {h.howH}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/80">{h.howSub(site.classApps)}</p>
            <ol className="mt-9 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {h.how.map(([title, d], i) => (
                <li key={title} className="border-t border-white/20 pt-4">
                  <span className="font-display text-[1.9rem] font-semibold leading-none text-gold" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="mt-1.5 text-[1.4rem]">{title}</h3>
                  <p className="mt-1.5 text-white/75">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Fees */}
      <section aria-labelledby="fees-heading">
        <div className={`${band} grid gap-10 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <h2 id="fees-heading" className={h2}>
              {h.feesH}
            </h2>
            <div className="mt-6 text-muted">
              <Ticks items={t.plan.notes(site.classMinutes, site.trial.classes, site.siblingDiscountPercent).slice(0, 3).concat(t.plan.groupNotes(groupClass.minutes, site.trial.classes).slice(0, 1))} />
            </div>
            <Link href={href(lang, "/pricing")} className="link mt-6 inline-block font-semibold">
              {h.feesLink}
            </Link>
          </div>
          <PricingTable lang={lang} minutes={site.classMinutes} />
        </div>
      </section>

      {/* The choice most parents are weighing up */}
      <section className="border-t border-line" aria-labelledby="compare-heading">
        <div className={band}>
          <div className="max-w-3xl">
            <h2 id="compare-heading" className={h2}>
              {h.compareH}
            </h2>
            <p className="mt-4 text-lg text-muted">{h.compareSub}</p>
          </div>
          <div className="mt-8">
            <Table label={h.compareH} head={h.compareHead} rows={h.compareRows(money("USD", lowest("USD")), money("USD", lowestGroup("USD")))} />
          </div>
          {lang === "en" && (
            <Link href="/blog/online-quran-classes-vs-madrasah" className="link mt-5 inline-block font-semibold">
              {h.compareMore}
            </Link>
          )}
        </div>
      </section>

      {/* Countries */}
      <section className="border-y border-line bg-white" aria-labelledby="countries-heading">
        <div className={band}>
          <div className="max-w-3xl">
            <h2 id="countries-heading" className={h2}>
              {h.countriesH}
            </h2>
            <p className="mt-4 text-lg text-muted">{h.countriesSub}</p>
          </div>
          <div className="mt-8">
            <Table
              label={h.countriesH}
              head={h.countriesHead}
              rows={countries.map((l) => [
                <Link key={l.slug} href={href(lang, `/${l.slug}`)} className="link font-semibold">
                  {h.classesIn(l.country!.name)}
                </Link>,
                l.facts[1].value,
                moneyFor(lang)(l.country!.currency, lowest(l.country!.currency)),
              ])}
            />
          </div>
          <p className="mt-4 text-muted">{h.elsewhere}</p>
        </div>
      </section>

      <Reviews lang={lang} />

      {/* FAQ */}
      <section aria-labelledby="faq-heading">
        <div className={`${band} grid gap-10 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <h2 id="faq-heading" className={h2}>
              {h.faqH}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {h.faqMore}{" "}
              <Link href={href(lang, "/faq")} className="link">
                {h.faqLink}
              </Link>
              .
            </p>
          </div>
          <FaqList faqs={faqs} lang={lang} />
        </div>
        <JsonLd data={faqSchema(faqs)} />
      </section>

      {/* Guides are written in English, so this section appears on the English site only */}
      {guides.length > 0 && (
        <section className="border-t border-line bg-white" aria-labelledby="guides-heading">
          <div className={band}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="guides-heading" className={h2}>
                {h.guidesH}
              </h2>
              <Link href="/blog" className="link font-semibold">
                {h.guidesAll}
              </Link>
            </div>
            <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
              {guides.map((p) => (
                <li key={p.slug} className="border-t border-gold pt-5">
                  <h3 className="text-[1.5rem]">
                    <Link href={`/blog/${p.slug}`} className="underline-offset-4 hover:underline">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-muted">{p.excerpt}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm text-muted">{t.common.lastReviewed(longDate(site.lastUpdated, lang))}</p>
          </div>
        </section>
      )}

      <PageSchema lang={lang} path="/" />
      <section className="on-emerald bg-emerald py-14 text-center text-white">
        <div className="wrap">
          <h2 className="text-[clamp(1.8rem,1.3rem+2vw,2.8rem)]">Start learning the Quran with a teacher who fits your family</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">Try three live one-to-one lessons before choosing a monthly plan. No credit card required.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={href(lang, "/free-trial")} className="btn btn-primary">Book 3 Free Trial Classes</Link>
            {wa && <a href={wa} rel="noopener noreferrer" className="btn btn-line border-white text-white">WhatsApp (+92 315 6540714)</a>}
          </div>
        </div>
      </section>
    </>
  );
}
