import { ProductStatus } from "@prisma/client";
import { z } from "zod";
import {
  MAX_PRICE_IN_PENCE,
  normalizePriceInput,
  priceInputToPence,
  priceInputToPenceBigInt,
} from "@/lib/products/price";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRICE_PATTERN = /^\d+(?:\.\d+)?$/;

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

export const productCurrencySchema = z.enum(["GBP"], {
  errorMap: () => ({ message: "Currency must be GBP." }),
});

export const productStatusSchema = z.nativeEnum(ProductStatus);

export const priceInputSchema = z
  .string()
  .transform((value) => normalizePriceInput(value))
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required.",
      });
      return;
    }

    if (value.startsWith("-")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price cannot be negative.",
      });
      return;
    }

    if (!PRICE_PATTERN.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid price.",
      });
      return;
    }

    const [, fraction = ""] = value.split(".");

    if (fraction.length > 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price may have at most two decimal places.",
      });
      return;
    }

    const pence = priceInputToPenceBigInt(value);

    if (pence > BigInt(MAX_PRICE_IN_PENCE)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price exceeds the maximum allowed value.",
      });
    }
  });

const productFieldsSchema = z.object({
  collectionId: z.string().trim().min(1, "Collection is required."),
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
  description: z.string().trim().min(1, "Description is required."),
  price: priceInputSchema,
  currency: productCurrencySchema,
  status: productStatusSchema,
  imageUrl: optionalUrl,
});

export const createProductSchema = productFieldsSchema;
export const updateProductSchema = productFieldsSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type ProductFormValues = {
  collectionId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: "GBP";
  status: ProductStatus;
  imageUrl: string;
};

export const defaultProductFormValues: ProductFormValues = {
  collectionId: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  currency: "GBP",
  status: ProductStatus.DRAFT,
  imageUrl: "",
};

export function productInputToWriteData(
  input: CreateProductInput | UpdateProductInput,
) {
  return {
    collectionId: input.collectionId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    priceInPence: priceInputToPence(input.price),
    currency: input.currency,
    status: input.status,
    imageUrl: input.imageUrl,
  };
}
