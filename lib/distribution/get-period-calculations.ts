import { prisma } from "@/lib/prisma";
import { sumCalculatedCompensationInPence } from "@/lib/distribution/aggregate";
import type { CalculationSummary } from "@/lib/distribution/calculation-lifecycle";

export type PeriodCalculationSummary = CalculationSummary & {
  currency: string;
  calculationVersion: string;
};

export async function getPeriodCalculations(
  contributionPeriodId: string,
): Promise<PeriodCalculationSummary[]> {
  const calculations = await prisma.distributionCalculation.findMany({
    where: { contributionPeriodId },
    orderBy: [{ calculationSequence: "desc" }],
    include: {
      lines: {
        select: {
          calculatedCompensationInPence: true,
        },
      },
      replacedBy: {
        select: {
          id: true,
        },
      },
    },
  });

  return calculations.map((calculation) => ({
    id: calculation.id,
    calculationSequence: calculation.calculationSequence,
    status: calculation.status,
    distributableAmountInPence: calculation.distributableAmountInPence,
    currency: calculation.currency,
    calculationVersion: calculation.calculationVersion,
    calculatedAt: calculation.calculatedAt,
    approvedAt: calculation.approvedAt,
    voidedAt: calculation.voidedAt,
    replacesCalculationId: calculation.replacesCalculationId,
    replacedById: calculation.replacedBy?.id ?? null,
    totalCalculatedCompensationInPence: sumCalculatedCompensationInPence(
      calculation.lines.map((line) => line.calculatedCompensationInPence),
    ),
  }));
}
