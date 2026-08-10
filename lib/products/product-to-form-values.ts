import type { ProductStatus } from "@prisma/client";
import { penceToPriceInput } from "@/lib/products/price";
import type { ProductFormValues } from "@/lib/products/schemas";

type ProductFormSource = {
  collectionId: string;
  name: string;
  slug: string;
  description: string;
  priceInPence: number;
  currency: string;
  status: ProductStatus;
  imageUrl: string | null;
};

export function productToFormValues(
  product: ProductFormSource,
): ProductFormValues {
  return {
    collectionId: product.collectionId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: penceToPriceInput(product.priceInPence),
    currency: "GBP",
    status: product.status,
    imageUrl: product.imageUrl ?? "",
  };
}
