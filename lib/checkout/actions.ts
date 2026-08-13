"use server";

import { ProductStatus } from "@prisma/client";
import { getAppUrl } from "@/lib/checkout/get-app-url";
import { isProductCheckoutEligible } from "@/lib/checkout/eligibility";
import { getProductById } from "@/lib/products/get-product-by-id";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/get-stripe-client";

export type CreateCheckoutSessionResult =
  | { success: true; url: string }
  | { success: false; error: string };

function unavailableMessage(): CreateCheckoutSessionResult {
  return {
    success: false,
    error:
      "Checkout is temporarily unavailable. Please try again shortly.",
  };
}

export async function createCheckoutSessionAction(
  productId: string,
): Promise<CreateCheckoutSessionResult> {
  if (!process.env.DATABASE_URL) {
    return unavailableMessage();
  }

  if (!isStripeConfigured()) {
    return {
      success: false,
      error:
        "Payment processing is not configured. Checkout cannot proceed at this time.",
    };
  }

  const appUrl = getAppUrl();

  if (!appUrl) {
    return {
      success: false,
      error:
        "Checkout is not fully configured. Please try again later.",
    };
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return {
      success: false,
      error:
        "Payment processing is not configured. Checkout cannot proceed at this time.",
    };
  }

  const productResult = await getProductById(productId);

  if (productResult.status === "unavailable") {
    return unavailableMessage();
  }

  if (productResult.status === "not_found") {
    return {
      success: false,
      error: "This piece could not be found in the archive.",
    };
  }

  const { product } = productResult;

  if (!isProductCheckoutEligible(product.status)) {
    return {
      success: false,
      error:
        product.status === ProductStatus.SOLD_OUT
          ? "This piece is sold out."
          : product.status === ProductStatus.ARCHIVED
            ? "This piece has been archived and is no longer available."
            : "This piece is not currently available.",
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency.toLowerCase(),
            unit_amount: product.priceInPence,
            product_data: {
              name: product.name,
              description: product.description.slice(0, 500),
              ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
            },
          },
        },
      ],
      metadata: {
        productId: product.id,
        collectionId: product.collectionId,
        productSlug: product.slug,
        collectionNumber: String(product.collection.collectionNumber),
      },
      success_url: `${appUrl}/checkout/${product.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${product.id}`,
    });

    if (!session.url) {
      return {
        success: false,
        error: "Unable to begin checkout. Please try again.",
      };
    }

    return {
      success: true,
      url: session.url,
    };
  } catch (error) {
    console.error(
      "[checkout] Failed to create Checkout Session",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      success: false,
      error: "Unable to begin checkout. Please try again.",
    };
  }
}
