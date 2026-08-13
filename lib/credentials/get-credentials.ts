import { prisma } from "@/lib/prisma";

export type CredentialListItem = {
  id: string;
  credentialNumber: number;
  type: "FOUNDER" | "CONTRIBUTOR";
  allocationBasisPoints: number;
  mintAddress: string | null;
  currentOwnerWallet: string | null;
  mintedAt: Date | null;
  collection: {
    id: string;
    collectionNumber: number;
    name: string;
  };
  contributor: {
    id: string;
    displayName: string;
  } | null;
};

export type GetCredentialsResult =
  | { status: "success"; credentials: CredentialListItem[] }
  | { status: "unavailable" };

export async function getCredentials(): Promise<GetCredentialsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[credentials] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const credentials = await prisma.credential.findMany({
      orderBy: [{ collection: { collectionNumber: "asc" } }, { credentialNumber: "asc" }],
      include: {
        collection: {
          select: {
            id: true,
            collectionNumber: true,
            name: true,
          },
        },
        contributor: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return {
      status: "success",
      credentials,
    };
  } catch (error) {
    console.error(
      "[credentials] Failed to retrieve credentials",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
