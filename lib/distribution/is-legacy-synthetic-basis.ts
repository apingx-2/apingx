/**
 * Legacy synthetic placeholders are explicitly flagged at migration time.
 * Do not infer placeholder status from commercial values at runtime.
 */
export function isLegacySyntheticDistributionBasis(basis: {
  isLegacySyntheticPlaceholder: boolean;
}): boolean {
  return basis.isLegacySyntheticPlaceholder;
}

export function getLegacySyntheticPlaceholderMessage(): string {
  return "Legacy placeholder — this basis was reconstructed from a previously entered flat distributable amount. Replace it with genuine commerce reconciliation data before approval where available.";
}
