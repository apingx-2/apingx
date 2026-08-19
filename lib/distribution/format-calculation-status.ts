import type { DistributionCalculationStatus } from "@prisma/client";

const STATUS_COPY: Record<
  DistributionCalculationStatus,
  { label: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    description: "Calculation draft — not yet finalised",
  },
  CALCULATED: {
    label: "Calculated",
    description: "Awaiting administrative approval",
  },
  APPROVED: {
    label: "Approved",
    description: "Approved compensation calculation — no payment executed",
  },
  VOID: {
    label: "Void",
    description: "Voided historical calculation — preserved for audit",
  },
};

export function getCalculationStatusCopy(status: DistributionCalculationStatus) {
  return STATUS_COPY[status];
}
