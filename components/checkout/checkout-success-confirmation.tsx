import { CollectionReference } from "@/components/products/collection-reference";
import { ProductPriceDisplay } from "@/components/products/product-price-display";
import type { ProductDetail } from "@/lib/products/get-product-by-id";

type CheckoutSuccessConfirmationProps = {
  product: ProductDetail;
};

export function CheckoutSuccessConfirmation({
  product,
}: CheckoutSuccessConfirmationProps) {
  return (
    <article className="space-y-8">
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">Payment complete</p>
        <CollectionReference
          collectionNumber={product.collection.collectionNumber}
          name={product.collection.name}
        />
        <h1 className="type-section">{product.name}</h1>
      </header>

      <section
        role="status"
        className="surface-panel rounded-sm border px-5 py-6 md:px-6"
      >
        <h2 className="type-label">Payment acknowledged</h2>
        <p className="type-body mt-4">
          Your payment for this piece has been received. This confirms the
          checkout payment flow only — credential issuance, fulfilment and archive
          progression follow in later stages of the ApingX platform.
        </p>
        <dl className="mt-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <dt className="type-label">Amount paid</dt>
            <dd>
              <ProductPriceDisplay
                priceInPence={product.priceInPence}
                currency={product.currency}
              />
            </dd>
          </div>
        </dl>
      </section>
    </article>
  );
}
