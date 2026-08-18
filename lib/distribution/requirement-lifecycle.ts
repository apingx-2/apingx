import { ContributionPeriodStatus } from "@prisma/client";

export function isRequirementMutablePeriodStatus(
  status: ContributionPeriodStatus,
): boolean {
  return (
    status === ContributionPeriodStatus.DRAFT ||
    status === ContributionPeriodStatus.OPEN
  );
}

export function canEditRequirement(input: {
  periodStatus: ContributionPeriodStatus;
  evidenceCount: number;
}): boolean {
  return (
    isRequirementMutablePeriodStatus(input.periodStatus) &&
    input.evidenceCount === 0
  );
}

export function canDeleteRequirement(input: {
  periodStatus: ContributionPeriodStatus;
  evidenceCount: number;
}): boolean {
  return canEditRequirement(input);
}

export function getRequirementLockMessage(input: {
  periodStatus: ContributionPeriodStatus;
  evidenceCount: number;
}): string | null {
  if (input.periodStatus === ContributionPeriodStatus.CLOSED) {
    return "Finalised with the Contribution Period.";
  }

  if (input.evidenceCount > 0) {
    return "Locked — evidence has been recorded against this requirement.";
  }

  return null;
}

export function getRequirementScopeLabel(
  contributor: { displayName: string } | null,
): string {
  return contributor
    ? `Applies to ${contributor.displayName}`
    : "Applies to all Contributors";
}
