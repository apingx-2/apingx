import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutPaymentStatus } from "@/components/checkout/checkout-payment-status";
import { CheckoutSuccessConfirmation } from "@/components/checkout/checkout-success-confirmation";
import { getCheckoutProduct } from "@/lib/checkout/get-checkout-product";
import { verifyCheckoutSession } from "@/lib/checkout/verify-checkout-session";

export const dynamic = "force-dynamic";

type CheckoutSuccessPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: CheckoutSuccessPageProps) {
  const { productId } = await params;
  const { session_id: sessionId } = await searchParams;
  const productResult = await getCheckoutProduct(productId);

  if (productResult.status === "not_found") {
    notFound();
  }

  if (productResult.status === "unavailable") {
    return (
      <CheckoutPaymentStatus message="Payment status could not be confirmed at this time. If you completed payment, retain your confirmation email from Stripe and contact support if needed." />
    );
  }

  if (!sessionId) {
    return (
      <CheckoutPaymentStatus message="No payment session was returned. If you completed payment, retain your confirmation email from Stripe and contact support if needed." />
    );
  }

  const verification = await verifyCheckoutSession(sessionId, productId);

  if (verification.status === "confirmed") {
    return <CheckoutSuccessConfirmation product={verification.product} />;
  }

  const message =
    verification.status === "unconfigured"
      ? "Payment verification is not configured. If you completed payment, retain your confirmation email from Stripe."
      : verification.status === "invalid"
        ? "This payment session could not be matched to this piece. If you completed payment, retain your confirmation email from Stripe."
        : "Payment could not be confirmed from this session. If you completed payment, retain your confirmation email from Stripe and contact support if needed.";

  return (
    <div className="space-y-8">
      <CheckoutPaymentStatus message={message} />
      <Link
        href={`/checkout/${productId}`}
        className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        Return to checkout
      </Link>
    </div>
  );
}
