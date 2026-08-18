"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { closeContributionPeriodAction } from "@/lib/distribution/actions";

type ClosePeriodPanelProps = {
  contributionPeriodId: string;
};

export function ClosePeriodPanel({
  contributionPeriodId,
}: ClosePeriodPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleClose() {
    setFormError(null);

    startTransition(async () => {
      const result = await closeContributionPeriodAction({
        contributionPeriodId,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="surface-panel space-y-4 rounded-sm border p-6">
      <div className="space-y-2">
        <h2 className="type-label">Close Contribution Period</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Closing finalises Contributor eligibility for future historical
          calculation purposes. Contributors who have not satisfied applicable
          requirements will be marked not qualified when the period is closed.
          Existing evidence records are not modified automatically. No
          compensation calculation, payment, or settlement will be created.
        </p>
      </div>

      {formError ? (
        <p role="alert" className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3">
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
          I understand that closing this period finalises eligibility and that
          Contributors who have not satisfied applicable requirements will be
          marked not qualified.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleClose}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
      >
        Close Contribution Period
      </button>
    </section>
  );
}
