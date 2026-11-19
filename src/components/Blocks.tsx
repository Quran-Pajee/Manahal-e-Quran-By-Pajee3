import Link from "next/link";
import type { ReactNode } from "react";
import type { Block } from "@/content/types";
import { href as localHref, type Lang } from "@/i18n";

/** Turns "[text](/path)" inside content strings into links. */
export function rich(text: string, lang: Lang = "en"): ReactNode[] {
  return plainRich(text, lang);
}
function plainRich(text: string, lang: Lang = "en"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = m[2];
    out.push(
      href.startsWith("/") ? (
        <Link key={m.index} href={localHref(lang, href)} className="link">
          {m[1]}
        </Link>
      ) : (
        <a key={m.index} href={href} className="link" rel="noopener">
          {m[1]}
        </a>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Links an editor may write: pages on this site, web addresses and email. Anything else is shown as plain text. */
const safeHref = (h: string) => /^(\/(?!\/)|https?:\/\/|mailto:)/i.test(h);

/**
 * Inline formatting for content written in the dashboard: [text](/path) links, **bold** and *italic*.
 * It builds elements directly and never inserts HTML, so nothing typed in the editor can run as code.
 */
export function richMd(text: string, lang: Lang = "en"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const href = m[2];
      if (!safeHref(href)) out.push(m[1]);
      else if (href.startsWith("/"))
        out.push(
          <Link key={m.index} href={localHref(lang, href)} className="link">
            {m[1]}
          </Link>,
        );
      else
        out.push(
          <a key={m.index} href={href} className="link" rel="noopener">
            {m[1]}
          </a>,
        );
    } else if (m[3] !== undefined) out.push(<strong key={m.index}>{m[3]}</strong>);
    else out.push(<em key={m.index}>{m[4]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

export function Table({ head, rows, caption, label }: { head: string[]; rows: ReactNode[][]; caption?: string; label?: string }) {
  return (
    <div className="tbl-wrap" tabIndex={0} role="region" aria-label={caption ?? label ?? "Table"}>
      <table className="tbl">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {c}
                  </th>
                ) : (
                  <td key={j}>{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** `md` is set for content written in the dashboard, where **bold** and *italic* are also understood. */
export function Blocks({ blocks, lang = "en", md = false }: { blocks: Block[]; lang?: Lang; md?: boolean }) {
  const rich = md ? richMd : plainRich;
  return (
    <div className="prose-q">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} id={slugify(b.text)}>
                {b.text}
              </h2>
            );
          case "h3":
            return <h3 key={i}>{b.text}</h3>;
          case "p":
            return <p key={i}>{rich(b.text, lang)}</p>;
          case "note":
            return (
              <p key={i} className="rounded-lg border-s-4 border-gold bg-white px-4 py-3">
                {rich(b.text, lang)}
              </p>
            );
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{rich(it, lang)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{rich(it, lang)}</li>
                ))}
              </ol>
            );
          case "table":
            return <Table key={i} head={b.head} caption={b.caption} rows={b.rows.map((r) => r.map((c) => rich(c, lang)))} />;
        }
      })}
    </div>
  );
}
