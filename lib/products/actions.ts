"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  createProductSchema,
  productInputToWriteData,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/products/schemas";
import { prisma } from "@/lib/prisma";

export type ProductActionFieldErrors = Partial<
  Record<
    | "collectionId"
    | "name"
    | "slug"
    | "description"
    | "price"
    | "currency"
    | "status"
    | "imageUrl"
    | "form",
    string[]
  >
>;

export type ProductActionResult =
  | { success: true; id: string }
  | {
      success: false;
      error: string;
      fieldErrors?: ProductActionFieldErrors;
    };

function mapValidationErrors(
  fieldErrors: Record<string, string[] | undefined>,
): ProductActionFieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] =>
      Boolean(entry[1]?.length),
    ),
  );
}

function mapUniqueConstraintError(
  error: Prisma.PrismaClientKnownRequestError,
): ProductActionResult {
  const target = Array.isArray(error.meta?.target)
    ? (error.meta.target as string[])
    : [];

  if (target.includes("collectionId") && target.includes("slug")) {
    return {
      success: false,
      error: "This slug is already in use within the selected Collection.",
      fieldErrors: {
        slug: [
          "This slug is already in use within the selected Collection.",
        ],
      },
    };
  }

  return {
    success: false,
    error: "A Product with these identifiers already exists.",
  };
}

function unavailableResult(): ProductActionResult {
  return {
    success: false,
    error:
      "The archive database is unavailable. Try again once the connection is configured.",
  };
}

async function validateCollectionId(
  collectionId: string,
): Promise<ProductActionResult | null> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true },
  });

  if (!collection) {
    return {
      success: false,
      error: "Please review the Product record and correct the highlighted fields.",
      fieldErrors: {
        collectionId: ["Select a valid Collection."],
      },
    };
  }

  return null;
}

export async function createProductAction(
  input: CreateProductInput,
): Promise<ProductActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = createProductSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the Product record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const collectionError = await validateCollectionId(parsed.data.collectionId);

    if (collectionError) {
      return collectionError;
    }

    const product = await prisma.product.create({
      data: productInputToWriteData(parsed.data),
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);

    return { success: true, id: product.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return mapUniqueConstraintError(error);
    }

    console.error(
      "[products] Failed to create product",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to create the Product record. Please try again.",
    };
  }
}

export async function updateProductAction(
  id: string,
  input: UpdateProductInput,
): Promise<ProductActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = updateProductSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the Product record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "This Product record could not be found in the archive.",
      };
    }

    const collectionError = await validateCollectionId(parsed.data.collectionId);

    if (collectionError) {
      return collectionError;
    }

    const product = await prisma.product.update({
      where: { id },
      data: productInputToWriteData(parsed.data),
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);
    revalidatePath(`/admin/products/${product.id}/edit`);

    return { success: true, id: product.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return mapUniqueConstraintError(error);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        error: "This Product record could not be found in the archive.",
      };
    }

    console.error(
      "[products] Failed to update product",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to update the Product record. Please try again.",
    };
  }
}
