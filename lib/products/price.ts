const CURRENCY_PREFIX_PATTERN = /^£\s?/;

/** Upper bound for Prisma `Int` / PostgreSQL `integer` priceInPence storage. */
export const MAX_PRICE_IN_PENCE = 2_147_483_647;

export function normalizePriceInput(value: string): string {
  return value.trim().replace(CURRENCY_PREFIX_PATTERN, "");
}

export function priceInputToPenceBigInt(value: string): bigint {
  const normalized = normalizePriceInput(value);
  const [wholePart, fractionPart = ""] = normalized.split(".");
  const penceFraction = fractionPart.padEnd(2, "0").slice(0, 2);

  return BigInt(wholePart) * BigInt(100) + BigInt(penceFraction);
}

export function penceToPriceInput(priceInPence: number): string {
  const pounds = Math.trunc(priceInPence / 100);
  const remainder = Math.abs(priceInPence % 100);

  return `${pounds}.${String(remainder).padStart(2, "0")}`;
}

export function priceInputToPence(value: string): number {
  const pence = priceInputToPenceBigInt(value);

  return Number(pence);
}

export function formatProductPrice(
  priceInPence: number,
  currency: string,
): string {
  const amount = penceToPriceInput(priceInPence);

  if (currency === "GBP") {
    return `£${amount}`;
  }

  return `${amount} ${currency}`;
}
