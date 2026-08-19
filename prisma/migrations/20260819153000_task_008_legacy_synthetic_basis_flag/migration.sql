-- Explicit flag for migration backfill placeholders (not inferred at runtime).
ALTER TABLE "DistributionBasis"
ADD COLUMN "isLegacySyntheticPlaceholder" BOOLEAN NOT NULL DEFAULT false;

-- One-time classification of records created by the distribution basis backfill.
UPDATE "DistributionBasis"
SET "isLegacySyntheticPlaceholder" = true
WHERE "contributorPoolBasisPoints" = 10000
  AND "discountsInPence" = 0
  AND "returnsRefundsInPence" = 0
  AND "successfulChargebacksInPence" = 0
  AND "vatExcludedInPence" = 0
  AND "grossQualifyingProductSalesInPence" = "retainedProductRevenueInPence"
  AND "grossQualifyingProductSalesInPence" = "netQualifyingRevenueInPence"
  AND "grossQualifyingProductSalesInPence" = "proposedDistributableAmountInPence";
