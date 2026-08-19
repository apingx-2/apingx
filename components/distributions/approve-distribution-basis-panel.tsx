"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DistributionBasisDisplay } from "@/components/distributions/distribution-basis-display";
import { approveDistributionBasisAction } from "@/lib/distribution/actions";
import { approveDistributionBasisSchema } from "@/lib/distribution/schemas";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";

type ApproveDistributionBasisPanelProps = {
  contributionPeriodId: string;
  periodTitle: string;
  collectionNumber: number;
  collectionName: string;
  basis: {
    currency: string;
    grossQualifyingProductSalesInPence: number;
    discountsInPence: number;
    returnsRefundsInPence: number;
    successfulChargebacksInPence: number;
    retainedProductRevenueInPence: number;
    vatExcludedInPence: number;
    netQualifyingRevenueInPence: number;
    contributorPoolBasisPoints: number;
    proposedDistributableAmountInPence: number;
    reconciliationCutoffAt: Date;
    basisVersion: string;
    isLegacySyntheticPlaceholder: boolean;
    approvedAt: Date | null;
  };
};

export function ApproveDistributionBasisPanel({
  contributionPeriodId,
  periodTitle,
  collectionNumber,
  collectionName,
  basis,
}: ApproveDistributionBasisPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleApprove() {
    setFormError(null);

    startTransition(async () => {
      const parsed = approveDistributionBasisSchema.safeParse({
        contributionPeriodId,
      });

      if (!parsed.success) {
        setFormError(
          "Unable to approve the Distribution Basis. Please try again.",
        );
        return;
      }

      const result = await approveDistributionBasisAction(parsed.data);

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
        <h2 className="type-label">Review &amp; Approve Distribution Basis</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Approval records the commercial reconciliation for this closed
          Contribution Period and enables historical calculation creation. No
          payment or settlement occurs.
        </p>
      </div>

      <dl className="grid gap-3 md:grid-cols-2">
        <div>
          <dt className="type-label text-[var(--text-secondary)]">Period</dt>
          <dd className="type-body mt-1">{periodTitle}</dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">Collection</dt>
          <dd className="type-body mt-1">
            {formatCollectionNumber(collectionNumber)} / {collectionName}
          </dd>
        </div>
      </dl>

      <DistributionBasisDisplay basis={basis} />

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
          I understand that approving this Distribution Basis enables historical
          calculation creation and that the approved commercial inputs become
          immutable through normal workflows.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleApprove}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Approve Distribution Basis
      </button>
    </section>
  );
}
