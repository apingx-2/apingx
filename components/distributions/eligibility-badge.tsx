import type { DerivedContributorEligibility } from "@/lib/distribution/types";
import { getEligibilityCopy } from "@/lib/distribution/format-eligibility";

type EligibilityBadgeProps = {
  eligibility: DerivedContributorEligibility;
  className?: string;
};

export function EligibilityBadge({
  eligibility,
  className = "",
}: EligibilityBadgeProps) {
  const copy = getEligibilityCopy(eligibility);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-sm border border-[var(--border-default)] px-2.5 py-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="type-label text-[var(--text-primary)]">{copy.label}</span>
      <span className="type-status hidden sm:inline">{copy.description}</span>
      <span className="sr-only">{copy.description}</span>
    </span>
  );
}
