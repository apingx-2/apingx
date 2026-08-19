import {
  ContributionPeriodStatus,
  DistributionCalculationStatus,
  EligibilitySnapshotStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDistributionCalculationVersion } from "@/lib/distribution/calculate-compensation";
import { isDistributionBasisApproved } from "@/lib/distribution/basis-lifecycle";
import { buildDistributionPreview } from "@/lib/distribution/preview-calculation";
import { validateParticipantEnrollment } from "@/lib/distribution/validate-participant-enrollment";
import type { DistributionParticipantInput } from "@/lib/distribution/types";

export type PersistCalculationResult =
  | { success: true; calculationId: string }
  | { success: false; error: string };

type PeriodForCalculation = NonNullable<
  Awaited<ReturnType<typeof loadPeriodForCalculation>>
>;

async function loadPeriodForCalculation(contributionPeriodId: string) {
  return prisma.contributionPeriod.findUnique({
    where: { id: contributionPeriodId },
    include: {
      collection: {
        select: {
          id: true,
          collectionNumber: true,
        },
      },
      distributionBasis: true,
      participants: {
        include: {
          contributor: {
            select: {
              id: true,
              displayName: true,
            },
          },
          credential: {
            select: {
              id: true,
              credentialNumber: true,
              allocationBasisPoints: true,
              contributorId: true,
              collectionId: true,
            },
          },
        },
      },
      requirements: {
        select: {
          id: true,
          contributorId: true,
          label: true,
          requiredVerificationCount: true,
        },
      },
      evidence: {
        select: {
          contributionRequirementId: true,
          contributorId: true,
          reviewStatus: true,
          invalidatedAt: true,
        },
      },
    },
  });
}

function mapParticipants(
  period: PeriodForCalculation,
): DistributionParticipantInput[] {
  return period.participants.map((participant) => ({
    participantId: participant.id,
    contributorId: participant.contributorId,
    contributorDisplayName: participant.contributor.displayName,
    credentialId: participant.credentialId,
    credentialNumber: participant.credential.credentialNumber,
    collectionId: period.collectionId,
    collectionNumber: period.collection.collectionNumber,
    allocationBasisPoints: participant.credential.allocationBasisPoints,
    agreementReference: participant.agreementReference,
  }));
}

function validatePeriodParticipants(period: PeriodForCalculation): string | null {
  for (const participant of period.participants) {
    const validation = validateParticipantEnrollment({
      periodCollectionId: period.collectionId,
      credentialCollectionId: participant.credential.collectionId,
      credentialContributorId: participant.credential.contributorId,
      participantContributorId: participant.contributorId,
    });

    if (!validation.valid) {
      return validation.reason;
    }
  }

  return null;
}

function toEligibilitySnapshot(
  eligibility: "QUALIFIED" | "NOT_QUALIFIED" | "PENDING",
): EligibilitySnapshotStatus {
  return eligibility === "QUALIFIED"
    ? EligibilitySnapshotStatus.QUALIFIED
    : EligibilitySnapshotStatus.NOT_QUALIFIED;
}

export async function persistDistributionCalculation(input: {
  contributionPeriodId: string;
  replacesCalculationId?: string | null;
}): Promise<PersistCalculationResult> {
  const period = await loadPeriodForCalculation(input.contributionPeriodId);

  if (!period) {
    return { success: false, error: "This Contribution Period could not be found." };
  }

  if (period.status !== ContributionPeriodStatus.CLOSED) {
    return {
      success: false,
      error: "Calculations can only be created for closed Contribution Periods.",
    };
  }

  if (!period.distributionBasis || !isDistributionBasisApproved(period.distributionBasis)) {
    return {
      success: false,
      error: "An approved Distribution Basis is required before creating a calculation.",
    };
  }

  const approvedDistributableAmountInPence =
    period.distributionBasis.proposedDistributableAmountInPence;

  if (period.participants.length === 0) {
    return {
      success: false,
      error: "At least one enrolled participant is required before creating a calculation.",
    };
  }

  const participantValidationError = validatePeriodParticipants(period);

  if (participantValidationError) {
    return { success: false, error: participantValidationError };
  }

  const previewResult = buildDistributionPreview({
    periodStatus: period.status,
    distributableAmountInPence: approvedDistributableAmountInPence,
    requirements: period.requirements,
    evidence: period.evidence,
    participants: mapParticipants(period),
  });

  if (!previewResult.success) {
    return { success: false, error: previewResult.error };
  }

  const preview = previewResult.preview;
  const basisId = period.distributionBasis.id;

  try {
    const calculation = await prisma.$transaction(async (tx) => {
      const approvedCalculation = await tx.distributionCalculation.findFirst({
        where: {
          contributionPeriodId: period.id,
          status: DistributionCalculationStatus.APPROVED,
        },
        select: { id: true },
      });

      if (approvedCalculation) {
        throw new Error("APPROVED_EXISTS");
      }

      const pendingCalculation = await tx.distributionCalculation.findFirst({
        where: {
          contributionPeriodId: period.id,
          status: DistributionCalculationStatus.CALCULATED,
        },
        select: { id: true },
      });

      if (pendingCalculation) {
        throw new Error("CALCULATED_EXISTS");
      }

      if (input.replacesCalculationId) {
        const replacedCalculation = await tx.distributionCalculation.findUnique({
          where: { id: input.replacesCalculationId },
          select: {
            id: true,
            contributionPeriodId: true,
            status: true,
            replacedBy: {
              select: { id: true },
            },
          },
        });

        if (
          !replacedCalculation ||
          replacedCalculation.contributionPeriodId !== period.id
        ) {
          throw new Error("REPLACEMENT_NOT_FOUND");
        }

        if (replacedCalculation.status !== DistributionCalculationStatus.VOID) {
          throw new Error("REPLACEMENT_NOT_VOID");
        }

        if (replacedCalculation.replacedBy) {
          throw new Error("REPLACEMENT_ALREADY_EXISTS");
        }
      }

      const maxSequence = await tx.distributionCalculation.aggregate({
        where: { contributionPeriodId: period.id },
        _max: { calculationSequence: true },
      });

      const nextSequence = (maxSequence._max.calculationSequence ?? 0) + 1;
      const calculatedAt = new Date();

      const created = await tx.distributionCalculation.create({
        data: {
          contributionPeriodId: period.id,
          distributionBasisId: basisId,
          calculationSequence: nextSequence,
          status: DistributionCalculationStatus.CALCULATED,
          calculationVersion: getDistributionCalculationVersion(),
          distributableAmountInPence: approvedDistributableAmountInPence,
          currency: period.currency,
          calculatedAt,
          replacesCalculationId: input.replacesCalculationId ?? null,
          lines: {
            create: preview.lines.map((line) => ({
              contributionPeriodParticipantId: line.participantId,
              contributorId: line.contributorId,
              credentialId: line.credentialId,
              collectionId: line.collectionId,
              contributorDisplayNameSnapshot: line.contributorDisplayName,
              credentialNumberSnapshot: line.credentialNumber,
              collectionNumberSnapshot: line.collectionNumber,
              allocationBasisPointsSnapshot: line.allocationBasisPoints,
              agreementReferenceSnapshot: line.agreementReference,
              eligibilitySnapshot: toEligibilitySnapshot(line.eligibility),
              distributableAmountInPenceSnapshot: approvedDistributableAmountInPence,
              calculatedCompensationInPence: line.calculatedCompensationInPence,
              requirementAuditSnapshot:
                line.requirementAuditSnapshot as Prisma.InputJsonValue,
            })),
          },
        },
        select: { id: true },
      });

      return created;
    });

    return { success: true, calculationId: calculation.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;

      if (
        Array.isArray(target) &&
        target.includes("contributionPeriodId") &&
        target.includes("calculationSequence")
      ) {
        return {
          success: false,
          error:
            "Another calculation was created at the same time. Refresh and try again if still required.",
        };
      }

      return {
        success: false,
        error:
          "An active calculation already exists for this Contribution Period.",
      };
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "APPROVED_EXISTS":
          return {
            success: false,
            error: "An approved calculation already exists for this Contribution Period.",
          };
        case "CALCULATED_EXISTS":
          return {
            success: false,
            error:
              "A calculated record is awaiting review. Approve or void it before creating another calculation.",
          };
        case "REPLACEMENT_NOT_FOUND":
          return {
            success: false,
            error: "The calculation to replace could not be found.",
          };
        case "REPLACEMENT_NOT_VOID":
          return {
            success: false,
            error: "Only void calculations can be replaced.",
          };
        case "REPLACEMENT_ALREADY_EXISTS":
          return {
            success: false,
            error: "This calculation already has a replacement record.",
          };
      }
    }

    console.error(
      "[distribution] Failed to persist calculation",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to create the distribution calculation. Please try again.",
    };
  }
}
