-- Enforce at most one active CALCULATED calculation per Contribution Period.
CREATE UNIQUE INDEX "DistributionCalculation_one_calculated_per_period"
ON "DistributionCalculation" ("contributionPeriodId")
WHERE "status" = 'CALCULATED';

-- Enforce at most one APPROVED calculation per Contribution Period.
CREATE UNIQUE INDEX "DistributionCalculation_one_approved_per_period"
ON "DistributionCalculation" ("contributionPeriodId")
WHERE "status" = 'APPROVED';
