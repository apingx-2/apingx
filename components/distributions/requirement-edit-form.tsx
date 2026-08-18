"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateRequirementAction } from "@/lib/distribution/actions";
import type { EnrollmentContributorOption } from "@/lib/distribution/get-enrollment-options";
import { updateRequirementSchema } from "@/lib/distribution/schemas";

type RequirementEditFormProps = {
  requirement: {
    id: string;
    label: string;
    description: string | null;
    requiredVerificationCount: number;
    sortOrder: number;
    contributor: {
      id: string;
      displayName: string;
    } | null;
  };
  contributionPeriodId: string;
  contributors: EnrollmentContributorOption[];
  onCancel: () => void;
};

export function RequirementEditForm({
  requirement,
  contributionPeriodId,
  contributors,
  onCancel,
}: RequirementEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [label, setLabel] = useState(requirement.label);
  const [description, setDescription] = useState(requirement.description ?? "");
  const [requiredVerificationCount, setRequiredVerificationCount] = useState(
    String(requirement.requiredVerificationCount),
  );
  const [contributorId, setContributorId] = useState(
    requirement.contributor?.id ?? "",
  );
  const [sortOrder, setSortOrder] = useState(String(requirement.sortOrder));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = updateRequirementSchema.safeParse({
        requirementId: requirement.id,
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

      const result = await updateRequirementAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onCancel();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 border-t border-[var(--border-subtle)] pt-4"
    >
      {formError ? (
        <p
          role="alert"
          className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={`requirement-label-${requirement.id}`} className="type-label">
          Requirement label
        </label>
        <input
          id={`requirement-label-${requirement.id}`}
          type="text"
          value={label}
          disabled={isPending}
          onChange={(event) => setLabel(event.target.value)}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        {fieldErrors.label?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.label[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`requirement-description-${requirement.id}`}
          className="type-label"
        >
          Description (optional)
        </label>
        <textarea
          id={`requirement-description-${requirement.id}`}
          value={description}
          disabled={isPending}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`requiredVerificationCount-${requirement.id}`}
            className="type-label"
          >
            Required verified submissions
          </label>
          <input
            id={`requiredVerificationCount-${requirement.id}`}
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
          <label htmlFor={`requirement-sortOrder-${requirement.id}`} className="type-label">
            Sort order
          </label>
          <input
            id={`requirement-sortOrder-${requirement.id}`}
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
        <label
          htmlFor={`requirement-contributorId-${requirement.id}`}
          className="type-label"
        >
          Contributor scope
        </label>
        <select
          id={`requirement-contributorId-${requirement.id}`}
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

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
        >
          Save requirement
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 transition-colors hover:border-[var(--border-strong)] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
