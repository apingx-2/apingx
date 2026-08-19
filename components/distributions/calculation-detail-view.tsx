import Link from "next/link";
import { DistributionCalculationStatus } from "@prisma/client";
import {
  ApproveCalculationPanel,
  CreateReplacementCalculationPanel,
  VoidCalculationPanel,
} from "@/components/distributions/calculation-action-panels";
import { CalculationStatusBadge } from "@/components/distributions/calculation-status-badge";
import { DistributionBasisDisplay } from "@/components/distributions/distribution-basis-display";
import { EligibilityBadge } from "@/components/distributions/eligibility-badge";
import { formatArchiveDateTime } from "@/lib/collections/format-date";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import {
  formatAllocationBasisPoints,
  formatCredentialNumber,
} from "@/lib/credentials/format-credential-number";
import {
  canApproveDistributionCalculation,
  canCreateReplacementCalculation,
  canVoidDistributionCalculation,
} from "@/lib/distribution/calculation-lifecycle";
import type { DistributionCalculationDetail } from "@/lib/distribution/get-calculation-by-id";
import type { PeriodCalculationSummary } from "@/lib/distribution/get-period-calculations";
import { formatRequirementAuditSnapshot } from "@/lib/distribution/format-requirement-audit-snapshot";
import { formatProductPrice } from "@/lib/products/price";

type CalculationDetailViewProps = {
  calculation: DistributionCalculationDetail;
  periodCalculations: PeriodCalculationSummary[];
};

export function CalculationDetailView({
  calculation,
  periodCalculations,
}: CalculationDetailViewProps) {
  const canApprove = canApproveDistributionCalculation({
    calculationStatus: calculation.status,
    periodStatus: calculation.period.status,
    distributionBasis: calculation.distributionBasis,
    calculations: periodCalculations,
    calculationId: calculation.id,
  });
  const canVoid = canVoidDistributionCalculation({
    calculationStatus: calculation.status,
  });
  const canReplace = canCreateReplacementCalculation({
    calculationStatus: calculation.status,
    replacedById: calculation.replacedById,
  });

  const qualifiedContributors = [
    ...new Set(
      calculation.lines
        .filter((line) => line.eligibilitySnapshot === "QUALIFIED")
        .map((line) => line.contributorDisplayNameSnapshot),
    ),
  ];
  const notQualifiedContributors = [
    ...new Set(
      calculation.lines
        .filter((line) => line.eligibilitySnapshot === "NOT_QUALIFIED")
        .map((line) => line.contributorDisplayNameSnapshot),
    ),
  ];

  return (
    <div className="space-y-8">
      <section className="surface-panel space-y-6 rounded-sm border p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="type-metadata">
              Archive / Distributions / Calculation
            </p>
            <h1 className="type-section">
              Calculation {calculation.calculationSequence}
            </h1>
            <p className="type-body text-[var(--text-secondary)]">
              {calculation.period.title}
            </p>
            <p className="type-body text-[var(--text-secondary)]">
              {formatCollectionNumber(calculation.period.collection.collectionNumber)}{" "}
              / {calculation.period.collection.name}
            </p>
          </div>
          <CalculationStatusBadge status={calculation.status} />
        </div>

        <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Calculation version
            </dt>
            <dd className="type-body mt-1">{calculation.calculationVersion}</dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Approved distributable amount
            </dt>
            <dd className="type-body mt-1">
              {formatProductPrice(calculation.distributableAmountInPence, calculation.currency)}
            </dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Total calculated compensation
            </dt>
            <dd className="type-body mt-1">
              {formatProductPrice(
                calculation.totalCalculatedCompensationInPence,
                calculation.currency,
              )}
            </dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Unallocated remainder
            </dt>
            <dd className="type-body mt-1">
              {formatProductPrice(
                calculation.unallocatedRemainderInPence,
                calculation.currency,
              )}
            </dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Qualified allocation
            </dt>
            <dd className="type-body mt-1">
              {formatAllocationBasisPoints(calculation.totalQualifiedAllocationBasisPoints)}
            </dd>
          </div>
          {calculation.calculatedAt ? (
            <div>
              <dt className="type-label text-[var(--text-secondary)]">
                Calculated
              </dt>
              <dd className="type-body mt-1">
                {formatArchiveDateTime(calculation.calculatedAt)}
              </dd>
            </div>
          ) : null}
          {calculation.approvedAt ? (
            <div>
              <dt className="type-label text-[var(--text-secondary)]">
                Approved
              </dt>
              <dd className="type-body mt-1">
                {formatArchiveDateTime(calculation.approvedAt)}
              </dd>
            </div>
          ) : null}
          {calculation.voidedAt ? (
            <div>
              <dt className="type-label text-[var(--text-secondary)]">
                Voided
              </dt>
              <dd className="type-body mt-1">
                {formatArchiveDateTime(calculation.voidedAt)}
              </dd>
            </div>
          ) : null}
          {calculation.replacesCalculationId ? (
            <div>
              <dt className="type-label text-[var(--text-secondary)]">
                Replaces
              </dt>
              <dd className="type-body mt-1 break-all">
                <Link
                  href={`/admin/distributions/calculations/${calculation.replacesCalculationId}`}
                  className="focus-ring rounded-sm text-[var(--accent-steel)] underline-offset-2 hover:underline"
                >
                  Calculation record {calculation.replacesCalculationId}
                </Link>
              </dd>
            </div>
          ) : null}
          {calculation.replacedById ? (
            <div>
              <dt className="type-label text-[var(--text-secondary)]">
                Replaced by
              </dt>
              <dd className="type-body mt-1 break-all">
                <Link
                  href={`/admin/distributions/calculations/${calculation.replacedById}`}
                  className="focus-ring rounded-sm text-[var(--accent-steel)] underline-offset-2 hover:underline"
                >
                  Calculation record {calculation.replacedById}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>

        {calculation.voidReason ? (
          <p className="type-body text-[var(--text-secondary)]">
            Void reason: {calculation.voidReason}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="type-label">Qualified Contributors</h2>
            {qualifiedContributors.length === 0 ? (
              <p className="type-body mt-2 text-[var(--text-secondary)]">None</p>
            ) : (
              <ul className="type-body mt-2 list-disc pl-5">
                {qualifiedContributors.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="type-label">Not qualified Contributors</h2>
            {notQualifiedContributors.length === 0 ? (
              <p className="type-body mt-2 text-[var(--text-secondary)]">None</p>
            ) : (
              <ul className="type-body mt-2 list-disc pl-5">
                {notQualifiedContributors.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {calculation.distributionBasis ? (
        <section className="surface-panel space-y-4 rounded-sm border p-6">
          <div className="space-y-2">
            <h2 className="type-label">Distribution Basis (traceability)</h2>
            <p className="type-body text-[var(--text-secondary)]">
              Commercial reconciliation consumed by this calculation. Amounts are
              snapshotted on the calculation header; the basis record is shown
              for historical traceability.
            </p>
          </div>
          <DistributionBasisDisplay basis={calculation.distributionBasis} />
        </section>
      ) : null}

      <section className="surface-panel space-y-4 rounded-sm border p-6">
        <h2 className="type-label">Calculation lines</h2>
        <ul className="space-y-4">
          {calculation.lines.map((line) => (
            <li
              key={line.id}
              className="rounded-sm border border-[var(--border-subtle)] px-4 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="type-body">
                    <span className="type-label">Contributor: </span>
                    {line.contributorDisplayNameSnapshot}
                  </p>
                  <p className="type-body">
                    <span className="type-label">Credential: </span>
                    {formatCredentialNumber(line.credentialNumberSnapshot)}
                  </p>
                  <p className="type-body">
                    <span className="type-label">Collection: </span>
                    {formatCollectionNumber(line.collectionNumberSnapshot)}
                  </p>
                  {line.agreementReferenceSnapshot ? (
                    <p className="type-body break-all">
                      <span className="type-label">Agreement reference: </span>
                      {line.agreementReferenceSnapshot}
                    </p>
                  ) : null}
                  <p className="type-status">
                    Allocation:{" "}
                    {formatAllocationBasisPoints(line.allocationBasisPointsSnapshot)}
                  </p>
                  <p className="type-body">
                    Calculated compensation:{" "}
                    {formatProductPrice(
                      line.calculatedCompensationInPence,
                      calculation.currency,
                    )}
                  </p>
                  <div className="space-y-1">
                    <p className="type-label">Requirement audit snapshot</p>
                    <ul className="type-body list-disc pl-5 text-[var(--text-secondary)]">
                      {formatRequirementAuditSnapshot(
                        line.requirementAuditSnapshot,
                      ).map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <EligibilityBadge
                  eligibility={
                    line.eligibilitySnapshot === "QUALIFIED"
                      ? "QUALIFIED"
                      : "NOT_QUALIFIED"
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {calculation.status === DistributionCalculationStatus.CALCULATED &&
      canApprove ? (
        <ApproveCalculationPanel calculationId={calculation.id} />
      ) : null}

      {canVoid ? (
        <VoidCalculationPanel calculationId={calculation.id} />
      ) : null}

      {canReplace ? (
        <CreateReplacementCalculationPanel voidedCalculationId={calculation.id} />
      ) : null}

      <Link
        href={`/admin/distributions/periods/${calculation.contributionPeriodId}`}
        className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        Back to Contribution Period
      </Link>
    </div>
  );
}
