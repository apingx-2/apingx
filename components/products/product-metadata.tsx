import Image from "next/image";
import Link from "next/link";
import { CollectionReference } from "@/components/products/collection-reference";
import { ProductPriceDisplay } from "@/components/products/product-price-display";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { formatArchiveDateTime } from "@/lib/collections/format-date";
import type { ProductDetail } from "@/lib/products/get-product-by-id";

type ProductMetadataProps = {
  product: ProductDetail;
};

export function ProductMetadata({ product }: ProductMetadataProps) {
  const createdDate = formatArchiveDateTime(product.createdAt);
  const updatedDate = formatArchiveDateTime(product.updatedAt);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <CollectionReference
            collectionNumber={product.collection.collectionNumber}
            name={product.collection.name}
          />
          <h1 className="type-section mt-4">{product.name}</h1>
          <div className="mt-5">
            <ProductStatusBadge status={product.status} />
          </div>
        </div>

        <Link
          href={`/admin/products/${product.id}/edit`}
          className="focus-ring type-label inline-flex shrink-0 rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          Edit Product
        </Link>
      </div>

      {product.imageUrl ? (
        <div className="relative aspect-[4/3] max-w-2xl overflow-hidden rounded-sm border border-[var(--border-default)] bg-[var(--surface-2)]">
          <Image
            src={product.imageUrl}
            alt={`${product.name} image`}
            fill
            unoptimized
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[4/3] max-w-2xl items-center justify-center rounded-sm border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)]"
        >
          <span className="type-status px-4 text-center">No image recorded</span>
        </div>
      )}

      <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
        <h2 className="type-label">Description</h2>
        <p className="type-body mt-4 whitespace-pre-wrap">{product.description}</p>
      </section>

      <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
        <h2 className="type-label">Archive metadata</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="type-label">Price</dt>
            <dd className="mt-1">
              <ProductPriceDisplay
                priceInPence={product.priceInPence}
                currency={product.currency}
              />
            </dd>
          </div>
          <div>
            <dt className="type-label">Currency</dt>
            <dd className="type-status mt-1">{product.currency}</dd>
          </div>
          <div>
            <dt className="type-label">Slug</dt>
            <dd className="type-status mt-1">{product.slug}</dd>
          </div>
          <div>
            <dt className="type-label">Collection</dt>
            <dd className="type-status mt-1">
              <CollectionReference
                collectionNumber={product.collection.collectionNumber}
                name={product.collection.name}
              />
            </dd>
          </div>
          {createdDate ? (
            <div>
              <dt className="type-label">Created</dt>
              <dd className="type-status mt-1">{createdDate}</dd>
            </div>
          ) : null}
          {updatedDate ? (
            <div>
              <dt className="type-label">Last updated</dt>
              <dd className="type-status mt-1">{updatedDate}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
