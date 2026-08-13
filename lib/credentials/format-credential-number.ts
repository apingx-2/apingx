export function formatCredentialNumber(credentialNumber: number): string {
  return `CREDENTIAL ${String(credentialNumber).padStart(3, "0")}`;
}

export function formatCredentialType(
  type: "FOUNDER" | "CONTRIBUTOR",
): string {
  return type === "FOUNDER" ? "Founder" : "Contributor";
}

export function formatAllocationBasisPoints(basisPoints: number): string {
  const percent = basisPoints / 100;
  return `${percent.toLocaleString("en-GB", {
    minimumFractionDigits: percent % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}%`;
}
