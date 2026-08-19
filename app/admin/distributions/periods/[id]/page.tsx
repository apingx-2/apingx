import Link from "next/link";
import { notFound } from "next/navigation";
import { PeriodMetadata } from "@/components/distributions/period-metadata";
import { buildClosedPeriodPreview } from "@/lib/distribution/build-period-preview";
import { getContributionPeriodById } from "@/lib/distribution/get-period-by-id";
import { getPeriodCalculations } from "@/lib/distribution/get-period-calculations";
import {
  getContributorOptionsForRequirements,
  getEnrollmentOptions,
} from "@/lib/distribution/get-enrollment-options";

export const dynamic = "force-dynamic";

type ContributionPeriodDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContributionPeriodDetailPage({
  params,
}: ContributionPeriodDetailPageProps) {
  const { id } = await params;
  const result = await getContributionPeriodById(id);

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
          This Contribution Period record is unavailable. Try again once the
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

  const [enrollmentOptions, contributorOptions, calculations] = await Promise.all([
    getEnrollmentOptions(id),
    getContributorOptionsForRequirements(id),
    getPeriodCalculations(id),
  ]);

  if (
    enrollmentOptions.status === "unavailable" ||
    contributorOptions.status === "unavailable"
  ) {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Enrollment options are unavailable. Try again once the archive database
          connection is configured.
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

  const previewResult = buildClosedPeriodPreview(result.period);

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">Archive / Distributions / Period</p>
        <Link
          href="/admin/distributions"
          className="focus-ring type-label mt-6 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Distributions
        </Link>
      </div>

      <PeriodMetadata
        period={result.period}
        calculations={calculations}
        preview={previewResult?.success ? previewResult.preview : null}
        previewError={previewResult && !previewResult.success ? previewResult.error : null}
        enrollmentOptions={
          enrollmentOptions.status === "success"
            ? enrollmentOptions
            : {
                contributors: [],
                credentials: [],
                enrolledCredentialIds: [],
              }
        }
        requirementContributorOptions={
          contributorOptions.status === "success"
            ? contributorOptions.contributors
            : []
        }
      />
    </div>
  );
}
