"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRequirementAction } from "@/lib/distribution/actions";
import { createRequirementSchema } from "@/lib/distribution/schemas";
import type { EnrollmentContributorOption } from "@/lib/distribution/get-enrollment-options";

type RequirementFormProps = {
  contributionPeriodId: string;
  contributors: EnrollmentContributorOption[];
  disabled?: boolean;
};

export function RequirementForm({
  contributionPeriodId,
  contributors,
  disabled = false,
}: RequirementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [requiredVerificationCount, setRequiredVerificationCount] = useState("1");
  const [contributorId, setContributorId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = createRequirementSchema.safeParse({
        contributionPeriodId,
        label,
        description,
        requiredVerificationCount,
        contributorId,
        sortOrder,
      });

      if (!parsed.success) {
        setFormError(
          "Please review the requirement and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await createRequirementAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setLabel("");
      setDescription("");
      setRequiredVerificationCount("1");
      setContributorId("");
      setSortOrder("0");
      router.refresh();
    });
  }

  if (disabled) {
    return (
      <p className="type-body text-[var(--text-secondary)]">
        Requirements cannot be added while the period is closed.
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

      <div className="space-y-2">
        <label htmlFor="requirement-label" className="type-label">
          Requirement label
        </label>
        <input
          id="requirement-label"
          type="text"
          value={label}
          disabled={isPending}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Three approved promotional activities"
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        {fieldErrors.label?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.label[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="requirement-description" className="type-label">
          Description (optional)
        </label>
        <textarea
          id="requirement-description"
          value={description}
          disabled={isPending}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="requiredVerificationCount" className="type-label">
            Required verified submissions
          </label>
          <input
            id="requiredVerificationCount"
            type="number"
            min={1}
            value={requiredVerificationCount}
            disabled={isPending}
            onChange={(event) =>
              setRequiredVerificationCount(event.target.value)
            }
            className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
          />
          {fieldErrors.requiredVerificationCount?.[0] ? (
            <p className="type-status text-[var(--text-secondary)]">
              {fieldErrors.requiredVerificationCount[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="requirement-sortOrder" className="type-label">
            Sort order
          </label>
          <input
            id="requirement-sortOrder"
            type="number"
            min={0}
            value={sortOrder}
            disabled={isPending}
            onChange={(event) => setSortOrder(event.target.value)}
            className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="requirement-contributorId" className="type-label">
          Contributor scope
        </label>
        <select
          id="requirement-contributorId"
          value={contributorId}
          disabled={isPending}
          onChange={(event) => setContributorId(event.target.value)}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        >
          <option value="">All enrolled Contributors</option>
          {contributors.map((contributor) => (
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

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Add requirement
      </button>
    </form>
  );
}
