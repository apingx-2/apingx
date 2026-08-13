import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const collection = await prisma.collection.upsert({
    where: { collectionNumber: 1 },
    update: {},
    create: {
      collectionNumber: 1,
      slug: "provenance",
      name: "Provenance",
      subtitle: "Collection 001",
      story:
        "The genesis collection of the ApingX Archive. Fashion remembered, not just worn.",
      status: "DRAFT",
      launchDate: null,
      coverImageUrl: null,
    },
  });

  const contributor = await prisma.contributor.upsert({
    where: { id: "seed_contributor_001" },
    update: {},
    create: {
      id: "seed_contributor_001",
      displayName: "ApingX Studio",
      biography: "The creative studio behind Collection 001.",
      email: null,
      walletAddress: null,
      imageUrl: null,
    },
  });

  await prisma.credential.upsert({
    where: {
      collectionId_credentialNumber: {
        collectionId: collection.id,
        credentialNumber: 1,
      },
    },
    update: {},
    create: {
      collectionId: collection.id,
      contributorId: contributor.id,
      credentialNumber: 1,
      type: "CONTRIBUTOR",
      allocationBasisPoints: 500,
      mintAddress: null,
      currentOwnerWallet: null,
      mintedAt: null,
    },
  });

  await prisma.credential.upsert({
    where: {
      collectionId_credentialNumber: {
        collectionId: collection.id,
        credentialNumber: 2,
      },
    },
    update: {},
    create: {
      collectionId: collection.id,
      contributorId: null,
      credentialNumber: 2,
      type: "FOUNDER",
      allocationBasisPoints: 1000,
      mintAddress: null,
      currentOwnerWallet: null,
      mintedAt: null,
    },
  });

  await prisma.product.upsert({
    where: {
      collectionId_slug: {
        collectionId: collection.id,
        slug: "provenance-tee",
      },
    },
    update: {},
    create: {
      collectionId: collection.id,
      name: "Provenance Tee",
      slug: "provenance-tee",
      description: "Limited-edition tee from Collection 001.",
      priceInPence: 8500,
      currency: "GBP",
      status: "DRAFT",
      imageUrl: null,
    },
  });

  console.log("Seed complete:", {
    collectionId: collection.id,
    contributorId: contributor.id,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
