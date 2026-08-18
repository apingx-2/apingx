import type { ContributionPeriodStatus } from "@prisma/client";
import { getPeriodStatusCopy } from "@/lib/distribution/format-period-status";

type PeriodStatusBadgeProps = {
  status: ContributionPeriodStatus;
  className?: string;
};

export function PeriodStatusBadge({
  status,
  className = "",
}: PeriodStatusBadgeProps) {
  const copy = getPeriodStatusCopy(status);

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
