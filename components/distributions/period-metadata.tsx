import Link from "next/link";
import { ContributionPeriodStatus } from "@prisma/client";
import { ClosePeriodPanel } from "@/components/distributions/close-period-panel";
import { CalculationHistorySection } from "@/components/distributions/calculation-history-section";
import { CalculationPreviewPanel } from "@/components/distributions/calculation-preview-panel";
import {
  DiscardPeriodBlockedNotice,
  DiscardPeriodPanel,
} from "@/components/distributions/discard-period-panel";
import { EligibilityBadge } from "@/components/distributions/eligibility-badge";
import { EvidenceForm } from "@/components/distributions/evidence-form";
import { EvidenceInvalidateForm } from "@/components/distributions/evidence-invalidate-form";
import { EvidenceReviewForm } from "@/components/distributions/evidence-review-form";
import { EvidenceStatusBadge } from "@/components/distributions/evidence-status-badge";
import { ParticipantEnrollmentForm } from "@/components/distributions/participant-enrollment-form";
import { PeriodStatusBadge } from "@/components/distributions/period-status-badge";
import { RequirementForm } from "@/components/distributions/requirement-form";
import { RequirementListItem } from "@/components/distributions/requirement-list-item";
import { formatArchiveDate, formatArchiveDateTime } from "@/lib/collections/format-date";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { isDistributionBasisApproved } from "@/lib/distribution/basis-lifecycle";
import {
  formatAllocationBasisPoints,
  formatCredentialNumber,
} from "@/lib/credentials/format-credential-number";
import type { ContributionPeriodDetail } from "@/lib/distribution/get-period-by-id";
import type {
  EnrollmentContributorOption,
  EnrollmentCredentialOption,
} from "@/lib/distribution/get-enrollment-options";
import { canInvalidateEvidenceVerification } from "@/lib/distribution/evidence-lifecycle";
import {
  canDiscardContributionPeriod,
  getDiscardBlockReason,
} from "@/lib/distribution/period-discard-lifecycle";
import { formatEvidenceProgressLabel } from "@/lib/distribution/evidence-progress";
import type { PeriodCalculationSummary } from "@/lib/distribution/get-period-calculations";
import type { DistributionPreviewResult } from "@/lib/distribution/types";
import { formatProductPrice } from "@/lib/products/price";

type PeriodMetadataProps = {
  period: ContributionPeriodDetail;
  calculations: PeriodCalculationSummary[];
  preview: DistributionPreviewResult | null;
  previewError: string | null;
  enrollmentOptions: {
    contributors: EnrollmentContributorOption[];
    credentials: EnrollmentCredentialOption[];
    enrolledCredentialIds: string[];
  };
  requirementContributorOptions: EnrollmentContributorOption[];
};

export function PeriodMetadata({
  period,
  calculations,
  preview,
  previewError,
  enrollmentOptions,
  requirementContributorOptions,
}: PeriodMetadataProps) {
  const isClosed = period.status === ContributionPeriodStatus.CLOSED;
  const isEditable = !isClosed;
  const evidenceCount = period.evidence.length;
  const discardable = canDiscardContributionPeriod({
    status: period.status,
    evidenceCount,
    calculationCount: period.calculationCount,
  });
  const discardBlockReason = getDiscardBlockReason({
    status: period.status,
    evidenceCount,
    calculationCount: period.calculationCount,
  });

  const eligibilityByContributor = new Map(
    period.contributorEligibility.map((entry) => [
      entry.contributorId,
      entry.eligibility,
    ]),
  );

  return (
    <div className="space-y-8">
      <section className="surface-panel space-y-6 rounded-sm border p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="type-metadata">
              {formatCollectionNumber(period.collection.collectionNumber)} /{" "}
              {period.collection.name}
            </p>
            <h1 className="type-section">{period.title}</h1>
            <p className="type-body text-[var(--text-secondary)]">
              {formatArchiveDate(period.startDate)} to{" "}
              {formatArchiveDate(period.endDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodStatusBadge status={period.status} />
            {isEditable ? (
              <Link
                href={`/admin/distributions/periods/${period.id}/edit`}
                className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                Edit period
              </Link>
            ) : null}
          </div>
        </div>

        <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Distribution Basis
            </dt>
            <dd className="type-body mt-1">
              {period.distributionBasis
                ? isDistributionBasisApproved(period.distributionBasis)
                  ? "Approved"
                  : "Prepared (not approved)"
                : "Not prepared"}
            </dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Approved distributable amount
            </dt>
            <dd className="type-body mt-1">
              {period.distributionBasis?.approvedAt
                ? formatProductPrice(
                    period.distributionBasis.proposedDistributableAmountInPence,
                    period.currency,
                  )
                : "Not approved"}
            </dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Basis approval
            </dt>
            <dd className="type-body mt-1">
              {period.distributionBasis?.approvedAt
                ? formatArchiveDateTime(period.distributionBasis.approvedAt)
                : "Not approved"}
            </dd>
          </div>
          <div>
            <dt className="type-label text-[var(--text-secondary)]">
              Persisted calculations
            </dt>
            <dd className="type-body mt-1">{period.calculationCount}</dd>
          </div>
        </dl>

        <p className="type-body text-[var(--text-secondary)]">
          Credential records allocation and provenance. Contributor is the
          compensated party. NFT ownership is not used to determine eligibility.
        </p>
      </section>

      <section className="surface-panel space-y-4 rounded-sm border p-6">
        <div>
          <h2 className="type-label">Contributor eligibility</h2>
          <p className="type-body mt-2 text-[var(--text-secondary)]">
            Eligibility is derived live from verified evidence against applicable
            requirements.
          </p>
        </div>

        {period.contributorEligibility.length === 0 ? (
          <p className="type-body text-[var(--text-secondary)]">
            Enroll Contributors to derive eligibility.
          </p>
        ) : (
          <ul className="space-y-3">
            {period.contributorEligibility.map((entry) => (
              <li
                key={entry.contributorId}
                className="flex flex-col gap-2 rounded-sm border border-[var(--border-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="type-body">{entry.contributorDisplayName}</span>
                <EligibilityBadge eligibility={entry.eligibility} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-panel space-y-4 rounded-sm border p-6">
        <div>
          <h2 className="type-label">Participants</h2>
          <p className="type-body mt-2 text-[var(--text-secondary)]">
            Explicit enrollment links a Contributor to a Credential allocation
            reference for this period.
          </p>
        </div>

        {period.participants.length === 0 ? (
          <p className="type-body text-[var(--text-secondary)]">
            No participants enrolled yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {period.participants.map((participant) => (
              <li
                key={participant.id}
                className="rounded-sm border border-[var(--border-subtle)] px-4 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="type-body">
                      <span className="type-label">Contributor: </span>
                      {participant.contributor.displayName}
                    </p>
                    <p className="type-body">
                      <span className="type-label">Credential: </span>
                      {formatCredentialNumber(participant.credential.credentialNumber)}{" "}
                      — {participant.credential.allocationBasisPoints} bps (
                      {formatAllocationBasisPoints(
                        participant.credential.allocationBasisPoints,
                      )}
                      )
                    </p>
                    {participant.agreementReference ? (
                      <p className="type-body break-all">
                        <span className="type-label">Agreement reference: </span>
                        {participant.agreementReference}
                      </p>
                    ) : null}
                  </div>
                  <EligibilityBadge
                    eligibility={
                      eligibilityByContributor.get(participant.contributor.id) ??
                      "PENDING"
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <ParticipantEnrollmentForm
          contributionPeriodId={period.id}
          contributors={enrollmentOptions.contributors}
          credentials={enrollmentOptions.credentials}
          enrolledCredentialIds={enrollmentOptions.enrolledCredentialIds}
          disabled={!isEditable}
        />
      </section>

      <section className="surface-panel space-y-4 rounded-sm border p-6">
        <div>
          <h2 className="type-label">Contribution requirements</h2>
          <p className="type-body mt-2 text-[var(--text-secondary)]">
            Requirements define qualifying work for contributor compensation
            eligibility.
          </p>
        </div>

        {period.requirements.length === 0 ? (
          <p className="type-body text-[var(--text-secondary)]">
            No requirements defined yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {period.requirements.map((requirement) => (
              <RequirementListItem
                key={requirement.id}
                requirement={requirement}
                contributionPeriodId={period.id}
                periodStatus={period.status}
                contributors={requirementContributorOptions}
              />
            ))}
          </ul>
        )}

        <RequirementForm
          contributionPeriodId={period.id}
          contributors={requirementContributorOptions}
          disabled={!isEditable}
        />
      </section>

      <section className="surface-panel space-y-4 rounded-sm border p-6">
        <div>
          <h2 className="type-label">Contribution evidence</h2>
          <p className="type-body mt-2 text-[var(--text-secondary)]">
            Evidence is reviewed by archive administrators. Verified evidence is
            immutable in normal workflows.
          </p>
        </div>

        {period.evidence.length === 0 ? (
          <p className="type-body text-[var(--text-secondary)]">
            No evidence recorded yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {period.evidence.map((entry) => (
              <li
                key={entry.id}
                className="rounded-sm border border-[var(--border-subtle)] px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="type-body">
                      <span className="type-label">Contributor: </span>
                      {entry.contributor.displayName}
                    </p>
                    <p className="type-body">
                      <span className="type-label">Requirement: </span>
                      {entry.requirement.label}
                    </p>
                    {entry.referenceUrl ? (
                      <p className="type-body break-all">
                        <span className="type-label">Reference: </span>
                        <a
                          href={entry.referenceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="focus-ring rounded-sm text-[var(--accent-steel)] underline-offset-2 hover:underline"
                        >
                          {entry.referenceUrl}
                        </a>
                      </p>
                    ) : null}
                    {entry.note ? (
                      <p className="type-body whitespace-pre-wrap">{entry.note}</p>
                    ) : null}
                    <p className="type-status">
                      Submitted {formatArchiveDateTime(entry.submittedAt)}
                      {entry.reviewedAt
                        ? ` · Reviewed ${formatArchiveDateTime(entry.reviewedAt)}`
                        : ""}
                    </p>
                    {entry.rejectionReason ? (
                      <p className="type-body text-[var(--text-secondary)]">
                        Rejection reason: {entry.rejectionReason}
                      </p>
                    ) : null}
                    {entry.invalidationReason ? (
                      <p className="type-body text-[var(--text-secondary)]">
                        Invalidation reason: {entry.invalidationReason}
                      </p>
                    ) : null}
                    {entry.invalidatedAt ? (
                      <p className="type-status">
                        Invalidated {formatArchiveDateTime(entry.invalidatedAt)}
                      </p>
                    ) : null}
                  </div>
                  <EvidenceStatusBadge
                    status={entry.reviewStatus}
                    invalidatedAt={entry.invalidatedAt}
                  />
                </div>

                {entry.reviewStatus === "PENDING" ? (
                  <EvidenceReviewForm
                    evidenceId={entry.id}
                    contributionPeriodId={period.id}
                    disabled={!isEditable}
                  />
                ) : null}

                {canInvalidateEvidenceVerification({
                  reviewStatus: entry.reviewStatus,
                  invalidatedAt: entry.invalidatedAt,
                  periodStatus: period.status,
                }) ? (
                  <EvidenceInvalidateForm
                    evidenceId={entry.id}
                    contributionPeriodId={period.id}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {period.evidenceProgress.length > 0 ? (
          <div className="space-y-3 rounded-sm border border-[var(--border-subtle)] px-4 py-4">
            <h3 className="type-label">Verification progress</h3>
            <p className="type-body text-[var(--text-secondary)]">
              Active verified submissions count toward each Contributor&apos;s
              requirement independently. Additional submissions remain available
              while the period is open.
            </p>
            <ul className="space-y-2">
              {period.evidenceProgress.map((entry) => (
                <li key={`${entry.contributorId}:${entry.requirementId}`} className="type-body">
                  <span className="type-label">{entry.contributorDisplayName}</span>
                  {" · "}
                  {entry.requirementLabel}:{" "}
                  {formatEvidenceProgressLabel(entry)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <EvidenceForm
          contributionPeriodId={period.id}
          contributors={requirementContributorOptions}
          requirements={period.requirements.map((requirement) => ({
            id: requirement.id,
            label: requirement.label,
            requiredVerificationCount: requirement.requiredVerificationCount,
            contributorId: requirement.contributor?.id ?? null,
          }))}
          evidenceProgress={period.evidenceProgress}
          disabled={!isEditable}
        />
      </section>

      {period.status === ContributionPeriodStatus.OPEN ? (
        <ClosePeriodPanel contributionPeriodId={period.id} />
      ) : null}

      {!isClosed ? (
        discardable ? (
          <DiscardPeriodPanel
            contributionPeriodId={period.id}
            periodTitle={period.title}
          />
        ) : discardBlockReason ? (
          <DiscardPeriodBlockedNotice reason={discardBlockReason} />
        ) : null
      ) : null}

      {isClosed && preview ? (
        <CalculationPreviewPanel preview={preview} />
      ) : null}

      {isClosed && previewError ? (
        <section className="surface-panel rounded-sm border p-6">
          <p className="type-body text-[var(--text-secondary)]">{previewError}</p>
        </section>
      ) : null}

      {isClosed ? (
        <CalculationHistorySection period={period} calculations={calculations} />
      ) : null}
    </div>
  );
}
