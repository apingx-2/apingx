import type { ContributionPeriodStatus } from "@prisma/client";

const STATUS_COPY: Record<
  ContributionPeriodStatus,
  { label: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    description: "Being prepared and not yet open for contribution",
  },
  OPEN: {
    label: "Open",
    description: "Contributors may submit and review evidence",
  },
  CLOSED: {
    label: "Closed",
    description: "Contribution and evidence review finalised",
  },
};

export function getPeriodStatusCopy(status: ContributionPeriodStatus) {
  return STATUS_COPY[status];
}
