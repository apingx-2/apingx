import { ContributionPeriodStatus } from "@prisma/client";

export function isDiscardEligiblePeriodStatus(
  status: ContributionPeriodStatus,
): boolean {
  return (
    status === ContributionPeriodStatus.DRAFT ||
    status === ContributionPeriodStatus.OPEN
  );
}

export function canDiscardContributionPeriod(input: {
  status: ContributionPeriodStatus;
  evidenceCount: number;
  calculationCount: number;
}): boolean {
  if (!isDiscardEligiblePeriodStatus(input.status)) {
    return false;
  }

  return input.evidenceCount === 0 && input.calculationCount === 0;
}

export function getDiscardBlockReason(input: {
  status: ContributionPeriodStatus;
  evidenceCount: number;
  calculationCount: number;
}): string | null {
  if (!isDiscardEligiblePeriodStatus(input.status)) {
    return null;
  }

  if (input.evidenceCount > 0) {
    return "This Contribution Period cannot be discarded because evidence has been recorded. Evidence records must be preserved for audit purposes.";
  }

  if (input.calculationCount > 0) {
    return "This Contribution Period cannot be discarded because a distribution calculation exists. Calculations must be preserved for audit purposes.";
  }

  return null;
}
