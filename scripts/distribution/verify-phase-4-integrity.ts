/**
 * Task 008 Phase 4 financial-integrity verification (pure/invariant tests).
 *
 * Usage: npx tsx scripts/distribution/verify-phase-4-integrity.ts
 */

import {
  ContributionPeriodStatus,
  DistributionCalculationStatus,
} from "@prisma/client";
import {
  canApproveDistributionBasis,
  canEditDistributionBasis,
  canPrepareDistributionBasis,
  canReconcileLegacySyntheticBasis,
  getApproveDistributionBasisBlockReason,
  getReconcileLegacySyntheticBlockReason,
  isDistributionBasisApproved,
} from "@/lib/distribution/basis-lifecycle";
import {
  canApproveDistributionCalculation,
  canCreateDistributionCalculation,
  canCreateReplacementCalculation,
  canVoidDistributionCalculation,
} from "@/lib/distribution/calculation-lifecycle";
import { buildDistributionPreview } from "@/lib/distribution/preview-calculation";
import { isLegacySyntheticDistributionBasis } from "@/lib/distribution/is-legacy-synthetic-basis";
import { deriveDistributionBasis } from "@/lib/distribution/distribution-basis";

type CheckResult = { name: string; pass: boolean; detail?: string };
const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

const approvedBasis = {
  grossQualifyingProductSalesInPence: 6_000_000,
  discountsInPence: 300_000,
  returnsRefundsInPence: 500_000,
  successfulChargebacksInPence: 100_000,
  retainedProductRevenueInPence: 5_100_000,
  vatExcludedInPence: 850_000,
  netQualifyingRevenueInPence: 4_250_000,
  contributorPoolBasisPoints: 2_000,
  proposedDistributableAmountInPence: 850_000,
  currency: "GBP",
  basisVersion: "distribution-basis-v1",
  reconciliationCutoffAt: new Date("2026-01-31T23:59:59Z"),
  isLegacySyntheticPlaceholder: false,
  approvedAt: new Date("2026-02-01T10:00:00Z"),
};

function main() {
  check(
    "Basis lifecycle: cannot prepare/edit when period not CLOSED",
    !canPrepareDistributionBasis({
      periodStatus: ContributionPeriodStatus.OPEN,
      basis: null,
    }) &&
      !canEditDistributionBasis({
        periodStatus: ContributionPeriodStatus.OPEN,
        basis: { approvedAt: null },
      }),
  );

  check(
    "Basis lifecycle: cannot edit approved basis",
    !canEditDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: { approvedAt: approvedBasis.approvedAt },
    }) &&
      !canPrepareDistributionBasis({
        periodStatus: ContributionPeriodStatus.CLOSED,
        basis: { approvedAt: approvedBasis.approvedAt },
      }),
  );

  check(
    "Basis lifecycle: can approve unapproved CLOSED basis",
    canApproveDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: { ...approvedBasis, approvedAt: null },
      currency: "GBP",
    }),
  );

  check(
    "Basis lifecycle: approved basis detected",
    isDistributionBasisApproved(approvedBasis),
  );

  check(
    "Legacy synthetic basis detection uses explicit flag",
    isLegacySyntheticDistributionBasis({ isLegacySyntheticPlaceholder: true }) &&
      !isLegacySyntheticDistributionBasis({ isLegacySyntheticPlaceholder: false }),
  );

  check(
    "Genuine 100% pool basis is not treated as synthetic without flag",
    !isLegacySyntheticDistributionBasis({
      isLegacySyntheticPlaceholder: false,
    }),
  );

  const placeholderBasis = {
    ...approvedBasis,
    approvedAt: null,
    isLegacySyntheticPlaceholder: true,
    grossQualifyingProductSalesInPence: 200_000,
    proposedDistributableAmountInPence: 200_000,
    contributorPoolBasisPoints: 10_000,
  };

  check(
    "Legacy placeholder blocks approval until reconciled",
    !canApproveDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: placeholderBasis,
      currency: "GBP",
    }) &&
      Boolean(
        getApproveDistributionBasisBlockReason({
          periodStatus: ContributionPeriodStatus.CLOSED,
          basis: placeholderBasis,
          currency: "GBP",
        })?.includes("legacy migration placeholder"),
      ),
  );

  check(
    "Unapproved legacy placeholder remains editable",
    canEditDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: { approvedAt: null },
    }),
  );

  check(
    "Legacy placeholder with historical calculations cannot be reconciled",
    !canReconcileLegacySyntheticBasis({
      basis: placeholderBasis,
      referencingCalculationCount: 1,
    }) &&
      Boolean(
        getReconcileLegacySyntheticBlockReason({
          basis: placeholderBasis,
          referencingCalculationCount: 1,
        })?.includes("historical calculations"),
      ),
  );

  check(
    "Legacy placeholder without calculations can be reconciled",
    canReconcileLegacySyntheticBasis({
      basis: placeholderBasis,
      referencingCalculationCount: 0,
    }),
  );

  const noActiveCalcs: Parameters<typeof canCreateDistributionCalculation>[0]["calculations"] =
    [];

  check(
    "Calculation lifecycle: create blocked without approved basis",
    !canCreateDistributionCalculation({
      status: ContributionPeriodStatus.CLOSED,
      distributionBasis: null,
      participantCount: 2,
      calculations: noActiveCalcs,
    }),
  );

  check(
    "Calculation lifecycle: create allowed with approved basis and no active calcs",
    canCreateDistributionCalculation({
      status: ContributionPeriodStatus.CLOSED,
      distributionBasis: approvedBasis,
      participantCount: 2,
      calculations: noActiveCalcs,
    }),
  );

  check(
    "Calculation lifecycle: create blocked when CALCULATED exists",
    !canCreateDistributionCalculation({
      status: ContributionPeriodStatus.CLOSED,
      distributionBasis: approvedBasis,
      participantCount: 2,
      calculations: [
        {
          id: "c1",
          calculationSequence: 1,
          status: DistributionCalculationStatus.CALCULATED,
          distributableAmountInPence: 850_000,
          calculatedAt: new Date(),
          approvedAt: null,
          voidedAt: null,
          replacesCalculationId: null,
          replacedById: null,
          totalCalculatedCompensationInPence: 0,
        },
      ],
    }),
  );

  check(
    "Calculation lifecycle: void only from APPROVED",
    canVoidDistributionCalculation({
      calculationStatus: DistributionCalculationStatus.APPROVED,
    }) &&
      !canVoidDistributionCalculation({
        calculationStatus: DistributionCalculationStatus.CALCULATED,
      }),
  );

  check(
    "Replacement chain: only VOID without existing replacement",
    canCreateReplacementCalculation({
      calculationStatus: DistributionCalculationStatus.VOID,
      replacedById: null,
    }) &&
      !canCreateReplacementCalculation({
        calculationStatus: DistributionCalculationStatus.VOID,
        replacedById: "existing-replacement",
      }),
  );

  const multiCredentialPreview = buildDistributionPreview({
    periodStatus: ContributionPeriodStatus.CLOSED,
    distributableAmountInPence: 850_000,
    requirements: [],
    evidence: [],
    participants: [
      {
        participantId: "p1",
        contributorId: "studio",
        contributorDisplayName: "ApingX Studio",
        credentialId: "c1",
        credentialNumber: 1,
        collectionId: "col",
        collectionNumber: 1,
        allocationBasisPoints: 500,
        agreementReference: null,
      },
      {
        participantId: "p2",
        contributorId: "studio",
        contributorDisplayName: "ApingX Studio",
        credentialId: "c3",
        credentialNumber: 3,
        collectionId: "col",
        collectionNumber: 1,
        allocationBasisPoints: 200,
        agreementReference: null,
      },
    ],
  });

  check(
    "Multiple Credentials: one line per participant/credential",
    multiCredentialPreview.success &&
      multiCredentialPreview.preview.lines.length === 2 &&
      multiCredentialPreview.preview.lines[0]?.participantId !==
        multiCredentialPreview.preview.lines[1]?.participantId,
    multiCredentialPreview.success
      ? `lines=${multiCredentialPreview.preview.lines.length}`
      : multiCredentialPreview.error,
  );

  check(
    "NQR QA derived pool equals £8,500",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 6_000_000,
      discountsInPence: 300_000,
      returnsRefundsInPence: 500_000,
      successfulChargebacksInPence: 100_000,
      vatExcludedInPence: 850_000,
      contributorPoolBasisPoints: 2_000,
    }).proposedDistributableAmountInPence === 850_000,
  );

  check(
    "Approval lifecycle: cannot approve second APPROVED calculation",
    !canApproveDistributionCalculation({
      calculationStatus: DistributionCalculationStatus.CALCULATED,
      periodStatus: ContributionPeriodStatus.CLOSED,
      distributionBasis: approvedBasis,
      calculationId: "calc-2",
      calculations: [
        {
          id: "calc-1",
          calculationSequence: 1,
          status: DistributionCalculationStatus.APPROVED,
          distributableAmountInPence: 850_000,
          calculatedAt: new Date(),
          approvedAt: new Date(),
          voidedAt: null,
          replacesCalculationId: null,
          replacedById: null,
          totalCalculatedCompensationInPence: 59_500,
        },
        {
          id: "calc-2",
          calculationSequence: 2,
          status: DistributionCalculationStatus.CALCULATED,
          distributableAmountInPence: 850_000,
          calculatedAt: new Date(),
          approvedAt: null,
          voidedAt: null,
          replacesCalculationId: null,
          replacedById: null,
          totalCalculatedCompensationInPence: 59_500,
        },
      ],
    }),
  );

  const failed = results.filter((entry) => !entry.pass);
  for (const entry of results) {
    console.log(`${entry.pass ? "PASS" : "FAIL"}: ${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exitCode = 1;
}

main();
