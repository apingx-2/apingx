import { ContributionPeriodStatus } from "@prisma/client";
import {
  validateAllocationBasisPoints,
  validateTotalQualifiedAllocationBasisPoints,
} from "@/lib/distribution/allocation";
import {
  calculateCompensationInPence,
  calculateUnallocatedRemainderInPence,
  getDistributionCalculationVersion,
} from "@/lib/distribution/calculate-compensation";
import {
  aggregateCompensationByContributor,
  sumCalculatedCompensationInPence,
} from "@/lib/distribution/aggregate";
import {
  buildRequirementAuditSnapshot,
  deriveContributorEligibility,
} from "@/lib/distribution/eligibility";
import type {
  DistributionEvidenceInput,
  DistributionParticipantInput,
  DistributionPreviewResult,
  DistributionRequirementInput,
} from "@/lib/distribution/types";

export type BuildDistributionPreviewInput = {
  periodStatus: ContributionPeriodStatus;
  distributableAmountInPence: number;
  requirements: DistributionRequirementInput[];
  evidence: DistributionEvidenceInput[];
  participants: DistributionParticipantInput[];
};

export type DistributionPreviewValidationResult =
  | { success: true; preview: DistributionPreviewResult }
  | { success: false; error: string };

export function buildDistributionPreview(
  input: BuildDistributionPreviewInput,
): DistributionPreviewValidationResult {
  if (!Number.isInteger(input.distributableAmountInPence)) {
    return {
      success: false,
      error: "Distributable amount must be stored as whole pence.",
    };
  }

  if (input.distributableAmountInPence < 0) {
    return {
      success: false,
      error: "Distributable amount cannot be negative.",
    };
  }

  const eligibilityByContributor = new Map<
    string,
    ReturnType<typeof deriveContributorEligibility>
  >();

  for (const participant of input.participants) {
    if (!eligibilityByContributor.has(participant.contributorId)) {
      eligibilityByContributor.set(
        participant.contributorId,
        deriveContributorEligibility({
          contributorId: participant.contributorId,
          periodStatus: input.periodStatus,
          requirements: input.requirements,
          evidence: input.evidence,
        }),
      );
    }
  }

  for (const participant of input.participants) {
    const allocationValidation = validateAllocationBasisPoints(
      participant.allocationBasisPoints,
    );

    if (!allocationValidation.valid) {
      return {
        success: false,
        error: allocationValidation.reason,
      };
    }
  }

  const participantContexts = input.participants.map((participant) => {
    const eligibility =
      eligibilityByContributor.get(participant.contributorId) ?? "PENDING";

    return {
      participant,
      eligibility,
      qualified: eligibility === "QUALIFIED",
    };
  });

  const qualifiedAllocationValidation = validateTotalQualifiedAllocationBasisPoints(
    participantContexts.map((entry) => ({
      allocationBasisPoints: entry.participant.allocationBasisPoints,
      qualified: entry.qualified,
    })),
  );

  if (!qualifiedAllocationValidation.valid) {
    return {
      success: false,
      error: qualifiedAllocationValidation.reason,
    };
  }

  const lines = participantContexts.map((entry) => ({
    participantId: entry.participant.participantId,
    contributorId: entry.participant.contributorId,
    contributorDisplayName: entry.participant.contributorDisplayName,
    credentialId: entry.participant.credentialId,
    credentialNumber: entry.participant.credentialNumber,
    collectionId: entry.participant.collectionId,
    collectionNumber: entry.participant.collectionNumber,
    allocationBasisPoints: entry.participant.allocationBasisPoints,
    agreementReference: entry.participant.agreementReference,
    eligibility: entry.eligibility,
    calculatedCompensationInPence:
      entry.eligibility === "QUALIFIED"
        ? calculateCompensationInPence(
            input.distributableAmountInPence,
            entry.participant.allocationBasisPoints,
          )
        : 0,
    requirementAuditSnapshot: buildRequirementAuditSnapshot({
      contributorId: entry.participant.contributorId,
      requirements: input.requirements,
      evidence: input.evidence,
    }),
  }));

  const compensationAmounts = lines.map(
    (line) => line.calculatedCompensationInPence,
  );

  return {
    success: true,
    preview: {
      calculationVersion: getDistributionCalculationVersion(),
      distributableAmountInPence: input.distributableAmountInPence,
      lines,
      totalCalculatedCompensationInPence:
        sumCalculatedCompensationInPence(compensationAmounts),
      unallocatedRemainderInPence: calculateUnallocatedRemainderInPence(
        input.distributableAmountInPence,
        compensationAmounts,
      ),
      totalQualifiedAllocationBasisPoints:
        qualifiedAllocationValidation.totalQualifiedAllocationBasisPoints,
      contributorTotals: aggregateCompensationByContributor(lines),
    },
  };
}
