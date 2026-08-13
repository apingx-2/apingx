/**
 * TEST / DEV ONLY — Local Solana validator Credential mint integration harness.
 *
 * Exercises Task 007 mint/verify primitives against http://localhost:8899.
 * Does NOT use application Devnet configuration.
 * Does NOT write mintAddress/currentOwnerWallet/mintedAt to PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/solana/test-local-credential-mint.ts [--credential-id <id>] [--recipient <pubkey>]
 *
 * Requires:
 *   - Local validator at http://localhost:8899 with Token Metadata program loaded
 *   - DATABASE_URL for read-only Credential lookup
 *   - SOLANA_MINT_AUTHORITY_SECRET_KEY for the funded local mint authority
 */

import { prisma } from "@/lib/prisma";
import { getCredentialById } from "@/lib/credentials/get-credential-by-id";
import { isCredentialAlreadyMinted } from "@/lib/credentials/eligibility";
import { metadataMatchesCredential } from "@/lib/solana/verify-credential-nft";
import { verifyCredentialOnChainWithUmi } from "@/lib/solana/verify-credential-nft";
import { mintCredentialNftOnLocalValidator } from "@/lib/solana/test-only/mint-credential-local";
import {
  assertLocalValidatorHarnessAllowed,
  createLocalValidatorMintingUmi,
  createLocalValidatorReadOnlyUmi,
  getLocalValidatorMintAuthorityPublicKey,
  LOCAL_VALIDATOR_RPC_URL,
} from "@/lib/solana/test-only/local-validator-client";
import {
  fetchLocalMetadataJson,
  startLocalMetadataServer,
} from "@/lib/solana/test-only/local-metadata-server";
import { isValidSolanaPublicKey } from "@/lib/solana/validate-public-key";
import { getSolanaConfig } from "@/lib/solana/config";

type CliOptions = {
  credentialId?: string;
  recipient?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--credential-id") {
      options.credentialId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--recipient") {
      options.recipient = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

async function resolveCredential(credentialId?: string) {
  if (credentialId) {
    const result = await getCredentialById(credentialId);

    if (result.status !== "success") {
      throw new Error(`Credential ${credentialId} could not be loaded.`);
    }

    return result.credential;
  }

  const credential = await prisma.credential.findFirst({
    where: {
      mintAddress: null,
      mintedAt: null,
    },
    orderBy: [{ collection: { collectionNumber: "asc" } }, { credentialNumber: "asc" }],
    include: {
      collection: {
        select: {
          id: true,
          collectionNumber: true,
          name: true,
          slug: true,
        },
      },
      contributor: {
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
        },
      },
    },
  });

  if (!credential) {
    throw new Error("No unminted Credential found in PostgreSQL.");
  }

  return credential;
}

function localhostRejectedByApplicationConfig(): boolean {
  const savedCluster = process.env.SOLANA_CLUSTER;
  const savedRpc = process.env.SOLANA_RPC_URL;

  process.env.SOLANA_CLUSTER = "devnet";
  process.env.SOLANA_RPC_URL = LOCAL_VALIDATOR_RPC_URL;

  const result = getSolanaConfig();

  if (savedCluster === undefined) {
    delete process.env.SOLANA_CLUSTER;
  } else {
    process.env.SOLANA_CLUSTER = savedCluster;
  }

  if (savedRpc === undefined) {
    delete process.env.SOLANA_RPC_URL;
  } else {
    process.env.SOLANA_RPC_URL = savedRpc;
  }

  return !result.ok && result.error === "rpc_inconsistent";
}

function reportDevnetGuardUnchanged(): void {
  console.log("Application Devnet guard check:");
  console.log(
    `- localhost RPC rejected by getSolanaConfig(): ${localhostRejectedByApplicationConfig() ? "yes" : "no"}`,
  );
}

async function assertCredentialRecordUnchanged(credentialId: string) {
  const record = await prisma.credential.findUnique({
    where: { id: credentialId },
    select: {
      mintAddress: true,
      currentOwnerWallet: true,
      mintedAt: true,
    },
  });

  if (!record) {
    throw new Error("Credential record disappeared after local mint test.");
  }

  if (record.mintAddress || record.currentOwnerWallet || record.mintedAt) {
    throw new Error(
      "PostgreSQL Credential mint fields were modified during local harness execution.",
    );
  }
}

async function main() {
  assertLocalValidatorHarnessAllowed();

  const options = parseArgs(process.argv.slice(2));
  const credential = await resolveCredential(options.credentialId);

  if (isCredentialAlreadyMinted(credential)) {
    throw new Error(
      "Selected Credential is already minted in PostgreSQL. Choose an unminted record for local testing.",
    );
  }

  const recipient =
    options.recipient?.trim() || getLocalValidatorMintAuthorityPublicKey();

  if (!isValidSolanaPublicKey(recipient)) {
    throw new Error("Recipient wallet must be a valid Solana public key.");
  }

  const metadataServer = await startLocalMetadataServer(credential);

  try {
    const mintingUmi = createLocalValidatorMintingUmi();
    const readOnlyUmi = createLocalValidatorReadOnlyUmi();

    console.log("Starting local validator Credential mint harness");
    console.log(`RPC: ${LOCAL_VALIDATOR_RPC_URL}`);
    console.log(`Credential ID: ${credential.id}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Metadata URI: ${metadataServer.metadataUri}`);
    console.log(`Metadata name: ${metadataServer.metadataJson.name}`);
    console.log("PostgreSQL writes: disabled (read-only Credential lookup)");

    reportDevnetGuardUnchanged();

    const resolvedMetadata = await fetchLocalMetadataJson(
      metadataServer.metadataUri,
    );

    if (resolvedMetadata.name !== metadataServer.metadataJson.name) {
      throw new Error("Local metadata server returned unexpected JSON.");
    }

    const mintResult = await mintCredentialNftOnLocalValidator(mintingUmi, {
      credential,
      metadataUri: metadataServer.metadataUri,
      recipientWallet: recipient,
    });

    if (!mintResult.success) {
      throw new Error(mintResult.error);
    }

    const verification = await verifyCredentialOnChainWithUmi(
      readOnlyUmi,
      mintResult.mintAddress,
    );

    const metadataVerified =
      verification.status === "verified" &&
      metadataMatchesCredential(
        verification.metadataName,
        credential.credentialNumber,
      );

    const ownerMatchesRecipient =
      verification.status === "verified" &&
      verification.onChainOwner === recipient;

    await assertCredentialRecordUnchanged(credential.id);

    console.log("\nLocal mint harness result:");
    console.log(`Credential ID: ${credential.id}`);
    console.log(`Mint address: ${mintResult.mintAddress}`);
    console.log(`Transaction signature: ${mintResult.transactionSignature}`);
    console.log(`Recipient public wallet: ${recipient}`);
    console.log(`Metadata URI resolved: yes`);
    console.log(
      `Metadata verification: ${
        metadataVerified
          ? "passed"
          : verification.status === "verified"
            ? "asset verified, metadata name mismatch"
            : verification.status
      }`,
    );
    console.log(`Recipient ownership: ${ownerMatchesRecipient ? "passed" : "failed"}`);
    console.log("PostgreSQL write status: read-only (no mint fields written)");

    if (verification.status === "verified") {
      console.log(`On-chain owner: ${verification.onChainOwner}`);
      console.log(`On-chain metadata name: ${verification.metadataName}`);
      console.log(`NFT supply check: ${verification.isNft ? "passed" : "failed"}`);
    }
  } finally {
    await metadataServer.close();
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(
    error instanceof Error ? error.message : "Local mint harness failed.",
  );
  await prisma.$disconnect();
  process.exit(1);
});
