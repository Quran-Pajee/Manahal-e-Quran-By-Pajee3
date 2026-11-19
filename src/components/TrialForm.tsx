import { LeadForm } from "./LeadForm";
import { courses, coursesFor } from "@/content/courses";
import { site } from "@/content/site";
import { ui } from "@/i18n/ui";

type Props = Omit<React.ComponentProps<typeof LeadForm>, "courses" | "trialClasses">;

/** Server wrapper so pages do not have to pass the course list each time. */
export function TrialForm(props: Props) {
  const local = coursesFor(props.lang);
  return <LeadForm {...props} courses={courses.map((c, i) => ({ value: c.name, label: local[i].name }))} trialClasses={site.trial.classes} />;
}

/**
 * The form inside the mihrab arch: a white arch in an emerald frame with a gold hairline.
 * Used in every hero and in the closing section. It is kept short so the whole card, button included, fits a laptop screen.
 */
export function TrialCard({ title, ...props }: Props & { title?: string }) {
  const t = ui[props.lang];
  return (
    <div className="arch arch-frame mx-auto w-full max-w-[29rem]">
      <div className="arch on-light bg-white px-5 pb-5 pt-12 text-charcoal sm:px-6">
        <h2 className="mb-4 text-center text-[1.5rem] leading-tight">{title ?? t.common.trialCta(site.trial.classes)}</h2>
        <TrialForm {...props} variant="quick" />
      </div>
    </div>
  );
}
