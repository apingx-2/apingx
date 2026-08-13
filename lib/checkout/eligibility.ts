import { ProductStatus } from "@prisma/client";

export function isProductCheckoutEligible(status: ProductStatus): boolean {
  return status === ProductStatus.ACTIVE;
}

export function getCheckoutAvailabilityMessage(
  status: ProductStatus,
): string {
  switch (status) {
    case ProductStatus.SOLD_OUT:
      return "This piece is sold out.";
    case ProductStatus.ARCHIVED:
      return "This piece has been archived and is no longer available.";
    case ProductStatus.DRAFT:
    default:
      return "This piece is not currently available.";
  }
}
