-- CreateEnum
CREATE TYPE "ContributionPeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContributionEvidenceReviewStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EligibilitySnapshotStatus" AS ENUM ('QUALIFIED', 'NOT_QUALIFIED');

-- CreateEnum
CREATE TYPE "DistributionCalculationStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'VOID');

-- CreateTable
CREATE TABLE "ContributionPeriod" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "ContributionPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "distributableAmountInPence" INTEGER,
    "distributableAmountApprovedAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionPeriodParticipant" (
    "id" TEXT NOT NULL,
    "contributionPeriodId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "agreementReference" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionPeriodParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionRequirement" (
    "id" TEXT NOT NULL,
    "contributionPeriodId" TEXT NOT NULL,
    "contributorId" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "requiredVerificationCount" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionEvidence" (
    "id" TEXT NOT NULL,
    "contributionPeriodId" TEXT NOT NULL,
    "contributionRequirementId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "referenceUrl" TEXT,
    "note" TEXT,
    "reviewStatus" "ContributionEvidenceReviewStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "ContributionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionCalculation" (
    "id" TEXT NOT NULL,
    "contributionPeriodId" TEXT NOT NULL,
    "calculationSequence" INTEGER NOT NULL,
    "status" "DistributionCalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "calculationVersion" TEXT NOT NULL,
    "distributableAmountInPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "calculatedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "replacesCalculationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionCalculationLine" (
    "id" TEXT NOT NULL,
    "distributionCalculationId" TEXT NOT NULL,
    "contributionPeriodParticipantId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "contributorDisplayNameSnapshot" TEXT NOT NULL,
    "credentialNumberSnapshot" INTEGER NOT NULL,
    "collectionNumberSnapshot" INTEGER NOT NULL,
    "allocationBasisPointsSnapshot" INTEGER NOT NULL,
    "agreementReferenceSnapshot" TEXT,
    "eligibilitySnapshot" "EligibilitySnapshotStatus" NOT NULL,
    "distributableAmountInPenceSnapshot" INTEGER NOT NULL,
    "calculatedCompensationInPence" INTEGER NOT NULL,
    "requirementAuditSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionCalculationLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContributionPeriod_collectionId_idx" ON "ContributionPeriod"("collectionId");

-- CreateIndex
CREATE INDEX "ContributionPeriod_status_idx" ON "ContributionPeriod"("status");

-- CreateIndex
CREATE INDEX "ContributionPeriod_collectionId_startDate_idx" ON "ContributionPeriod"("collectionId", "startDate");

-- CreateIndex
CREATE INDEX "ContributionPeriodParticipant_contributionPeriodId_idx" ON "ContributionPeriodParticipant"("contributionPeriodId");

-- CreateIndex
CREATE INDEX "ContributionPeriodParticipant_contributorId_idx" ON "ContributionPeriodParticipant"("contributorId");

-- CreateIndex
CREATE INDEX "ContributionPeriodParticipant_credentialId_idx" ON "ContributionPeriodParticipant"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionPeriodParticipant_contributionPeriodId_credenti_key" ON "ContributionPeriodParticipant"("contributionPeriodId", "credentialId");

-- CreateIndex
CREATE INDEX "ContributionRequirement_contributionPeriodId_idx" ON "ContributionRequirement"("contributionPeriodId");

-- CreateIndex
CREATE INDEX "ContributionRequirement_contributorId_idx" ON "ContributionRequirement"("contributorId");

-- CreateIndex
CREATE INDEX "ContributionEvidence_contributionPeriodId_contributorId_idx" ON "ContributionEvidence"("contributionPeriodId", "contributorId");

-- CreateIndex
CREATE INDEX "ContributionEvidence_contributionRequirementId_idx" ON "ContributionEvidence"("contributionRequirementId");

-- CreateIndex
CREATE INDEX "ContributionEvidence_reviewStatus_idx" ON "ContributionEvidence"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionCalculation_replacesCalculationId_key" ON "DistributionCalculation"("replacesCalculationId");

-- CreateIndex
CREATE INDEX "DistributionCalculation_contributionPeriodId_status_idx" ON "DistributionCalculation"("contributionPeriodId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionCalculation_contributionPeriodId_calculationSeq_key" ON "DistributionCalculation"("contributionPeriodId", "calculationSequence");

-- CreateIndex
CREATE INDEX "DistributionCalculationLine_distributionCalculationId_idx" ON "DistributionCalculationLine"("distributionCalculationId");

-- CreateIndex
CREATE INDEX "DistributionCalculationLine_contributionPeriodParticipantId_idx" ON "DistributionCalculationLine"("contributionPeriodParticipantId");

-- CreateIndex
CREATE INDEX "DistributionCalculationLine_contributorId_idx" ON "DistributionCalculationLine"("contributorId");

-- CreateIndex
CREATE INDEX "DistributionCalculationLine_credentialId_idx" ON "DistributionCalculationLine"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionCalculationLine_distributionCalculationId_contr_key" ON "DistributionCalculationLine"("distributionCalculationId", "contributionPeriodParticipantId");

-- AddForeignKey
ALTER TABLE "ContributionPeriod" ADD CONSTRAINT "ContributionPeriod_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionPeriodParticipant" ADD CONSTRAINT "ContributionPeriodParticipant_contributionPeriodId_fkey" FOREIGN KEY ("contributionPeriodId") REFERENCES "ContributionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionPeriodParticipant" ADD CONSTRAINT "ContributionPeriodParticipant_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionPeriodParticipant" ADD CONSTRAINT "ContributionPeriodParticipant_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionRequirement" ADD CONSTRAINT "ContributionRequirement_contributionPeriodId_fkey" FOREIGN KEY ("contributionPeriodId") REFERENCES "ContributionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionRequirement" ADD CONSTRAINT "ContributionRequirement_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvidence" ADD CONSTRAINT "ContributionEvidence_contributionPeriodId_fkey" FOREIGN KEY ("contributionPeriodId") REFERENCES "ContributionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvidence" ADD CONSTRAINT "ContributionEvidence_contributionRequirementId_fkey" FOREIGN KEY ("contributionRequirementId") REFERENCES "ContributionRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvidence" ADD CONSTRAINT "ContributionEvidence_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculation" ADD CONSTRAINT "DistributionCalculation_contributionPeriodId_fkey" FOREIGN KEY ("contributionPeriodId") REFERENCES "ContributionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculation" ADD CONSTRAINT "DistributionCalculation_replacesCalculationId_fkey" FOREIGN KEY ("replacesCalculationId") REFERENCES "DistributionCalculation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculationLine" ADD CONSTRAINT "DistributionCalculationLine_distributionCalculationId_fkey" FOREIGN KEY ("distributionCalculationId") REFERENCES "DistributionCalculation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculationLine" ADD CONSTRAINT "DistributionCalculationLine_contributionPeriodParticipantI_fkey" FOREIGN KEY ("contributionPeriodParticipantId") REFERENCES "ContributionPeriodParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculationLine" ADD CONSTRAINT "DistributionCalculationLine_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculationLine" ADD CONSTRAINT "DistributionCalculationLine_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCalculationLine" ADD CONSTRAINT "DistributionCalculationLine_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
