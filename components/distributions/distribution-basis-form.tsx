"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertDistributionBasisAction } from "@/lib/distribution/actions";
import {
  basisMoneyToInput,
  upsertDistributionBasisSchema,
} from "@/lib/distribution/schemas";
import { deriveDistributionBasis } from "@/lib/distribution/distribution-basis";
import {
  getLegacySyntheticPlaceholderMessage,
  isLegacySyntheticDistributionBasis,
} from "@/lib/distribution/is-legacy-synthetic-basis";
import { DistributionBasisDisplay } from "@/components/distributions/distribution-basis-display";
import { formatProductPrice } from "@/lib/products/price";
import {
  formatAllocationBasisPoints,
} from "@/lib/credentials/format-credential-number";

type DistributionBasisFormProps = {
  contributionPeriodId: string;
  initialBasis: {
    grossQualifyingProductSalesInPence: number;
    discountsInPence: number;
    returnsRefundsInPence: number;
    successfulChargebacksInPence: number;
    vatExcludedInPence: number;
    contributorPoolBasisPoints: number;
    reconciliationCutoffAt: Date;
    currency: string;
    basisVersion: string;
    isLegacySyntheticPlaceholder: boolean;
    approvedAt: Date | null;
    retainedProductRevenueInPence: number;
    netQualifyingRevenueInPence: number;
    proposedDistributableAmountInPence: number;
  } | null;
};

function toLocalDateTimeInput(date: Date): string {
  const copy = new Date(date);
  const offset = copy.getTimezoneOffset();
  copy.setMinutes(copy.getMinutes() - offset);
  return copy.toISOString().slice(0, 16);
}

export function DistributionBasisForm({
  contributionPeriodId,
  initialBasis,
}: DistributionBasisFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [grossQualifyingProductSalesGbp, setGrossQualifyingProductSalesGbp] =
    useState(
      initialBasis
        ? basisMoneyToInput(initialBasis.grossQualifyingProductSalesInPence)
        : "",
    );
  const [discountsGbp, setDiscountsGbp] = useState(
    initialBasis ? basisMoneyToInput(initialBasis.discountsInPence) : "0.00",
  );
  const [returnsRefundsGbp, setReturnsRefundsGbp] = useState(
    initialBasis ? basisMoneyToInput(initialBasis.returnsRefundsInPence) : "0.00",
  );
  const [successfulChargebacksGbp, setSuccessfulChargebacksGbp] = useState(
    initialBasis
      ? basisMoneyToInput(initialBasis.successfulChargebacksInPence)
      : "0.00",
  );
  const [vatExcludedGbp, setVatExcludedGbp] = useState(
    initialBasis ? basisMoneyToInput(initialBasis.vatExcludedInPence) : "0.00",
  );
  const [contributorPoolBasisPoints, setContributorPoolBasisPoints] = useState(
    initialBasis ? String(initialBasis.contributorPoolBasisPoints) : "2000",
  );
  const [reconciliationCutoffAt, setReconciliationCutoffAt] = useState(
    initialBasis
      ? toLocalDateTimeInput(initialBasis.reconciliationCutoffAt)
      : toLocalDateTimeInput(new Date()),
  );

  const preview = useMemo(() => {
    try {
      const gross = Number(grossQualifyingProductSalesGbp.replace(/[£,\s]/g, ""));
      if (!grossQualifyingProductSalesGbp.trim()) {
        return null;
      }

      return deriveDistributionBasis({
        grossQualifyingProductSalesInPence: Math.round(
          parseFloat(grossQualifyingProductSalesGbp.replace(/[£,\s]/g, "") || "0") * 100,
        ),
        discountsInPence: Math.round(parseFloat(discountsGbp || "0") * 100),
        returnsRefundsInPence: Math.round(parseFloat(returnsRefundsGbp || "0") * 100),
        successfulChargebacksInPence: Math.round(
          parseFloat(successfulChargebacksGbp || "0") * 100,
        ),
        vatExcludedInPence: Math.round(parseFloat(vatExcludedGbp || "0") * 100),
        contributorPoolBasisPoints: Number(contributorPoolBasisPoints || 0),
      });
    } catch {
      return null;
    }
  }, [
    grossQualifyingProductSalesGbp,
    discountsGbp,
    returnsRefundsGbp,
    successfulChargebacksGbp,
    vatExcludedGbp,
    contributorPoolBasisPoints,
  ]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = upsertDistributionBasisSchema.safeParse({
        contributionPeriodId,
        grossQualifyingProductSalesGbp,
        discountsGbp,
        returnsRefundsGbp,
        successfulChargebacksGbp,
        vatExcludedGbp,
        contributorPoolBasisPoints,
        reconciliationCutoffAt,
      });

      if (!parsed.success) {
        setFormError(
          "Please review the Distribution Basis and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await upsertDistributionBasisAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="surface-panel space-y-4 rounded-sm border p-6">
      <div className="space-y-2">
        <h2 className="type-label">Distribution Basis</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Commercial reconciliation for this closed Contribution Period.
          Shipping and delivery are excluded. Operating costs are not deducted.
          Returns affect the commercial pool only — not Contributor qualification.
          This is not a payout or settlement.
        </p>
        {initialBasis && isLegacySyntheticDistributionBasis(initialBasis) ? (
          <p className="type-body rounded-sm border border-[var(--border-subtle)] px-4 py-3 text-[var(--text-secondary)]">
            {getLegacySyntheticPlaceholderMessage()}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? (
          <p
            role="alert"
            className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
          >
            {formError}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["grossQualifyingProductSalesGbp", "Gross Qualifying Product Sales", grossQualifyingProductSalesGbp, setGrossQualifyingProductSalesGbp],
              ["discountsGbp", "Discounts", discountsGbp, setDiscountsGbp],
              ["returnsRefundsGbp", "Returns / Refunds", returnsRefundsGbp, setReturnsRefundsGbp],
              ["successfulChargebacksGbp", "Successful Chargebacks", successfulChargebacksGbp, setSuccessfulChargebacksGbp],
              ["vatExcludedGbp", "VAT Excluded", vatExcludedGbp, setVatExcludedGbp],
            ] as const
          ).map(([id, label, value, setter]) => (
            <div key={id} className="space-y-2">
              <label htmlFor={id} className="type-label">
                {label} (GBP)
              </label>
              <input
                id={id}
                type="text"
                inputMode="decimal"
                value={value}
                disabled={isPending}
                onChange={(event) => setter(event.target.value)}
                className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
              />
              {fieldErrors[id]?.[0] ? (
                <p className="type-status text-[var(--text-secondary)]">
                  {fieldErrors[id][0]}
                </p>
              ) : null}
            </div>
          ))}

          <div className="space-y-2">
            <label htmlFor="contributorPoolBasisPoints" className="type-label">
              Contributor Pool Basis Points
            </label>
            <input
              id="contributorPoolBasisPoints"
              type="number"
              min={0}
              max={10000}
              value={contributorPoolBasisPoints}
              disabled={isPending}
              onChange={(event) => setContributorPoolBasisPoints(event.target.value)}
              className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
            />
            {fieldErrors.contributorPoolBasisPoints?.[0] ? (
              <p className="type-status text-[var(--text-secondary)]">
                {fieldErrors.contributorPoolBasisPoints[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="reconciliationCutoffAt" className="type-label">
              Reconciliation Cutoff
            </label>
            <input
              id="reconciliationCutoffAt"
              type="datetime-local"
              value={reconciliationCutoffAt}
              disabled={isPending}
              onChange={(event) => setReconciliationCutoffAt(event.target.value)}
              className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
            />
            {fieldErrors.reconciliationCutoffAt?.[0] ? (
              <p className="type-status text-[var(--text-secondary)]">
                {fieldErrors.reconciliationCutoffAt[0]}
              </p>
            ) : null}
          </div>
        </div>

        {preview ? (
          <div className="rounded-sm border border-[var(--border-subtle)] px-4 py-4">
            <h3 className="type-label">Derived values</h3>
            <dl className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <dt className="type-label text-[var(--text-secondary)]">
                  Retained Product Revenue
                </dt>
                <dd className="type-body mt-1">
                  {formatProductPrice(preview.retainedProductRevenueInPence, "GBP")}
                </dd>
              </div>
              <div>
                <dt className="type-label text-[var(--text-secondary)]">
                  Net Qualifying Revenue
                </dt>
                <dd className="type-body mt-1">
                  {formatProductPrice(preview.netQualifyingRevenueInPence, "GBP")}
                </dd>
              </div>
              <div>
                <dt className="type-label text-[var(--text-secondary)]">
                  Proposed Distributable Amount
                </dt>
                <dd className="type-body mt-1">
                  {formatProductPrice(preview.proposedDistributableAmountInPence, "GBP")}
                </dd>
              </div>
              <div>
                <dt className="type-label text-[var(--text-secondary)]">
                  Contributor Pool
                </dt>
                <dd className="type-body mt-1">
                  {formatAllocationBasisPoints(Number(contributorPoolBasisPoints || 0))}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
        >
          Save Distribution Basis
        </button>
      </form>
    </section>
  );
}
