"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRequirementAction } from "@/lib/distribution/actions";
import { deleteRequirementSchema } from "@/lib/distribution/schemas";

type RequirementDeleteControlProps = {
  requirementId: string;
  requirementLabel: string;
  contributionPeriodId: string;
};

export function RequirementDeleteControl({
  requirementId,
  requirementLabel,
  contributionPeriodId,
}: RequirementDeleteControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    setFormError(null);

    startTransition(async () => {
      const parsed = deleteRequirementSchema.safeParse({
        requirementId,
        contributionPeriodId,
      });

      if (!parsed.success) {
        setFormError("Unable to delete the requirement. Please try again.");
        return;
      }

      const result = await deleteRequirementAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setConfirming(false);
        return;
      }

      setConfirming(false);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)]"
      >
        Delete requirement
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-sm border border-[var(--border-strong)] px-4 py-4">
      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <p className="type-body">
        Delete <span className="type-label">{requirementLabel}</span>? This
        cannot be undone.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          aria-busy={isPending}
          onClick={handleDelete}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
        >
          Confirm delete
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setConfirming(false);
            setFormError(null);
          }}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
