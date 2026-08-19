import type { DistributionCalculationStatus } from "@prisma/client";
import { getCalculationStatusCopy } from "@/lib/distribution/format-calculation-status";

type CalculationStatusBadgeProps = {
  status: DistributionCalculationStatus;
  className?: string;
};

export function CalculationStatusBadge({
  status,
  className = "",
}: CalculationStatusBadgeProps) {
  const copy = getCalculationStatusCopy(status);

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
