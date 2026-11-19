import { site } from "@/content/site";
import { plans, lowest, highest, groupTiers, groupClass, SIBLING_DISCOUNT_PERCENT } from "@/content/pricing";
import type { Course } from "@/content/courses";
import type { Landing } from "@/content/pages";
import type { Post } from "@/content/blog";
import type { Faq, Currency } from "@/content/types";
import { abs, absIn } from "./seo";
import type { Lang } from "@/i18n";

/** Structured data (JSON-LD). Helps Google rich results and gives AI engines clean, citable facts. */

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;
const stripLinks = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const sameAs = Object.values(site.social).filter(Boolean);

const rating = () => {
  if (!site.reviews.length) return {};
  const avg = site.reviews.reduce((s, r) => s + r.rating, 0) / site.reviews.length;
  return {
    aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: site.reviews.length, bestRating: 5 },
    review: site.reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
  };
};

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": ORG_ID,
  name: site.name,
  alternateName: site.alternateNames,
  url: site.url,
  logo: abs("/brand/manahil-icon.png"),
  description: site.description,
  parentOrganization: { "@type": "Organization", name: site.organisation.name, url: site.organisation.url },
  areaServed: ["US", "GB", "AU", "CA"].map((c) => ({ "@type": "Country", name: c })),
  knowsAbout: ["Quran recitation", "Tajweed", "Hifz (Quran memorization)", "Noorani Qaida", "Quranic Arabic", "Tafseer", "Ijazah"],
  knowsLanguage: site.teachingLanguages,
  ...(sameAs.length ? { sameAs } : {}),
  ...(site.email || site.whatsapp
    ? {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "admissions",
          ...(site.email ? { email: site.email } : {}),
          ...(site.whatsapp ? { telephone: `+${site.whatsapp}` } : {}),
          availableLanguage: site.teachingLanguages,
        },
      }
    : {}),
  ...(site.address ? { address: site.address } : {}),
  ...rating(),
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE_ID,
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: ["en", "ur", "ar"],
  publisher: { "@id": ORG_ID },
});

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});

export const faqSchema = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: stripLinks(f.a) } })),
});

const offer = (currency: Currency) => ({
  "@type": "AggregateOffer",
  priceCurrency: currency,
  lowPrice: lowest(currency),
  highPrice: highest(currency),
  offerCount: plans.length,
  category: "Paid",
  description: `Monthly one-to-one fees; the second child receives ${SIBLING_DISCOUNT_PERCENT}% off their own one-to-one plan.`,
  url: abs("/pricing"),
});

export const courseSchema = (c: Course, lang: Lang = "en") => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": `${absIn(lang, `/courses/${c.slug}`)}#course`,
  name: c.h1,
  description: c.answer,
  url: absIn(lang, `/courses/${c.slug}`),
  provider: { "@id": ORG_ID, "@type": "EducationalOrganization", name: site.name, url: site.url },
  inLanguage: lang,
  educationalLevel: c.level,
  teaches: c.syllabus.map((s) => s.title),
  coursePrerequisites: c.before,
  typicalAgeRange: c.ages,
  availableLanguage: site.teachingLanguages,
  offers: offer("USD"),
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "Online",
    courseWorkload: "PT1H30M",
    instructor: { "@type": "Organization", name: `${site.name} teachers` },
  },
});

export const landingSchema = (l: Landing, lang: Lang = "en") => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${absIn(lang, `/${l.slug}`)}#service`,
  name: l.h1,
  serviceType: "Online Quran classes",
  description: l.answer,
  url: absIn(lang, `/${l.slug}`),
  provider: { "@id": ORG_ID },
  areaServed: l.country
    ? { "@type": "Country", name: l.country.code }
    : ["US", "GB", "AU", "CA"].map((c) => ({ "@type": "Country", name: c })),
  offers: offer(l.country?.currency ?? "USD"),
});

export const articleSchema = (p: Post) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: p.title,
  description: p.description,
  datePublished: p.date,
  dateModified: p.updated,
  mainEntityOfPage: abs(`/blog/${p.slug}`),
  url: abs(`/blog/${p.slug}`),
  image: abs("/opengraph-image"),
  author: { "@id": ORG_ID, "@type": "Organization", name: site.name, url: abs("/about") },
  publisher: { "@id": ORG_ID },
  inLanguage: "en",
});

/** Schema for a guide written in the dashboard. `kind` links pillar pages and their cluster pages to each other. */
export const guideSchema = (
  p: { slug: string; title: string; excerpt: string; seoDescription: string; createdAt: string; updatedAt: string; publishedAt: string | null; schemaType: string; ogImage: string; body: string },
  pillar: { slug: string; title: string } | null,
  clusters: { slug: string; title: string }[],
  isPillar: boolean,
) => ({
  "@context": "https://schema.org",
  "@type": p.schemaType === "Article" ? "Article" : "BlogPosting",
  "@id": `${abs(`/blog/${p.slug}`)}#article`,
  headline: p.title,
  description: p.seoDescription || p.excerpt,
  datePublished: (p.publishedAt ?? p.createdAt).slice(0, 10),
  dateModified: p.updatedAt.slice(0, 10),
  mainEntityOfPage: abs(`/blog/${p.slug}`),
  url: abs(`/blog/${p.slug}`),
  image: p.ogImage || abs("/opengraph-image"),
  author: { "@id": ORG_ID, "@type": "Organization", name: site.name, url: abs("/about") },
  publisher: { "@id": ORG_ID },
  inLanguage: "en",
  ...(isPillar && clusters.length ? { hasPart: clusters.map((c) => ({ "@type": "Article", headline: c.title, url: abs(`/blog/${c.slug}`) })) } : {}),
  ...(!isPillar && pillar ? { isPartOf: { "@type": "Article", headline: pillar.title, url: abs(`/blog/${pillar.slug}`) } } : {}),
});

/** HowTo schema built from the numbered lists and headings of a guide. */
export const howToSchema = (p: { slug: string; title: string; excerpt: string }, steps: string[]) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: p.title,
  description: p.excerpt,
  url: abs(`/blog/${p.slug}`),
  step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*+/g, "") })),
});

export const pricingSchema = () => ({
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: `${site.name} monthly fees`,
  description: `Second child: ${SIBLING_DISCOUNT_PERCENT}% off one-to-one monthly fees. Group fees are per learner with no additional sibling discount.`,
  url: abs("/pricing"),
  itemListElement: [
    ...plans.map((p) => ({
      "@type": "Offer",
      name: `One-to-one, ${p.name}, ${site.classMinutes}-minute classes`,
      price: p.prices.USD,
      priceCurrency: "USD",
      eligibleQuantity: { "@type": "QuantitativeValue", value: p.classesPerMonth, unitText: "classes per month" },
      seller: { "@id": ORG_ID },
    })),
    ...groupTiers.flatMap((g) =>
      g.plans.map((p) => ({
        "@type": "Offer",
        name: `${g.name} (${g.min} to ${g.max} learners), ${p.name}, ${groupClass.minutes}-minute classes, per learner`,
        price: p.prices.USD,
        priceCurrency: "USD",
        eligibleQuantity: { "@type": "QuantitativeValue", value: p.classesPerMonth, unitText: "classes per month" },
        seller: { "@id": ORG_ID },
      })),
    ),
  ],
});
