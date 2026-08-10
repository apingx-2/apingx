import type { CollectionOption } from "@/lib/products/format-collection-option";
import { prisma } from "@/lib/prisma";

export type GetCollectionOptionsResult =
  | { status: "success"; collections: CollectionOption[] }
  | { status: "unavailable" };

export async function getCollectionOptions(): Promise<GetCollectionOptionsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[products] DATABASE_URL is not configured");
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

    return {
      status: "success",
      collections,
    };
  } catch (error) {
    console.error(
      "[products] Failed to retrieve collection options",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
