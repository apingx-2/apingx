import { prisma } from "@/lib/prisma";

export type CollectionDetail = {
  id: string;
  collectionNumber: number;
  slug: string;
  name: string;
  subtitle: string | null;
  story: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  launchDate: Date | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
  credentialCount: number;
};

export type GetCollectionByIdResult =
  | { status: "success"; collection: CollectionDetail }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function getCollectionById(
  id: string,
): Promise<GetCollectionByIdResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[collections] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            credentials: true,
          },
        },
      },
    });

    if (!collection) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      collection: {
        id: collection.id,
        collectionNumber: collection.collectionNumber,
        slug: collection.slug,
        name: collection.name,
        subtitle: collection.subtitle,
        story: collection.story,
        status: collection.status,
        launchDate: collection.launchDate,
        coverImageUrl: collection.coverImageUrl,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        productCount: collection._count.products,
        credentialCount: collection._count.credentials,
      },
    };
  } catch (error) {
    console.error(
      "[collections] Failed to retrieve collection",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
