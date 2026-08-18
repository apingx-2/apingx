import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributionPeriodStatus } from "@prisma/client";
import { PeriodForm } from "@/components/distributions/period-form";
import { getContributionPeriodById } from "@/lib/distribution/get-period-by-id";
import { getCollectionOptionsForPeriods } from "@/lib/distribution/get-enrollment-options";
import { periodToFormValues } from "@/lib/distribution/period-to-form-values";

export const dynamic = "force-dynamic";

type EditContributionPeriodPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContributionPeriodPage({
  params,
}: EditContributionPeriodPageProps) {
  const { id } = await params;
  const [periodResult, collectionsResult] = await Promise.all([
    getContributionPeriodById(id),
    getCollectionOptionsForPeriods(),
  ]);

  if (periodResult.status === "not_found") {
    notFound();
  }

  if (
    periodResult.status === "unavailable" ||
    collectionsResult.status === "unavailable"
  ) {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          This Contribution Period record is unavailable. Try again once the archive
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

  if (periodResult.period.status === ContributionPeriodStatus.CLOSED) {
    return (
      <div className="space-y-8">
        <p className="type-body text-[var(--text-secondary)]">
          Closed Contribution Periods cannot be edited through this workflow.
        </p>
        <Link
          href={`/admin/distributions/periods/${id}`}
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to period detail
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">Archive / Distributions / Edit period</p>
        <h1 className="type-section mt-4">Edit Contribution Period</h1>
        <Link
          href={`/admin/distributions/periods/${id}`}
          className="focus-ring type-label mt-6 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to period detail
        </Link>
      </div>

      <PeriodForm
        mode="edit"
        periodId={id}
        collections={collectionsResult.collections}
        initialValues={periodToFormValues(periodResult.period)}
        currentStatus={periodResult.period.status}
      />
    </div>
  );
}
