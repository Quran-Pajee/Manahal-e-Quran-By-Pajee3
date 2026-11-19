import { pageMeta, longDate } from "@/lib/seo";
import { site } from "@/content/site";
import { resolvePageContent } from "@/lib/cms";
import { unstable_cache } from "next/cache";
import { plans, moneyFor, lowest, lowestGroup } from "@/content/pricing";
import { faqsFor } from "@/content/faqs";
import { faqSchema, pricingSchema } from "@/lib/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/Faq";
import { Table } from "@/components/Blocks";
import { PricingTable } from "@/components/PricingTable";
import { PageHead, TrialSection } from "@/components/Sections";
import { asLang } from "@/i18n";
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

export default async function PricingPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang];
  const pp = t.pricingPage;
  const override = await cachedPricingContent(lang);
  const faqs = faqsFor(lang).pricing;

  return (
    <>
      <PageHead
        lang={lang}
        crumbs={<Breadcrumbs lang={lang} items={[{ name: pp.crumb, path: "/pricing" }]} />}
        title={typeof override.h1 === "string" && override.h1.trim() ? override.h1 : pp.h1}
        lead="Choose your monthly 1-on-1 or group class plan, with flexible lessons and 3 free trial classes before enrollment."
      />

      <div className="wrap max-w-[62rem] py-12 lg:py-16">
        <PricingTable lang={lang} minutes={site.classMinutes} />




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
