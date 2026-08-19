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
};

export const defaultContributionPeriodFormValues: ContributionPeriodFormValues =
  {
    collectionId: "",
    title: "",
    startDate: "",
    endDate: "",
    status: ContributionPeriodStatus.DRAFT,
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

/**
 * Normalizes Distribution Basis money input from HTML form strings or from
 * already-parsed integer pence (server action re-validation).
 */
export function parseBasisMoneyInputToPence(value: unknown): number {
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error("INVALID_BASIS_MONEY");
    }

    if (value < 0) {
      throw new Error("NEGATIVE_BASIS_MONEY");
    }

    return value;
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_BASIS_MONEY");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("EMPTY_BASIS_MONEY");
  }

  const normalized = normalizePriceInput(trimmed);

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("INVALID_BASIS_MONEY");
  }

  const pence = priceInputToPenceBigInt(normalized);

  if (pence < BigInt(0)) {
    throw new Error("NEGATIVE_BASIS_MONEY");
  }

  return Number(pence);
}

function parseReconciliationCutoffInput(value: unknown): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("INVALID_RECONCILIATION_CUTOFF");
    }

    return value;
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_RECONCILIATION_CUTOFF");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("EMPTY_RECONCILIATION_CUTOFF");
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    throw new Error("INVALID_RECONCILIATION_CUTOFF");
  }

  return new Date(trimmed);
}

const basisMoneyFieldSchema = z.preprocess(
  (value) => {
    try {
      return parseBasisMoneyInputToPence(value);
    } catch {
      return value;
    }
  },
  z
    .number({
      invalid_type_error: "Enter a valid amount in GBP, such as 8500.00.",
    })
    .int("Enter a valid amount in GBP, such as 8500.00.")
    .min(0, "Amount cannot be negative."),
);

const reconciliationCutoffFieldSchema = z.preprocess(
  (value) => {
    try {
      return parseReconciliationCutoffInput(value);
    } catch {
      return value;
    }
  },
  z.date({
    invalid_type_error: "Enter a valid reconciliation cutoff date and time.",
  }),
);

export function basisMoneyInputToPence(value: string): number {
  return parseBasisMoneyInputToPence(value);
}

export function basisMoneyToInput(amountInPence: number): string {
  const pounds = Math.trunc(amountInPence / 100);
  const remainder = Math.abs(amountInPence % 100);
  return `${pounds}.${String(remainder).padStart(2, "0")}`;
}

export const upsertDistributionBasisSchema = z.object({
  contributionPeriodId: z.string().trim().min(1),
  grossQualifyingProductSalesGbp: basisMoneyFieldSchema,
  discountsGbp: basisMoneyFieldSchema,
  returnsRefundsGbp: basisMoneyFieldSchema,
  successfulChargebacksGbp: basisMoneyFieldSchema,
  vatExcludedGbp: basisMoneyFieldSchema,
  contributorPoolBasisPoints: z.coerce
    .number()
    .int("Contributor Pool Basis Points must be a whole number.")
    .min(0, "Contributor Pool Basis Points cannot be negative.")
    .max(10000, "Contributor Pool Basis Points cannot exceed 10,000."),
  reconciliationCutoffAt: reconciliationCutoffFieldSchema,
});

export type UpsertDistributionBasisInput = z.infer<
  typeof upsertDistributionBasisSchema
>;

export const approveDistributionBasisSchema = z.object({
  contributionPeriodId: z.string().trim().min(1),
});

export type ApproveDistributionBasisInput = z.infer<
  typeof approveDistributionBasisSchema
>;

export const createDistributionCalculationSchema = z.object({
  contributionPeriodId: z.string().trim().min(1),
});

export type CreateDistributionCalculationInput = z.infer<
  typeof createDistributionCalculationSchema
>;

export const approveDistributionCalculationSchema = z.object({
  calculationId: z.string().trim().min(1),
});

export type ApproveDistributionCalculationInput = z.infer<
  typeof approveDistributionCalculationSchema
>;

export const voidDistributionCalculationSchema = z.object({
  calculationId: z.string().trim().min(1),
  voidReason: z
    .string()
    .trim()
    .min(1, "A void reason is required.")
    .max(2000, "Void reason must be 2000 characters or fewer."),
});

export type VoidDistributionCalculationInput = z.infer<
  typeof voidDistributionCalculationSchema
>;

export const createReplacementCalculationSchema = z.object({
  voidedCalculationId: z.string().trim().min(1),
});

export type CreateReplacementCalculationInput = z.infer<
  typeof createReplacementCalculationSchema
>;
