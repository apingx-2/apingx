import {
  ContributionPeriodStatus,
  DistributionCalculationStatus,
} from "@prisma/client";
import {
  getApprovedDistributableAmountInPence,
  isDistributionBasisApproved,
} from "@/lib/distribution/basis-lifecycle";
import type { DistributionBasisSnapshot } from "@/lib/distribution/distribution-basis";

export type CalculationSummary = {
  id: string;
  calculationSequence: number;
  status: DistributionCalculationStatus;
  distributableAmountInPence: number;
  calculatedAt: Date | null;
  approvedAt: Date | null;
  voidedAt: Date | null;
  replacesCalculationId: string | null;
  replacedById: string | null;
  totalCalculatedCompensationInPence: number;
};

export function getApprovedCalculation(
  calculations: CalculationSummary[],
): CalculationSummary | undefined {
  return calculations.find(
    (calculation) => calculation.status === DistributionCalculationStatus.APPROVED,
  );
}

export function getPendingReviewCalculation(
  calculations: CalculationSummary[],
): CalculationSummary | undefined {
  return calculations.find(
    (calculation) =>
      calculation.status === DistributionCalculationStatus.CALCULATED,
  );
}

export function canCreateDistributionCalculation(input: {
  status: ContributionPeriodStatus;
  distributionBasis: DistributionBasisSnapshot | null;
  participantCount: number;
  calculations: CalculationSummary[];
}): boolean {
  if (input.status !== ContributionPeriodStatus.CLOSED) {
    return false;
  }

  if (!isDistributionBasisApproved(input.distributionBasis)) {
    return false;
  }

  if (
    getApprovedDistributableAmountInPence(input.distributionBasis) === null
  ) {
    return false;
  }

  if (input.participantCount === 0) {
    return false;
  }

  if (getApprovedCalculation(input.calculations)) {
    return false;
  }

  if (getPendingReviewCalculation(input.calculations)) {
    return false;
  }

  return true;
}

export function canApproveDistributionCalculation(input: {
  calculationStatus: DistributionCalculationStatus;
  periodStatus: ContributionPeriodStatus;
  distributionBasis: DistributionBasisSnapshot | null;
  calculations: CalculationSummary[];
  calculationId: string;
}): boolean {
  if (input.calculationStatus !== DistributionCalculationStatus.CALCULATED) {
    return false;
  }

  if (input.periodStatus !== ContributionPeriodStatus.CLOSED) {
    return false;
  }

  if (!isDistributionBasisApproved(input.distributionBasis)) {
    return false;
  }

  const otherApproved = input.calculations.find(
    (calculation) =>
      calculation.status === DistributionCalculationStatus.APPROVED &&
      calculation.id !== input.calculationId,
  );

  return !otherApproved;
}

export function canVoidDistributionCalculation(input: {
  calculationStatus: DistributionCalculationStatus;
}): boolean {
  return input.calculationStatus === DistributionCalculationStatus.APPROVED;
}

export function canCreateReplacementCalculation(input: {
  calculationStatus: DistributionCalculationStatus;
  replacedById: string | null;
}): boolean {
  return (
    input.calculationStatus === DistributionCalculationStatus.VOID &&
    input.replacedById === null
  );
}

export function getCreateCalculationBlockReason(input: {
  status: ContributionPeriodStatus;
  distributionBasis: DistributionBasisSnapshot | null;
  participantCount: number;
  calculations: CalculationSummary[];
}): string | null {
  if (input.status !== ContributionPeriodStatus.CLOSED) {
    return "Calculations can only be created for closed Contribution Periods.";
  }

  if (!input.distributionBasis) {
    return "A Distribution Basis must be prepared before creating a calculation.";
  }

  if (!isDistributionBasisApproved(input.distributionBasis)) {
    return "The Distribution Basis must be approved before creating a calculation.";
  }

  if (input.participantCount === 0) {
    return "At least one enrolled participant is required before creating a calculation.";
  }

  if (getApprovedCalculation(input.calculations)) {
    return "An approved calculation already exists for this Contribution Period.";
  }

  if (getPendingReviewCalculation(input.calculations)) {
    return "A calculated record is awaiting review. Approve or void it before creating another calculation.";
  }

  return null;
}
