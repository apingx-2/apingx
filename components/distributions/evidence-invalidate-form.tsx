"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { invalidateEvidenceVerificationAction } from "@/lib/distribution/actions";
import { invalidateEvidenceVerificationSchema } from "@/lib/distribution/schemas";

type EvidenceInvalidateFormProps = {
  evidenceId: string;
  contributionPeriodId: string;
};

export function EvidenceInvalidateForm({
  evidenceId,
  contributionPeriodId,
}: EvidenceInvalidateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [confirming, setConfirming] = useState(false);
  const [invalidationReason, setInvalidationReason] = useState("");

  function handleInvalidate() {
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = invalidateEvidenceVerificationSchema.safeParse({
        evidenceId,
        contributionPeriodId,
        invalidationReason,
      });

      if (!parsed.success) {
        setFormError(
          "Please review the invalidation and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await invalidateEvidenceVerificationAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setConfirming(false);
      setInvalidationReason("");
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)]"
        >
          Invalidate verification
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <p className="type-body">
        Invalidate this verification? The original review outcome will be
        preserved, but the evidence will no longer count toward eligibility.
      </p>

      <div className="space-y-2">
        <label htmlFor={`invalidationReason-${evidenceId}`} className="type-label">
          Invalidation reason
        </label>
        <textarea
          id={`invalidationReason-${evidenceId}`}
          value={invalidationReason}
          disabled={isPending}
          onChange={(event) => setInvalidationReason(event.target.value)}
          rows={3}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        {fieldErrors.invalidationReason?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.invalidationReason[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          aria-busy={isPending}
          onClick={handleInvalidate}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
        >
          Confirm invalidation
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setConfirming(false);
            setFormError(null);
            setFieldErrors({});
          }}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
