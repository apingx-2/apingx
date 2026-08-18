import type { ContributionEvidenceReviewStatus } from "@prisma/client";
import { getEvidenceDisplayStatus } from "@/lib/distribution/evidence-lifecycle";
import { getEvidenceStatusCopy } from "@/lib/distribution/format-evidence-status";

type EvidenceStatusBadgeProps = {
  status: ContributionEvidenceReviewStatus;
  invalidatedAt?: Date | null;
  className?: string;
};

export function EvidenceStatusBadge({
  status,
  invalidatedAt = null,
  className = "",
}: EvidenceStatusBadgeProps) {
  const displayStatus = getEvidenceDisplayStatus({ reviewStatus: status, invalidatedAt });
  const copy = getEvidenceStatusCopy(displayStatus);

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