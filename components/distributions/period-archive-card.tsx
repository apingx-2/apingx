import Link from "next/link";
import { formatArchiveDate } from "@/lib/collections/format-date";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import type { ContributionPeriodListItem } from "@/lib/distribution/get-periods";
import { formatProductPrice } from "@/lib/products/price";
import { PeriodStatusBadge } from "@/components/distributions/period-status-badge";

type PeriodArchiveCardProps = {
  period: ContributionPeriodListItem;
};

export function PeriodArchiveCard({ period }: PeriodArchiveCardProps) {
  const start = formatArchiveDate(period.startDate);
  const end = formatArchiveDate(period.endDate);
  const { eligibilitySummary } = period;

  return (
    <article className="surface-panel rounded-sm border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="type-metadata">
            {formatCollectionNumber(period.collection.collectionNumber)} /{" "}
            {period.collection.name}
          </p>
          <h2 className="type-subsection">
            <Link
              href={`/admin/distributions/periods/${period.id}`}
              className="focus-ring rounded-sm transition-colors hover:text-[var(--accent-steel)]"
            >
              {period.title}
            </Link>
          </h2>
          <p className="type-body text-[var(--text-secondary)]">
            {start} to {end}
          </p>
        </div>
        <PeriodStatusBadge status={period.status} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="type-label text-[var(--text-secondary)]">Participants</dt>
          <dd className="type-body mt-1">{period.participantCount}</dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Approved distributable amount
          </dt>
          <dd className="type-body mt-1">
            {period.approvedDistributableAmountInPence !== null
              ? formatProductPrice(
                  period.approvedDistributableAmountInPence,
                  period.currency,
                )
              : "Not approved"}
          </dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">Qualified</dt>
          <dd className="type-body mt-1">{eligibilitySummary.qualified}</dd>
        </div>
        <div>
          <dt className="type-label text-[var(--text-secondary)]">
            Pending / not qualified
          </dt>
          <dd className="type-body mt-1">
            {eligibilitySummary.pending} / {eligibilitySummary.notQualified}
          </dd>
        </div>
      </dl>
    </article>
  );
}
