import { prisma } from "@/lib/prisma";

export type OverviewCounts = {
  collections: number;
  products: number;
  contributors: number;
  credentials: number;
};

export type OverviewCountsResult =
  | { status: "success"; counts: OverviewCounts }
  | { status: "unavailable" };

export async function getOverviewCounts(): Promise<OverviewCountsResult> {
  if (!process.env.DATABASE_URL) {
    console.error("[admin] DATABASE_URL is not configured");
    return { status: "unavailable" };
  }

  try {
    const [collections, products, contributors, credentials] =
      await Promise.all([
        prisma.collection.count(),
        prisma.product.count(),
        prisma.contributor.count(),
        prisma.credential.count(),
      ]);

    return {
      status: "success",
      counts: {
        collections,
        products,
        contributors,
        credentials,
      },
    };
  } catch (error) {
    console.error(
      "[admin] Failed to retrieve overview counts",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unavailable" };
  }
}
