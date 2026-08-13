import { notFound } from "next/navigation";
import { CheckoutPaymentButton } from "@/components/checkout/checkout-payment-button";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { CheckoutUnavailable } from "@/components/checkout/checkout-unavailable";
import { getCheckoutProduct } from "@/lib/checkout/get-checkout-product";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { productId } = await params;
  const result = await getCheckoutProduct(productId);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <CheckoutUnavailable message="This checkout is temporarily unavailable. Please try again shortly." />
    );
  }

  const { product } = result;

  return (
    <div className="space-y-8">
      <CheckoutSummary product={product} />

      {product.eligible ? (
        <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
          <h2 className="type-label">Payment</h2>
          <p className="type-body mt-4">
            You will complete payment securely through Stripe. The charge is
            determined from the archive record — not from your browser.
          </p>
          <div className="mt-6">
            <CheckoutPaymentButton productId={product.id} />
          </div>
        </section>
      ) : (
        <CheckoutUnavailable message={product.availabilityMessage ?? "This piece is not currently available."} />
      )}
    </div>
  );
}
