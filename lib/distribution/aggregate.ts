import type { DistributionPreviewLine } from "@/lib/distribution/types";

export type ContributorCompensationAggregate = {
  contributorId: string;
  contributorDisplayName: string;
  totalCompensationInPence: number;
  lineCount: number;
};

export function aggregateCompensationByContributor(
  lines: Array<
    Pick<
      DistributionPreviewLine,
      "contributorId" | "contributorDisplayName" | "calculatedCompensationInPence"
    >
  >,
): ContributorCompensationAggregate[] {
  const totals = new Map<string, ContributorCompensationAggregate>();

  for (const line of lines) {
    const existing = totals.get(line.contributorId);

    if (!existing) {
      totals.set(line.contributorId, {
        contributorId: line.contributorId,
        contributorDisplayName: line.contributorDisplayName,
        totalCompensationInPence: line.calculatedCompensationInPence,
        lineCount: 1,
      });
      continue;
    }

    existing.totalCompensationInPence += line.calculatedCompensationInPence;
    existing.lineCount += 1;
  }

  return Array.from(totals.values()).sort((left, right) =>
    left.contributorDisplayName.localeCompare(right.contributorDisplayName),
  );
}

export function sumCalculatedCompensationInPence(lines: number[]): number {
  return lines.reduce((total, amount) => total + amount, 0);
}
