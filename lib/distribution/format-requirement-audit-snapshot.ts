import type { RequirementAuditSnapshotEntry } from "@/lib/distribution/types";

export function formatRequirementAuditSnapshot(
  snapshot: RequirementAuditSnapshotEntry[] | unknown,
): string[] {
  if (!Array.isArray(snapshot)) {
    return ["Requirement audit snapshot unavailable."];
  }

  if (snapshot.length === 0) {
    return ["No applicable contribution requirements recorded."];
  }

  return snapshot.map((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("label" in entry) ||
      !("verifiedEvidenceCount" in entry) ||
      !("requiredVerificationCount" in entry)
    ) {
      return "Requirement audit entry unavailable.";
    }

    const requirement = entry as RequirementAuditSnapshotEntry;
    const status = requirement.satisfied ? "satisfied" : "not satisfied";

    return `${requirement.label}: ${requirement.verifiedEvidenceCount} of ${requirement.requiredVerificationCount} verified submissions (${status})`;
  });
}
