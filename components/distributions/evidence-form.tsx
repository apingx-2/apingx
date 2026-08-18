"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createEvidenceAction } from "@/lib/distribution/actions";
import {
  findEvidenceProgressEntry,
  formatEvidenceProgressLabel,
  type EvidenceProgressEntry,
} from "@/lib/distribution/evidence-progress";
import { createEvidenceSchema } from "@/lib/distribution/schemas";
import type { EnrollmentContributorOption } from "@/lib/distribution/get-enrollment-options";

type RequirementOption = {
  id: string;
  label: string;
  requiredVerificationCount: number;
  contributorId: string | null;
};

type EvidenceFormProps = {
  contributionPeriodId: string;
  contributors: EnrollmentContributorOption[];
  requirements: RequirementOption[];
  evidenceProgress: EvidenceProgressEntry[];
  disabled?: boolean;
};

export function EvidenceForm({
  contributionPeriodId,
  contributors,
  requirements,
  evidenceProgress,
  disabled = false,
}: EvidenceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [contributionRequirementId, setContributionRequirementId] =
    useState("");
  const [contributorId, setContributorId] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [note, setNote] = useState("");

  const selectedRequirement = useMemo(
    () => requirements.find((requirement) => requirement.id === contributionRequirementId),
    [contributionRequirementId, requirements],
  );

  const availableContributors = useMemo(() => {
    if (!selectedRequirement?.contributorId) {
      return contributors;
    }

    return contributors.filter(
      (contributor) => contributor.id === selectedRequirement.contributorId,
    );
  }, [contributors, selectedRequirement]);

  useEffect(() => {
    if (!selectedRequirement?.contributorId) {
      return;
    }

    if (contributorId !== selectedRequirement.contributorId) {
      setContributorId(selectedRequirement.contributorId);
    }
  }, [contributorId, selectedRequirement]);

  const selectedProgress = useMemo(() => {
    if (!contributionRequirementId || !contributorId) {
      return undefined;
    }

    return findEvidenceProgressEntry(
      evidenceProgress,
      contributorId,
      contributionRequirementId,
    );
  }, [contributionRequirementId, contributorId, evidenceProgress]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = createEvidenceSchema.safeParse({
        contributionPeriodId,
        contributionRequirementId,
        contributorId,
        referenceUrl,
        note,
      });

      if (!parsed.success) {
        const flattened = parsed.error.flatten();
        setFormError(
          flattened.formErrors[0] ??
            "Please review the evidence record and correct the highlighted fields.",
        );
        setFieldErrors(flattened.fieldErrors);
        return;
      }

      const result = await createEvidenceAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setReferenceUrl("");
      setNote("");
      router.refresh();
    });
  }

  if (disabled) {
    return (
      <p className="type-body text-[var(--text-secondary)]">
        Evidence cannot be recorded while the period is closed.
      </p>
    );
  }

  if (requirements.length === 0 || contributors.length === 0) {
    return (
      <p className="type-body text-[var(--text-secondary)]">
        Add requirements and enroll Contributors before recording evidence.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <p role="alert" className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3">
          {formError}
        </p>
      ) : null}

      <p className="type-body text-[var(--text-secondary)]">
        Each submission is one evidence item. Requirements may need multiple
        verified submissions from the same Contributor.
      </p>

      <div className="space-y-2">
        <label htmlFor="contributionRequirementId" className="type-label">
          Requirement
        </label>
        <select
          id="contributionRequirementId"
          value={contributionRequirementId}
          disabled={isPending}
          onChange={(event) =>
            setContributionRequirementId(event.target.value)
          }
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        >
          <option value="">Select a requirement</option>
          {requirements.map((requirement) => (
            <option key={requirement.id} value={requirement.id}>
              {requirement.label}
            </option>
          ))}
        </select>
        {fieldErrors.contributionRequirementId?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.contributionRequirementId[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="evidence-contributorId" className="type-label">
          Contributor
        </label>
        <select
          id="evidence-contributorId"
          value={contributorId}
          disabled={isPending || Boolean(selectedRequirement?.contributorId)}
          onChange={(event) => setContributorId(event.target.value)}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        >
          <option value="">Select a Contributor</option>
          {availableContributors.map((contributor) => (
            <option key={contributor.id} value={contributor.id}>
              {contributor.displayName}
            </option>
          ))}
        </select>
        {fieldErrors.contributorId?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.contributorId[0]}
          </p>
        ) : null}
      </div>

      {selectedProgress ? (
        <p className="type-status text-[var(--text-secondary)]">
          {selectedProgress.contributorDisplayName} ·{" "}
          {selectedProgress.requirementLabel}:{" "}
          {formatEvidenceProgressLabel(selectedProgress)}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="referenceUrl" className="type-label">
          Reference URL (optional)
        </label>
        <input
          id="referenceUrl"
          type="url"
          value={referenceUrl}
          disabled={isPending}
          onChange={(event) => setReferenceUrl(event.target.value)}
          className="focus-ring type-body w-full break-all rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        {fieldErrors.referenceUrl?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.referenceUrl[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="type-label">
          Note (optional)
        </label>
        <textarea
          id="note"
          value={note}
          disabled={isPending}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        <p className="type-status text-[var(--text-secondary)]">
          Provide a reference URL or a note describing the contribution evidence.
        </p>
        {fieldErrors.note?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.note[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Record evidence
      </button>
    </form>
  );
}
