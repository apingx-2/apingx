import { ContributionPeriodStatus } from "@prisma/client";
import type {
  DerivedContributorEligibility,
  DistributionEvidenceInput,
  DistributionRequirementInput,
  RequirementAuditSnapshotEntry,
} from "@/lib/distribution/types";

function getApplicableRequirements(
  requirements: DistributionRequirementInput[],
  contributorId: string,
): DistributionRequirementInput[] {
  return requirements.filter(
    (requirement) =>
      requirement.contributorId === null ||
      requirement.contributorId === contributorId,
  );
}

export function countVerifiedEvidenceForPair(input: {
  evidence: DistributionEvidenceInput[];
  contributorId: string;
  requirementId: string;
}): number {
  return input.evidence.filter(
    (entry) =>
      entry.contributorId === input.contributorId &&
      entry.contributionRequirementId === input.requirementId &&
      entry.reviewStatus === "VERIFIED" &&
      (entry.invalidatedAt === null || entry.invalidatedAt === undefined),
  ).length;
}

export function buildRequirementAuditSnapshot(input: {
  contributorId: string;
  requirements: DistributionRequirementInput[];
  evidence: DistributionEvidenceInput[];
}): RequirementAuditSnapshotEntry[] {
  return getApplicableRequirements(input.requirements, input.contributorId).map(
    (requirement) => {
      const verifiedEvidenceCount = countVerifiedEvidenceForPair({
        evidence: input.evidence,
        contributorId: input.contributorId,
        requirementId: requirement.id,
      });

      return {
        requirementId: requirement.id,
        label: requirement.label,
        requiredVerificationCount: requirement.requiredVerificationCount,
        verifiedEvidenceCount,
        satisfied:
          verifiedEvidenceCount >= requirement.requiredVerificationCount,
      };
    },
  );
}

export function deriveContributorEligibility(input: {
  contributorId: string;
  periodStatus: ContributionPeriodStatus;
  requirements: DistributionRequirementInput[];
  evidence: DistributionEvidenceInput[];
}): DerivedContributorEligibility {
  const applicableRequirements = getApplicableRequirements(
    input.requirements,
    input.contributorId,
  );

  if (applicableRequirements.length === 0) {
    return input.periodStatus === ContributionPeriodStatus.CLOSED
      ? "QUALIFIED"
      : "PENDING";
  }

  const allRequirementsSatisfied = applicableRequirements.every(
    (requirement) =>
      countVerifiedEvidenceForPair({
        evidence: input.evidence,
        contributorId: input.contributorId,
        requirementId: requirement.id,
      }) >= requirement.requiredVerificationCount,
  );

  if (allRequirementsSatisfied) {
    return "QUALIFIED";
  }

  if (input.periodStatus === ContributionPeriodStatus.CLOSED) {
    return "NOT_QUALIFIED";
  }

  return "PENDING";
}

export function canPersistDistributionCalculation(
  periodStatus: ContributionPeriodStatus,
): boolean {
  return periodStatus === ContributionPeriodStatus.CLOSED;
}

export function canPreviewDistributionCalculation(
  periodStatus: ContributionPeriodStatus,
): boolean {
  return (
    periodStatus === ContributionPeriodStatus.OPEN ||
    periodStatus === ContributionPeriodStatus.CLOSED
  );
}
