import { buildDistributionPreview } from "@/lib/distribution/preview-calculation";
import type { ContributionPeriodDetail } from "@/lib/distribution/get-period-by-id";
import { getApprovedDistributableAmountInPence } from "@/lib/distribution/basis-lifecycle";

export function buildClosedPeriodPreview(period: ContributionPeriodDetail) {
  if (period.status !== "CLOSED") {
    return null;
  }

  const distributableAmountInPence = getApprovedDistributableAmountInPence(
    period.distributionBasis,
  );

  if (distributableAmountInPence === null) {
    return null;
  }

  if (period.participants.length === 0) {
    return null;
  }

  return buildDistributionPreview({
    periodStatus: period.status,
    distributableAmountInPence,
    requirements: period.requirements.map((requirement) => ({
      id: requirement.id,
      contributorId: requirement.contributor?.id ?? null,
      label: requirement.label,
      requiredVerificationCount: requirement.requiredVerificationCount,
    })),
    evidence: period.evidence.map((entry) => ({
      contributionRequirementId: entry.requirement.id,
      contributorId: entry.contributor.id,
      reviewStatus: entry.reviewStatus,
      invalidatedAt: entry.invalidatedAt,
    })),
    participants: period.participants.map((participant) => ({
      participantId: participant.id,
      contributorId: participant.contributor.id,
      contributorDisplayName: participant.contributor.displayName,
      credentialId: participant.credential.id,
      credentialNumber: participant.credential.credentialNumber,
      collectionId: period.collectionId,
      collectionNumber: period.collection.collectionNumber,
      allocationBasisPoints: participant.credential.allocationBasisPoints,
      agreementReference: participant.agreementReference,
    })),
  });
}
