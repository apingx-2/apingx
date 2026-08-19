import { ContributionPeriodStatus } from "@prisma/client";
import type { DistributionBasisSnapshot } from "@/lib/distribution/distribution-basis";

export function canEditDistributionBasis(input: {
  periodStatus: ContributionPeriodStatus;
  basis: Pick<DistributionBasisSnapshot, "approvedAt"> | null;
}): boolean {
  return (
    input.periodStatus === ContributionPeriodStatus.CLOSED &&
    input.basis !== null &&
    input.basis.approvedAt === null
  );
}

export function canPrepareDistributionBasis(input: {
  periodStatus: ContributionPeriodStatus;
  basis: Pick<DistributionBasisSnapshot, "approvedAt"> | null;
}): boolean {
  return (
    input.periodStatus === ContributionPeriodStatus.CLOSED &&
    (input.basis === null || input.basis.approvedAt === null)
  );
}

export function canApproveDistributionBasis(input: {
  periodStatus: ContributionPeriodStatus;
  basis: (DistributionBasisSnapshot & { isLegacySyntheticPlaceholder: boolean }) | null;
  currency: string;
}): boolean {
  if (input.periodStatus !== ContributionPeriodStatus.CLOSED) {
    return false;
  }

  if (!input.basis) {
    return false;
  }

  if (input.basis.approvedAt !== null) {
    return false;
  }

  if (input.basis.isLegacySyntheticPlaceholder) {
    return false;
  }

  return input.currency === "GBP" && input.basis.currency === "GBP";
}

export function getApproveDistributionBasisBlockReason(input: {
  periodStatus: ContributionPeriodStatus;
  basis: (DistributionBasisSnapshot & { isLegacySyntheticPlaceholder: boolean }) | null;
  currency: string;
}): string | null {
  if (!input.basis) {
    return "A Distribution Basis must be prepared before approval.";
  }

  if (input.basis.approvedAt !== null) {
    return "The Distribution Basis has already been approved.";
  }

  if (input.basis.isLegacySyntheticPlaceholder) {
    return "Replace the legacy migration placeholder with genuine commerce reconciliation data before approval.";
  }

  if (
    !canApproveDistributionBasis({
      periodStatus: input.periodStatus,
      basis: input.basis,
      currency: input.currency,
    })
  ) {
    return "The Distribution Basis cannot be approved in its current state.";
  }

  return null;
}

export function canReconcileLegacySyntheticBasis(input: {
  basis: { isLegacySyntheticPlaceholder: boolean; approvedAt: Date | null } | null;
  referencingCalculationCount: number;
}): boolean {
  if (!input.basis?.isLegacySyntheticPlaceholder) {
    return true;
  }

  if (input.basis.approvedAt !== null) {
    return false;
  }

  return input.referencingCalculationCount === 0;
}

export function getReconcileLegacySyntheticBlockReason(input: {
  basis: { isLegacySyntheticPlaceholder: boolean; approvedAt: Date | null } | null;
  referencingCalculationCount: number;
}): string | null {
  if (!input.basis?.isLegacySyntheticPlaceholder) {
    return null;
  }

  if (input.basis.approvedAt !== null) {
    return "Approved legacy placeholders cannot be reconciled.";
  }

  if (input.referencingCalculationCount > 0) {
    return "This legacy placeholder is referenced by historical calculations and cannot be reconciled without compromising financial integrity.";
  }

  return null;
}

export function isDistributionBasisApproved(
  basis: Pick<DistributionBasisSnapshot, "approvedAt"> | null,
): boolean {
  return basis?.approvedAt !== null && basis?.approvedAt !== undefined;
}

export function getApprovedDistributableAmountInPence(
  basis: Pick<
    DistributionBasisSnapshot,
    "approvedAt" | "proposedDistributableAmountInPence"
  > | null,
): number | null {
  if (!isDistributionBasisApproved(basis) || !basis) {
    return null;
  }

  return basis.proposedDistributableAmountInPence;
}
