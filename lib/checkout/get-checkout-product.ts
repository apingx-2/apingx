import {
  getCheckoutAvailabilityMessage,
  isProductCheckoutEligible,
} from "@/lib/checkout/eligibility";
import {
  getProductById,
  type ProductDetail,
} from "@/lib/products/get-product-by-id";

export type CheckoutProduct = ProductDetail & {
  eligible: boolean;
  availabilityMessage: string | null;
};

export type GetCheckoutProductResult =
  | { status: "success"; product: CheckoutProduct }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function getCheckoutProduct(
  productId: string,
): Promise<GetCheckoutProductResult> {
  const result = await getProductById(productId);

  if (result.status !== "success") {
    return result;
  }

  const eligible = isProductCheckoutEligible(result.product.status);

  return {
    status: "success",
    product: {
      ...result.product,
      eligible,
      availabilityMessage: eligible
        ? null
        : getCheckoutAvailabilityMessage(result.product.status),
    },
  };
}
