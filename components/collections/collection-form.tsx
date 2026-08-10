"use client";

import { CollectionStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCollectionAction,
  updateCollectionAction,
  type CollectionActionFieldErrors,
} from "@/lib/collections/actions";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { slugify } from "@/lib/collections/slugify";
import {
  createCollectionSchema,
  defaultCollectionFormValues,
  updateCollectionSchema,
  type CollectionFormValues,
} from "@/lib/collections/schemas";

type CollectionFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      collectionId: string;
      collectionNumber: number;
      initialValues: Omit<CollectionFormValues, "collectionNumber">;
    };

function getFieldError(
  fieldErrors: CollectionActionFieldErrors | undefined,
  field: keyof CollectionFormValues,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function CollectionForm(props: CollectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CollectionActionFieldErrors>(
    {},
  );
  const [slugTouched, setSlugTouched] = useState(props.mode === "edit");

  const [values, setValues] = useState<CollectionFormValues>(() => {
    if (props.mode === "edit") {
      return {
        collectionNumber: String(props.collectionNumber),
        ...props.initialValues,
      };
    }

    return defaultCollectionFormValues;
  });

  function updateValue<K extends keyof CollectionFormValues>(
    key: K,
    value: CollectionFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((current) => {
      const next = { ...current, name };

      if (!slugTouched && props.mode === "create") {
        next.slug = slugify(name);
      }

      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      if (props.mode === "create") {
        const parsed = createCollectionSchema.safeParse({
          collectionNumber: values.collectionNumber,
          name: values.name,
          slug: values.slug,
          subtitle: values.subtitle,
          story: values.story,
          status: values.status,
          launchDate: values.launchDate,
          coverImageUrl: values.coverImageUrl,
        });

        if (!parsed.success) {
          setFormError(
            "Please review the Collection record and correct the highlighted fields.",
          );
          setFieldErrors(parsed.error.flatten().fieldErrors);
          return;
        }

        const result = await createCollectionAction(parsed.data);

        if (!result.success) {
          setFormError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }

        router.push(`/admin/collections/${result.id}`);
        router.refresh();
        return;
      }

      const parsed = updateCollectionSchema.safeParse({
        name: values.name,
        slug: values.slug,
        subtitle: values.subtitle,
        story: values.story,
        status: values.status,
        launchDate: values.launchDate,
        coverImageUrl: values.coverImageUrl,
      });

      if (!parsed.success) {
        setFormError(
          "Please review the Collection record and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await updateCollectionAction(props.collectionId, parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.push(`/admin/collections/${result.id}`);
      router.refresh();
    });
  }

  const collectionNumberError = getFieldError(fieldErrors, "collectionNumber");
  const nameError = getFieldError(fieldErrors, "name");
  const slugError = getFieldError(fieldErrors, "slug");
  const subtitleError = getFieldError(fieldErrors, "subtitle");
  const storyError = getFieldError(fieldErrors, "story");
  const statusError = getFieldError(fieldErrors, "status");
  const launchDateError = getFieldError(fieldErrors, "launchDate");
  const coverImageUrlError = getFieldError(fieldErrors, "coverImageUrl");

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="surface-panel rounded-sm border px-5 py-6 md:px-6"
    >
      {formError ? (
        <p
          role="alert"
          className="type-body mb-6 rounded-sm border border-[var(--border-strong)] px-4 py-3"
        >
          {formError}
        </p>
      ) : null}

      <div className="grid gap-6">
        {props.mode === "create" ? (
          <div>
            <label htmlFor="collectionNumber" className="type-label">
              Collection number
            </label>
            <input
              id="collectionNumber"
              name="collectionNumber"
              type="number"
              min={1}
              step={1}
              required
              value={values.collectionNumber}
              onChange={(event) =>
                updateValue("collectionNumber", event.target.value)
              }
              aria-invalid={collectionNumberError ? true : undefined}
              aria-describedby={
                collectionNumberError ? "collectionNumber-error" : undefined
              }
              className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
            />
            {collectionNumberError ? (
              <p id="collectionNumber-error" className="type-status mt-2">
                {collectionNumberError}
              </p>
            ) : (
              <p className="type-status mt-2">
                Assigned permanently as an archival identifier.
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="type-label">Collection number</p>
            <p className="type-archive-id mt-2">
              {formatCollectionNumber(props.collectionNumber)}
            </p>
            <p className="type-status mt-2">
              Archival identifier. It cannot be changed after creation.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="type-label">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={values.name}
            onChange={(event) => handleNameChange(event.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "name-error" : undefined}
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {nameError ? (
            <p id="name-error" className="type-status mt-2">
              {nameError}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="slug" className="type-label">
              Slug
            </label>
            {props.mode === "create" ? (
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(true);
                  updateValue("slug", slugify(values.name));
                }}
                className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-2.5 py-1.5 transition-colors hover:border-[var(--border-strong)]"
              >
                Derive from name
              </button>
            ) : null}
          </div>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              updateValue("slug", event.target.value);
            }}
            aria-invalid={slugError ? true : undefined}
            aria-describedby={slugError ? "slug-error" : undefined}
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {slugError ? (
            <p id="slug-error" className="type-status mt-2">
              {slugError}
            </p>
          ) : (
            <p className="type-status mt-2">
              Lowercase letters, numbers and hyphens only.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="subtitle" className="type-label">
            Subtitle
          </label>
          <input
            id="subtitle"
            name="subtitle"
            type="text"
            value={values.subtitle}
            onChange={(event) => updateValue("subtitle", event.target.value)}
            aria-invalid={subtitleError ? true : undefined}
            aria-describedby={subtitleError ? "subtitle-error" : undefined}
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {subtitleError ? (
            <p id="subtitle-error" className="type-status mt-2">
              {subtitleError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="story" className="type-label">
            Story
          </label>
          <textarea
            id="story"
            name="story"
            required
            rows={8}
            value={values.story}
            onChange={(event) => updateValue("story", event.target.value)}
            aria-invalid={storyError ? true : undefined}
            aria-describedby={storyError ? "story-error" : undefined}
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {storyError ? (
            <p id="story-error" className="type-status mt-2">
              {storyError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="type-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={values.status}
              onChange={(event) =>
                updateValue("status", event.target.value as CollectionStatus)
              }
              aria-invalid={statusError ? true : undefined}
              aria-describedby={statusError ? "status-error" : undefined}
              className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
            >
              <option value={CollectionStatus.DRAFT}>Draft</option>
              <option value={CollectionStatus.PUBLISHED}>Published</option>
              <option value={CollectionStatus.ARCHIVED}>Archived</option>
            </select>
            {statusError ? (
              <p id="status-error" className="type-status mt-2">
                {statusError}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="launchDate" className="type-label">
              Launch date
            </label>
            <input
              id="launchDate"
              name="launchDate"
              type="date"
              value={values.launchDate}
              onChange={(event) =>
                updateValue("launchDate", event.target.value)
              }
              aria-invalid={launchDateError ? true : undefined}
              aria-describedby={launchDateError ? "launchDate-error" : undefined}
              className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
            />
            {launchDateError ? (
              <p id="launchDate-error" className="type-status mt-2">
                {launchDateError}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="coverImageUrl" className="type-label">
            Cover image URL
          </label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            value={values.coverImageUrl}
            onChange={(event) =>
              updateValue("coverImageUrl", event.target.value)
            }
            aria-invalid={coverImageUrlError ? true : undefined}
            aria-describedby={
              coverImageUrlError ? "coverImageUrl-error" : undefined
            }
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {coverImageUrlError ? (
            <p id="coverImageUrl-error" className="type-status mt-2">
              {coverImageUrlError}
            </p>
          ) : (
            <p className="type-status mt-2">
              URL only. Image upload is not available in this task.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="focus-ring type-label rounded-sm border border-[var(--border-strong)] px-4 py-2.5 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-4)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Saving Collection record…"
            : props.mode === "create"
              ? "Create Collection"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
