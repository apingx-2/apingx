-- CreateTable
CREATE TABLE "DistributionBasis" (
    "id" TEXT NOT NULL,
    "contributionPeriodId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "grossQualifyingProductSalesInPence" INTEGER NOT NULL,
    "discountsInPence" INTEGER NOT NULL DEFAULT 0,
    "returnsRefundsInPence" INTEGER NOT NULL DEFAULT 0,
    "successfulChargebacksInPence" INTEGER NOT NULL DEFAULT 0,
    "retainedProductRevenueInPence" INTEGER NOT NULL,
    "vatExcludedInPence" INTEGER NOT NULL DEFAULT 0,
    "netQualifyingRevenueInPence" INTEGER NOT NULL,
    "contributorPoolBasisPoints" INTEGER NOT NULL,
    "proposedDistributableAmountInPence" INTEGER NOT NULL,
    "reconciliationCutoffAt" TIMESTAMP(3) NOT NULL,
    "basisVersion" TEXT NOT NULL DEFAULT 'distribution-basis-v1',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionBasis_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "DistributionCalculation" ADD COLUMN "distributionBasisId" TEXT;

-- Backfill legacy Distribution Basis records from ContributionPeriod pool fields.
INSERT INTO "DistributionBasis" (
    "id",
    "contributionPeriodId",
    "currency",
    "grossQualifyingProductSalesInPence",
    "discountsInPence",
    "returnsRefundsInPence",
    "successfulChargebacksInPence",
    "retainedProductRevenueInPence",
    "vatExcludedInPence",
    "netQualifyingRevenueInPence",
    "contributorPoolBasisPoints",
    "proposedDistributableAmountInPence",
    "reconciliationCutoffAt",
    "basisVersion",
    "approvedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    cp."id",
    cp."currency",
    cp."distributableAmountInPence",
    0,
    0,
    0,
    cp."distributableAmountInPence",
    0,
    cp."distributableAmountInPence",
    10000,
    cp."distributableAmountInPence",
    COALESCE(cp."distributableAmountApprovedAt", cp."updatedAt"),
    'distribution-basis-v1',
    cp."distributableAmountApprovedAt",
    cp."updatedAt",
    cp."updatedAt"
FROM "ContributionPeriod" cp
WHERE cp."distributableAmountInPence" IS NOT NULL;

-- Link existing calculations to backfilled basis where possible.
UPDATE "DistributionCalculation" dc
SET "distributionBasisId" = db."id"
FROM "DistributionBasis" db
WHERE db."contributionPeriodId" = dc."contributionPeriodId"
  AND dc."distributionBasisId" IS NULL;

-- Drop legacy pool fields from ContributionPeriod.
ALTER TABLE "ContributionPeriod" DROP COLUMN "distributableAmountInPence",
DROP COLUMN "distributableAmountApprovedAt";

-- CreateIndex
CREATE UNIQUE INDEX "DistributionBasis_contributionPeriodId_key" ON "DistributionBasis"("contributionPeriodId");

-- CreateIndex
CREATE INDEX "DistributionBasis_contributionPeriodId_idx" ON "DistributionBasis"("contributionPeriodId");

-- CreateIndex
CREATE INDEX "DistributionBasis_approvedAt_idx" ON "DistributionBasis"("approvedAt");

-- CreateIndex
CREATE INDEX "DistributionCalculation_distributionBasisId_idx" ON "DistributionCalculation"("distributionBasisId");

-- AddForeignKey
ALTER TABLE "DistributionBasis" ADD CONSTRAINT "DistributionBasis_contributionPeriodId_fkey" FOREIGN KEY ("contributionPeriodId") REFERENCES "ContributionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculation" ADD CONSTRAINT "DistributionCalculation_distributionBasisId_fkey" FOREIGN KEY ("distributionBasisId") REFERENCES "DistributionBasis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
