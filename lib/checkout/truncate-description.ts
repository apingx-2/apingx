export function truncateDescription(
  description: string,
  maxLength = 240,
): string {
  const trimmed = description.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}
