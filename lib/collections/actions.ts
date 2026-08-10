"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  createCollectionSchema,
  launchDateInputToNullableDate,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "@/lib/collections/schemas";
import { prisma } from "@/lib/prisma";

export type CollectionActionFieldErrors = Partial<
  Record<
    | "collectionNumber"
    | "name"
    | "slug"
    | "subtitle"
    | "story"
    | "status"
    | "launchDate"
    | "coverImageUrl"
    | "form",
    string[]
  >
>;

export type CollectionActionResult =
  | { success: true; id: string }
  | {
      success: false;
      error: string;
      fieldErrors?: CollectionActionFieldErrors;
    };

function mapValidationErrors(
  fieldErrors: Record<string, string[] | undefined>,
): CollectionActionFieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] =>
      Boolean(entry[1]?.length),
    ),
  );
}

function mapUniqueConstraintError(
  error: Prisma.PrismaClientKnownRequestError,
): CollectionActionResult {
  const target = Array.isArray(error.meta?.target)
    ? (error.meta.target as string[])
    : [];

  if (target.includes("collectionNumber")) {
    return {
      success: false,
      error: "This Collection number is already assigned within the archive.",
      fieldErrors: {
        collectionNumber: [
          "This Collection number is already assigned within the archive.",
        ],
      },
    };
  }

  if (target.includes("slug")) {
    return {
      success: false,
      error: "This slug is already in use within the archive.",
      fieldErrors: {
        slug: ["This slug is already in use within the archive."],
      },
    };
  }

  return {
    success: false,
    error: "A Collection with these identifiers already exists.",
  };
}

function unavailableResult(): CollectionActionResult {
  return {
    success: false,
    error:
      "The archive database is unavailable. Try again once the connection is configured.",
  };
}

function toCollectionWriteData(
  input: CreateCollectionInput | UpdateCollectionInput,
) {
  return {
    name: input.name,
    slug: input.slug,
    subtitle: input.subtitle,
    story: input.story,
    status: input.status,
    launchDate: launchDateInputToNullableDate(input.launchDate),
    coverImageUrl: input.coverImageUrl,
  };
}

export async function createCollectionAction(
  input: CreateCollectionInput,
): Promise<CollectionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = createCollectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the Collection record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const collection = await prisma.collection.create({
      data: {
        collectionNumber: parsed.data.collectionNumber,
        ...toCollectionWriteData(parsed.data),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/collections");
    revalidatePath(`/admin/collections/${collection.id}`);

    return { success: true, id: collection.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return mapUniqueConstraintError(error);
    }

    console.error(
      "[collections] Failed to create collection",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to create the Collection record. Please try again.",
    };
  }
}

export async function updateCollectionAction(
  id: string,
  input: UpdateCollectionInput,
): Promise<CollectionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = updateCollectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the Collection record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "This Collection record could not be found in the archive.",
      };
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: toCollectionWriteData(parsed.data),
    });

    revalidatePath("/admin");
    revalidatePath("/admin/collections");
    revalidatePath(`/admin/collections/${collection.id}`);
    revalidatePath(`/admin/collections/${collection.id}/edit`);

    return { success: true, id: collection.id };
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
        error: "This Collection record could not be found in the archive.",
      };
    }

    console.error(
      "[collections] Failed to update collection",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to update the Collection record. Please try again.",
    };
  }
}
