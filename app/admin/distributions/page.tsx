import Link from "next/link";
import { PeriodArchiveCard } from "@/components/distributions/period-archive-card";
import { getContributionPeriods } from "@/lib/distribution/get-periods";

export const dynamic = "force-dynamic";

export default async function DistributionsPage() {
  const result = await getContributionPeriods();

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="type-metadata">Archive / Distributions</p>
            <h1 className="type-section mt-4">Contributor programme</h1>
            <p className="type-body mt-4 max-w-3xl md:text-[0.9375rem]">
              Administer Contribution Periods, document qualifying work, review
              archival evidence, and prepare contributor compensation records.
              This workflow does not move money or create settlement records.
            </p>
          </div>
          <Link
            href="/admin/distributions/periods/new"
            className="focus-ring type-label inline-flex shrink-0 rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            Create Contribution Period
          </Link>
        </div>
      </header>

      {result.status === "unavailable" ? (
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Contribution Period records are unavailable. Try again once the archive
          database connection is configured.
        </p>
      ) : null}

      {result.status === "success" && result.periods.length === 0 ? (
        <p className="type-body text-[var(--text-secondary)]">
          No Contribution Periods have been created yet.
        </p>
      ) : null}

      {result.status === "success" && result.periods.length > 0 ? (
        <div className="grid gap-4">
          {result.periods.map((period) => (
            <PeriodArchiveCard key={period.id} period={period} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
