import { prisma } from "@/lib/prisma";

export type EnrollmentContributorOption = {
  id: string;
  displayName: string;
};

export type EnrollmentCredentialOption = {
  id: string;
  credentialNumber: number;
  allocationBasisPoints: number;
  contributorId: string;
  label: string;
};

export type GetEnrollmentOptionsResult =
  | {
      status: "success";
      contributors: EnrollmentContributorOption[];
      credentials: EnrollmentCredentialOption[];
      enrolledCredentialIds: string[];
    }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function getEnrollmentOptions(
  contributionPeriodId: string,
): Promise<GetEnrollmentOptionsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[distribution] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id: contributionPeriodId },
      select: {
        collectionId: true,
        participants: {
          select: {
            credentialId: true,
          },
        },
      },
    });

    if (!period) {
      return { status: "not_found" };
    }

    const credentials = await prisma.credential.findMany({
      where: {
        collectionId: period.collectionId,
        contributorId: {
          not: null,
        },
        type: "CONTRIBUTOR",
      },
      orderBy: [{ contributor: { displayName: "asc" } }, { credentialNumber: "asc" }],
      include: {
        contributor: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    const contributorMap = new Map<string, EnrollmentContributorOption>();

    for (const credential of credentials) {
      if (!credential.contributor) {
        continue;
      }

      contributorMap.set(credential.contributor.id, {
        id: credential.contributor.id,
        displayName: credential.contributor.displayName,
      });
    }

    return {
      status: "success",
      contributors: Array.from(contributorMap.values()).sort((left, right) =>
        left.displayName.localeCompare(right.displayName),
      ),
      credentials: credentials
        .filter((credential) => credential.contributor)
        .map((credential) => ({
          id: credential.id,
          credentialNumber: credential.credentialNumber,
          allocationBasisPoints: credential.allocationBasisPoints,
          contributorId: credential.contributor!.id,
          label: `CREDENTIAL ${String(credential.credentialNumber).padStart(3, "0")} — ${credential.allocationBasisPoints} bps`,
        })),
      enrolledCredentialIds: period.participants.map(
        (participant) => participant.credentialId,
      ),
    };
  } catch (error) {
    console.error(
      "[distribution] Failed to retrieve enrollment options",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}

export async function getCollectionOptionsForPeriods(): Promise<
  | {
      status: "success";
      collections: Array<{
        id: string;
        collectionNumber: number;
        name: string;
      }>;
    }
  | { status: "unavailable" }
> {
  if (!process.env.DATABASE_URL) {
    console.error("[distribution] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const collections = await prisma.collection.findMany({
      orderBy: { collectionNumber: "asc" },
      select: {
        id: true,
        collectionNumber: true,
        name: true,
      },
    });

    return { status: "success", collections };
  } catch (error) {
    console.error(
      "[distribution] Failed to retrieve collection options",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}

export async function getContributorOptionsForRequirements(
  contributionPeriodId: string,
): Promise<
  | { status: "success"; contributors: EnrollmentContributorOption[] }
  | { status: "not_found" }
  | { status: "unavailable" }
> {
  if (!process.env.DATABASE_URL) {
    return { status: "unavailable" };
  }

  try {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id: contributionPeriodId },
      select: {
        participants: {
          select: {
            contributor: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!period) {
      return { status: "not_found" };
    }

    const contributors = new Map<string, EnrollmentContributorOption>();

    for (const participant of period.participants) {
      contributors.set(participant.contributor.id, {
        id: participant.contributor.id,
        displayName: participant.contributor.displayName,
      });
    }

    return {
      status: "success",
      contributors: Array.from(contributors.values()).sort((left, right) =>
        left.displayName.localeCompare(right.displayName),
      ),
    };
  } catch (error) {
    console.error(
      "[distribution] Failed to retrieve contributor options",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
