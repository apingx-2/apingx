import { prisma } from "@/lib/prisma";

type ContributorScopeValidationResult =
  | { valid: true }
  | {
      valid: false;
      error: string;
      fieldErrors: { contributorId: string[] };
    };

export async function validateRequirementContributorScope(input: {
  contributionPeriodId: string;
  contributorId: string | null;
}): Promise<ContributorScopeValidationResult> {
  if (!input.contributorId) {
    return { valid: true };
  }

  const enrolled = await prisma.contributionPeriodParticipant.findFirst({
    where: {
      contributionPeriodId: input.contributionPeriodId,
      contributorId: input.contributorId,
    },
    select: { id: true },
  });

  if (!enrolled) {
    return {
      valid: false,
      error:
        "Contributor-specific requirements can only target enrolled Contributors.",
      fieldErrors: {
        contributorId: [
          "This Contributor is not enrolled in the Contribution Period.",
        ],
      },
    };
  }

  return { valid: true };
}
