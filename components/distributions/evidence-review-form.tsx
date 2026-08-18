"use client";

import { ContributionEvidenceReviewStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewEvidenceAction } from "@/lib/distribution/actions";
import { reviewEvidenceSchema } from "@/lib/distribution/schemas";

type EvidenceReviewFormProps = {
  evidenceId: string;
  contributionPeriodId: string;
  disabled?: boolean;
};

export function EvidenceReviewForm({
  evidenceId,
  contributionPeriodId,
  disabled = false,
}: EvidenceReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  function handleReview(reviewStatus: ContributionEvidenceReviewStatus) {
    setFormError(null);

    startTransition(async () => {
      const parsed = reviewEvidenceSchema.safeParse({
        evidenceId,
        contributionPeriodId,
        reviewStatus,
        rejectionReason,
      });

      if (!parsed.success) {
        setFormError(
          parsed.error.flatten().fieldErrors.rejectionReason?.[0] ??
            "Please review the evidence decision and correct the highlighted fields.",
        );
        return;
      }

      const result = await reviewEvidenceAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      setRejectionReason("");
      router.refresh();
    });
  }

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
      {formError ? (
        <p role="alert" className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3">
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={`rejectionReason-${evidenceId}`} className="type-label">
          Rejection reason (required if rejecting)
        </label>
        <textarea
          id={`rejectionReason-${evidenceId}`}
          value={rejectionReason}
          disabled={isPending}
          onChange={(event) => setRejectionReason(event.target.value)}
          rows={2}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          aria-busy={isPending}
          onClick={() =>
            handleReview(ContributionEvidenceReviewStatus.VERIFIED)
          }
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
        >
          Verify evidence
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-busy={isPending}
          onClick={() =>
            handleReview(ContributionEvidenceReviewStatus.REJECTED)
          }
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
        >
          Reject evidence
        </button>
      </div>
    </div>
  );
}
