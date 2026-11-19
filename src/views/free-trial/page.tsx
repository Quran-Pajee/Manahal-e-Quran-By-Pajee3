import { pageMeta } from "@/lib/seo";
import { site, whatsappLink } from "@/content/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TrialForm } from "@/components/TrialForm";
import { FaqList } from "@/components/Faq";
import { faqsFor } from "@/content/faqs";
import { asLang } from "@/i18n";
import { ui } from "@/i18n/ui";
import { PageSchema } from "@/components/PageSchema";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang].trialPage;
  return pageMeta({ lang, title: t.metaTitle(site.trial.classes), description: t.metaDescription(site.trial.classes), path: "/free-trial" });
}

/**
 * The booking page. Heading and form come first on every screen: side by side on a laptop,
 * heading then form on a tablet or phone. The explanation and the questions follow underneath.
 */
export default async function FreeTrialPage({ params }: Props) {
  const lang = asLang((await params).lang);
  const t = ui[lang];
  const tp = t.trialPage;
  const wa = whatsappLink();
  return (
    <div className="wrap grid gap-x-12 gap-y-6 py-6 sm:py-10 lg:grid-cols-[1fr_31rem] lg:gap-y-10">
      <div className="lg:col-start-1">
        <Breadcrumbs lang={lang} items={[{ name: tp.crumb, path: "/free-trial" }]} />
        <h1 className="mt-3 text-[clamp(1.85rem,1.3rem+2.8vw,3.1rem)] leading-[1.1]">{tp.h1(site.trial.classes)}</h1>
        <p className="mt-3 max-w-xl text-[1.08rem] text-muted sm:text-[1.17rem]">{tp.short}</p>
      </div>

      <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_18px_50px_rgb(18_61_50/0.1)] sm:p-6">
          <h2 className="sr-only">{tp.formH}</h2>
          <TrialForm lang={lang} source="free-trial" variant="trial" />
        </div>
      </div>

      <div className="lg:col-start-1">
        <p className="max-w-xl text-[1.1rem] leading-relaxed">{tp.lead(site.trial.classes, site.trial.minutes)}</p>

        <h2 className="mt-9 text-[1.5rem]">{tp.afterH}</h2>
        <ol className="mt-5 space-y-5">
          {tp.after.map(([title, d], i) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald font-sans text-lg font-semibold text-gold">{i + 1}</span>
              <span>
                <strong className="block text-[1.1rem] font-semibold">{title}</strong>
                <span className="text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        {wa && (
          <p className="mt-8">
            {tp.talk}{" "}
            <a href={wa} rel="noopener" className="link font-semibold">
              {t.trialSection.chatLink}
            </a>
          </p>
        )}

        <h2 className="mt-12 text-[1.5rem]">{tp.beforeH}</h2>
        <div className="mt-4">
          <FaqList faqs={faqsFor(lang).trial} lang={lang} />
        </div>
      </div>
      <PageSchema lang={lang} path="/free-trial" />
    </div>
  );
}
