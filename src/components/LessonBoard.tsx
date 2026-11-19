import type { Lang } from "@/i18n";
import { ui } from "@/i18n/ui";

/**
 * Hero visual: the Basmalah marked up the way a Tajweed teacher corrects it in class.
 * Whole words are highlighted (never single letters) so the Arabic joins correctly in every browser.
 */
function Underline({ className, delay = "" }: { className: string; delay?: string }) {
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" className={`pointer-events-none absolute inset-x-0 -bottom-1 h-2.5 w-full ${className}`} aria-hidden="true">
      <path d="M2 6c14-4 22 3 36 0s24-4 36-1 16 2 24-1" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" pathLength={1} className={`pen ${delay}`} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Tag({ n, className }: { n: number; className: string }) {
  return (
    <span className={`absolute -top-5 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full font-sans text-[0.8rem] font-bold leading-none text-white ${className}`} aria-hidden="true">
      {n}
    </span>
  );
}

export function LessonBoard({ lang }: { lang: Lang }) {
  const t = ui[lang].board;
  return (
    <figure className="arch on-light mx-auto w-full max-w-[30rem] bg-white px-6 pb-7 pt-16 text-charcoal outline outline-1 outline-offset-[0.4rem] outline-gold sm:px-9 sm:pt-20">
      <p lang="ar" dir="rtl" className="quran text-center text-[clamp(2.2rem,1.4rem+3.6vw,2.9rem)] leading-[2.3] text-emerald">
        <span>بِسْمِ</span> <span>ٱللَّهِ</span>{" "}
        <span className="relative inline-block">
          ٱلرَّحْمَٰنِ
          <Tag n={1} className="bg-leaf" />
          <Underline className="text-leaf" />
        </span>{" "}
        <span className="relative inline-block">
          ٱلرَّحِيمِ
          <Tag n={2} className="bg-gold-deep" />
          <Underline className="text-gold-deep" delay="pen-2" />
        </span>
      </p>

      <ol className="mt-5 space-y-3 border-t border-line pt-5 text-[0.98rem]">
        <li className="note-in flex gap-3" style={{ animationDelay: "0.5s" }}>
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf font-sans text-[0.8rem] font-bold text-white">1</span>
          <span>{t.n1}</span>
        </li>
        <li className="note-in flex gap-3" style={{ animationDelay: "1.4s" }}>
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-deep font-sans text-[0.8rem] font-bold text-white">2</span>
          <span>{t.n2}</span>
        </li>
      </ol>
      <figcaption className="mt-5 text-sm text-muted">{t.caption}</figcaption>
    </figure>
  );
}
