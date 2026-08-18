/**
 * Task 008 Phase 2 deterministic verification for distribution domain utilities.
 *
 * Usage: npx tsx scripts/distribution/verify-phase-2.ts
 */

import { ContributionPeriodStatus } from "@prisma/client";
import {
  validateAllocationBasisPoints,
  validateTotalQualifiedAllocationBasisPoints,
} from "@/lib/distribution/allocation";
import { calculateCompensationInPence } from "@/lib/distribution/calculate-compensation";
import { aggregateCompensationByContributor } from "@/lib/distribution/aggregate";
import { deriveContributorEligibility } from "@/lib/distribution/eligibility";
import { buildDistributionPreview } from "@/lib/distribution/preview-calculation";
import { validateParticipantEnrollment } from "@/lib/distribution/validate-participant-enrollment";

type CheckResult = {
  name: string;
  pass: boolean;
  detail?: string;
};

const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

function main() {
  check(
    "Case 1: £8,500.00 at 500 bps → £425.00",
    calculateCompensationInPence(850_000, 500) === 42_500,
    `got ${calculateCompensationInPence(850_000, 500)}`,
  );

  const case2 = buildDistributionPreview({
    periodStatus: ContributionPeriodStatus.CLOSED,
    distributableAmountInPence: 1_000_000,
    requirements: [],
    evidence: [],
    participants: [
      {
        participantId: "participant-a",
        contributorId: "contributor-a",
        contributorDisplayName: "Contributor A",
        credentialId: "credential-a",
        credentialNumber: 1,
        collectionId: "collection-1",
        collectionNumber: 1,
        allocationBasisPoints: 500,
        agreementReference: null,
      },
      {
        participantId: "participant-b",
        contributorId: "contributor-b",
        contributorDisplayName: "Contributor B",
        credentialId: "credential-b",
        credentialNumber: 2,
        collectionId: "collection-1",
        collectionNumber: 1,
        allocationBasisPoints: 750,
        agreementReference: null,
      },
    ],
  });

  check(
    "Case 2: £10,000.00 with 500 bps + 750 bps",
    case2.success &&
      case2.preview.lines[0]?.calculatedCompensationInPence === 50_000 &&
      case2.preview.lines[1]?.calculatedCompensationInPence === 75_000 &&
      case2.preview.unallocatedRemainderInPence === 875_000,
    case2.success
      ? `totals ${case2.preview.totalCalculatedCompensationInPence}, remainder ${case2.preview.unallocatedRemainderInPence}`
      : case2.error,
  );

  check(
    "Case 3: fractional penny truncates downward",
    calculateCompensationInPence(10_001, 3333) === 3333,
    `got ${calculateCompensationInPence(10_001, 3333)}`,
  );

  check(
    "Case 4: allocation > 10000 rejected",
    !validateAllocationBasisPoints(10_001).valid,
  );

  check(
    "Case 5: total qualified allocation > 10000 rejected",
    !validateTotalQualifiedAllocationBasisPoints([
      { allocationBasisPoints: 6000, qualified: true },
      { allocationBasisPoints: 5000, qualified: true },
    ]).valid,
  );

  const case3 = buildDistributionPreview({
    periodStatus: ContributionPeriodStatus.CLOSED,
    distributableAmountInPence: 1_000_000,
    requirements: [
      {
        id: "requirement-b",
        contributorId: null,
        label: "Promotional activity",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-b",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
      },
    ],
    participants: [
      {
        participantId: "participant-a",
        contributorId: "contributor-a",
        contributorDisplayName: "Alice",
        credentialId: "credential-a",
        credentialNumber: 1,
        collectionId: "collection-1",
        collectionNumber: 1,
        allocationBasisPoints: 500,
        agreementReference: null,
      },
      {
        participantId: "participant-b",
        contributorId: "contributor-b",
        contributorDisplayName: "Bob",
        credentialId: "credential-b",
        credentialNumber: 2,
        collectionId: "collection-1",
        collectionNumber: 1,
        allocationBasisPoints: 500,
        agreementReference: null,
      },
    ],
  });

  check(
    "Case 6: ineligible allocation not redistributed",
    case3.success &&
      case3.preview.lines.find((line) => line.contributorId === "contributor-a")
        ?.calculatedCompensationInPence === 50_000 &&
      case3.preview.lines.find((line) => line.contributorId === "contributor-b")
        ?.calculatedCompensationInPence === 0 &&
      case3.preview.unallocatedRemainderInPence === 950_000,
    case3.success
      ? `alice ${case3.preview.lines[0]?.calculatedCompensationInPence}, bob ${case3.preview.lines[1]?.calculatedCompensationInPence}, remainder ${case3.preview.unallocatedRemainderInPence}`
      : case3.error,
  );

  const openPending = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.OPEN,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "Promotional activity",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "REJECTED",
      },
    ],
  });

  check(
    "Case 7: OPEN unmet requirements → PENDING",
    openPending === "PENDING",
    openPending,
  );

  const closedNotQualified = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.CLOSED,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "Promotional activity",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "REJECTED",
      },
    ],
  });

  check(
    "Case 8: CLOSED unmet requirements → NOT_QUALIFIED",
    closedNotQualified === "NOT_QUALIFIED",
    closedNotQualified,
  );

  const multiCredential = buildDistributionPreview({
    periodStatus: ContributionPeriodStatus.CLOSED,
    distributableAmountInPence: 1_000_000,
    requirements: [],
    evidence: [],
    participants: [
      {
        participantId: "participant-a-1",
        contributorId: "contributor-a",
        contributorDisplayName: "Alice",
        credentialId: "credential-a1",
        credentialNumber: 1,
        collectionId: "collection-1",
        collectionNumber: 1,
        allocationBasisPoints: 300,
        agreementReference: null,
      },
      {
        participantId: "participant-a-2",
        contributorId: "contributor-a",
        contributorDisplayName: "Alice",
        credentialId: "credential-a2",
        credentialNumber: 2,
        collectionId: "collection-1",
        collectionNumber: 1,
        allocationBasisPoints: 200,
        agreementReference: null,
      },
    ],
  });

  const aliceAggregate =
    multiCredential.success &&
    aggregateCompensationByContributor(multiCredential.preview.lines)[0];

  check(
    "Case 9: multiple Credentials for one Contributor aggregate correctly",
    multiCredential.success &&
      multiCredential.preview.lines.length === 2 &&
      aliceAggregate !== false &&
      aliceAggregate.totalCompensationInPence === 50_000 &&
      aliceAggregate.lineCount === 2,
    multiCredential.success
      ? `lines ${multiCredential.preview.lines.map((line) => line.calculatedCompensationInPence).join(", ")}, total ${aliceAggregate && aliceAggregate.totalCompensationInPence}`
      : multiCredential.error,
  );

  check(
    "Case 10: Credential/Contributor mismatch rejected",
    !validateParticipantEnrollment({
      periodCollectionId: "collection-1",
      credentialCollectionId: "collection-1",
      credentialContributorId: "contributor-a",
      participantContributorId: "contributor-b",
    }).valid,
  );

  check(
    "Case 11: Credential/Period Collection mismatch rejected",
    !validateParticipantEnrollment({
      periodCollectionId: "collection-1",
      credentialCollectionId: "collection-2",
      credentialContributorId: "contributor-a",
      participantContributorId: "contributor-a",
    }).valid,
  );

  const activeVerified = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.OPEN,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "Promotional activity",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
    ],
  });

  check(
    "Case 12: active VERIFIED evidence counts toward eligibility",
    activeVerified === "QUALIFIED",
    activeVerified,
  );

  const invalidatedVerified = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.OPEN,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "Promotional activity",
        requiredVerificationCount: 1,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: new Date("2026-08-18T10:00:00.000Z"),
      },
    ],
  });

  check(
    "Case 13: invalidated VERIFIED evidence does not count toward eligibility",
    invalidatedVerified === "PENDING",
    invalidatedVerified,
  );

  const oneOfThreeVerified = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.OPEN,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "3 approved promotional activities",
        requiredVerificationCount: 3,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
    ],
  });

  check(
    "Case 14: 1/3 active verified → PENDING",
    oneOfThreeVerified === "PENDING",
    oneOfThreeVerified,
  );

  const threeOfThreeVerified = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.OPEN,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "3 approved promotional activities",
        requiredVerificationCount: 3,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
    ],
  });

  check(
    "Case 15: 3/3 active verified → QUALIFIED",
    threeOfThreeVerified === "QUALIFIED",
    threeOfThreeVerified,
  );

  const fourOfThreeVerified = deriveContributorEligibility({
    contributorId: "contributor-a",
    periodStatus: ContributionPeriodStatus.OPEN,
    requirements: [
      {
        id: "requirement-a",
        contributorId: null,
        label: "3 approved promotional activities",
        requiredVerificationCount: 3,
      },
    ],
    evidence: [
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
      {
        contributionRequirementId: "requirement-a",
        contributorId: "contributor-a",
        reviewStatus: "VERIFIED",
        invalidatedAt: null,
      },
    ],
  });

  check(
    "Case 16: 4/3 active verified → QUALIFIED",
    fourOfThreeVerified === "QUALIFIED",
    fourOfThreeVerified,
  );

  const failed = results.filter((result) => !result.pass);

  for (const result of results) {
    console.log(`${result.pass ? "PASS" : "FAIL"} - ${result.name}${result.detail ? ` (${result.detail})` : ""}`);
  }

  console.log(`\nVerification summary: ${results.length - failed.length}/${results.length} passed`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
