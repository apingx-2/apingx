import { prisma } from "@/lib/prisma";

import { calculateUnallocatedRemainderInPence } from "@/lib/distribution/calculate-compensation";

import { sumCalculatedCompensationInPence } from "@/lib/distribution/aggregate";

import { sumQualifiedAllocationBasisPoints } from "@/lib/distribution/allocation";

import { EligibilitySnapshotStatus } from "@prisma/client";



export type DistributionBasisDetail = {

  id: string;

  currency: string;

  grossQualifyingProductSalesInPence: number;

  discountsInPence: number;

  returnsRefundsInPence: number;

  successfulChargebacksInPence: number;

  retainedProductRevenueInPence: number;

  vatExcludedInPence: number;

  netQualifyingRevenueInPence: number;

  contributorPoolBasisPoints: number;

  proposedDistributableAmountInPence: number;

  reconciliationCutoffAt: Date;

  basisVersion: string;

  isLegacySyntheticPlaceholder: boolean;

  approvedAt: Date | null;

};



export type DistributionCalculationDetail = {

  id: string;

  contributionPeriodId: string;

  calculationSequence: number;

  status: "DRAFT" | "CALCULATED" | "APPROVED" | "VOID";

  calculationVersion: string;

  distributableAmountInPence: number;

  currency: string;

  calculatedAt: Date | null;

  approvedAt: Date | null;

  voidedAt: Date | null;

  voidReason: string | null;

  replacesCalculationId: string | null;

  replacedById: string | null;

  distributionBasisId: string | null;

  distributionBasis: DistributionBasisDetail | null;

  period: {

    id: string;

    title: string;

    status: "DRAFT" | "OPEN" | "CLOSED";

    collection: {

      id: string;

      collectionNumber: number;

      name: string;

    };

  };

  lines: Array<{

    id: string;

    contributorDisplayNameSnapshot: string;

    credentialNumberSnapshot: number;

    collectionNumberSnapshot: number;

    agreementReferenceSnapshot: string | null;

    allocationBasisPointsSnapshot: number;

    eligibilitySnapshot: EligibilitySnapshotStatus;

    distributableAmountInPenceSnapshot: number;

    calculatedCompensationInPence: number;

    requirementAuditSnapshot: unknown;

  }>;

  totalCalculatedCompensationInPence: number;

  unallocatedRemainderInPence: number;

  totalQualifiedAllocationBasisPoints: number;

};



export type GetDistributionCalculationByIdResult =

  | { status: "success"; calculation: DistributionCalculationDetail }

  | { status: "not_found" }

  | { status: "unavailable" };



function mapDistributionBasis(

  basis: {

    id: string;

    currency: string;

    grossQualifyingProductSalesInPence: number;

    discountsInPence: number;

    returnsRefundsInPence: number;

    successfulChargebacksInPence: number;

    retainedProductRevenueInPence: number;

    vatExcludedInPence: number;

    netQualifyingRevenueInPence: number;

    contributorPoolBasisPoints: number;

    proposedDistributableAmountInPence: number;

    reconciliationCutoffAt: Date;

    basisVersion: string;

    isLegacySyntheticPlaceholder: boolean;

    approvedAt: Date | null;

  } | null,

): DistributionBasisDetail | null {

  if (!basis) {

    return null;

  }



  return {

    id: basis.id,

    currency: basis.currency,

    grossQualifyingProductSalesInPence: basis.grossQualifyingProductSalesInPence,

    discountsInPence: basis.discountsInPence,

    returnsRefundsInPence: basis.returnsRefundsInPence,

    successfulChargebacksInPence: basis.successfulChargebacksInPence,

    retainedProductRevenueInPence: basis.retainedProductRevenueInPence,

    vatExcludedInPence: basis.vatExcludedInPence,

    netQualifyingRevenueInPence: basis.netQualifyingRevenueInPence,

    contributorPoolBasisPoints: basis.contributorPoolBasisPoints,

    proposedDistributableAmountInPence: basis.proposedDistributableAmountInPence,

    reconciliationCutoffAt: basis.reconciliationCutoffAt,

    basisVersion: basis.basisVersion,

    isLegacySyntheticPlaceholder: basis.isLegacySyntheticPlaceholder,

    approvedAt: basis.approvedAt,

  };

}



export async function getDistributionCalculationById(

  id: string,

): Promise<GetDistributionCalculationByIdResult> {

  if (!process.env.DATABASE_URL) {

    return { status: "unavailable" };

  }



  try {

    const calculation = await prisma.distributionCalculation.findUnique({

      where: { id },

      include: {

        contributionPeriod: {

          select: {

            id: true,

            title: true,

            status: true,

            collection: {

              select: {

                id: true,

                collectionNumber: true,

                name: true,

              },

            },

          },

        },

        distributionBasis: true,

        lines: {

          orderBy: [

            { contributorDisplayNameSnapshot: "asc" },

            { credentialNumberSnapshot: "asc" },

          ],

        },

        replacedBy: {

          select: { id: true },

        },

      },

    });



    if (!calculation) {

      return { status: "not_found" };

    }



    const compensationAmounts = calculation.lines.map(

      (line) => line.calculatedCompensationInPence,

    );



    const totalCalculatedCompensationInPence =

      sumCalculatedCompensationInPence(compensationAmounts);



    const totalQualifiedAllocationBasisPoints = sumQualifiedAllocationBasisPoints(

      calculation.lines.map((line) => ({

        allocationBasisPoints: line.allocationBasisPointsSnapshot,

        qualified:

          line.eligibilitySnapshot === EligibilitySnapshotStatus.QUALIFIED,

      })),

    );



    return {

      status: "success",

      calculation: {

        id: calculation.id,

        contributionPeriodId: calculation.contributionPeriodId,

        calculationSequence: calculation.calculationSequence,

        status: calculation.status,

        calculationVersion: calculation.calculationVersion,

        distributableAmountInPence: calculation.distributableAmountInPence,

        currency: calculation.currency,

        calculatedAt: calculation.calculatedAt,

        approvedAt: calculation.approvedAt,

        voidedAt: calculation.voidedAt,

        voidReason: calculation.voidReason,

        replacesCalculationId: calculation.replacesCalculationId,

        replacedById: calculation.replacedBy?.id ?? null,

        distributionBasisId: calculation.distributionBasisId,

        distributionBasis: mapDistributionBasis(calculation.distributionBasis),

        period: {

          id: calculation.contributionPeriod.id,

          title: calculation.contributionPeriod.title,

          status: calculation.contributionPeriod.status,

          collection: calculation.contributionPeriod.collection,

        },

        lines: calculation.lines.map((line) => ({

          id: line.id,

          contributorDisplayNameSnapshot: line.contributorDisplayNameSnapshot,

          credentialNumberSnapshot: line.credentialNumberSnapshot,

          collectionNumberSnapshot: line.collectionNumberSnapshot,

          agreementReferenceSnapshot: line.agreementReferenceSnapshot,

          allocationBasisPointsSnapshot: line.allocationBasisPointsSnapshot,

          eligibilitySnapshot: line.eligibilitySnapshot,

          distributableAmountInPenceSnapshot: line.distributableAmountInPenceSnapshot,

          calculatedCompensationInPence: line.calculatedCompensationInPence,

          requirementAuditSnapshot: line.requirementAuditSnapshot,

        })),

        totalCalculatedCompensationInPence,

        unallocatedRemainderInPence: calculateUnallocatedRemainderInPence(

          calculation.distributableAmountInPence,

          compensationAmounts,

        ),

        totalQualifiedAllocationBasisPoints,

      },

    };

  } catch (error) {

    console.error(

      "[distribution] Failed to retrieve distribution calculation",

      error instanceof Error ? error.message : "Unknown error",

    );

    return { status: "unavailable" };

  }

}
