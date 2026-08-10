import { prisma } from "@/lib/prisma";

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInPence: number;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "ARCHIVED";
  imageUrl: string | null;
  updatedAt: Date;
  collection: {
    id: string;
    collectionNumber: number;
    name: string;
  };
};

export type GetProductsResult =
  | { status: "success"; products: ProductListItem[] }
  | { status: "unavailable" };

export async function getProducts(): Promise<GetProductsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[products] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: [
        { collection: { collectionNumber: "asc" } },
        { name: "asc" },
      ],
      include: {
        collection: {
          select: {
            id: true,
            collectionNumber: true,
            name: true,
          },
        },
      },
    });

    return {
      status: "success",
      products,
    };
  } catch (error) {
    console.error(
      "[products] Failed to retrieve products",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
