export function formatArchiveDate(
  date: Date | null | undefined,
): string | null {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(date);
}

export function formatArchiveDateTime(
  date: Date | null | undefined,
): string | null {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
