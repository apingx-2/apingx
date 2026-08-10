import { CollectionStatus } from "@prisma/client";
import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalTrimmedString = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : undefined;
  });

const optionalUrl = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : undefined;
  })
  .refine((value) => value === undefined || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL.",
  });

function isValidCalendarDate(value: string): boolean {
  if (!DATE_INPUT_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export const launchDateInputSchema = z
  .string()
  .transform((value) => value.trim())
  .superRefine((value, ctx) => {
    if (!value) {
      return;
    }

    if (!isValidCalendarDate(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid launch date.",
      });
    }
  });

export function launchDateInputToNullableDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export const collectionStatusSchema = z.nativeEnum(CollectionStatus);

const collectionFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be 200 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(200, "Slug must be 200 characters or fewer.")
    .regex(
      slugPattern,
      "Slug must use lowercase letters, numbers and hyphens.",
    ),
  subtitle: optionalTrimmedString,
  story: z.string().trim().min(1, "Story is required."),
  status: collectionStatusSchema,
  launchDate: launchDateInputSchema,
  coverImageUrl: optionalUrl,
});

export const createCollectionSchema = collectionFieldsSchema.extend({
  collectionNumber: z.coerce
    .number({
      invalid_type_error: "Collection number must be a whole number.",
    })
    .int("Collection number must be a whole number.")
    .positive("Collection number must be greater than zero."),
});

export const updateCollectionSchema = collectionFieldsSchema;

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export type CollectionFormValues = {
  collectionNumber: string;
  name: string;
  slug: string;
  subtitle: string;
  story: string;
  status: CollectionStatus;
  launchDate: string;
  coverImageUrl: string;
};

export const defaultCollectionFormValues: CollectionFormValues = {
  collectionNumber: "",
  name: "",
  slug: "",
  subtitle: "",
  story: "",
  status: CollectionStatus.DRAFT,
  launchDate: "",
  coverImageUrl: "",
};
