import Image from "next/image";
import { CollectionReference } from "@/components/products/collection-reference";
import { ProductPriceDisplay } from "@/components/products/product-price-display";
import { truncateDescription } from "@/lib/checkout/truncate-description";
import type { CheckoutProduct } from "@/lib/checkout/get-checkout-product";

type CheckoutSummaryProps = {
  product: CheckoutProduct;
};

export function CheckoutSummary({ product }: CheckoutSummaryProps) {
  const descriptionSummary = truncateDescription(product.description);

  return (
    <article className="space-y-8">
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">Checkout</p>
        <CollectionReference
          collectionNumber={product.collection.collectionNumber}
          name={product.collection.name}
        />
        <h1 className="type-section">{product.name}</h1>
      </header>

      {product.imageUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-[var(--border-default)] bg-[var(--surface-2)]">
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
          className="flex aspect-[4/3] items-center justify-center rounded-sm border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)]"
        >
          <span className="type-status px-4 text-center">No image recorded</span>
        </div>
      )}

      <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
        <h2 className="type-label">Piece summary</h2>
        <p className="type-body mt-4">{descriptionSummary}</p>
      </section>

      <section
        aria-label="Order summary"
        className="surface-panel rounded-sm border px-5 py-6 md:px-6"
      >
        <h2 className="type-label">Order summary</h2>
        <dl className="mt-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <dt className="type-label">Quantity</dt>
            <dd className="type-status">1</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="type-label">Unit price</dt>
            <dd>
              <ProductPriceDisplay
                priceInPence={product.priceInPence}
                currency={product.currency}
              />
            </dd>
          </div>
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <div className="flex items-start justify-between gap-4">
              <dt className="type-label text-[var(--text-primary)]">Total</dt>
              <dd>
                <ProductPriceDisplay
                  priceInPence={product.priceInPence}
                  currency={product.currency}
                  className="text-[var(--text-primary)]"
                />
              </dd>
            </div>
          </div>
        </dl>
        <p className="type-status mt-5">
          All amounts in {product.currency}. Fiat price is authoritative.
        </p>
      </section>
    </article>
  );
}
