-- AlterTable
ALTER TABLE "ContributionEvidence" ADD COLUMN     "invalidatedAt" TIMESTAMP(3),
ADD COLUMN     "invalidationReason" TEXT;
