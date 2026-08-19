import {
  formatAllocationBasisPoints,
  formatCredentialNumber,
} from "@/lib/credentials/format-credential-number";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { EligibilityBadge } from "@/components/distributions/eligibility-badge";
import { formatProductPrice } from "@/lib/products/price";
import type { DistributionPreviewResult } from "@/lib/distribution/types";

type CalculationPreviewPanelProps = {
  preview: DistributionPreviewResult;
};

export function CalculationPreviewPanel({
  preview,
}: CalculationPreviewPanelProps) {
  return (
    <section className="surface-panel space-y-4 rounded-sm border p-6">
      <div className="space-y-2">
        <h2 className="type-label">Calculation preview</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Preview only — not an approved historical calculation. No record is
          persisted until you explicitly create a Distribution Calculation.
        </p>
      </div>

      <dl className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Calculation version
          </dt>
          <dd className="type-body mt-1">{preview.calculationVersion}</dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Distributable amount
          </dt>
          <dd className="type-body mt-1">
            {formatProductPrice(preview.distributableAmountInPence, "GBP")}
          </dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Total calculated compensation
          </dt>
          <dd className="type-body mt-1">
            {formatProductPrice(preview.totalCalculatedCompensationInPence, "GBP")}
          </dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Unallocated remainder
          </dt>
          <dd className="type-body mt-1">
            {formatProductPrice(preview.unallocatedRemainderInPence, "GBP")}
          </dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Qualified allocation
          </dt>
          <dd className="type-body mt-1">
            {formatAllocationBasisPoints(preview.totalQualifiedAllocationBasisPoints)}
          </dd>
        </div>
      </dl>

      <ul className="space-y-3">
        {preview.lines.map((line) => (
          <li
            key={line.participantId}
            className="rounded-sm border border-[var(--border-subtle)] px-4 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="type-body">
                  <span className="type-label">Contributor: </span>
                  {line.contributorDisplayName}
                </p>
                <p className="type-body">
                  <span className="type-label">Credential: </span>
                  {formatCredentialNumber(line.credentialNumber)}
                </p>
                <p className="type-body">
                  <span className="type-label">Collection: </span>
                  {formatCollectionNumber(line.collectionNumber)}
                </p>
                <p className="type-status">
                  Allocation: {formatAllocationBasisPoints(line.allocationBasisPoints)}
                </p>
                <p className="type-body">
                  Calculated compensation:{" "}
                  {formatProductPrice(line.calculatedCompensationInPence, "GBP")}
                </p>
              </div>
              <EligibilityBadge eligibility={line.eligibility} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
