import Link from "next/link";
import { pageMeta, longDate } from "@/lib/seo";
import { site } from "@/content/site";
import { resolvePageContent } from "@/lib/cms";
import { unstable_cache } from "next/cache";
import { plans, moneyFor, lowest, lowestGroup, currencies, perClass, groupTiers, groupClass } from "@/content/pricing";
import { faqsFor } from "@/content/faqs";
import { faqSchema, pricingSchema } from "@/lib/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/Faq";
import { Table } from "@/components/Blocks";
import { PricingTable } from "@/components/PricingTable";
import { PageHead, Ticks, TrialSection } from "@/components/Sections";
import { asLang, href } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

export const revalidate = 3600;
const cachedPricingContent = unstable_cache((lang: "en" | "ur" | "ar") => resolvePageContent("/pricing", lang, {}), ["public-pricing-cms"], { revalidate: 3600, tags: ["cms-pricing"] });

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].pricingPage;
  return pageMeta({
    lang,
    title: t.metaTitle,
    description: t.metaDescription(moneyFor(lang)("USD", lowest("USD")), moneyFor(lang)("GBP", lowest("GBP")), moneyFor(lang)("AUD", lowest("AUD")), moneyFor(lang)("CAD", lowest("CAD")), moneyFor(lang)("USD", lowestGroup("USD")), site.trial.classes),
    path: "/pricing",
  });
}

const h2 = "text-[clamp(1.5rem,1.2rem+1.2vw,2rem)]";
const code = { USD: "US", GBP: "GB", AUD: "AU", CAD: "CA" } as const;

export default async function PricingPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang];
  const pp = t.pricingPage;
  const override = await cachedPricingContent(lang);
  const faqs = faqsFor(lang).pricing;
  const countryHead = currencies.map((c) => `${t.countries[code[c.code]]} (${c.code})`);

  return (
    <>
      <PageHead
        lang={lang}
        crumbs={<Breadcrumbs lang={lang} items={[{ name: pp.crumb, path: "/pricing" }]} />}
        title={typeof override.h1 === "string" && override.h1.trim() ? override.h1 : pp.h1}
        lead={pp.lead(site.name, moneyFor(lang)("USD", plans[0].prices.USD), moneyFor(lang)("USD", plans[1].prices.USD), moneyFor(lang)("USD", plans[2].prices.USD), site.classMinutes, moneyFor(lang)("USD", lowestGroup("USD")), site.trial.classes)}
      />

      <div className="wrap max-w-[62rem] py-12 lg:py-16">
        <p className="mb-5 text-lg font-semibold text-emerald">One-to-one classes from $25 / £18 / C$33 / A$35 per month</p>
        <PricingTable lang={lang} minutes={site.classMinutes} />
        <div className="mt-7 rounded-xl border border-gold bg-wash p-5">
          <p className="font-semibold text-emerald">20% Sibling Discount for 2nd Child</p>
          <p className="mt-2 text-sm text-muted">Available on the second child’s one-to-one monthly plan.</p>
          <p className="mt-3 text-sm"><strong>Payment options:</strong> Stripe (Cards), PayPal, Wise, Zelle, and Interac.</p>
        </div>

        <section className="mt-14">
          <h2 className={h2}>{pp.includesH}</h2>
          <div className="mt-5">
            <Ticks items={t.plan.notes(site.classMinutes, site.trial.classes, site.siblingDiscountPercent)} />
          </div>
        </section>

        <section className="mt-14">
          <h2 id="group" className={h2}>
            {pp.groupH}
          </h2>
          <p className="mt-3 text-muted">{pp.groupSub(groupClass.minutes)}</p>
          {groupTiers.map((g) => (
            <div key={g.kind} className="mt-6">
              <Table
                caption={`${t.classTypes[g.kind]}: ${t.plan.groupSize(g.min, g.max)}. ${t.plan.tierWho[g.kind]}.`}
                head={[pp.planHead, ...countryHead]}
                rows={g.plans.map((p) => [t.plan.perWeek(p.perWeek), ...currencies.map((c) => moneyFor(lang)(c.code, p.prices[c.code]))])}
              />
            </div>
          ))}
          <h3 className="mt-8 text-[1.25rem]">{pp.groupNotesH}</h3>
          <div className="mt-4">
            <Ticks items={t.plan.groupNotes(groupClass.minutes, site.trial.classes)} />
          </div>
          <Link href={href(lang, "/group-quran-classes")} className="link mt-5 inline-block font-semibold">
            {pp.groupLink}
          </Link>
        </section>

        <section className="mt-14">
          <h2 className={h2}>{pp.allH}</h2>
          <p className="mt-3 text-muted">{pp.allSub(site.classMinutes)}</p>
          <div className="mt-5">
            <Table
              label={pp.allH}
              head={[pp.planHead, ...countryHead]}
              rows={plans.map((p) => [t.plan.perWeek(p.perWeek), ...currencies.map((c) => `${moneyFor(lang)(c.code, p.prices[c.code])} (${moneyFor(lang)(c.code, Math.round(perClass(p, c.code) * 100) / 100)})`)])}
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className={h2}>{pp.whichH}</h2>
          <div className="mt-5">
            <Table label={pp.whichH} head={pp.whichHead} rows={pp.which} />
          </div>
          <p className="mt-4 text-muted">{pp.whichNote}</p>
        </section>

        <section className="mt-14">
          <h2 className={h2}>{pp.faqH}</h2>
          <div className="mt-5">
            <FaqList faqs={faqs} lang={lang} />
          </div>
          <p className="mt-10 text-sm text-muted">{pp.reviewed(longDate(site.lastUpdated, lang))}</p>
        </section>
      </div>

      <JsonLd data={[pricingSchema(), faqSchema(faqs)]} />
      <PageSchema lang={lang} path="/pricing" />
      <TrialSection lang={lang} source="pricing" />
    </>
  );
}
