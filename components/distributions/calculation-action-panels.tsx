"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveDistributionCalculationAction,
  createReplacementCalculationAction,
  voidDistributionCalculationAction,
} from "@/lib/distribution/actions";
import {
  approveDistributionCalculationSchema,
  createReplacementCalculationSchema,
  voidDistributionCalculationSchema,
} from "@/lib/distribution/schemas";

type ApproveCalculationPanelProps = {
  calculationId: string;
};

export function ApproveCalculationPanel({
  calculationId,
}: ApproveCalculationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleApprove() {
    setFormError(null);

    startTransition(async () => {
      const parsed = approveDistributionCalculationSchema.safeParse({
        calculationId,
      });

      if (!parsed.success) {
        setFormError("Unable to approve the calculation. Please try again.");
        return;
      }

      const result = await approveDistributionCalculationAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <section
      id="approve"
      className="surface-panel space-y-4 rounded-sm border p-6"
    >
      <div className="space-y-2">
        <h2 className="type-label">Approve calculation</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Approval accepts the existing calculation snapshot as the historical
          compensation record. No payment or settlement occurs.
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={isPending}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span className="type-body">
          I have reviewed the calculation lines and accept this snapshot as the
          approved historical compensation record.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleApprove}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Approve Calculation
      </button>
    </section>
  );
}

type VoidCalculationPanelProps = {
  calculationId: string;
};

export function VoidCalculationPanel({ calculationId }: VoidCalculationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [confirmed, setConfirmed] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  function handleVoid() {
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = voidDistributionCalculationSchema.safeParse({
        calculationId,
        voidReason,
      });

      if (!parsed.success) {
        setFormError("Please review the void request and correct the highlighted fields.");
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await voidDistributionCalculationAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.refresh();
    });
  }

  return (
    <section
      id="void"
      className="surface-panel space-y-4 rounded-sm border border-[var(--border-strong)] p-6"
    >
      <div className="space-y-2">
        <h2 className="type-label">Void calculation</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Voiding preserves the approved calculation snapshot for audit. It does
          not delete lines or create a replacement automatically.
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="voidReason" className="type-label">
          Void reason
        </label>
        <textarea
          id="voidReason"
          value={voidReason}
          disabled={isPending}
          onChange={(event) => setVoidReason(event.target.value)}
          rows={3}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        {fieldErrors.voidReason?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.voidReason[0]}
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={isPending}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span className="type-body">
          I understand that voiding preserves this calculation for audit and
          that a replacement must be created separately if required.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleVoid}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
      >
        Void Calculation
      </button>
    </section>
  );
}

type CreateReplacementCalculationPanelProps = {
  voidedCalculationId: string;
};

export function CreateReplacementCalculationPanel({
  voidedCalculationId,
}: CreateReplacementCalculationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleCreate() {
    setFormError(null);

    startTransition(async () => {
      const parsed = createReplacementCalculationSchema.safeParse({
        voidedCalculationId,
      });

      if (!parsed.success) {
        setFormError("Unable to create the replacement calculation. Please try again.");
        return;
      }

      const result = await createReplacementCalculationAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.push(`/admin/distributions/calculations/${result.id}`);
    });
  }

  return (
    <section
      id="replacement"
      className="surface-panel space-y-4 rounded-sm border p-6"
    >
      <div className="space-y-2">
        <h2 className="type-label">Create replacement calculation</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Creates a fresh calculation snapshot from the current closed-period
          eligibility and allocation state using the same approved Distribution
          Basis pool. This corrects allocation/eligibility snapshots only — not an
          erroneous approved commercial basis. The voided calculation remains
          preserved for audit.
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={isPending}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span className="type-body">
          I understand that this creates a new calculation sequence using fresh
          current business state, not a clone of the voided lines.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleCreate}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Create Replacement Calculation
      </button>
    </section>
  );
}
