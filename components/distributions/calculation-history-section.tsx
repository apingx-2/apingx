import Link from "next/link";

import { DistributionCalculationStatus } from "@prisma/client";

import { ApproveDistributionBasisPanel } from "@/components/distributions/approve-distribution-basis-panel";

import { CalculationStatusBadge } from "@/components/distributions/calculation-status-badge";

import { CreateCalculationPanel } from "@/components/distributions/create-calculation-panel";

import { DistributionBasisDisplay } from "@/components/distributions/distribution-basis-display";

import { DistributionBasisForm } from "@/components/distributions/distribution-basis-form";

import { formatArchiveDateTime } from "@/lib/collections/format-date";

import {

  canApproveDistributionBasis,

  canEditDistributionBasis,

  canPrepareDistributionBasis,

  getApproveDistributionBasisBlockReason,
} from "@/lib/distribution/basis-lifecycle";

import {

  canCreateDistributionCalculation,

  canCreateReplacementCalculation,

  getCreateCalculationBlockReason,

} from "@/lib/distribution/calculation-lifecycle";

import type { PeriodCalculationSummary } from "@/lib/distribution/get-period-calculations";

import type { ContributionPeriodDetail } from "@/lib/distribution/get-period-by-id";

import { formatProductPrice } from "@/lib/products/price";



type CalculationHistorySectionProps = {

  period: ContributionPeriodDetail;

  calculations: PeriodCalculationSummary[];

};



export function CalculationHistorySection({

  period,

  calculations,

}: CalculationHistorySectionProps) {

  const isClosed = period.status === "CLOSED";

  const basis = period.distributionBasis;

  const canPrepare = canPrepareDistributionBasis({

    periodStatus: period.status,

    basis,

  });

  const canEdit = canEditDistributionBasis({

    periodStatus: period.status,

    basis,

  });

  const canApproveBasis = canApproveDistributionBasis({

    periodStatus: period.status,

    basis,

    currency: period.currency,

  });

  const approveBlockReason = getApproveDistributionBasisBlockReason({
    periodStatus: period.status,
    basis,
    currency: period.currency,
  });

  const canCreate = canCreateDistributionCalculation({

    status: period.status,

    distributionBasis: basis,

    participantCount: period.participants.length,

    calculations,

  });

  const createBlockReason = getCreateCalculationBlockReason({

    status: period.status,

    distributionBasis: basis,

    participantCount: period.participants.length,

    calculations,

  });

  const sequenceById = new Map(

    calculations.map((calculation) => [

      calculation.id,

      calculation.calculationSequence,

    ]),

  );



  if (!isClosed) {

    return null;

  }



  return (

    <section className="space-y-6">

      {canPrepare && !basis ? (

        <DistributionBasisForm

          contributionPeriodId={period.id}

          initialBasis={null}

        />

      ) : null}



      {canEdit && basis ? (

        <DistributionBasisForm

          contributionPeriodId={period.id}

          initialBasis={basis}

        />

      ) : null}



      {canApproveBasis && basis ? (

        <ApproveDistributionBasisPanel

          contributionPeriodId={period.id}

          periodTitle={period.title}

          collectionNumber={period.collection.collectionNumber}

          collectionName={period.collection.name}

          basis={basis}

        />

      ) : null}



      {approveBlockReason && basis && !basis.approvedAt && !canApproveBasis ? (

        <section className="surface-panel rounded-sm border p-6">

          <p className="type-body text-[var(--text-secondary)]">{approveBlockReason}</p>

        </section>

      ) : null}



      {basis?.approvedAt ? (

        <section className="surface-panel space-y-4 rounded-sm border p-6">

          <div className="space-y-2">

            <h2 className="type-label">Approved Distribution Basis</h2>

            <p className="type-body text-[var(--text-secondary)]">

              Commercial reconciliation record for this Contribution Period.

              Returns affect the pool only — not Contributor qualification.

            </p>

          </div>

          <DistributionBasisDisplay basis={basis} />

        </section>

      ) : null}



      <section className="surface-panel space-y-4 rounded-sm border p-6">

        <div className="space-y-2">

          <h2 className="type-label">Calculation history</h2>

          <p className="type-body text-[var(--text-secondary)]">

            Historical compensation calculations for this closed Contribution

            Period. Approval records entitlement only — no payment or settlement

            occurs.

          </p>

        </div>



        {calculations.length === 0 ? (

          <p className="type-body text-[var(--text-secondary)]">

            No distribution calculations recorded yet.

          </p>

        ) : (

          <ul className="space-y-3">

            {calculations.map((calculation) => (

              <li

                key={calculation.id}

                className="rounded-sm border border-[var(--border-subtle)] px-4 py-4"

              >

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div className="space-y-2">

                    <p className="type-body">

                      <span className="type-label">Sequence: </span>

                      {calculation.calculationSequence}

                    </p>

                    <p className="type-body">

                      <span className="type-label">Distributable amount: </span>

                      {formatProductPrice(

                        calculation.distributableAmountInPence,

                        calculation.currency,

                      )}

                    </p>

                    <p className="type-body">

                      <span className="type-label">Total compensation: </span>

                      {formatProductPrice(

                        calculation.totalCalculatedCompensationInPence,

                        calculation.currency,

                      )}

                    </p>

                    {calculation.calculatedAt ? (

                      <p className="type-status">

                        Calculated {formatArchiveDateTime(calculation.calculatedAt)}

                      </p>

                    ) : null}

                    {calculation.approvedAt ? (

                      <p className="type-status">

                        Approved {formatArchiveDateTime(calculation.approvedAt)}

                      </p>

                    ) : null}

                    {calculation.replacesCalculationId ? (

                      <p className="type-status">

                        Replaces calculation{" "}

                        {sequenceById.get(calculation.replacesCalculationId) ??

                          calculation.replacesCalculationId}

                      </p>

                    ) : null}

                    {calculation.replacedById ? (

                      <p className="type-status">

                        Replaced by calculation{" "}

                        {sequenceById.get(calculation.replacedById) ??

                          calculation.replacedById}

                      </p>

                    ) : null}

                  </div>

                  <CalculationStatusBadge status={calculation.status} />

                </div>



                <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--border-subtle)] pt-4">

                  <Link

                    href={`/admin/distributions/calculations/${calculation.id}`}

                    className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"

                  >

                    View calculation

                  </Link>

                  {calculation.status === DistributionCalculationStatus.CALCULATED ? (

                    <Link

                      href={`/admin/distributions/calculations/${calculation.id}#approve`}

                      className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)]"

                    >

                      Approve

                    </Link>

                  ) : null}

                  {calculation.status === DistributionCalculationStatus.APPROVED ? (

                    <Link

                      href={`/admin/distributions/calculations/${calculation.id}#void`}

                      className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)]"

                    >

                      Void

                    </Link>

                  ) : null}

                  {canCreateReplacementCalculation({

                    calculationStatus: calculation.status,

                    replacedById: calculation.replacedById,

                  }) ? (

                    <Link

                      href={`/admin/distributions/calculations/${calculation.id}#replacement`}

                      className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)]"

                    >

                      Create replacement

                    </Link>

                  ) : null}

                </div>

              </li>

            ))}

          </ul>

        )}



        {canCreate ? (

          <CreateCalculationPanel contributionPeriodId={period.id} />

        ) : createBlockReason && basis?.approvedAt ? (

          <p className="type-body text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-4">

            {createBlockReason}

          </p>

        ) : null}

      </section>

    </section>

  );

}
