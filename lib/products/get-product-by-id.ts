import { prisma } from "@/lib/prisma";

export type ProductDetail = {
  id: string;
  collectionId: string;
  name: string;
  slug: string;
  description: string;
  priceInPence: number;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "ARCHIVED";
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  collection: {
    id: string;
    collectionNumber: number;
    name: string;
  };
};

export type GetProductByIdResult =
  | { status: "success"; product: ProductDetail }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function getProductById(
  id: string,
): Promise<GetProductByIdResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[products] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
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

    if (!product) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      product,
    };
  } catch (error) {
    console.error(
      "[products] Failed to retrieve product",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
