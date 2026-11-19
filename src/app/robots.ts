import type { MetadataRoute } from "next";
import { SEO_ORIGIN } from "@/lib/seo";

/**
 * Search crawlers and AI crawlers are both welcome on the public pages.
 * Being readable by GPTBot, ClaudeBot, PerplexityBot and Google-Extended is what makes
 * the site eligible to be quoted in AI answers (GEO / AEO).
 */
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Amazonbot", "meta-externalagent"];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/portal", "/teach", "/api", "/free-trial/thank-you", "/ur/free-trial/thank-you", "/ar/free-trial/thank-you"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_BOTS, allow: "/", disallow },
    ],
    sitemap: `${SEO_ORIGIN}/sitemap.xml`,
  };
}
