import { prisma } from "@/lib/prisma";
import { derivePeriodContributorEligibility } from "@/lib/distribution/derive-period-eligibility";
import {
  buildEvidenceProgressSummaries,
  type EvidenceProgressEntry,
} from "@/lib/distribution/evidence-progress";

export type ContributionPeriodDetail = {
  id: string;
  collectionId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: "DRAFT" | "OPEN" | "CLOSED";
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  distributionBasis: {
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
  } | null;
  collection: {
    id: string;
    collectionNumber: number;
    name: string;
  };
  participants: Array<{
    id: string;
    agreementReference: string | null;
    enrolledAt: Date;
    contributor: {
      id: string;
      displayName: string;
    };
    credential: {
      id: string;
      credentialNumber: number;
      type: "FOUNDER" | "CONTRIBUTOR";
      allocationBasisPoints: number;
    };
  }>;
  requirements: Array<{
    id: string;
    label: string;
    description: string | null;
    requiredVerificationCount: number;
    sortOrder: number;
    contributor: {
      id: string;
      displayName: string;
    } | null;
    evidenceCount: number;
  }>;
  evidence: Array<{
    id: string;
    referenceUrl: string | null;
    note: string | null;
    reviewStatus: "PENDING" | "VERIFIED" | "REJECTED";
    submittedAt: Date;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    invalidatedAt: Date | null;
    invalidationReason: string | null;
    contributor: {
      id: string;
      displayName: string;
    };
    requirement: {
      id: string;
      label: string;
    };
  }>;
  contributorEligibility: Array<{
    contributorId: string;
    contributorDisplayName: string;
    eligibility: "PENDING" | "QUALIFIED" | "NOT_QUALIFIED";
  }>;
  evidenceProgress: EvidenceProgressEntry[];
  calculationCount: number;
};

export type GetContributionPeriodByIdResult =
  | { status: "success"; period: ContributionPeriodDetail }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function getContributionPeriodById(
  id: string,
): Promise<GetContributionPeriodByIdResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[distribution] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            collectionNumber: true,
            name: true,
          },
        },
        participants: {
          orderBy: [
            { contributor: { displayName: "asc" } },
            { credential: { credentialNumber: "asc" } },
          ],
          include: {
            contributor: {
              select: {
                id: true,
                displayName: true,
              },
            },
            credential: {
              select: {
                id: true,
                credentialNumber: true,
                type: true,
                allocationBasisPoints: true,
              },
            },
          },
        },
        requirements: {
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          include: {
            contributor: {
              select: {
                id: true,
                displayName: true,
              },
            },
            _count: {
              select: {
                evidence: true,
              },
            },
          },
        },
        evidence: {
          orderBy: [{ submittedAt: "desc" }],
          include: {
            contributor: {
              select: {
                id: true,
                displayName: true,
              },
            },
            contributionRequirement: {
              select: {
                id: true,
                label: true,
              },
            },
          },
        },
        distributionBasis: true,
        _count: {
          select: {
            calculations: true,
          },
        },
      },
    });

    if (!period) {
      return { status: "not_found" };
    }

    const contributorEligibility = derivePeriodContributorEligibility({
      periodStatus: period.status,
      requirements: period.requirements.map((requirement) => ({
        id: requirement.id,
        contributorId: requirement.contributorId,
        label: requirement.label,
        requiredVerificationCount: requirement.requiredVerificationCount,
      })),
      evidence: period.evidence.map((entry) => ({
        contributionRequirementId: entry.contributionRequirementId,
        contributorId: entry.contributorId,
        reviewStatus: entry.reviewStatus,
        invalidatedAt: entry.invalidatedAt,
      })),
      participants: period.participants.map((participant) => ({
        contributorId: participant.contributorId,
        contributorDisplayName: participant.contributor.displayName,
      })),
    });

    const evidenceProgress = buildEvidenceProgressSummaries({
      requirements: period.requirements.map((requirement) => ({
        id: requirement.id,
        contributorId: requirement.contributorId,
        label: requirement.label,
        requiredVerificationCount: requirement.requiredVerificationCount,
      })),
      evidence: period.evidence.map((entry) => ({
        contributionRequirementId: entry.contributionRequirementId,
        contributorId: entry.contributorId,
        reviewStatus: entry.reviewStatus,
        invalidatedAt: entry.invalidatedAt,
      })),
      participants: period.participants.map((participant) => ({
        contributorId: participant.contributorId,
        contributorDisplayName: participant.contributor.displayName,
      })),
    });

    return {
      status: "success",
      period: {
        id: period.id,
        collectionId: period.collectionId,
        title: period.title,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        currency: period.currency,
        createdAt: period.createdAt,
        updatedAt: period.updatedAt,
        distributionBasis: period.distributionBasis,
        collection: period.collection,
        participants: period.participants.map((participant) => ({
          id: participant.id,
          agreementReference: participant.agreementReference,
          enrolledAt: participant.enrolledAt,
          contributor: participant.contributor,
          credential: participant.credential,
        })),
        requirements: period.requirements.map((requirement) => ({
          id: requirement.id,
          label: requirement.label,
          description: requirement.description,
          requiredVerificationCount: requirement.requiredVerificationCount,
          sortOrder: requirement.sortOrder,
          contributor: requirement.contributor,
          evidenceCount: requirement._count.evidence,
        })),
        evidence: period.evidence.map((entry) => ({
          id: entry.id,
          referenceUrl: entry.referenceUrl,
          note: entry.note,
          reviewStatus: entry.reviewStatus,
          submittedAt: entry.submittedAt,
          reviewedAt: entry.reviewedAt,
          rejectionReason: entry.rejectionReason,
          invalidatedAt: entry.invalidatedAt,
          invalidationReason: entry.invalidationReason,
          contributor: entry.contributor,
          requirement: {
            id: entry.contributionRequirement.id,
            label: entry.contributionRequirement.label,
          },
        })),
        contributorEligibility,
        evidenceProgress,
        calculationCount: period._count.calculations,
      },
    };
  } catch (error) {
    console.error(
      "[distribution] Failed to retrieve contribution period",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
