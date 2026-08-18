import { ContributionEvidenceReviewStatus, ContributionPeriodStatus } from "@prisma/client";
import { z } from "zod";
import {
  launchDateInputSchema,
  launchDateInputToNullableDate,
} from "@/lib/collections/schemas";
import { normalizePriceInput, priceInputToPenceBigInt } from "@/lib/products/price";

export { launchDateInputToNullableDate as periodDateInputToDate };

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

export const contributionPeriodStatusSchema = z.nativeEnum(
  ContributionPeriodStatus,
);

const distributableAmountInputSchema = z
  .string()
  .transform((value) => value.trim())
  .superRefine((value, ctx) => {
    if (!value) {
      return;
    }

    const normalized = normalizePriceInput(value);

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid amount in GBP, such as 8500.00.",
      });
      return;
    }

    const pence = priceInputToPenceBigInt(normalized);

    if (pence < BigInt(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount cannot be negative.",
      });
    }
  });

export function distributableAmountInputToPence(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return Number(priceInputToPenceBigInt(normalizePriceInput(trimmed)));
}

export function distributableAmountToInput(
  amountInPence: number | null | undefined,
): string {
  if (amountInPence === null || amountInPence === undefined) {
    return "";
  }

  const pounds = Math.trunc(amountInPence / 100);
  const remainder = Math.abs(amountInPence % 100);

  return `${pounds}.${String(remainder).padStart(2, "0")}`;
}

const periodFieldsSchema = z
  .object({
    collectionId: z.string().trim().min(1, "Collection is required."),
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(200, "Title must be 200 characters or fewer."),
    startDate: launchDateInputSchema.refine((value) => value.length > 0, {
      message: "Start date is required.",
    }),
    endDate: launchDateInputSchema.refine((value) => value.length > 0, {
      message: "End date is required.",
    }),
    status: contributionPeriodStatusSchema,
    distributableAmountGbp: distributableAmountInputSchema,
  })
  .superRefine((value, ctx) => {
    const start = launchDateInputToNullableDate(value.startDate);
    const end = launchDateInputToNullableDate(value.endDate);

    if (start && end && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date.",
        path: ["endDate"],
      });
    }
  });

export const createContributionPeriodSchema = periodFieldsSchema.superRefine(
  (value, ctx) => {
    if (value.status === ContributionPeriodStatus.CLOSED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A new Contribution Period cannot be created directly as Closed. Open the period first.",
        path: ["status"],
      });
    }
  },
);

export const updateContributionPeriodSchema = periodFieldsSchema.superRefine(
  (value, ctx) => {
    if (value.status === ContributionPeriodStatus.CLOSED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Closing a Contribution Period requires the dedicated close workflow.",
        path: ["status"],
      });
    }
  },
);

export type CreateContributionPeriodInput = z.infer<
  typeof createContributionPeriodSchema
>;
export type UpdateContributionPeriodInput = z.infer<
  typeof updateContributionPeriodSchema
>;

export type ContributionPeriodFormValues = {
  collectionId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: ContributionPeriodStatus;
  distributableAmountGbp: string;
};

export const defaultContributionPeriodFormValues: ContributionPeriodFormValues =
  {
    collectionId: "",
    title: "",
    startDate: "",
    endDate: "",
    status: ContributionPeriodStatus.DRAFT,
    distributableAmountGbp: "",
  };

export const enrollParticipantSchema = z.object({
  contributionPeriodId: z.string().trim().min(1),
  contributorId: z.string().trim().min(1, "Contributor is required."),
  credentialId: z.string().trim().min(1, "Credential is required."),
  agreementReference: optionalTrimmedString,
});

export type EnrollParticipantInput = z.infer<typeof enrollParticipantSchema>;

const nullableContributorIdInput = z.preprocess(
  (value) => {
    if (value == null || value === "") {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    return value;
  },
  z.union([z.string().min(1), z.null()]),
);

const requirementFieldsSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Requirement label is required.")
    .max(200, "Label must be 200 characters or fewer."),
  description: optionalTrimmedString,
  requiredVerificationCount: z.coerce
    .number({
      invalid_type_error: "Required verification count must be a whole number.",
    })
    .int("Required verification count must be a whole number.")
    .min(1, "At least one verified submission is required.")
    .max(100, "Required verification count cannot exceed 100."),
  contributorId: nullableContributorIdInput,
  sortOrder: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .default(0),
});

export const createRequirementSchema = requirementFieldsSchema.extend({
  contributionPeriodId: z.string().trim().min(1),
});

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;

export const updateRequirementSchema = requirementFieldsSchema.extend({
  requirementId: z.string().trim().min(1),
  contributionPeriodId: z.string().trim().min(1),
});

export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;

export const deleteRequirementSchema = z.object({
  requirementId: z.string().trim().min(1),
  contributionPeriodId: z.string().trim().min(1),
});

export type DeleteRequirementInput = z.infer<typeof deleteRequirementSchema>;

export const createEvidenceSchema = z
  .object({
    contributionPeriodId: z.string().trim().min(1),
    contributionRequirementId: z.string().trim().min(1, "Requirement is required."),
    contributorId: z.string().trim().min(1, "Contributor is required."),
    referenceUrl: optionalUrl,
    note: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (!value.referenceUrl && !value.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a reference URL or a note describing the evidence.",
        path: [],
      });
    }
  });

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const reviewEvidenceSchema = z
  .object({
    evidenceId: z.string().trim().min(1),
    contributionPeriodId: z.string().trim().min(1),
    reviewStatus: z.enum([
      ContributionEvidenceReviewStatus.VERIFIED,
      ContributionEvidenceReviewStatus.REJECTED,
    ]),
    rejectionReason: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (
      value.reviewStatus === ContributionEvidenceReviewStatus.REJECTED &&
      !value.rejectionReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a reason when rejecting evidence.",
        path: ["rejectionReason"],
      });
    }
  });

export type ReviewEvidenceInput = z.infer<typeof reviewEvidenceSchema>;

export const invalidateEvidenceVerificationSchema = z.object({
  evidenceId: z.string().trim().min(1),
  contributionPeriodId: z.string().trim().min(1),
  invalidationReason: z
    .string()
    .trim()
    .min(1, "An invalidation reason is required.")
    .max(2000, "Invalidation reason must be 2000 characters or fewer."),
});

export type InvalidateEvidenceVerificationInput = z.infer<
  typeof invalidateEvidenceVerificationSchema
>;

export const closeContributionPeriodSchema = z.object({
  contributionPeriodId: z.string().trim().min(1),
});

export const discardContributionPeriodSchema = z.object({
  contributionPeriodId: z.string().trim().min(1),
});

export type DiscardContributionPeriodInput = z.infer<
  typeof discardContributionPeriodSchema
>;
