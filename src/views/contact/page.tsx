import { pageMeta } from "@/lib/seo";
import { phoneLabel, site, whatsappLink } from "@/content/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TrialForm } from "@/components/TrialForm";
import { asLang } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].contactPage;
  return pageMeta({ lang, title: t.metaTitle(site.name), description: t.metaDescription(site.name), path: "/contact" });
}

export default async function ContactPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang];
  const c = t.contactPage;
  const wa = whatsappLink("Assalamu alaikum, I have a question about your Quran classes.");
  const row = "border-s-2 border-gold ps-5";
  return (
    <div className="wrap grid gap-x-12 gap-y-6 py-6 sm:py-10 lg:grid-cols-[1fr_31rem] lg:gap-y-10">
      <div className="lg:col-start-1">
        <Breadcrumbs lang={lang} items={[{ name: c.crumb, path: "/contact" }]} />
        <h1 className="mt-3 text-[clamp(1.85rem,1.3rem+2.8vw,3.1rem)] leading-[1.1]">{c.h1}</h1>
        <p className="mt-3 max-w-xl text-[1.08rem] leading-relaxed text-muted sm:text-[1.17rem]">{c.lead}</p>
        {wa && (
          <a href={wa} rel="noopener" className="btn btn-primary mt-5 w-full text-[1.05rem] min-[480px]:w-auto">
            {t.trialSection.chatLink}
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_18px_50px_rgb(18_61_50/0.1)] sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <h2 className="mb-4 text-[1.4rem]">{c.formH}</h2>
        <TrialForm lang={lang} source="contact" variant="full" submitLabel={t.form.send} />
      </div>

      <dl className="grid max-w-xl gap-6 lg:col-start-1">
        {wa && (
          <div className={row}>
            <dt className="text-sm text-muted">{t.common.whatsapp}</dt>
            <dd>
              <a href={wa} rel="noopener" className="link text-[1.15rem] font-semibold" dir="ltr">
                {phoneLabel()}
              </a>
            </dd>
          </div>
        )}
        {site.email && (
          <div className={row}>
            <dt className="text-sm text-muted">{c.email}</dt>
            <dd>
              <a href={`mailto:${site.email}`} className="link text-[1.15rem] font-semibold">
                {site.email}
              </a>
            </dd>
          </div>
        )}
        {site.address && (
          <div className={row}>
            <dt className="text-sm text-muted">{c.address}</dt>
            <dd className="text-[1.1rem]">{site.address}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-sm text-muted">{c.whereK}</dt>
          <dd className="text-[1.1rem]">{c.whereV}</dd>
        </div>
      </dl>
      <PageSchema lang={lang} path="/contact" />
    </div>
  );
}
