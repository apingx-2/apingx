import {
  BASIS_POINTS_DENOMINATOR,
  DISTRIBUTION_CALCULATION_VERSION,
} from "@/lib/distribution/constants";

export function calculateCompensationInPence(
  distributableAmountInPence: number | bigint,
  allocationBasisPoints: number,
): number {
  if (!Number.isInteger(allocationBasisPoints)) {
    throw new Error("Allocation basis points must be an integer.");
  }

  const distributable = BigInt(distributableAmountInPence);
  const basisPoints = BigInt(allocationBasisPoints);
  const denominator = BigInt(BASIS_POINTS_DENOMINATOR);

  return Number((distributable * basisPoints) / denominator);
}

export function getDistributionCalculationVersion(): string {
  return DISTRIBUTION_CALCULATION_VERSION;
}

export function calculateUnallocatedRemainderInPence(
  distributableAmountInPence: number,
  calculatedCompensationLines: number[],
): number {
  const distributable = BigInt(distributableAmountInPence);
  const totalCompensation = calculatedCompensationLines.reduce(
    (sum, amount) => sum + BigInt(amount),
    BigInt(0),
  );

  if (totalCompensation > distributable) {
    return 0;
  }

  return Number(distributable - totalCompensation);
}
