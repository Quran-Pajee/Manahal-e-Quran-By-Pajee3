import { site } from "@/content/site";

/**
 * The mark: an open Quran inside a mihrab arch, with the eight-point star that divides the Quran into its parts.
 * `light` is the reversed version for emerald backgrounds. The same drawing is in public/brand as SVG and PNG files.
 */
const ARCH = "M12 92V47C12 35 21 28.5 31 23.5C38 20 44 13 48 4C52 13 58 20 65 23.5C75 28.5 84 35 84 47V92Z";
const ARCH_INNER = "M19.5 92V48.5C19.5 39.5 26.5 34.5 34.5 30.5C40 27.8 45 22.5 48 16C51 22.5 56 27.8 61.5 30.5C69.5 34.5 76.5 39.5 76.5 48.5V92";
const PAGES = "M48 59C41 53 32 52 25.5 55V78C32 75 41 76 48 82ZM48 59C55 53 64 52 70.5 55V78C64 75 55 76 48 82Z";
const STAR = "M48 34.3L49.82 36.12L52.38 36.12L52.38 38.68L54.2 40.5L52.38 42.32L52.38 44.88L49.82 44.88L48 46.7L46.18 44.88L43.62 44.88L43.62 42.32L41.8 40.5L43.62 38.68L43.62 36.12L46.18 36.12Z";

export function Mark({ className = "h-11 w-11", light = false }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      {light ? (
        <path d={ARCH} fill="none" stroke="#C7A45D" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <>
          <path d={ARCH} fill="#123D32" />
          <path d={ARCH_INNER} fill="none" stroke="#C7A45D" strokeWidth="1.5" />
        </>
      )}
      <path d={PAGES} fill="#FAF7EF" />
      <path d="M48 59V82" stroke={light ? "#123D32" : "#C7A45D"} strokeWidth="1.6" />
      <path d={STAR} fill="#C7A45D" />
    </svg>
  );
}

/** Horizontal logo for the header and footer: the mark, the name, and "Academy by PAJEE" beneath it. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" lang="en" dir="ltr">
      <Mark light={light} />
      <span className="leading-none">
        <span className={`block font-display text-[1.42rem] font-semibold leading-none ${light ? "text-white" : "text-emerald"}`}>{site.shortName}</span>
        <span className={`mt-1 block font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] ${light ? "text-white/85" : "text-emerald"}`}>
          Academy <span className={light ? "text-gold" : "text-gold-deep"}>by {site.organisation.name}</span>
        </span>
      </span>
    </span>
  );
}
