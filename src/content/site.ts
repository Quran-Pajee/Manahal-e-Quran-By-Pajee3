/**
 * Everything about the academy that appears across the site lives here.
 * Change the name, contact details and offer in this one file.
 *
 * Rule for this file: only put in things that are true for your academy.
 * Empty values are hidden on the site, so nothing fake is ever shown.
 */

export type Review = {
  name: string; // e.g. "Amina K."
  location: string; // e.g. "Houston, USA"
  course: string; // e.g. "Noorani Qaida"
  text: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string; // YYYY-MM-DD
};

export type Teacher = {
  name: string; // e.g. "Ustadha Maryam"
  role: string; // e.g. "Tajweed and Hifz teacher"
  qualification: string; // e.g. "Hafiza, Ijazah in Hafs an Asim, 8 years teaching"
  languages: string; // e.g. "English, Urdu"
};

export const site = {
  // Manahil (مناهل) means springs: the places people come to for water.
  name: "Manahil-e-Quran Academy",
  shortName: "Manahil-e-Quran",
  // Other ways people spell the name when they search. Used in schema only, never shown.
  alternateNames: ["Manahil e Quran", "Minahil e Quran", "Manahil ul Quran Academy", "مناہلِ قرآن اکیڈمی", "أكاديمية مناهل القرآن"],
  // The academy runs on a subdomain of the parent organisation's domain.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://quran.pajee.org").replace(/\/$/, ""),

  // The parent organisation. The logo carries its signature ("by PAJEE"); it is also named in the footer, on the About page and in schema.
  organisation: {
    name: "PAJEE",
    url: "https://pajee.org",
  },
  description:
    "Live one-to-one online Quran classes for kids and adults. Noorani Qaida, Quran reading, Tajweed, Hifz, Tafseer, Arabic and Ijazah with male and female teachers, timed for families in the USA, UK, Canada and Australia.",

  // Contact. Digits only for WhatsApp, with country code (no +, no spaces).
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "923156540714",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "quran.pajee@gmail.com",
  // Optional postal address shown in the footer and in schema.
  address: "",

  social: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },

  // The offer. Used in headlines, forms, FAQs and schema.
  trial: { classes: 3, minutes: 30 },
  classMinutes: 30,
  classApps: "Zoom or Google Meet",
  teachingLanguages: ["English", "Urdu", "Arabic"],
  // How families can pay. Switch a line to false if you do not offer it; set all three to false to hide the question.
  // The details each family sees (payment link, Payoneer, bank account) are entered in the admin panel under Fees.
  paymentMethods: { card: true, payoneer: true, bankTransfer: true },
  checkoutPaymentOptions: ["Stripe (Cards)", "PayPal", "Wise", "Zelle", "Interac"],
  siblingDiscountPercent: 20,

  // About page. Write two or three sentences on who runs the academy, where and since when.
  // Search engines and AI assistants trust sites that say who is behind them, so fill this in before launch.
  story: "",
  // Real teachers only. Add them and a "Meet the teachers" section appears on the About page.
  teachers: [] as Teacher[],

  // Real reviews only. Add them here and the reviews section and star-rating schema switch on by themselves.
  reviews: [] as Review[],

  // Shown as "Last reviewed" on key pages and used in the sitemap.
  lastUpdated: "2026-10-10",
};

export const whatsappLink = (text = "Assalamu alaikum, I would like to book free trial Quran classes.") =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}` : "";

/** The WhatsApp number written for people to read, e.g. "+92 315 6540714". */
export const phoneLabel = () => {
  const n = site.whatsapp;
  if (!n) return "";
  if (n.startsWith("92") && n.length === 12) return `+92 ${n.slice(2, 5)} ${n.slice(5)}`;
  if (n.startsWith("1") && n.length === 11) return `+1 ${n.slice(1, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  if (n.startsWith("44") && n.length === 12) return `+44 ${n.slice(2, 6)} ${n.slice(6)}`;
  return `+${n}`;
};

export const trialLabel = `Book ${site.trial.classes} free trial classes`;
