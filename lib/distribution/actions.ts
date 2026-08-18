"use server";

import {
  ContributionEvidenceReviewStatus,
  ContributionPeriodStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  closeContributionPeriodSchema,
  createContributionPeriodSchema,
  createEvidenceSchema,
  createRequirementSchema,
  deleteRequirementSchema,
  discardContributionPeriodSchema,
  distributableAmountInputToPence,
  enrollParticipantSchema,
  invalidateEvidenceVerificationSchema,
  periodDateInputToDate,
  reviewEvidenceSchema,
  updateContributionPeriodSchema,
  updateRequirementSchema,
  type CreateContributionPeriodInput,
  type CreateEvidenceInput,
  type CreateRequirementInput,
  type DeleteRequirementInput,
  type EnrollParticipantInput,
  type InvalidateEvidenceVerificationInput,
  type ReviewEvidenceInput,
  type UpdateContributionPeriodInput,
  type UpdateRequirementInput,
} from "@/lib/distribution/schemas";
import { canEditRequirement } from "@/lib/distribution/requirement-lifecycle";
import { canInvalidateEvidenceVerification } from "@/lib/distribution/evidence-lifecycle";
import {
  canDiscardContributionPeriod,
  isDiscardEligiblePeriodStatus,
} from "@/lib/distribution/period-discard-lifecycle";
import { validateParticipantEnrollment } from "@/lib/distribution/validate-participant-enrollment";
import { validateRequirementContributorScope } from "@/lib/distribution/validate-requirement-contributor-scope";

type DistributionFieldErrors = Partial<Record<string, string[]>>;

export type DistributionActionResult =
  | { success: true; id: string }
  | {
      success: false;
      error: string;
      fieldErrors?: DistributionFieldErrors;
    };

function mapValidationErrors(
  fieldErrors: Record<string, string[] | undefined>,
): DistributionFieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] =>
      Boolean(entry[1]?.length),
    ),
  );
}

function unavailableResult(): DistributionActionResult {
  return {
    success: false,
    error:
      "The archive database is unavailable. Try again once the connection is configured.",
  };
}

function revalidatePeriodPaths(periodId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/distributions");
  revalidatePath(`/admin/distributions/periods/${periodId}`);
  revalidatePath(`/admin/distributions/periods/${periodId}/edit`);
}

function isValidEditFormStatusTransition(
  currentStatus: ContributionPeriodStatus,
  nextStatus: ContributionPeriodStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === ContributionPeriodStatus.CLOSED) {
    return false;
  }

  if (currentStatus === ContributionPeriodStatus.DRAFT) {
    return nextStatus === ContributionPeriodStatus.OPEN;
  }

  if (currentStatus === ContributionPeriodStatus.OPEN) {
    return false;
  }

  return false;
}

function toPeriodWriteData(
  input: CreateContributionPeriodInput | UpdateContributionPeriodInput,
) {
  const distributableAmountInPence = distributableAmountInputToPence(
    input.distributableAmountGbp,
  );

  return {
    collectionId: input.collectionId,
    title: input.title,
    startDate: periodDateInputToDate(input.startDate)!,
    endDate: periodDateInputToDate(input.endDate)!,
    status: input.status,
    distributableAmountInPence,
    currency: "GBP" as const,
  };
}

export async function createContributionPeriodAction(
  input: CreateContributionPeriodInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = createContributionPeriodSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        "Please review the Contribution Period record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: parsed.data.collectionId },
      select: { id: true },
    });

    if (!collection) {
      return {
        success: false,
        error: "The selected Collection could not be found in the archive.",
        fieldErrors: {
          collectionId: ["The selected Collection could not be found."],
        },
      };
    }

    const period = await prisma.contributionPeriod.create({
      data: toPeriodWriteData(parsed.data),
    });

    revalidatePeriodPaths(period.id);
    revalidatePath("/admin/distributions");

    return { success: true, id: period.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to create contribution period",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to create the Contribution Period. Please try again.",
    };
  }
}

export async function updateContributionPeriodAction(
  id: string,
  input: UpdateContributionPeriodInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = updateContributionPeriodSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        "Please review the Contribution Period record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const existing = await prisma.contributionPeriod.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        collectionId: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    if (existing.status === ContributionPeriodStatus.CLOSED) {
      return {
        success: false,
        error:
          "Closed Contribution Periods cannot be edited through this workflow.",
      };
    }

    if (
      parsed.data.collectionId !== existing.collectionId &&
      existing.status !== ContributionPeriodStatus.DRAFT
    ) {
      return {
        success: false,
        error:
          "The Collection can only be changed while the Contribution Period is in Draft.",
        fieldErrors: {
          collectionId: [
            "The Collection can only be changed while the period is in Draft.",
          ],
        },
      };
    }

    if (
      !isValidEditFormStatusTransition(existing.status, parsed.data.status)
    ) {
      return {
        success: false,
        error:
          "This status change is not permitted. Draft periods may open through this form. Closing an open period requires the dedicated close workflow.",
        fieldErrors: {
          status: ["This status change is not permitted."],
        },
      };
    }

    const collection = await prisma.collection.findUnique({
      where: { id: parsed.data.collectionId },
      select: { id: true },
    });

    if (!collection) {
      return {
        success: false,
        error: "The selected Collection could not be found in the archive.",
        fieldErrors: {
          collectionId: ["The selected Collection could not be found."],
        },
      };
    }

    const period = await prisma.contributionPeriod.update({
      where: { id },
      data: toPeriodWriteData(parsed.data),
    });

    revalidatePeriodPaths(period.id);
    revalidatePath("/admin/distributions");

    return { success: true, id: period.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    console.error(
      "[distribution] Failed to update contribution period",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to update the Contribution Period. Please try again.",
    };
  }
}

export async function closeContributionPeriodAction(
  input: { contributionPeriodId: string },
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = closeContributionPeriodSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Unable to close this Contribution Period.",
    };
  }

  try {
    const existing = await prisma.contributionPeriod.findUnique({
      where: { id: parsed.data.contributionPeriodId },
      select: { id: true, status: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    if (existing.status === ContributionPeriodStatus.CLOSED) {
      return { success: true, id: existing.id };
    }

    if (existing.status !== ContributionPeriodStatus.OPEN) {
      return {
        success: false,
        error: "Only open Contribution Periods can be closed.",
      };
    }

    const period = await prisma.contributionPeriod.update({
      where: { id: existing.id },
      data: {
        status: ContributionPeriodStatus.CLOSED,
      },
    });

    revalidatePeriodPaths(period.id);
    revalidatePath("/admin/distributions");

    return { success: true, id: period.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to close contribution period",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to close the Contribution Period. Please try again.",
    };
  }
}

export async function discardContributionPeriodAction(input: {
  contributionPeriodId: string;
}): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = discardContributionPeriodSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Unable to discard this Contribution Period.",
    };
  }

  const periodId = parsed.data.contributionPeriodId;

  try {
    const existing = await prisma.contributionPeriod.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            evidence: true,
            calculations: true,
          },
        },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    if (!isDiscardEligiblePeriodStatus(existing.status)) {
      return {
        success: false,
        error: "Only draft or open Contribution Periods can be discarded.",
      };
    }

    const evidenceCount = existing._count.evidence;
    const calculationCount = existing._count.calculations;

    if (evidenceCount > 0) {
      return {
        success: false,
        error:
          "This Contribution Period cannot be discarded because evidence has been recorded.",
      };
    }

    if (calculationCount > 0) {
      return {
        success: false,
        error:
          "This Contribution Period cannot be discarded because a distribution calculation exists.",
      };
    }

    if (
      !canDiscardContributionPeriod({
        status: existing.status,
        evidenceCount,
        calculationCount,
      })
    ) {
      return {
        success: false,
        error: "This Contribution Period cannot be discarded.",
      };
    }

    await prisma.$transaction([
      prisma.contributionRequirement.deleteMany({
        where: { contributionPeriodId: periodId },
      }),
      prisma.contributionPeriodParticipant.deleteMany({
        where: { contributionPeriodId: periodId },
      }),
      prisma.contributionPeriod.delete({
        where: { id: periodId },
      }),
    ]);

    revalidatePeriodPaths(periodId);
    revalidatePath("/admin/distributions");

    return { success: true, id: periodId };
  } catch (error) {
    console.error(
      "[distribution] Failed to discard contribution period",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to discard the Contribution Period. Please try again.",
    };
  }
}

export async function enrollParticipantAction(
  input: EnrollParticipantInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = enrollParticipantSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the enrollment details and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id: parsed.data.contributionPeriodId },
      select: {
        id: true,
        collectionId: true,
        status: true,
      },
    });

    if (!period) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    if (period.status === ContributionPeriodStatus.CLOSED) {
      return {
        success: false,
        error: "Participants cannot be enrolled once the period is closed.",
      };
    }

    const [contributor, credential] = await Promise.all([
      prisma.contributor.findUnique({
        where: { id: parsed.data.contributorId },
        select: { id: true },
      }),
      prisma.credential.findUnique({
        where: { id: parsed.data.credentialId },
        select: {
          id: true,
          collectionId: true,
          contributorId: true,
          type: true,
        },
      }),
    ]);

    if (!contributor) {
      return {
        success: false,
        error: "The selected Contributor could not be found.",
        fieldErrors: {
          contributorId: ["The selected Contributor could not be found."],
        },
      };
    }

    if (!credential) {
      return {
        success: false,
        error: "The selected Credential could not be found.",
        fieldErrors: {
          credentialId: ["The selected Credential could not be found."],
        },
      };
    }

    const enrollmentValidation = validateParticipantEnrollment({
      periodCollectionId: period.collectionId,
      credentialCollectionId: credential.collectionId,
      credentialContributorId: credential.contributorId,
      participantContributorId: parsed.data.contributorId,
    });

    if (!enrollmentValidation.valid) {
      return {
        success: false,
        error: enrollmentValidation.reason,
        fieldErrors: {
          credentialId: [enrollmentValidation.reason],
        },
      };
    }

    if (credential.type === "FOUNDER") {
      return {
        success: false,
        error:
          "Founder Credentials without an associated Contributor cannot be enrolled.",
        fieldErrors: {
          credentialId: [
            "Founder Credentials without an associated Contributor cannot be enrolled.",
          ],
        },
      };
    }

    const participant = await prisma.contributionPeriodParticipant.create({
      data: {
        contributionPeriodId: period.id,
        contributorId: parsed.data.contributorId,
        credentialId: parsed.data.credentialId,
        agreementReference: parsed.data.agreementReference ?? null,
      },
    });

    revalidatePeriodPaths(period.id);

    return { success: true, id: participant.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "This Credential is already enrolled in the Contribution Period.",
        fieldErrors: {
          credentialId: [
            "This Credential is already enrolled in the Contribution Period.",
          ],
        },
      };
    }

    console.error(
      "[distribution] Failed to enroll participant",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to enroll the participant. Please try again.",
    };
  }
}

export async function createRequirementAction(
  input: CreateRequirementInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = createRequirementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the requirement and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id: parsed.data.contributionPeriodId },
      select: { id: true, status: true },
    });

    if (!period) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    if (period.status === ContributionPeriodStatus.CLOSED) {
      return {
        success: false,
        error: "Requirements cannot be added once the period is closed.",
      };
    }

    if (parsed.data.contributorId) {
      const scopeValidation = await validateRequirementContributorScope({
        contributionPeriodId: period.id,
        contributorId: parsed.data.contributorId,
      });

      if (!scopeValidation.valid) {
        return {
          success: false,
          error: scopeValidation.error,
          fieldErrors: scopeValidation.fieldErrors,
        };
      }
    }

    const requirement = await prisma.contributionRequirement.create({
      data: {
        contributionPeriodId: period.id,
        label: parsed.data.label,
        description: parsed.data.description ?? null,
        requiredVerificationCount: parsed.data.requiredVerificationCount,
        contributorId: parsed.data.contributorId,
        sortOrder: parsed.data.sortOrder,
      },
    });

    revalidatePeriodPaths(period.id);

    return { success: true, id: requirement.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to create requirement",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to create the requirement. Please try again.",
    };
  }
}

function requirementLockedError(input: {
  periodStatus: ContributionPeriodStatus;
  evidenceCount: number;
}): string {
  if (input.periodStatus === ContributionPeriodStatus.CLOSED) {
    return "Requirements cannot be changed once the period is closed.";
  }

  if (input.evidenceCount > 0) {
    return "This requirement is locked because evidence has already been recorded against it.";
  }

  return "This requirement cannot be changed.";
}

export async function updateRequirementAction(
  input: UpdateRequirementInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = updateRequirementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the requirement and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const requirement = await prisma.contributionRequirement.findUnique({
      where: { id: parsed.data.requirementId },
      select: {
        id: true,
        contributionPeriodId: true,
        contributionPeriod: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            evidence: true,
          },
        },
      },
    });

    if (
      !requirement ||
      requirement.contributionPeriodId !== parsed.data.contributionPeriodId
    ) {
      return {
        success: false,
        error: "This requirement could not be found.",
      };
    }

    const periodStatus = requirement.contributionPeriod.status;
    const evidenceCount = requirement._count.evidence;

    if (
      !canEditRequirement({
        periodStatus,
        evidenceCount,
      })
    ) {
      return {
        success: false,
        error: requirementLockedError({ periodStatus, evidenceCount }),
      };
    }

    const scopeValidation = await validateRequirementContributorScope({
      contributionPeriodId: requirement.contributionPeriodId,
      contributorId: parsed.data.contributorId,
    });

    if (!scopeValidation.valid) {
      return {
        success: false,
        error: scopeValidation.error,
        fieldErrors: scopeValidation.fieldErrors,
      };
    }

    await prisma.contributionRequirement.update({
      where: { id: requirement.id },
      data: {
        label: parsed.data.label,
        description: parsed.data.description ?? null,
        requiredVerificationCount: parsed.data.requiredVerificationCount,
        contributorId: parsed.data.contributorId,
        sortOrder: parsed.data.sortOrder,
      },
    });

    revalidatePeriodPaths(requirement.contributionPeriodId);

    return { success: true, id: requirement.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to update requirement",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to update the requirement. Please try again.",
    };
  }
}

export async function deleteRequirementAction(
  input: DeleteRequirementInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = deleteRequirementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Unable to delete the requirement. Please try again.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const requirement = await prisma.contributionRequirement.findUnique({
      where: { id: parsed.data.requirementId },
      select: {
        id: true,
        contributionPeriodId: true,
        contributionPeriod: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            evidence: true,
          },
        },
      },
    });

    if (
      !requirement ||
      requirement.contributionPeriodId !== parsed.data.contributionPeriodId
    ) {
      return {
        success: false,
        error: "This requirement could not be found.",
      };
    }

    const periodStatus = requirement.contributionPeriod.status;
    const evidenceCount = requirement._count.evidence;

    if (
      !canEditRequirement({
        periodStatus,
        evidenceCount,
      })
    ) {
      return {
        success: false,
        error: requirementLockedError({ periodStatus, evidenceCount }),
      };
    }

    await prisma.contributionRequirement.delete({
      where: { id: requirement.id },
    });

    revalidatePeriodPaths(requirement.contributionPeriodId);

    return { success: true, id: requirement.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to delete requirement",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to delete the requirement. Please try again.",
    };
  }
}

export async function createEvidenceAction(
  input: CreateEvidenceInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = createEvidenceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the evidence record and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id: parsed.data.contributionPeriodId },
      select: { id: true, status: true },
    });

    if (!period) {
      return {
        success: false,
        error: "This Contribution Period could not be found.",
      };
    }

    if (period.status === ContributionPeriodStatus.CLOSED) {
      return {
        success: false,
        error: "Evidence cannot be added once the period is closed.",
      };
    }

    const [requirement, enrolled] = await Promise.all([
      prisma.contributionRequirement.findFirst({
        where: {
          id: parsed.data.contributionRequirementId,
          contributionPeriodId: period.id,
        },
        select: {
          id: true,
          contributorId: true,
        },
      }),
      prisma.contributionPeriodParticipant.findFirst({
        where: {
          contributionPeriodId: period.id,
          contributorId: parsed.data.contributorId,
        },
        select: { id: true },
      }),
    ]);

    if (!requirement) {
      return {
        success: false,
        error: "The selected requirement could not be found for this period.",
        fieldErrors: {
          contributionRequirementId: [
            "The selected requirement could not be found for this period.",
          ],
        },
      };
    }

    if (!enrolled) {
      return {
        success: false,
        error: "Evidence can only be recorded for enrolled Contributors.",
        fieldErrors: {
          contributorId: [
            "This Contributor is not enrolled in the Contribution Period.",
          ],
        },
      };
    }

    if (
      requirement.contributorId &&
      requirement.contributorId !== parsed.data.contributorId
    ) {
      return {
        success: false,
        error: "This requirement applies to a different Contributor.",
        fieldErrors: {
          contributorId: ["This requirement applies to a different Contributor."],
        },
      };
    }

    const evidence = await prisma.contributionEvidence.create({
      data: {
        contributionPeriodId: period.id,
        contributionRequirementId: requirement.id,
        contributorId: parsed.data.contributorId,
        referenceUrl: parsed.data.referenceUrl ?? null,
        note: parsed.data.note ?? null,
        reviewStatus: ContributionEvidenceReviewStatus.PENDING,
      },
    });

    revalidatePeriodPaths(period.id);

    return { success: true, id: evidence.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to create evidence",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to record the evidence. Please try again.",
    };
  }
}

export async function reviewEvidenceAction(
  input: ReviewEvidenceInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = reviewEvidenceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the evidence decision and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const evidence = await prisma.contributionEvidence.findFirst({
      where: {
        id: parsed.data.evidenceId,
        contributionPeriodId: parsed.data.contributionPeriodId,
      },
      select: {
        id: true,
        reviewStatus: true,
        contributionPeriod: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!evidence) {
      return {
        success: false,
        error: "This evidence record could not be found.",
      };
    }

    if (evidence.reviewStatus === ContributionEvidenceReviewStatus.VERIFIED) {
      return {
        success: false,
        error: "Verified evidence is immutable and cannot be reviewed again.",
      };
    }

    if (evidence.contributionPeriod.status === ContributionPeriodStatus.CLOSED) {
      return {
        success: false,
        error: "Evidence cannot be reviewed once the period is closed.",
      };
    }

    const updated = await prisma.contributionEvidence.update({
      where: { id: evidence.id },
      data: {
        reviewStatus: parsed.data.reviewStatus,
        reviewedAt: new Date(),
        rejectionReason:
          parsed.data.reviewStatus === ContributionEvidenceReviewStatus.REJECTED
            ? parsed.data.rejectionReason ?? null
            : null,
      },
    });

    revalidatePeriodPaths(parsed.data.contributionPeriodId);

    return { success: true, id: updated.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to review evidence",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to review the evidence. Please try again.",
    };
  }
}

export async function invalidateEvidenceVerificationAction(
  input: InvalidateEvidenceVerificationInput,
): Promise<DistributionActionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableResult();
  }

  const parsed = invalidateEvidenceVerificationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the invalidation and correct the highlighted fields.",
      fieldErrors: mapValidationErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const evidence = await prisma.contributionEvidence.findFirst({
      where: {
        id: parsed.data.evidenceId,
        contributionPeriodId: parsed.data.contributionPeriodId,
      },
      select: {
        id: true,
        reviewStatus: true,
        reviewedAt: true,
        invalidatedAt: true,
        contributionPeriod: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!evidence) {
      return {
        success: false,
        error: "This evidence record could not be found.",
      };
    }

    if (evidence.reviewStatus !== ContributionEvidenceReviewStatus.VERIFIED) {
      return {
        success: false,
        error: "Only verified evidence can be invalidated.",
      };
    }

    if (evidence.invalidatedAt !== null) {
      return {
        success: false,
        error: "This verification has already been invalidated.",
      };
    }

    if (
      !canInvalidateEvidenceVerification({
        reviewStatus: evidence.reviewStatus,
        invalidatedAt: evidence.invalidatedAt,
        periodStatus: evidence.contributionPeriod.status,
      })
    ) {
      return {
        success: false,
        error:
          "Evidence verification cannot be invalidated once the period is closed.",
      };
    }

    const updated = await prisma.contributionEvidence.update({
      where: { id: evidence.id },
      data: {
        invalidatedAt: new Date(),
        invalidationReason: parsed.data.invalidationReason,
      },
    });

    revalidatePeriodPaths(parsed.data.contributionPeriodId);

    return { success: true, id: updated.id };
  } catch (error) {
    console.error(
      "[distribution] Failed to invalidate evidence verification",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to invalidate the evidence verification. Please try again.",
    };
  }
}
