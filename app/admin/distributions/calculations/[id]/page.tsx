import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculationDetailView } from "@/components/distributions/calculation-detail-view";
import { getDistributionCalculationById } from "@/lib/distribution/get-calculation-by-id";
import { getPeriodCalculations } from "@/lib/distribution/get-period-calculations";

export const dynamic = "force-dynamic";

type DistributionCalculationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DistributionCalculationDetailPage({
  params,
}: DistributionCalculationDetailPageProps) {
  const { id } = await params;
  const result = await getDistributionCalculationById(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          This distribution calculation record is unavailable. Try again once the
          archive database connection is configured.
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

  const periodCalculations = await getPeriodCalculations(
    result.calculation.contributionPeriodId,
  );

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <Link
          href="/admin/distributions"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Distributions
        </Link>
      </div>

      <CalculationDetailView
        calculation={result.calculation}
        periodCalculations={periodCalculations}
      />
    </div>
  );
}
