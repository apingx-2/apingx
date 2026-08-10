import { formatProductPrice } from "@/lib/products/price";

type ProductPriceDisplayProps = {
  priceInPence: number;
  currency: string;
  className?: string;
};

export function ProductPriceDisplay({
  priceInPence,
  currency,
  className = "",
}: ProductPriceDisplayProps) {
  return (
    <span className={["type-status", className].filter(Boolean).join(" ")}>
      {formatProductPrice(priceInPence, currency)}
    </span>
  );
}
