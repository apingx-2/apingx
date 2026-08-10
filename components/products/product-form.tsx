"use client";

import { ProductStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createProductAction,
  updateProductAction,
  type ProductActionFieldErrors,
} from "@/lib/products/actions";
import { formatCollectionOptionLabel } from "@/lib/products/format-collection-option";
import type { CollectionOption } from "@/lib/products/format-collection-option";
import { slugify } from "@/lib/collections/slugify";
import {
  createProductSchema,
  defaultProductFormValues,
  updateProductSchema,
  type ProductFormValues,
} from "@/lib/products/schemas";

type ProductFormProps = {
  collectionOptions: CollectionOption[];
} & (
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      productId: string;
      initialValues: ProductFormValues;
    }
);

function getFieldError(
  fieldErrors: ProductActionFieldErrors | undefined,
  field: keyof ProductFormValues,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function ProductForm({
  collectionOptions,
  ...props
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductActionFieldErrors>({});
  const [slugTouched, setSlugTouched] = useState(props.mode === "edit");

  const [values, setValues] = useState<ProductFormValues>(() => {
    if (props.mode === "edit") {
      return props.initialValues;
    }

    return {
      ...defaultProductFormValues,
      collectionId: collectionOptions[0]?.id ?? "",
    };
  });

  function updateValue<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
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
      const payload = {
        collectionId: values.collectionId,
        name: values.name,
        slug: values.slug,
        description: values.description,
        price: values.price,
        currency: values.currency,
        status: values.status,
        imageUrl: values.imageUrl,
      };

      if (props.mode === "create") {
        const parsed = createProductSchema.safeParse(payload);

        if (!parsed.success) {
          setFormError(
            "Please review the Product record and correct the highlighted fields.",
          );
          setFieldErrors(parsed.error.flatten().fieldErrors);
          return;
        }

        const result = await createProductAction(parsed.data);

        if (!result.success) {
          setFormError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }

        router.push(`/admin/products/${result.id}`);
        router.refresh();
        return;
      }

      const parsed = updateProductSchema.safeParse(payload);

      if (!parsed.success) {
        setFormError(
          "Please review the Product record and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await updateProductAction(props.productId, parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.push(`/admin/products/${result.id}`);
      router.refresh();
    });
  }

  const collectionIdError = getFieldError(fieldErrors, "collectionId");
  const nameError = getFieldError(fieldErrors, "name");
  const slugError = getFieldError(fieldErrors, "slug");
  const descriptionError = getFieldError(fieldErrors, "description");
  const priceError = getFieldError(fieldErrors, "price");
  const currencyError = getFieldError(fieldErrors, "currency");
  const statusError = getFieldError(fieldErrors, "status");
  const imageUrlError = getFieldError(fieldErrors, "imageUrl");

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
        <div>
          <label htmlFor="collectionId" className="type-label">
            Collection
          </label>
          <select
            id="collectionId"
            name="collectionId"
            required
            value={values.collectionId}
            onChange={(event) =>
              updateValue("collectionId", event.target.value)
            }
            aria-invalid={collectionIdError ? true : undefined}
            aria-describedby={
              collectionIdError ? "collectionId-error" : "collectionId-help"
            }
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          >
            <option value="" disabled>
              Select a Collection
            </option>
            {collectionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {formatCollectionOptionLabel(option)}
              </option>
            ))}
          </select>
          {collectionIdError ? (
            <p id="collectionId-error" className="type-status mt-2">
              {collectionIdError}
            </p>
          ) : (
            <p id="collectionId-help" className="type-status mt-2">
              Every Product belongs to a Collection within the archive.
            </p>
          )}
        </div>

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
            aria-describedby={slugError ? "slug-error" : "slug-help"}
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {slugError ? (
            <p id="slug-error" className="type-status mt-2">
              {slugError}
            </p>
          ) : (
            <p id="slug-help" className="type-status mt-2">
              Unique within the selected Collection. Lowercase letters, numbers
              and hyphens only.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="type-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
            aria-invalid={descriptionError ? true : undefined}
            aria-describedby={
              descriptionError ? "description-error" : undefined
            }
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {descriptionError ? (
            <p id="description-error" className="type-status mt-2">
              {descriptionError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="type-label">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="text"
              inputMode="decimal"
              required
              placeholder="85.00"
              value={values.price}
              onChange={(event) => updateValue("price", event.target.value)}
              aria-invalid={priceError ? true : undefined}
              aria-describedby={priceError ? "price-error" : "price-help"}
              className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
            />
            {priceError ? (
              <p id="price-error" className="type-status mt-2">
                {priceError}
              </p>
            ) : (
              <p id="price-help" className="type-status mt-2">
                Enter the price in pounds, for example 85.00.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="type-label">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={values.currency}
              onChange={(event) =>
                updateValue("currency", event.target.value as "GBP")
              }
              aria-invalid={currencyError ? true : undefined}
              aria-describedby={currencyError ? "currency-error" : undefined}
              className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
            >
              <option value="GBP">GBP</option>
            </select>
            {currencyError ? (
              <p id="currency-error" className="type-status mt-2">
                {currencyError}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="status" className="type-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={(event) =>
              updateValue("status", event.target.value as ProductStatus)
            }
            aria-invalid={statusError ? true : undefined}
            aria-describedby={statusError ? "status-error" : undefined}
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)] sm:max-w-xs"
          >
            <option value={ProductStatus.DRAFT}>Draft</option>
            <option value={ProductStatus.ACTIVE}>Active</option>
            <option value={ProductStatus.SOLD_OUT}>Sold out</option>
            <option value={ProductStatus.ARCHIVED}>Archived</option>
          </select>
          {statusError ? (
            <p id="status-error" className="type-status mt-2">
              {statusError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="imageUrl" className="type-label">
            Image URL
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            value={values.imageUrl}
            onChange={(event) => updateValue("imageUrl", event.target.value)}
            aria-invalid={imageUrlError ? true : undefined}
            aria-describedby={
              imageUrlError ? "imageUrl-error" : "imageUrl-help"
            }
            className="focus-ring mt-2 block w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text-primary)]"
          />
          {imageUrlError ? (
            <p id="imageUrl-error" className="type-status mt-2">
              {imageUrlError}
            </p>
          ) : (
            <p id="imageUrl-help" className="type-status mt-2">
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
            ? "Saving Product record…"
            : props.mode === "create"
              ? "Create Product"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
