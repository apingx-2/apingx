/**
 * Task 008 Distribution Basis / Net Qualifying Revenue verification.
 *
 * Usage: npx tsx scripts/distribution/verify-distribution-basis.ts
 */

import { ContributionPeriodStatus } from "@prisma/client";
import { calculateCompensationInPence } from "@/lib/distribution/calculate-compensation";
import { deriveContributorEligibility } from "@/lib/distribution/eligibility";
import {
  deriveDistributionBasis,
  validateDistributionBasisInput,
} from "@/lib/distribution/distribution-basis";
import {
  parseBasisMoneyInputToPence,
  upsertDistributionBasisSchema,
} from "@/lib/distribution/schemas";
import {
  canApproveDistributionBasis,
  canEditDistributionBasis,
} from "@/lib/distribution/basis-lifecycle";
import { isLegacySyntheticDistributionBasis } from "@/lib/distribution/is-legacy-synthetic-basis";
import { buildDistributionPreview } from "@/lib/distribution/preview-calculation";

type CheckResult = {
  name: string;
  pass: boolean;
  detail?: string;
};

const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

const QA_GROSS = 6_000_000;
const QA_DISCOUNTS = 300_000;
const QA_RETURNS = 500_000;
const QA_CHARGEBACKS = 100_000;
const QA_VAT = 850_000;
const QA_POOL_BPS = 2_000;
const QA_NQR = 4_250_000;
const QA_PROPOSED = 850_000;

function main() {
  const qaDerived = deriveDistributionBasis({
    grossQualifyingProductSalesInPence: QA_GROSS,
    discountsInPence: QA_DISCOUNTS,
    returnsRefundsInPence: QA_RETURNS,
    successfulChargebacksInPence: QA_CHARGEBACKS,
    vatExcludedInPence: QA_VAT,
    contributorPoolBasisPoints: QA_POOL_BPS,
  });

  check(
    "Basis 1: QA worked example derived values",
    qaDerived.retainedProductRevenueInPence === 5_100_000 &&
      qaDerived.netQualifyingRevenueInPence === QA_NQR &&
      qaDerived.proposedDistributableAmountInPence === QA_PROPOSED,
    JSON.stringify(qaDerived),
  );

  check(
    "Basis 2: discounts reduce retained revenue",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 1_000_000,
      discountsInPence: 100_000,
      returnsRefundsInPence: 0,
      successfulChargebacksInPence: 0,
      vatExcludedInPence: 0,
      contributorPoolBasisPoints: 10_000,
    }).retainedProductRevenueInPence === 900_000,
  );

  check(
    "Basis 3: refunds reduce retained revenue",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 1_000_000,
      discountsInPence: 0,
      returnsRefundsInPence: 50_000,
      successfulChargebacksInPence: 0,
      vatExcludedInPence: 0,
      contributorPoolBasisPoints: 10_000,
    }).retainedProductRevenueInPence === 950_000,
  );

  check(
    "Basis 4: successful chargebacks reduce retained revenue",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 1_000_000,
      discountsInPence: 0,
      returnsRefundsInPence: 0,
      successfulChargebacksInPence: 25_000,
      vatExcludedInPence: 0,
      contributorPoolBasisPoints: 10_000,
    }).retainedProductRevenueInPence === 975_000,
  );

  check(
    "Basis 5: VAT excluded after retained product revenue",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 1_000_000,
      discountsInPence: 0,
      returnsRefundsInPence: 0,
      successfulChargebacksInPence: 0,
      vatExcludedInPence: 200_000,
      contributorPoolBasisPoints: 10_000,
    }).netQualifyingRevenueInPence === 800_000,
  );

  check(
    "Basis 6: pool bps 0 yields zero proposed distributable amount",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 1_000_000,
      discountsInPence: 0,
      returnsRefundsInPence: 0,
      successfulChargebacksInPence: 0,
      vatExcludedInPence: 0,
      contributorPoolBasisPoints: 0,
    }).proposedDistributableAmountInPence === 0,
  );

  check(
    "Basis 7: pool bps 10000 yields full NQR as proposed amount",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 1_000_000,
      discountsInPence: 0,
      returnsRefundsInPence: 0,
      successfulChargebacksInPence: 0,
      vatExcludedInPence: 0,
      contributorPoolBasisPoints: 10_000,
    }).proposedDistributableAmountInPence === 1_000_000,
  );

  const negativeCheck = validateDistributionBasisInput({
    grossQualifyingProductSalesInPence: -1,
    discountsInPence: 0,
    returnsRefundsInPence: 0,
    successfulChargebacksInPence: 0,
    vatExcludedInPence: 0,
    contributorPoolBasisPoints: 2_000,
  });
  check(
    "Basis 8: invalid negative values rejected",
    !negativeCheck.valid,
    negativeCheck.valid ? undefined : negativeCheck.error,
  );

  const vatTooHigh = validateDistributionBasisInput({
    grossQualifyingProductSalesInPence: 100_000,
    discountsInPence: 0,
    returnsRefundsInPence: 0,
    successfulChargebacksInPence: 0,
    vatExcludedInPence: 200_000,
    contributorPoolBasisPoints: 2_000,
  });
  check(
    "Basis 9: VAT > retained revenue rejected",
    !vatTooHigh.valid,
    vatTooHigh.valid ? undefined : vatTooHigh.error,
  );

  check(
    "Basis 10: BigInt floor rounding on proposed amount",
    deriveDistributionBasis({
      grossQualifyingProductSalesInPence: 10_003,
      discountsInPence: 0,
      returnsRefundsInPence: 0,
      successfulChargebacksInPence: 0,
      vatExcludedInPence: 0,
      contributorPoolBasisPoints: 1,
    }).proposedDistributableAmountInPence === 1,
  );

  check(
    "Calc 11: £8,500 pool with 500 + 200 qualified bps → £425 + £170",
    calculateCompensationInPence(QA_PROPOSED, 500) === 42_500 &&
      calculateCompensationInPence(QA_PROPOSED, 200) === 17_000,
    `500→${calculateCompensationInPence(QA_PROPOSED, 500)}, 200→${calculateCompensationInPence(QA_PROPOSED, 200)}`,
  );

  const qaPreview = buildDistributionPreview({
    periodStatus: ContributionPeriodStatus.CLOSED,
    distributableAmountInPence: QA_PROPOSED,
    requirements: [
      {
        id: "req-studio",
        contributorId: null,
        label: "Studio contribution",
        requiredVerificationCount: 1,
      },
      {
        id: "req-archive",
        contributorId: "contributor-archive",
        label: "Archive contribution",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "req-studio",
        contributorId: "contributor-studio",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
    ],
    participants: [
      {
        participantId: "p-001",
        contributorId: "contributor-studio",
        contributorDisplayName: "ApingX Studio",
        credentialId: "cred-001",
        credentialNumber: 1,
        collectionId: "col-1",
        collectionNumber: 1,
        allocationBasisPoints: 500,
        agreementReference: null,
      },
      {
        participantId: "p-003",
        contributorId: "contributor-studio",
        contributorDisplayName: "ApingX Studio",
        credentialId: "cred-003",
        credentialNumber: 3,
        collectionId: "col-1",
        collectionNumber: 1,
        allocationBasisPoints: 200,
        agreementReference: null,
      },
      {
        participantId: "p-004",
        contributorId: "contributor-archive",
        contributorDisplayName: "Archive Collaborator",
        credentialId: "cred-004",
        credentialNumber: 4,
        collectionId: "col-1",
        collectionNumber: 1,
        allocationBasisPoints: 750,
        agreementReference: null,
      },
    ],
  });

  const line001 = qaPreview.success
    ? qaPreview.preview.lines.find((line) => line.credentialNumber === 1)
    : undefined;
  const line003 = qaPreview.success
    ? qaPreview.preview.lines.find((line) => line.credentialNumber === 3)
    : undefined;
  const line004 = qaPreview.success
    ? qaPreview.preview.lines.find((line) => line.credentialNumber === 4)
    : undefined;

  check(
    "Calc 11b: QA preview £425 + £170 = £595 total compensation",
    qaPreview.success &&
      line001?.calculatedCompensationInPence === 42_500 &&
      line003?.calculatedCompensationInPence === 17_000 &&
      qaPreview.preview.totalCalculatedCompensationInPence === 59_500,
    qaPreview.success
      ? `001=${line001?.calculatedCompensationInPence}, 003=${line003?.calculatedCompensationInPence}, total=${qaPreview.preview.totalCalculatedCompensationInPence}`
      : qaPreview.error,
  );

  check(
    "Calc 12: NOT_QUALIFIED 750 bps = £0",
    qaPreview.success && line004?.calculatedCompensationInPence === 0,
    qaPreview.success
      ? `004 compensation=${line004?.calculatedCompensationInPence}, eligibility=${line004?.eligibility}`
      : qaPreview.error,
  );

  check(
    "Calc 13: remainder = £7,905",
    qaPreview.success &&
      qaPreview.preview.unallocatedRemainderInPence === 790_500,
    qaPreview.success
      ? `remainder=${qaPreview.preview.unallocatedRemainderInPence}`
      : qaPreview.error,
  );

  const eligibilityBeforeReturns = deriveContributorEligibility({
    periodStatus: ContributionPeriodStatus.CLOSED,
    requirements: [
      {
        id: "req-1",
        contributorId: "contributor-a",
        label: "Deliverable",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "req-1",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
    ],
    contributorId: "contributor-a",
  });

  const basisWithHeavyReturns = deriveDistributionBasis({
    grossQualifyingProductSalesInPence: QA_GROSS,
    discountsInPence: QA_DISCOUNTS,
    returnsRefundsInPence: QA_RETURNS,
    successfulChargebacksInPence: QA_CHARGEBACKS,
    vatExcludedInPence: QA_VAT,
    contributorPoolBasisPoints: QA_POOL_BPS,
  });

  check(
    "Calc 14: returns reduce NQR but do not affect eligibility state",
    eligibilityBeforeReturns === "QUALIFIED" &&
      basisWithHeavyReturns.netQualifyingRevenueInPence === QA_NQR,
    `eligibility=${eligibilityBeforeReturns}, nqr=${basisWithHeavyReturns.netQualifyingRevenueInPence}`,
  );

  const rawFormInput = {
    contributionPeriodId: "period-test",
    grossQualifyingProductSalesGbp: "60000",
    discountsGbp: "3000",
    returnsRefundsGbp: "5000",
    successfulChargebacksGbp: "1000",
    vatExcludedGbp: "8500",
    contributorPoolBasisPoints: "2000",
    reconciliationCutoffAt: "2026-01-31T23:59",
  };

  const rawParse = upsertDistributionBasisSchema.safeParse(rawFormInput);

  check(
    "Schema: raw HTML-style GBP strings parse without type errors",
    rawParse.success,
    rawParse.success ? undefined : JSON.stringify(rawParse.error.flatten().fieldErrors),
  );

  if (rawParse.success) {
    const domainValidation = validateDistributionBasisInput({
      grossQualifyingProductSalesInPence: rawParse.data.grossQualifyingProductSalesGbp,
      discountsInPence: rawParse.data.discountsGbp,
      returnsRefundsInPence: rawParse.data.returnsRefundsGbp,
      successfulChargebacksInPence: rawParse.data.successfulChargebacksGbp,
      vatExcludedInPence: rawParse.data.vatExcludedGbp,
      contributorPoolBasisPoints: rawParse.data.contributorPoolBasisPoints,
    });

    check(
      "Schema: raw browser QA input derives retained £51,000 / NQR £42,500 / pool £8,500",
      domainValidation.valid &&
        domainValidation.derived.retainedProductRevenueInPence === 5_100_000 &&
        domainValidation.derived.netQualifyingRevenueInPence === QA_NQR &&
        domainValidation.derived.proposedDistributableAmountInPence === QA_PROPOSED,
      domainValidation.valid
        ? JSON.stringify(domainValidation.derived)
        : domainValidation.error,
    );

    const reparse = upsertDistributionBasisSchema.safeParse(rawParse.data);

    check(
      "Schema: already-normalized pence/Date values re-parse without type errors",
      reparse.success,
      reparse.success ? undefined : JSON.stringify(reparse.error.flatten().fieldErrors),
    );
  }

  check(
    "Schema: zero string amounts are valid and not treated as empty",
    parseBasisMoneyInputToPence("0") === 0 &&
      upsertDistributionBasisSchema.safeParse({
        ...rawFormInput,
        discountsGbp: "0",
        returnsRefundsGbp: "0",
        successfulChargebacksGbp: "0",
        vatExcludedGbp: "0",
      }).success,
  );

  check(
    "Schema: normalized zero pence re-parses",
    upsertDistributionBasisSchema.safeParse({
      contributionPeriodId: "period-test",
      grossQualifyingProductSalesGbp: 6_000_000,
      discountsGbp: 0,
      returnsRefundsGbp: 0,
      successfulChargebacksGbp: 0,
      vatExcludedGbp: 0,
      contributorPoolBasisPoints: 2000,
      reconciliationCutoffAt: new Date("2026-01-31T23:59:00"),
    }).success,
  );

  const reconciledBasis = {
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
    reconciliationCutoffAt: new Date("2026-01-31T23:59:00Z"),
    isLegacySyntheticPlaceholder: false,
    approvedAt: null,
  };

  check(
    "Lifecycle: reconciled genuine basis is not legacy synthetic",
    !isLegacySyntheticDistributionBasis(reconciledBasis),
  );

  check(
    "Lifecycle: reconciled genuine basis can be approved when CLOSED",
    canApproveDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: reconciledBasis,
      currency: "GBP",
    }),
  );

  check(
    "Lifecycle: unapproved legacy placeholder can still be edited",
    canEditDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: {
        approvedAt: null,
      },
    }),
  );

  const genuineFullPoolBasis = {
    ...reconciledBasis,
    discountsInPence: 0,
    returnsRefundsInPence: 0,
    successfulChargebacksInPence: 0,
    vatExcludedInPence: 0,
    grossQualifyingProductSalesInPence: 1_000_000,
    retainedProductRevenueInPence: 1_000_000,
    netQualifyingRevenueInPence: 1_000_000,
    contributorPoolBasisPoints: 10_000,
    proposedDistributableAmountInPence: 1_000_000,
    isLegacySyntheticPlaceholder: false,
  };

  check(
    "Lifecycle: genuine 100% pool with zero deductions is not synthetic",
    !isLegacySyntheticDistributionBasis(genuineFullPoolBasis) &&
      canApproveDistributionBasis({
        periodStatus: ContributionPeriodStatus.CLOSED,
        basis: genuineFullPoolBasis,
        currency: "GBP",
      }),
  );

  check(
    "Lifecycle: approved basis cannot be edited",
    !canEditDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: {
        approvedAt: new Date("2026-02-01T10:00:00Z"),
      },
    }),
  );

  check(
    "Lifecycle: approved basis cannot be approved again",
    !canApproveDistributionBasis({
      periodStatus: ContributionPeriodStatus.CLOSED,
      basis: {
        ...reconciledBasis,
        approvedAt: new Date("2026-02-01T10:00:00Z"),
      },
      currency: "GBP",
    }),
  );

  const failed = results.filter((entry) => !entry.pass);

  for (const entry of results) {
    const status = entry.pass ? "PASS" : "FAIL";
    console.log(`${status}: ${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`);
  }

  console.log("");
  console.log(`${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
