import Link from "next/link";
import { PeriodForm } from "@/components/distributions/period-form";
import { getCollectionOptionsForPeriods } from "@/lib/distribution/get-enrollment-options";

export const dynamic = "force-dynamic";

export default async function NewContributionPeriodPage() {
  const collectionsResult = await getCollectionOptionsForPeriods();

  if (collectionsResult.status === "unavailable") {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Contribution Period records are unavailable. Try again once the archive
          database connection is configured.
        </p>
        <Link
          href="/admin/distributions"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Distributions
        </Link>
      </div>
    );
  }

  if (collectionsResult.collections.length === 0) {
    return (
      <div className="space-y-8">
        <p className="type-body text-[var(--text-secondary)]">
          Create a Collection before opening a Contribution Period.
        </p>
        <Link
          href="/admin/collections/new"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Create Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">Archive / Distributions / New period</p>
        <h1 className="type-section mt-4">Create Contribution Period</h1>
        <Link
          href="/admin/distributions"
          className="focus-ring type-label mt-6 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Distributions
        </Link>
      </div>

      <PeriodForm mode="create" collections={collectionsResult.collections} />
    </div>
  );
}
