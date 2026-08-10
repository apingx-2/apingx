import Link from "next/link";
import Image from "next/image";
import { CollectionReference } from "@/components/products/collection-reference";
import { ProductPriceDisplay } from "@/components/products/product-price-display";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { formatArchiveDate } from "@/lib/collections/format-date";
import type { ProductListItem } from "@/lib/products/get-products";

type ProductArchiveCardProps = {
  product: ProductListItem;
};

export function ProductArchiveCard({ product }: ProductArchiveCardProps) {
  const updatedDate = formatArchiveDate(product.updatedAt);

  return (
    <article className="surface-card group rounded-sm transition-colors">
      <Link
        href={`/admin/products/${product.id}`}
        className="focus-ring block rounded-sm p-5 md:p-6"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
          {product.imageUrl ? (
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-2)] md:w-32">
              <Image
                src={product.imageUrl}
                alt=""
                fill
                unoptimized
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 128px"
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="flex aspect-[4/3] w-full shrink-0 items-center justify-center rounded-sm border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)] md:w-32"
            >
              <span className="type-status px-3 text-center">No image</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <CollectionReference
              collectionNumber={product.collection.collectionNumber}
              name={product.collection.name}
            />

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <h2 className="type-collection">{product.name}</h2>
              <ProductStatusBadge status={product.status} />
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
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
              {updatedDate ? (
                <div>
                  <dt className="type-label">Last updated</dt>
                  <dd className="type-status mt-1">{updatedDate}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </Link>
    </article>
  );
}
