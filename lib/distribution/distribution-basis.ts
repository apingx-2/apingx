import {
  BASIS_POINTS_DENOMINATOR,
  DISTRIBUTION_BASIS_VERSION,
  MAX_ALLOCATION_BASIS_POINTS,
  MIN_ALLOCATION_BASIS_POINTS,
} from "@/lib/distribution/constants";

export type DistributionBasisInput = {
  grossQualifyingProductSalesInPence: number;
  discountsInPence: number;
  returnsRefundsInPence: number;
  successfulChargebacksInPence: number;
  vatExcludedInPence: number;
  contributorPoolBasisPoints: number;
};

export type DistributionBasisDerived = {
  retainedProductRevenueInPence: number;
  netQualifyingRevenueInPence: number;
  proposedDistributableAmountInPence: number;
};

export type DistributionBasisValidationResult =
  | {
      valid: true;
      derived: DistributionBasisDerived;
    }
  | {
      valid: false;
      error: string;
      fieldErrors?: Partial<Record<keyof DistributionBasisInput, string[]>>;
    };

function isNonNegativeInteger(value: number, label: string): string | null {
  if (!Number.isInteger(value)) {
    return `${label} must be a whole number of pence.`;
  }

  if (value < 0) {
    return `${label} cannot be negative.`;
  }

  return null;
}

export function calculateRetainedProductRevenueInPence(input: {
  grossQualifyingProductSalesInPence: number | bigint;
  discountsInPence: number | bigint;
  returnsRefundsInPence: number | bigint;
  successfulChargebacksInPence: number | bigint;
}): number {
  const gross = BigInt(input.grossQualifyingProductSalesInPence);
  const deductions =
    BigInt(input.discountsInPence) +
    BigInt(input.returnsRefundsInPence) +
    BigInt(input.successfulChargebacksInPence);

  const retained = gross - deductions;

  if (retained < BigInt(0)) {
    throw new Error("Retained product revenue cannot be negative.");
  }

  return Number(retained);
}

export function calculateNetQualifyingRevenueInPence(input: {
  retainedProductRevenueInPence: number | bigint;
  vatExcludedInPence: number | bigint;
}): number {
  const retained = BigInt(input.retainedProductRevenueInPence);
  const vat = BigInt(input.vatExcludedInPence);
  const nqr = retained - vat;

  if (nqr < BigInt(0)) {
    throw new Error("Net Qualifying Revenue cannot be negative.");
  }

  return Number(nqr);
}

export function calculateProposedDistributableAmountInPence(input: {
  netQualifyingRevenueInPence: number | bigint;
  contributorPoolBasisPoints: number | bigint;
}): number {
  const nqr = BigInt(input.netQualifyingRevenueInPence);
  const pool = BigInt(input.contributorPoolBasisPoints);
  const denominator = BigInt(BASIS_POINTS_DENOMINATOR);

  return Number((nqr * pool) / denominator);
}

export function deriveDistributionBasis(
  input: DistributionBasisInput,
): DistributionBasisDerived {
  const retainedProductRevenueInPence = calculateRetainedProductRevenueInPence({
    grossQualifyingProductSalesInPence: input.grossQualifyingProductSalesInPence,
    discountsInPence: input.discountsInPence,
    returnsRefundsInPence: input.returnsRefundsInPence,
    successfulChargebacksInPence: input.successfulChargebacksInPence,
  });

  const netQualifyingRevenueInPence = calculateNetQualifyingRevenueInPence({
    retainedProductRevenueInPence,
    vatExcludedInPence: input.vatExcludedInPence,
  });

  const proposedDistributableAmountInPence =
    calculateProposedDistributableAmountInPence({
      netQualifyingRevenueInPence,
      contributorPoolBasisPoints: input.contributorPoolBasisPoints,
    });

  return {
    retainedProductRevenueInPence,
    netQualifyingRevenueInPence,
    proposedDistributableAmountInPence,
  };
}

export function validateDistributionBasisInput(
  input: DistributionBasisInput,
): DistributionBasisValidationResult {
  const fieldErrors: Partial<Record<keyof DistributionBasisInput, string[]>> =
    {};

  const checks: Array<[keyof DistributionBasisInput, string, number]> = [
    [
      "grossQualifyingProductSalesInPence",
      "Gross Qualifying Product Sales",
      input.grossQualifyingProductSalesInPence,
    ],
    ["discountsInPence", "Discounts", input.discountsInPence],
    ["returnsRefundsInPence", "Returns / Refunds", input.returnsRefundsInPence],
    [
      "successfulChargebacksInPence",
      "Successful Chargebacks",
      input.successfulChargebacksInPence,
    ],
    ["vatExcludedInPence", "VAT Excluded", input.vatExcludedInPence],
    [
      "contributorPoolBasisPoints",
      "Contributor Pool Basis Points",
      input.contributorPoolBasisPoints,
    ],
  ];

  for (const [field, label, value] of checks) {
    const error = isNonNegativeInteger(value, label);

    if (error) {
      fieldErrors[field] = [error];
    }
  }

  if (
    input.contributorPoolBasisPoints < MIN_ALLOCATION_BASIS_POINTS ||
    input.contributorPoolBasisPoints > MAX_ALLOCATION_BASIS_POINTS
  ) {
    fieldErrors.contributorPoolBasisPoints = [
      "Contributor Pool Basis Points must be between 0 and 10,000.",
    ];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      error: "Please review the Distribution Basis and correct the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    const derived = deriveDistributionBasis(input);
    return { valid: true, derived };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "The Distribution Basis figures are internally inconsistent.",
    };
  }
}

export function getDistributionBasisVersion(): string {
  return DISTRIBUTION_BASIS_VERSION;
}

export type DistributionBasisSnapshot = DistributionBasisInput &
  DistributionBasisDerived & {
    currency: string;
    basisVersion: string;
    reconciliationCutoffAt: Date;
    approvedAt: Date | null;
  };

export function assertDerivedBasisConsistency(input: {
  grossQualifyingProductSalesInPence: number;
  discountsInPence: number;
  returnsRefundsInPence: number;
  successfulChargebacksInPence: number;
  vatExcludedInPence: number;
  contributorPoolBasisPoints: number;
  retainedProductRevenueInPence: number;
  netQualifyingRevenueInPence: number;
  proposedDistributableAmountInPence: number;
}): boolean {
  const derived = deriveDistributionBasis({
    grossQualifyingProductSalesInPence: input.grossQualifyingProductSalesInPence,
    discountsInPence: input.discountsInPence,
    returnsRefundsInPence: input.returnsRefundsInPence,
    successfulChargebacksInPence: input.successfulChargebacksInPence,
    vatExcludedInPence: input.vatExcludedInPence,
    contributorPoolBasisPoints: input.contributorPoolBasisPoints,
  });

  return (
    derived.retainedProductRevenueInPence ===
      input.retainedProductRevenueInPence &&
    derived.netQualifyingRevenueInPence === input.netQualifyingRevenueInPence &&
    derived.proposedDistributableAmountInPence ===
      input.proposedDistributableAmountInPence
  );
}
