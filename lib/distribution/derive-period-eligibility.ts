import { ContributionPeriodStatus } from "@prisma/client";
import { deriveContributorEligibility } from "@/lib/distribution/eligibility";
import type {
  DerivedContributorEligibility,
  DistributionEvidenceInput,
  DistributionRequirementInput,
} from "@/lib/distribution/types";

export type ContributorEligibilitySummary = {
  contributorId: string;
  contributorDisplayName: string;
  eligibility: DerivedContributorEligibility;
};

export function derivePeriodContributorEligibility(input: {
  periodStatus: ContributionPeriodStatus;
  requirements: DistributionRequirementInput[];
  evidence: DistributionEvidenceInput[];
  participants: Array<{
    contributorId: string;
    contributorDisplayName: string;
  }>;
}): ContributorEligibilitySummary[] {
  const uniqueContributors = new Map<
    string,
    { contributorId: string; contributorDisplayName: string }
  >();

  for (const participant of input.participants) {
    if (!uniqueContributors.has(participant.contributorId)) {
      uniqueContributors.set(participant.contributorId, {
        contributorId: participant.contributorId,
        contributorDisplayName: participant.contributorDisplayName,
      });
    }
  }

  return Array.from(uniqueContributors.values())
    .map((contributor) => ({
      contributorId: contributor.contributorId,
      contributorDisplayName: contributor.contributorDisplayName,
      eligibility: deriveContributorEligibility({
        contributorId: contributor.contributorId,
        periodStatus: input.periodStatus,
        requirements: input.requirements,
        evidence: input.evidence,
      }),
    }))
    .sort((left, right) =>
      left.contributorDisplayName.localeCompare(right.contributorDisplayName),
    );
}

export function summarizeEligibility(
  summaries: ContributorEligibilitySummary[],
): {
  qualified: number;
  pending: number;
  notQualified: number;
} {
  return summaries.reduce(
    (counts, entry) => {
      if (entry.eligibility === "QUALIFIED") {
        counts.qualified += 1;
      } else if (entry.eligibility === "PENDING") {
        counts.pending += 1;
      } else {
        counts.notQualified += 1;
      }

      return counts;
    },
    { qualified: 0, pending: 0, notQualified: 0 },
  );
}
