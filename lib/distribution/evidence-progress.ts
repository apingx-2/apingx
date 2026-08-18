import type {
  DistributionEvidenceInput,
  DistributionRequirementInput,
} from "@/lib/distribution/types";
import { countVerifiedEvidenceForPair } from "@/lib/distribution/eligibility";

export type EvidenceProgressEntry = {
  contributorId: string;
  contributorDisplayName: string;
  requirementId: string;
  requirementLabel: string;
  requiredVerificationCount: number;
  verifiedEvidenceCount: number;
};

function getApplicableRequirements(
  requirements: DistributionRequirementInput[],
  contributorId: string,
): DistributionRequirementInput[] {
  return requirements.filter(
    (requirement) =>
      requirement.contributorId === null ||
      requirement.contributorId === contributorId,
  );
}

export function buildEvidenceProgressSummaries(input: {
  requirements: DistributionRequirementInput[];
  evidence: DistributionEvidenceInput[];
  participants: Array<{
    contributorId: string;
    contributorDisplayName: string;
  }>;
}): EvidenceProgressEntry[] {
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

  const summaries: EvidenceProgressEntry[] = [];

  for (const contributor of uniqueContributors.values()) {
    for (const requirement of getApplicableRequirements(
      input.requirements,
      contributor.contributorId,
    )) {
      summaries.push({
        contributorId: contributor.contributorId,
        contributorDisplayName: contributor.contributorDisplayName,
        requirementId: requirement.id,
        requirementLabel: requirement.label,
        requiredVerificationCount: requirement.requiredVerificationCount,
        verifiedEvidenceCount: countVerifiedEvidenceForPair({
          evidence: input.evidence,
          contributorId: contributor.contributorId,
          requirementId: requirement.id,
        }),
      });
    }
  }

  return summaries.sort((left, right) => {
    const contributorCompare = left.contributorDisplayName.localeCompare(
      right.contributorDisplayName,
    );

    if (contributorCompare !== 0) {
      return contributorCompare;
    }

    return left.requirementLabel.localeCompare(right.requirementLabel);
  });
}

export function formatEvidenceProgressLabel(input: {
  verifiedEvidenceCount: number;
  requiredVerificationCount: number;
}): string {
  const requiredLabel =
    input.requiredVerificationCount === 1
      ? "verified submission"
      : "verified submissions";

  return `${input.verifiedEvidenceCount} of ${input.requiredVerificationCount} ${requiredLabel}`;
}

export function findEvidenceProgressEntry(
  summaries: EvidenceProgressEntry[],
  contributorId: string,
  requirementId: string,
): EvidenceProgressEntry | undefined {
  return summaries.find(
    (entry) =>
      entry.contributorId === contributorId &&
      entry.requirementId === requirementId,
  );
}
