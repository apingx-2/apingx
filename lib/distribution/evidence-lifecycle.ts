import {
  ContributionEvidenceReviewStatus,
  ContributionPeriodStatus,
} from "@prisma/client";

export function isActiveVerifiedEvidence(entry: {
  reviewStatus: ContributionEvidenceReviewStatus;
  invalidatedAt: Date | null;
}): boolean {
  return (
    entry.reviewStatus === ContributionEvidenceReviewStatus.VERIFIED &&
    entry.invalidatedAt === null
  );
}

export function canInvalidateEvidenceVerification(input: {
  reviewStatus: ContributionEvidenceReviewStatus;
  invalidatedAt: Date | null;
  periodStatus: ContributionPeriodStatus;
}): boolean {
  return (
    input.reviewStatus === ContributionEvidenceReviewStatus.VERIFIED &&
    input.invalidatedAt === null &&
    (input.periodStatus === ContributionPeriodStatus.DRAFT ||
      input.periodStatus === ContributionPeriodStatus.OPEN)
  );
}

export function getEvidenceDisplayStatus(input: {
  reviewStatus: ContributionEvidenceReviewStatus;
  invalidatedAt: Date | null;
}): "PENDING" | "VERIFIED" | "REJECTED" | "VERIFIED_INVALIDATED" {
  if (
    input.reviewStatus === ContributionEvidenceReviewStatus.VERIFIED &&
    input.invalidatedAt !== null
  ) {
    return "VERIFIED_INVALIDATED";
  }

  return input.reviewStatus;
}
