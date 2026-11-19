import type { Block } from "@/content/types";

/**
 * The small set of Markdown the content editor understands:
 *
 *   ## Heading            ### Smaller heading
 *   Plain paragraphs, with **bold**, *italic* and [links](/pricing)
 *   - bullet list         1. numbered list
 *   > a highlighted note
 *   | Column | Column |   tables, with a |---|---| line under the header row
 */
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
const isRule = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

export function mdToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{1,3})\s+(.*)$/))) {
      flush();
      out.push({ type: m[1].length === 3 ? "h3" : "h2", text: m[2].replace(/\s*#+$/, "") });
    } else if (t.startsWith("|") && i + 1 < lines.length && isRule(lines[i + 1])) {
      flush();
      const head = cells(t);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = cells(lines[i]);
        // every row gets exactly as many cells as the header, so a missing "|" cannot break the table
        rows.push(head.map((_, k) => row[k] ?? ""));
        i++;
      }
      i--;
      out.push({ type: "table", head, rows });
    } else if (/^[-*]\s+/.test(t)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i].trim().replace(/^[-*]\s+/, "")), i++;
      i--;
      out.push({ type: "ul", items });
    } else if (/^\d+[.)]\s+/.test(t)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i].trim().replace(/^\d+[.)]\s+/, "")), i++;
      i--;
      out.push({ type: "ol", items });
    } else if (t.startsWith(">")) {
      flush();
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) parts.push(lines[i].trim().replace(/^>\s?/, "")), i++;
      i--;
      out.push({ type: "note", text: parts.join(" ") });
    } else para.push(t);
  }
  flush();
  return out;
}

/** The reverse: used once, to load the site's built-in guides into the editor. */
export function blocksToMd(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "h2":
          return `## ${b.text}`;
        case "h3":
          return `### ${b.text}`;
        case "p":
          return b.text;
        case "note":
          return `> ${b.text}`;
        case "ul":
          return b.items.map((i) => `- ${i}`).join("\n");
        case "ol":
          return b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
        case "table":
          return [`| ${b.head.join(" | ")} |`, `|${b.head.map(() => " --- ").join("|")}|`, ...b.rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
      }
    })
    .join("\n\n");
}

/** The words of a piece of Markdown with the formatting marks removed. Used for word counts and reading time. */
export function plainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, " ")
    .replace(/[#>*|`_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export const wordCount = (md: string) => (plainText(md).match(/\S+/g) ?? []).length;
export const readingMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / 220));

/** Internal links ("/pricing") found in a piece of Markdown. */
export const internalLinks = (md: string) => [...md.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);

/** Questions and answers typed as "Q: ..." and "A: ..." lines. */
export function parseFaqs(text: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  let cur: { q: string; a: string } | null = null;
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const mq = line.match(/^Q\s*[:.]\s*(.+)$/i);
    const ma = line.match(/^A\s*[:.]\s*(.*)$/i);
    if (mq) {
      if (cur && cur.a) out.push(cur);
      cur = { q: mq[1].trim(), a: "" };
    } else if (ma && cur) cur.a = ma[1].trim();
    else if (line && cur && cur.a) cur.a += ` ${line}`;
  }
  if (cur && cur.a) out.push(cur);
  return out.slice(0, 30);
}
export const faqsToText = (faqs: { q: string; a: string }[]) => faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
