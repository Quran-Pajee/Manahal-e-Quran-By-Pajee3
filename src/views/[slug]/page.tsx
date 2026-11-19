import { notFound } from "next/navigation";
import { pageMeta, absIn, longDate } from "@/lib/seo";
import { site } from "@/content/site";
import { landings, getLanding, countryLandings } from "@/content/pages";
import { legals, getLegal } from "@/content/legal";
import { faqSchema, landingSchema } from "@/lib/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Blocks, slugify } from "@/components/Blocks";
import { FaqList } from "@/components/Faq";
import { TrialCard } from "@/components/TrialForm";
import { Facts, HeroCta, PageHead, SideNav, TrialSection } from "@/components/Sections";
import { trialHref } from "@/lib/trial-link";
import { asLang } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

/**
 * One route for every top-level content page:
 * country pages, audience pages (kids, adults, female teachers, group classes) in every language,
 * and the policy pages in English.
 */
export function generateStaticParams({ params }: { params: { lang: string } }) {
  const slugs = landings.map((p) => ({ slug: p.slug }));
  return params.lang === "en" ? [...slugs, ...legals.map((p) => ({ slug: p.slug }))] : slugs;
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await params;
  const lang = asLang(p.lang);
  const l = getLanding(p.slug, lang);
  if (l) {
    // Country pages are regional versions of the same offer, so they point at each other and at their Urdu and Arabic versions.
    const languages = l.country
      ? { ...Object.fromEntries(countryLandings.map((c) => [c.country!.hreflang, absIn("en", `/${c.slug}`)])), ur: absIn("ur", `/${l.slug}`), ar: absIn("ar", `/${l.slug}`) }
      : undefined;
    return pageMeta({ lang, title: l.metaTitle, description: l.metaDescription, path: `/${l.slug}`, languages });
  }
  const legal = lang === "en" ? getLegal(p.slug) : undefined;
  if (legal) return pageMeta({ title: legal.title, description: legal.description, path: `/${legal.slug}`, translated: false });
  return {};
}

export default async function TopLevelPage({ params }: Props) {
  const p = await params;
  const lang = asLang(p.lang);
  const t = ui[lang];
  const l = getLanding(p.slug, lang);

  if (!l) {
    const legal = lang === "en" ? getLegal(p.slug) : undefined;
    if (!legal) notFound();
    return (
      <>
        <PageHead crumbs={<Breadcrumbs lang={lang} items={[{ name: legal.title, path: `/${legal.slug}` }]} />} title={legal.title} />
        <div className="wrap max-w-[52rem] py-12 lg:py-16">
          <Blocks blocks={legal.blocks} />
        </div>
        <PageSchema lang="en" path={`/${legal.slug}`} />
      </>
    );
  }

  const source = `landing:${l.slug}`;
  const defaults = { defaultCountry: l.country?.formCountry, defaultCourse: l.formCourse, defaultStudent: l.formStudent, defaultTeacher: l.formTeacher, defaultClassType: l.formClassType };
  const heads = l.blocks.filter((b) => b.type === "h2").map((b) => (b as { text: string }).text);

  return (
    <>
      <div className="on-emerald lattice bg-emerald text-white">
        <div className="wrap grid gap-10 py-7 sm:py-10 lg:grid-cols-[1fr_29rem] lg:items-start">
          <div className="lg:pt-4">
            <Breadcrumbs light lang={lang} items={[{ name: l.kind === "country" ? t.footer.classesIn(l.nav) : l.nav, path: `/${l.slug}` }]} />
            <h1 className="mt-4 text-[clamp(1.95rem,1.3rem+3vw,3.3rem)] leading-[1.08]">{l.h1}</h1>
            {/* Below desktop width the form sits further down, so the button comes straight after the heading and opens the form's own page. */}
            <HeroCta light lang={lang} to={trialHref(lang, defaults)} className="mt-5 lg:hidden" />
            <p className="mt-5 max-w-2xl text-[1.08rem] leading-relaxed text-white/85 sm:text-[1.17rem] lg:mt-6">{l.answer}</p>
            <div className="mt-8 max-w-2xl">
              <Facts light items={l.facts} />
            </div>
          </div>
          <TrialCard lang={lang} source={source} {...defaults} />
        </div>
      </div>

      <div className="wrap grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:py-16">
        <article className="max-w-[56rem] [&_.prose-q>h2:first-child]:mt-0">
          <Blocks blocks={l.blocks} lang={lang} />

          <section className="mt-14">
            <h2 id="questions" className="text-[clamp(1.5rem,1.2rem+1.2vw,1.95rem)]">
              {l.country ? t.landing.questionsCountry(l.country.name) : t.landing.questions}
            </h2>
            <div className="mt-5">
              <FaqList faqs={l.faqs} lang={lang} />
            </div>
          </section>
          <p className="mt-10 text-sm text-muted">{t.common.lastReviewed(longDate(site.lastUpdated, lang))}</p>
        </article>
        <SideNav lang={lang} items={[...heads.map((h) => ({ id: slugify(h), label: h })), { id: "questions", label: t.common.questions }]} />
      </div>

      <JsonLd data={[landingSchema(l, lang), faqSchema(l.faqs)]} />
      <PageSchema lang={lang} path={`/${l.slug}`} />
      <TrialSection lang={lang} source={source} {...defaults} />
    </>
  );
}

