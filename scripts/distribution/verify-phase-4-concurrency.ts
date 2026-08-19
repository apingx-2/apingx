/**
 * Task 008 Phase 4 local financial-concurrency integration verification.
 *
 * Runs ONLY against canonical local dev PostgreSQL (localhost apingx_dev).
 * Creates isolated disposable fixtures; does not touch historical QA records.
 *
 * Usage: npx tsx scripts/distribution/verify-phase-4-concurrency.ts
 */

import {
  ContributionPeriodStatus,
  CredentialType,
  DistributionCalculationStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDistributionBasisVersion } from "@/lib/distribution/distribution-basis";
import { persistDistributionCalculation } from "@/lib/distribution/persist-calculation";

type CheckResult = {
  name: string;
  pass: boolean;
  detail?: string;
};

const results: CheckResult[] = [];
const disposablePeriodIds: string[] = [];
const disposableCollectionIds: string[] = [];
const disposableContributorIds: string[] = [];
const disposableCredentialIds: string[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function assertLocalDevDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const isLocalHost =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  if (!isLocalHost) {
    throw new Error(
      "Refusing to run concurrency verification outside local development PostgreSQL.",
    );
  }

  if (/prod/i.test(databaseUrl)) {
    throw new Error("Refusing to run concurrency verification against production.");
  }
}

async function createClosedPeriodFixture(suffix: string) {
  const stamp = Date.now();
  const collectionNumber = 90_000 + (stamp % 9_000);

  const collection = await prisma.collection.create({
    data: {
      collectionNumber,
      slug: `conc-test-${stamp}-${suffix}`,
      name: `CONC-TEST Collection ${suffix}`,
      story: "Disposable concurrency integration fixture.",
      status: "PUBLISHED",
    },
  });
  disposableCollectionIds.push(collection.id);

  const contributor = await prisma.contributor.create({
    data: {
      displayName: `CONC-TEST Contributor ${suffix}`,
    },
  });
  disposableContributorIds.push(contributor.id);

  const credential = await prisma.credential.create({
    data: {
      collectionId: collection.id,
      contributorId: contributor.id,
      credentialNumber: 1,
      type: CredentialType.CONTRIBUTOR,
      allocationBasisPoints: 500,
    },
  });
  disposableCredentialIds.push(credential.id);

  const period = await prisma.contributionPeriod.create({
    data: {
      collectionId: collection.id,
      title: `CONC-TEST Period ${suffix} ${stamp}`,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-31"),
      status: ContributionPeriodStatus.CLOSED,
      currency: "GBP",
    },
  });
  disposablePeriodIds.push(period.id);

  await prisma.contributionPeriodParticipant.create({
    data: {
      contributionPeriodId: period.id,
      contributorId: contributor.id,
      credentialId: credential.id,
    },
  });

  return { collection, contributor, credential, period };
}

async function createApprovedBasis(contributionPeriodId: string) {
  return prisma.distributionBasis.create({
    data: {
      contributionPeriodId,
      currency: "GBP",
      grossQualifyingProductSalesInPence: 6_000_000,
      discountsInPence: 300_000,
      returnsRefundsInPence: 500_000,
      successfulChargebacksInPence: 100_000,
      retainedProductRevenueInPence: 5_100_000,
      vatExcludedInPence: 850_000,
      netQualifyingRevenueInPence: 4_250_000,
      contributorPoolBasisPoints: 2_000,
      proposedDistributableAmountInPence: 850_000,
      reconciliationCutoffAt: new Date("2026-01-31T23:59:59Z"),
      basisVersion: getDistributionBasisVersion(),
      approvedAt: new Date("2026-02-01T10:00:00Z"),
    },
  });
}

const basisCreatePayload = (contributionPeriodId: string) => ({
  contributionPeriodId,
  currency: "GBP" as const,
  grossQualifyingProductSalesInPence: 1_000_000,
  discountsInPence: 0,
  returnsRefundsInPence: 0,
  successfulChargebacksInPence: 0,
  retainedProductRevenueInPence: 1_000_000,
  vatExcludedInPence: 0,
  netQualifyingRevenueInPence: 1_000_000,
  contributorPoolBasisPoints: 2_000,
  proposedDistributableAmountInPence: 200_000,
  reconciliationCutoffAt: new Date("2026-01-31T23:59:59Z"),
  basisVersion: getDistributionBasisVersion(),
});

async function verifyPartialUniqueIndexes(): Promise<void> {
  const indexes = await prisma.$queryRaw<
    Array<{ indexname: string; indexdef: string }>
  >`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'DistributionCalculation_one_calculated_per_period',
        'DistributionCalculation_one_approved_per_period'
      )
    ORDER BY indexname
  `;

  const calculated = indexes.find(
    (entry) => entry.indexname === "DistributionCalculation_one_calculated_per_period",
  );
  const approved = indexes.find(
    (entry) => entry.indexname === "DistributionCalculation_one_approved_per_period",
  );

  check(
    "Index: DistributionCalculation_one_calculated_per_period exists",
    Boolean(calculated),
    calculated?.indexdef,
  );
  check(
    "Index: calculated predicate includes status = 'CALCULATED'",
    Boolean(calculated?.indexdef.includes("CALCULATED")),
    calculated?.indexdef,
  );
  check(
    "Index: DistributionCalculation_one_approved_per_period exists",
    Boolean(approved),
    approved?.indexdef,
  );
  check(
    "Index: approved predicate includes status = 'APPROVED'",
    Boolean(approved?.indexdef.includes("APPROVED")),
    approved?.indexdef,
  );
}

async function testConcurrentBasisCreation(): Promise<void> {
  const { period } = await createClosedPeriodFixture("basis");

  const outcomes = await Promise.allSettled([
    prisma.distributionBasis.create({ data: basisCreatePayload(period.id) }),
    prisma.distributionBasis.create({ data: basisCreatePayload(period.id) }),
  ]);

  const persistedCount = await prisma.distributionBasis.count({
    where: { contributionPeriodId: period.id },
  });

  const successes = outcomes.filter((entry) => entry.status === "fulfilled");
  const uniqueFailures = outcomes.filter(
    (entry) => entry.status === "rejected" && isPrismaUniqueViolation(entry.reason),
  );

  check(
    "Concurrent basis create: exactly one basis persists",
    persistedCount === 1,
    `persisted=${persistedCount}`,
  );
  check(
    "Concurrent basis create: one success and one P2002",
    successes.length === 1 && uniqueFailures.length === 1,
    `successes=${successes.length}, p2002=${uniqueFailures.length}`,
  );
}

async function testConcurrentCalculationCreation(): Promise<void> {
  const { period } = await createClosedPeriodFixture("calc-create");
  await createApprovedBasis(period.id);

  const outcomes = await Promise.allSettled([
    persistDistributionCalculation({ contributionPeriodId: period.id }),
    persistDistributionCalculation({ contributionPeriodId: period.id }),
  ]);

  const calculatedRows = await prisma.distributionCalculation.findMany({
    where: {
      contributionPeriodId: period.id,
      status: DistributionCalculationStatus.CALCULATED,
    },
    orderBy: { calculationSequence: "asc" },
  });

  const sequences = calculatedRows.map((row) => row.calculationSequence);
  const uniqueSequences = new Set(sequences);

  const successes = outcomes.filter(
    (entry) => entry.status === "fulfilled" && entry.value.success,
  );
  const safeConflicts = outcomes.filter(
    (entry) =>
      entry.status === "fulfilled" &&
      !entry.value.success &&
      /active calculation already exists|created at the same time/i.test(
        entry.value.error,
      ),
  );

  check(
    "Concurrent calculation create: exactly one CALCULATED persists",
    calculatedRows.length === 1,
    `calculated=${calculatedRows.length}, statuses=${calculatedRows.map((row) => row.status).join(",")}`,
  );
  check(
    "Concurrent calculation create: sequences remain unique",
    sequences.length === uniqueSequences.size,
    `sequences=${sequences.join(",")}`,
  );
  check(
    "Concurrent calculation create: one success and one safe conflict",
    successes.length === 1 && safeConflicts.length === 1,
    `successes=${successes.length}, conflicts=${safeConflicts.length}`,
  );
}

async function testConcurrentApproval(): Promise<void> {
  const { period } = await createClosedPeriodFixture("calc-approve");
  const basis = await createApprovedBasis(period.id);

  const voidCalcA = await prisma.distributionCalculation.create({
    data: {
      contributionPeriodId: period.id,
      distributionBasisId: basis.id,
      calculationSequence: 1,
      status: DistributionCalculationStatus.VOID,
      calculationVersion: "distribution-v1",
      distributableAmountInPence: 850_000,
      currency: "GBP",
      voidedAt: new Date("2026-02-02T10:00:00Z"),
      voidReason: "CONC-TEST fixture for approval index race",
    },
  });

  const voidCalcB = await prisma.distributionCalculation.create({
    data: {
      contributionPeriodId: period.id,
      distributionBasisId: basis.id,
      calculationSequence: 2,
      status: DistributionCalculationStatus.VOID,
      calculationVersion: "distribution-v1",
      distributableAmountInPence: 850_000,
      currency: "GBP",
      voidedAt: new Date("2026-02-03T10:00:00Z"),
      voidReason: "CONC-TEST fixture for approval index race",
    },
  });

  const approveNow = new Date("2026-02-04T10:00:00Z");

  const outcomes = await Promise.allSettled([
    prisma.distributionCalculation.update({
      where: { id: voidCalcA.id },
      data: {
        status: DistributionCalculationStatus.APPROVED,
        approvedAt: approveNow,
        voidedAt: null,
        voidReason: null,
      },
    }),
    prisma.distributionCalculation.update({
      where: { id: voidCalcB.id },
      data: {
        status: DistributionCalculationStatus.APPROVED,
        approvedAt: approveNow,
        voidedAt: null,
        voidReason: null,
      },
    }),
  ]);

  const approvedCount = await prisma.distributionCalculation.count({
    where: {
      contributionPeriodId: period.id,
      status: DistributionCalculationStatus.APPROVED,
    },
  });

  const uniqueFailures = outcomes.filter(
    (entry) => entry.status === "rejected" && isPrismaUniqueViolation(entry.reason),
  );

  check(
    "Concurrent approval race: at most one APPROVED persists",
    approvedCount === 1,
    `approved=${approvedCount}`,
  );
  check(
    "Concurrent approval race: losing update receives P2002",
    uniqueFailures.length === 1,
    `p2002=${uniqueFailures.length}`,
  );
}

async function testConcurrentReplacementCreation(): Promise<void> {
  const { period } = await createClosedPeriodFixture("replacement");
  const basis = await createApprovedBasis(period.id);

  const original = await persistDistributionCalculation({
    contributionPeriodId: period.id,
  });

  if (!original.success) {
    check("Concurrent replacement setup: initial calculation created", false, original.error);
    return;
  }

  await prisma.distributionCalculation.update({
    where: { id: original.calculationId },
    data: {
      status: DistributionCalculationStatus.APPROVED,
      approvedAt: new Date("2026-02-05T10:00:00Z"),
    },
  });

  await prisma.distributionCalculation.update({
    where: { id: original.calculationId },
    data: {
      status: DistributionCalculationStatus.VOID,
      voidedAt: new Date("2026-02-06T10:00:00Z"),
      voidReason: "CONC-TEST void for replacement concurrency",
    },
  });

  const outcomes = await Promise.allSettled([
    persistDistributionCalculation({
      contributionPeriodId: period.id,
      replacesCalculationId: original.calculationId,
    }),
    persistDistributionCalculation({
      contributionPeriodId: period.id,
      replacesCalculationId: original.calculationId,
    }),
  ]);

  const replacements = await prisma.distributionCalculation.findMany({
    where: {
      contributionPeriodId: period.id,
      replacesCalculationId: original.calculationId,
    },
    orderBy: { calculationSequence: "asc" },
  });

  const activeCalculated = await prisma.distributionCalculation.count({
    where: {
      contributionPeriodId: period.id,
      status: DistributionCalculationStatus.CALCULATED,
    },
  });

  const successes = outcomes.filter(
    (entry) => entry.status === "fulfilled" && entry.value.success,
  );
  const safeConflicts = outcomes.filter(
    (entry) =>
      entry.status === "fulfilled" &&
      !entry.value.success &&
      /active calculation already exists|already has a replacement|created at the same time/i.test(
        entry.value.error,
      ),
  );

  check(
    "Concurrent replacement: exactly one replacement persists",
    replacements.length === 1,
    `replacements=${replacements.length}, sequences=${replacements.map((row) => row.calculationSequence).join(",")}`,
  );
  check(
    "Concurrent replacement: replacement points to voided calculation",
    replacements.length === 1 &&
      replacements[0]?.replacesCalculationId === original.calculationId,
    replacements[0]?.replacesCalculationId ?? "none",
  );
  check(
    "Concurrent replacement: only one active CALCULATED remains",
    activeCalculated === 1,
    `activeCalculated=${activeCalculated}`,
  );
  check(
    "Concurrent replacement: one success and one safe conflict",
    successes.length === 1 && safeConflicts.length === 1,
    `successes=${successes.length}, conflicts=${safeConflicts.length}`,
  );
}

async function cleanupFixtures(): Promise<string[]> {
  const remaining: string[] = [];

  for (const periodId of disposablePeriodIds) {
    try {
      await prisma.distributionCalculationLine.deleteMany({
        where: {
          distributionCalculation: { contributionPeriodId: periodId },
        },
      });
      await prisma.distributionCalculation.deleteMany({
        where: { contributionPeriodId: periodId },
      });
      await prisma.distributionBasis.deleteMany({
        where: { contributionPeriodId: periodId },
      });
      await prisma.contributionEvidence.deleteMany({
        where: { contributionPeriodId: periodId },
      });
      await prisma.contributionRequirement.deleteMany({
        where: { contributionPeriodId: periodId },
      });
      await prisma.contributionPeriodParticipant.deleteMany({
        where: { contributionPeriodId: periodId },
      });
      await prisma.contributionPeriod.delete({ where: { id: periodId } });
    } catch (error) {
      remaining.push(
        `period ${periodId}: ${error instanceof Error ? error.message : "cleanup failed"}`,
      );
    }
  }

  for (const credentialId of disposableCredentialIds) {
    try {
      await prisma.credential.delete({ where: { id: credentialId } });
    } catch (error) {
      remaining.push(
        `credential ${credentialId}: ${error instanceof Error ? error.message : "cleanup failed"}`,
      );
    }
  }

  for (const contributorId of disposableContributorIds) {
    try {
      await prisma.contributor.delete({ where: { id: contributorId } });
    } catch (error) {
      remaining.push(
        `contributor ${contributorId}: ${error instanceof Error ? error.message : "cleanup failed"}`,
      );
    }
  }

  for (const collectionId of disposableCollectionIds) {
    try {
      await prisma.collection.delete({ where: { id: collectionId } });
    } catch (error) {
      remaining.push(
        `collection ${collectionId}: ${error instanceof Error ? error.message : "cleanup failed"}`,
      );
    }
  }

  return remaining;
}

async function main() {
  assertLocalDevDatabase();

  console.log("Task 008 Phase 4 concurrency verification (local dev only)\n");

  try {
    await verifyPartialUniqueIndexes();
    await testConcurrentBasisCreation();
    await testConcurrentCalculationCreation();
    await testConcurrentApproval();
    await testConcurrentReplacementCreation();
  } finally {
    const remaining = await cleanupFixtures();
    if (remaining.length > 0) {
      check(
        "Cleanup: all disposable fixtures removed",
        false,
        remaining.join("; "),
      );
    } else {
      check("Cleanup: all disposable fixtures removed", true);
    }
  }

  const failed = results.filter((entry) => !entry.pass);

  for (const entry of results) {
    console.log(
      `${entry.pass ? "PASS" : "FAIL"}: ${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`,
    );
  }

  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

  await prisma.$disconnect();

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
