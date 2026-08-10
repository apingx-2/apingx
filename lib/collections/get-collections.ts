import { prisma } from "@/lib/prisma";

export type CollectionListItem = {
  id: string;
  collectionNumber: number;
  slug: string;
  name: string;
  subtitle: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  launchDate: Date | null;
  coverImageUrl: string | null;
  updatedAt: Date;
  productCount: number;
  credentialCount: number;
};

export type GetCollectionsResult =
  | { status: "success"; collections: CollectionListItem[] }
  | { status: "unavailable" };

export async function getCollections(): Promise<GetCollectionsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[collections] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const collections = await prisma.collection.findMany({
      orderBy: { collectionNumber: "asc" },
      include: {
        _count: {
          select: {
            products: true,
            credentials: true,
          },
        },
      },
    });

    return {
      status: "success",
      collections: collections.map((collection) => ({
        id: collection.id,
        collectionNumber: collection.collectionNumber,
        slug: collection.slug,
        name: collection.name,
        subtitle: collection.subtitle,
        status: collection.status,
        launchDate: collection.launchDate,
        coverImageUrl: collection.coverImageUrl,
        updatedAt: collection.updatedAt,
        productCount: collection._count.products,
        credentialCount: collection._count.credentials,
      })),
    };
  } catch (error) {
    console.error(
      "[collections] Failed to retrieve collections",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
