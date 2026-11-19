import { pageMeta, longDate } from "@/lib/seo";
import { site } from "@/content/site";
import { faqsFor } from "@/content/faqs";
import { faqSchema } from "@/lib/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/Faq";
import { PageHead, TrialSection } from "@/components/Sections";
import { asLang } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].faqPage;
  return pageMeta({ lang, title: t.metaTitle, description: t.metaDescription(site.name), path: "/faq" });
}

export default async function FaqPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang];
  const { groups, all } = faqsFor(lang);
  return (
    <>
      <PageHead lang={lang} crumbs={<Breadcrumbs lang={lang} items={[{ name: t.faqPage.crumb, path: "/faq" }]} />} title={t.faqPage.h1} lead={t.faqPage.lead} />
      <div className="wrap max-w-[56rem] py-12 lg:py-16">
        {groups.map((g) => (
          <section key={g.title} className="mb-12">
            <h2 className="mb-4 text-[1.6rem]">{g.title}</h2>
            <FaqList faqs={g.items} lang={lang} />
          </section>
        ))}
        <p className="text-sm text-muted">{t.common.lastReviewed(longDate(site.lastUpdated, lang))}</p>
      </div>
      <JsonLd data={faqSchema(all)} />
      <PageSchema lang={lang} path="/faq" />
      <TrialSection lang={lang} source="faq" />
    </>
  );
}
