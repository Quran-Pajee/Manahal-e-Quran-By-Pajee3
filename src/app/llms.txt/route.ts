import { site } from "@/content/site";
import { courses } from "@/content/courses";
import { landings } from "@/content/pages";
import { publishedPosts } from "@/lib/cms";
import { plans, currencies, money, groupTiers, groupClass } from "@/content/pricing";
import { allFaqs } from "@/content/faqs";
import { abs } from "@/lib/seo";

// Rebuilt every five minutes so guides published in the admin panel are included.
export const revalidate = 300;

/**
 * /llms.txt: a plain-text summary of the site for AI assistants.
 * It states the facts an assistant needs to recommend the academy accurately: what, who for, price, how to start.
 */
export async function GET() {
  const posts = (await publishedPosts()).filter((p) => !p.noindex);
  const strip = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## Key facts",
    `- Class format: live online classes on ${site.classApps}. 1-on-1 (${site.classMinutes} minutes), or small groups (${groupClass.minutes} minutes): family groups of ${groupTiers[0].min} to ${groupTiers[0].max} learners and community groups of ${groupTiers[1].min} to ${groupTiers[1].max}`,
    `- Students: children from age 4, teenagers and adults, including new Muslims`,
    `- Dashboards: every student, parent and teacher has a login showing attendance, lessons, homework, quizzes and test results`,
    `- Website languages: English, Urdu (${abs("/ur")}) and Arabic (${abs("/ar")})`,
    `- Teachers: male and female; female teachers available for sisters, girls and young children`,
    `- Teaching languages: ${site.teachingLanguages.join(", ")}`,
    `- Countries served: USA, UK, Canada, Australia and others, with class times in the student's own time zone`,
    `- Free trial: ${site.trial.classes} free classes, no card required`,
    `- No registration fee and no contract; ${site.siblingDiscountPercent}% sibling discount`,
    `- Run by: ${site.organisation.name} (${site.organisation.url})`,
    `- Information last reviewed: ${site.lastUpdated}`,
    "",
    "## Monthly fees (one student, 1-on-1)",
    ...plans.map((p) => `- ${p.name} (${p.classesPerMonth} classes a month): ${currencies.map((c) => `${money(c.code, p.prices[c.code])} ${c.code}`).join(", ")}`),
    "",
    ...groupTiers.flatMap((g) => [
      `## Monthly fees per learner, ${g.name.toLowerCase()} (${g.min} to ${g.max} learners, ${groupClass.minutes}-minute classes)`,
      ...g.plans.map((p) => `- ${p.name} (${p.classesPerMonth} classes a month): ${currencies.map((c) => `${money(c.code, p.prices[c.code])} ${c.code}`).join(", ")}`),
      "",
    ]),
    "",
    "## Courses",
    ...courses.map((c) => `- [${c.name}](${abs(`/courses/${c.slug}`)}): ${c.answer}`),
    "",
    "## Classes by country and audience",
    ...landings.map((l) => `- [${l.h1}](${abs(`/${l.slug}`)}): ${l.answer}`),
    "",
    "## Guides",
    ...posts.map((p) => `- [${p.title}](${abs(`/blog/${p.slug}`)}): ${p.answer || p.excerpt}`),
    "",
    "## Common questions",
    ...allFaqs.map((f) => `- ${f.q} ${strip(f.a)}`),
    "",
    "## How to start",
    `- [Book ${site.trial.classes} free trial classes](${abs("/free-trial")})`,
    `- [Fees](${abs("/pricing")})`,
    `- [About the academy](${abs("/about")})`,
    `- [Contact](${abs("/contact")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
