import {
  MAX_ALLOCATION_BASIS_POINTS,
  MIN_ALLOCATION_BASIS_POINTS,
} from "@/lib/distribution/constants";

export type AllocationValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function isValidAllocationBasisPoints(
  allocationBasisPoints: number,
): boolean {
  return (
    Number.isInteger(allocationBasisPoints) &&
    allocationBasisPoints >= MIN_ALLOCATION_BASIS_POINTS &&
    allocationBasisPoints <= MAX_ALLOCATION_BASIS_POINTS
  );
}

export function validateAllocationBasisPoints(
  allocationBasisPoints: number,
): AllocationValidationResult {
  if (!Number.isInteger(allocationBasisPoints)) {
    return {
      valid: false,
      reason: "Allocation must be a whole number of basis points.",
    };
  }

  if (allocationBasisPoints < MIN_ALLOCATION_BASIS_POINTS) {
    return {
      valid: false,
      reason: "Allocation cannot be negative.",
    };
  }

  if (allocationBasisPoints > MAX_ALLOCATION_BASIS_POINTS) {
    return {
      valid: false,
      reason: "Allocation cannot exceed 10,000 basis points.",
    };
  }

  return { valid: true };
}

export function sumQualifiedAllocationBasisPoints(
  allocations: Array<{
    allocationBasisPoints: number;
    qualified: boolean;
  }>,
): number {
  return allocations.reduce((total, entry) => {
    if (!entry.qualified) {
      return total;
    }

    return total + entry.allocationBasisPoints;
  }, 0);
}

export type QualifiedAllocationValidationResult =
  | { valid: true; totalQualifiedAllocationBasisPoints: number }
  | { valid: false; reason: string; totalQualifiedAllocationBasisPoints: number };

export function validateTotalQualifiedAllocationBasisPoints(
  allocations: Array<{
    allocationBasisPoints: number;
    qualified: boolean;
  }>,
): QualifiedAllocationValidationResult {
  const totalQualifiedAllocationBasisPoints =
    sumQualifiedAllocationBasisPoints(allocations);

  if (totalQualifiedAllocationBasisPoints > MAX_ALLOCATION_BASIS_POINTS) {
    return {
      valid: false,
      totalQualifiedAllocationBasisPoints,
      reason:
        "Total qualified allocation exceeds 10,000 basis points. Approval is blocked.",
    };
  }

  return {
    valid: true,
    totalQualifiedAllocationBasisPoints,
  };
}
