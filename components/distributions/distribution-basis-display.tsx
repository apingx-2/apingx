import { formatArchiveDateTime } from "@/lib/collections/format-date";
import {
  formatAllocationBasisPoints,
} from "@/lib/credentials/format-credential-number";
import {
  getLegacySyntheticPlaceholderMessage,
  isLegacySyntheticDistributionBasis,
} from "@/lib/distribution/is-legacy-synthetic-basis";
import { formatProductPrice } from "@/lib/products/price";

type DistributionBasisDisplayProps = {
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

export function DistributionBasisDisplay({ basis }: DistributionBasisDisplayProps) {
  const poolPercent = (basis.contributorPoolBasisPoints / 100).toFixed(2);
  const isLegacySynthetic = isLegacySyntheticDistributionBasis(basis);

  return (
    <>
      {isLegacySynthetic ? (
        <p className="type-body rounded-sm border border-[var(--border-subtle)] px-4 py-3 text-[var(--text-secondary)]">
          {getLegacySyntheticPlaceholderMessage()}
        </p>
      ) : null}

    <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Gross Qualifying Product Sales
        </dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.grossQualifyingProductSalesInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">Discounts</dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.discountsInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Returns / Refunds
        </dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.returnsRefundsInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Successful Chargebacks
        </dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.successfulChargebacksInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Retained Product Revenue
        </dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.retainedProductRevenueInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">VAT Excluded</dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.vatExcludedInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Net Qualifying Revenue
        </dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.netQualifyingRevenueInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Contributor Pool
        </dt>
        <dd className="type-body mt-1">
          {formatAllocationBasisPoints(basis.contributorPoolBasisPoints)} ({poolPercent}%)
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          {basis.approvedAt ? "Approved Distributable Amount" : "Proposed Distributable Amount"}
        </dt>
        <dd className="type-body mt-1">
          {formatProductPrice(basis.proposedDistributableAmountInPence, basis.currency)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">
          Reconciliation Cutoff
        </dt>
        <dd className="type-body mt-1">
          {formatArchiveDateTime(basis.reconciliationCutoffAt)}
        </dd>
      </div>
      <div>
        <dt className="type-label text-[var(--text-secondary)]">Basis version</dt>
        <dd className="type-body mt-1">{basis.basisVersion}</dd>
      </div>
      {basis.approvedAt ? (
        <div>
          <dt className="type-label text-[var(--text-secondary)]">Approved</dt>
          <dd className="type-body mt-1">{formatArchiveDateTime(basis.approvedAt)}</dd>
        </div>
      ) : null}
    </dl>
    </>
  );
}
