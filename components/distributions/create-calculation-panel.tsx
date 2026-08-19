"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDistributionCalculationAction } from "@/lib/distribution/actions";
import { createDistributionCalculationSchema } from "@/lib/distribution/schemas";

type CreateCalculationPanelProps = {
  contributionPeriodId: string;
};

export function CreateCalculationPanel({
  contributionPeriodId,
}: CreateCalculationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleCreate() {
    setFormError(null);

    startTransition(async () => {
      const parsed = createDistributionCalculationSchema.safeParse({
        contributionPeriodId,
      });

      if (!parsed.success) {
        setFormError("Unable to create the distribution calculation. Please try again.");
        return;
      }

      const result = await createDistributionCalculationAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.push(`/admin/distributions/calculations/${result.id}`);
    });
  }

  return (
    <div className="space-y-4 border-t border-[var(--border-subtle)] pt-4">
      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={isPending}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span className="type-body">
          I understand that this creates an immutable historical calculation
          snapshot from the current closed-period state. No payment or settlement
          occurs.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleCreate}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Create Distribution Calculation
      </button>
    </div>
  );
}
