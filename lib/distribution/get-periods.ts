import { prisma } from "@/lib/prisma";
import {
  derivePeriodContributorEligibility,
  summarizeEligibility,
} from "@/lib/distribution/derive-period-eligibility";

export type ContributionPeriodListItem = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: "DRAFT" | "OPEN" | "CLOSED";
  approvedDistributableAmountInPence: number | null;
  currency: string;
  collection: {
    id: string;
    collectionNumber: number;
    name: string;
  };
  participantCount: number;
  eligibilitySummary: {
    qualified: number;
    pending: number;
    notQualified: number;
  };
};

export type GetContributionPeriodsResult =
  | { status: "success"; periods: ContributionPeriodListItem[] }
  | { status: "unavailable" };

export async function getContributionPeriods(): Promise<GetContributionPeriodsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[distribution] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const periods = await prisma.contributionPeriod.findMany({
      orderBy: [{ startDate: "desc" }, { title: "asc" }],
      include: {
        collection: {
          select: {
            id: true,
            collectionNumber: true,
            name: true,
          },
        },
        participants: {
          select: {
            contributorId: true,
            contributor: {
              select: {
                displayName: true,
              },
            },
          },
        },
        requirements: {
          select: {
            id: true,
            contributorId: true,
            label: true,
            requiredVerificationCount: true,
          },
        },
        evidence: {
          select: {
            contributionRequirementId: true,
            contributorId: true,
            reviewStatus: true,
            invalidatedAt: true,
          },
        },
        distributionBasis: {
          select: {
            approvedAt: true,
            proposedDistributableAmountInPence: true,
          },
        },
      },
    });

    return {
      status: "success",
      periods: periods.map((period) => {
        const eligibility = derivePeriodContributorEligibility({
          periodStatus: period.status,
          requirements: period.requirements,
          evidence: period.evidence,
          participants: period.participants.map((participant) => ({
            contributorId: participant.contributorId,
            contributorDisplayName: participant.contributor.displayName,
          })),
        });

        return {
          id: period.id,
          title: period.title,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
          approvedDistributableAmountInPence:
            period.distributionBasis?.approvedAt != null
              ? period.distributionBasis.proposedDistributableAmountInPence
              : null,
          currency: period.currency,
          collection: period.collection,
          participantCount: period.participants.length,
          eligibilitySummary: summarizeEligibility(eligibility),
        };
      }),
    };
  } catch (error) {
    console.error(
      "[distribution] Failed to retrieve contribution periods",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
