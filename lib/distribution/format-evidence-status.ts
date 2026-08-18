import type { ContributionEvidenceReviewStatus } from "@prisma/client";

type EvidenceDisplayStatus =
  | ContributionEvidenceReviewStatus
  | "VERIFIED_INVALIDATED";

const STATUS_COPY: Record<
  EvidenceDisplayStatus,
  { label: string; description: string }
> = {
  PENDING: {
    label: "Pending review",
    description: "Awaiting archive review",
  },
  VERIFIED: {
    label: "Verified",
    description: "Accepted as qualifying contribution evidence",
  },
  REJECTED: {
    label: "Rejected",
    description: "Does not satisfy the requirement",
  },
  VERIFIED_INVALIDATED: {
    label: "Verified — invalidated",
    description:
      "Previously verified, but the verification was later invalidated",
  },
};

export function getEvidenceStatusCopy(status: EvidenceDisplayStatus) {
  return STATUS_COPY[status];
}
