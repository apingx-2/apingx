import type { ContributionEvidenceReviewStatus, ContributionPeriodStatus } from "@prisma/client";

export type DerivedContributorEligibility =
  | "PENDING"
  | "QUALIFIED"
  | "NOT_QUALIFIED";

export type DistributionRequirementInput = {
  id: string;
  contributorId: string | null;
  label: string;
  requiredVerificationCount: number;
};

export type DistributionEvidenceInput = {
  contributionRequirementId: string;
  contributorId: string;
  reviewStatus: ContributionEvidenceReviewStatus;
  invalidatedAt?: Date | null;
};

export type DistributionParticipantInput = {
  participantId: string;
  contributorId: string;
  contributorDisplayName: string;
  credentialId: string;
  credentialNumber: number;
  collectionId: string;
  collectionNumber: number;
  allocationBasisPoints: number;
  agreementReference: string | null;
};

export type DistributionPreviewLine = {
  participantId: string;
  contributorId: string;
  contributorDisplayName: string;
  credentialId: string;
  credentialNumber: number;
  collectionId: string;
  collectionNumber: number;
  allocationBasisPoints: number;
  agreementReference: string | null;
  eligibility: DerivedContributorEligibility;
  calculatedCompensationInPence: number;
};

export type DistributionPreviewResult = {
  calculationVersion: string;
  distributableAmountInPence: number;
  lines: DistributionPreviewLine[];
  totalCalculatedCompensationInPence: number;
  unallocatedRemainderInPence: number;
  totalQualifiedAllocationBasisPoints: number;
  contributorTotals: Array<{
    contributorId: string;
    contributorDisplayName: string;
    totalCompensationInPence: number;
    lineCount: number;
  }>;
};

export type ParticipantEnrollmentValidationInput = {
  periodCollectionId: string;
  credentialCollectionId: string;
  credentialContributorId: string | null;
  participantContributorId: string;
};

export type RequirementAuditSnapshotEntry = {
  requirementId: string;
  label: string;
  requiredVerificationCount: number;
  verifiedEvidenceCount: number;
  satisfied: boolean;
};

export type PeriodStatusForCalculation = ContributionPeriodStatus;
