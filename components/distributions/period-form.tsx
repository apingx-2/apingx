"use client";

import { ContributionPeriodStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createContributionPeriodAction,
  updateContributionPeriodAction,
} from "@/lib/distribution/actions";
import {
  createContributionPeriodSchema,
  defaultContributionPeriodFormValues,
  updateContributionPeriodSchema,
  type ContributionPeriodFormValues,
} from "@/lib/distribution/schemas";

type CollectionOption = {
  id: string;
  collectionNumber: number;
  name: string;
};

type PeriodFormProps =
  | {
      mode: "create";
      collections: CollectionOption[];
    }
  | {
      mode: "edit";
      periodId: string;
      collections: CollectionOption[];
      initialValues: ContributionPeriodFormValues;
      currentStatus: ContributionPeriodStatus;
    };

function getFieldError(
  fieldErrors: Record<string, string[] | undefined> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

function getAllowedStatuses(
  currentStatus: ContributionPeriodStatus,
  mode: "create" | "edit",
): ContributionPeriodStatus[] {
  if (mode === "create") {
    return [ContributionPeriodStatus.DRAFT, ContributionPeriodStatus.OPEN];
  }

  if (currentStatus === ContributionPeriodStatus.CLOSED) {
    return [ContributionPeriodStatus.CLOSED];
  }

  if (currentStatus === ContributionPeriodStatus.DRAFT) {
    return [
      ContributionPeriodStatus.DRAFT,
      ContributionPeriodStatus.OPEN,
    ];
  }

  return [ContributionPeriodStatus.OPEN];
}

export function PeriodForm(props: PeriodFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  const [values, setValues] = useState<ContributionPeriodFormValues>(() =>
    props.mode === "edit" ? props.initialValues : defaultContributionPeriodFormValues,
  );

  const currentStatus =
    props.mode === "edit"
      ? props.currentStatus
      : values.status;

  const allowedStatuses = getAllowedStatuses(
    currentStatus,
    props.mode,
  );

  function updateValue<K extends keyof ContributionPeriodFormValues>(
    key: K,
    value: ContributionPeriodFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      if (props.mode === "create") {
        const parsed = createContributionPeriodSchema.safeParse(values);

        if (!parsed.success) {
          setFormError(
            "Please review the Contribution Period record and correct the highlighted fields.",
          );
          setFieldErrors(parsed.error.flatten().fieldErrors);
          return;
        }

        const result = await createContributionPeriodAction(parsed.data);

        if (!result.success) {
          setFormError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }

        router.push(`/admin/distributions/periods/${result.id}`);
        router.refresh();
        return;
      }

      const parsed = updateContributionPeriodSchema.safeParse(values);

      if (!parsed.success) {
        setFormError(
          "Please review the Contribution Period record and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await updateContributionPeriodAction(
        props.periodId,
        parsed.data,
      );

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.push(`/admin/distributions/periods/${result.id}`);
      router.refresh();
    });
  }

  const collectionLocked =
    props.mode === "edit" && props.currentStatus !== ContributionPeriodStatus.DRAFT;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="surface-panel space-y-8 rounded-sm border p-6"
    >
      {formError ? (
        <p role="alert" className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3">
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="collectionId" className="type-label">
          Collection
        </label>
        <select
          id="collectionId"
          value={values.collectionId}
          disabled={collectionLocked || isPending}
          onChange={(event) => updateValue("collectionId", event.target.value)}
          aria-invalid={Boolean(getFieldError(fieldErrors, "collectionId"))}
          aria-describedby={
            getFieldError(fieldErrors, "collectionId")
              ? "collectionId-error"
              : undefined
          }
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        >
          <option value="">Select a Collection</option>
          {props.collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              COLLECTION {String(collection.collectionNumber).padStart(3, "0")} —{" "}
              {collection.name}
            </option>
          ))}
        </select>
        {getFieldError(fieldErrors, "collectionId") ? (
          <p id="collectionId-error" className="type-status text-[var(--text-secondary)]">
            {getFieldError(fieldErrors, "collectionId")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="type-label">
          Period title
        </label>
        <input
          id="title"
          type="text"
          value={values.title}
          disabled={isPending}
          onChange={(event) => updateValue("title", event.target.value)}
          aria-invalid={Boolean(getFieldError(fieldErrors, "title"))}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
        {getFieldError(fieldErrors, "title") ? (
          <p className="type-status text-[var(--text-secondary)]">
            {getFieldError(fieldErrors, "title")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startDate" className="type-label">
            Start date
          </label>
          <input
            id="startDate"
            type="date"
            value={values.startDate}
            disabled={isPending}
            onChange={(event) => updateValue("startDate", event.target.value)}
            aria-invalid={Boolean(getFieldError(fieldErrors, "startDate"))}
            className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
          />
          {getFieldError(fieldErrors, "startDate") ? (
            <p className="type-status text-[var(--text-secondary)]">
              {getFieldError(fieldErrors, "startDate")}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className="type-label">
            End date
          </label>
          <input
            id="endDate"
            type="date"
            value={values.endDate}
            disabled={isPending}
            onChange={(event) => updateValue("endDate", event.target.value)}
            aria-invalid={Boolean(getFieldError(fieldErrors, "endDate"))}
            className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
          />
          {getFieldError(fieldErrors, "endDate") ? (
            <p className="type-status text-[var(--text-secondary)]">
              {getFieldError(fieldErrors, "endDate")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {props.mode === "edit" &&
        props.currentStatus === ContributionPeriodStatus.OPEN ? (
          <div className="space-y-2">
            <p className="type-label">Status</p>
            <p className="type-body">Open</p>
            <p className="type-status text-[var(--text-secondary)]">
              Closing an open period requires the dedicated close workflow on
              the period detail page.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="status" className="type-label">
              Status
            </label>
            <select
              id="status"
              value={values.status}
              disabled={
                isPending || currentStatus === ContributionPeriodStatus.CLOSED
              }
              onChange={(event) =>
                updateValue(
                  "status",
                  event.target.value as ContributionPeriodStatus,
                )
              }
              aria-invalid={Boolean(getFieldError(fieldErrors, "status"))}
              className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {getFieldError(fieldErrors, "status") ? (
              <p className="type-status text-[var(--text-secondary)]">
                {getFieldError(fieldErrors, "status")}
              </p>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="distributableAmountGbp" className="type-label">
            Proposed distributable amount (GBP)
          </label>
          <input
            id="distributableAmountGbp"
            type="text"
            inputMode="decimal"
            placeholder="8500.00"
            value={values.distributableAmountGbp}
            disabled={isPending}
            onChange={(event) =>
              updateValue("distributableAmountGbp", event.target.value)
            }
            aria-invalid={Boolean(getFieldError(fieldErrors, "distributableAmountGbp"))}
            className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
          />
          <p className="type-status text-[var(--text-secondary)]">
            Optional proposed amount for future calculation. Stored as whole
            pence. Explicit approval is recorded in a later phase.
          </p>
          {getFieldError(fieldErrors, "distributableAmountGbp") ? (
            <p className="type-status text-[var(--text-secondary)]">
              {getFieldError(fieldErrors, "distributableAmountGbp")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
        >
          {props.mode === "create" ? "Create Contribution Period" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
