"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { discardContributionPeriodAction } from "@/lib/distribution/actions";

type DiscardPeriodPanelProps = {
  contributionPeriodId: string;
  periodTitle: string;
};

export function DiscardPeriodPanel({
  contributionPeriodId,
  periodTitle,
}: DiscardPeriodPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleDiscard() {
    setFormError(null);

    startTransition(async () => {
      const result = await discardContributionPeriodAction({
        contributionPeriodId,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.push("/admin/distributions");
      router.refresh();
    });
  }

  return (
    <section className="surface-panel space-y-4 rounded-sm border border-[var(--border-strong)] p-6">
      <div className="space-y-2">
        <h2 className="type-label">Discard Contribution Period</h2>
        <p className="type-body text-[var(--text-secondary)]">
          Permanently remove this unfinished Contribution Period and all of its
          setup data, including enrolled participants and defined requirements.
          This action cannot be undone. Contributors, Credentials, and
          Collections are not affected.
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
          I understand that discarding{" "}
          <span className="type-label">{periodTitle}</span> will permanently
          remove this period and its unfinished setup.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || isPending}
        aria-busy={isPending}
        onClick={handleDiscard}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
      >
        Discard Contribution Period
      </button>
    </section>
  );
}

type DiscardPeriodBlockedNoticeProps = {
  reason: string;
};

export function DiscardPeriodBlockedNotice({
  reason,
}: DiscardPeriodBlockedNoticeProps) {
  return (
    <section className="surface-panel space-y-4 rounded-sm border border-[var(--border-strong)] p-6">
      <div className="space-y-2">
        <h2 className="type-label">Discard Contribution Period</h2>
        <p className="type-body text-[var(--text-secondary)]">{reason}</p>
      </div>
    </section>
  );
}
