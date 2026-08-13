import { prisma } from "@/lib/prisma";

export type CredentialDetail = {
  id: string;
  collectionId: string;
  contributorId: string | null;
  credentialNumber: number;
  type: "FOUNDER" | "CONTRIBUTOR";
  allocationBasisPoints: number;
  mintAddress: string | null;
  currentOwnerWallet: string | null;
  mintedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  collection: {
    id: string;
    collectionNumber: number;
    name: string;
    slug: string;
  };
  contributor: {
    id: string;
    displayName: string;
    walletAddress: string | null;
  } | null;
};

export type GetCredentialByIdResult =
  | { status: "success"; credential: CredentialDetail }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function getCredentialById(
  id: string,
): Promise<GetCredentialByIdResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[credentials] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const credential = await prisma.credential.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            collectionNumber: true,
            name: true,
            slug: true,
          },
        },
        contributor: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!credential) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      credential,
    };
  } catch (error) {
    console.error(
      "[credentials] Failed to retrieve credential",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
