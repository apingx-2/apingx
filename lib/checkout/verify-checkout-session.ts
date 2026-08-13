import { getStripeClient } from "@/lib/stripe/get-stripe-client";
import {
  getProductById,
  type ProductDetail,
} from "@/lib/products/get-product-by-id";

export type VerifiedCheckoutPayment = {
  status: "confirmed";
  product: ProductDetail;
  sessionId: string;
};

export type CheckoutVerificationResult =
  | VerifiedCheckoutPayment
  | { status: "missing_session" }
  | { status: "unconfigured" }
  | { status: "invalid" }
  | { status: "unverified" };

export async function verifyCheckoutSession(
  sessionId: string,
  productId: string,
): Promise<CheckoutVerificationResult> {
  const stripe = getStripeClient();

  if (!stripe) {
    return { status: "unconfigured" };
  }

  const trimmedSessionId = sessionId.trim();

  if (!trimmedSessionId) {
    return { status: "missing_session" };
  }

  const productResult = await getProductById(productId);

  if (productResult.status !== "success") {
    return { status: "invalid" };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(trimmedSessionId);

    if (session.metadata?.productId !== productId) {
      return { status: "invalid" };
    }

    if (session.payment_status !== "paid") {
      return { status: "unverified" };
    }

    if (session.amount_total !== productResult.product.priceInPence) {
      return { status: "invalid" };
    }

    const sessionCurrency = session.currency?.toUpperCase();
    const productCurrency = productResult.product.currency.toUpperCase();

    if (sessionCurrency && sessionCurrency !== productCurrency) {
      return { status: "invalid" };
    }

    return {
      status: "confirmed",
      product: productResult.product,
      sessionId: trimmedSessionId,
    };
  } catch (error) {
    console.error(
      "[checkout] Failed to verify Checkout Session",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { status: "unverified" };
  }
}
