"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCredentialMetadataUri } from "@/lib/credentials/build-metadata";
import {
  assertCredentialMintable,
  evaluateMintEligibility,
} from "@/lib/credentials/eligibility";
import { mintCredentialNft } from "@/lib/solana/mint-credential-nft";
import { normaliseSolanaPublicKey } from "@/lib/solana/validate-public-key";

export type MintCredentialActionResult =
  | {
      success: true;
      mintAddress: string;
      transactionSignature: string;
    }
  | {
      success: false;
      error: string;
      reconciliation?: false;
    }
  | {
      success: false;
      error: string;
      reconciliation: true;
      mintAddress: string;
      transactionSignature: string;
    };

export async function mintCredentialAction(
  credentialId: string,
  recipientWallet: string,
): Promise<MintCredentialActionResult> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: "Credential records are unavailable.",
    };
  }

  const eligibility = await evaluateMintEligibility(
    credentialId,
    recipientWallet,
  );

  if (!eligibility.eligible) {
    return {
      success: false,
      error: eligibility.message,
    };
  }

  const credential = eligibility.credential;

  if (!credential) {
    return {
      success: false,
      error: "This Credential could not be found in the archive.",
    };
  }

  const mintableCheck = await assertCredentialMintable(credentialId);

  if (!mintableCheck.ok) {
    return {
      success: false,
      error: mintableCheck.message,
    };
  }

  let normalisedRecipient: string;

  try {
    normalisedRecipient = normaliseSolanaPublicKey(recipientWallet);
  } catch {
    return {
      success: false,
      error: "Enter a valid Solana public wallet address.",
    };
  }

  const metadataUri = getCredentialMetadataUri(credentialId);

  if (!metadataUri) {
    return {
      success: false,
      error:
        "Credential metadata URI could not be constructed. Configure NEXT_PUBLIC_APP_URL for metadata hosting.",
    };
  }

  const mintResult = await mintCredentialNft({
    credential,
    metadataUri,
    recipientWallet: normalisedRecipient,
  });

  if (!mintResult.success) {
    return {
      success: false,
      error: mintResult.error,
    };
  }

  try {
    const updated = await prisma.credential.updateMany({
      where: {
        id: credentialId,
        mintAddress: null,
        mintedAt: null,
      },
      data: {
        mintAddress: mintResult.mintAddress,
        currentOwnerWallet: normalisedRecipient,
        mintedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      console.error(
        "[credentials] On-chain mint succeeded but database update matched no rows",
        {
          credentialId,
          mintAddress: mintResult.mintAddress,
          transactionSignature: mintResult.transactionSignature,
          network: "devnet",
        },
      );

      return {
        success: false,
        reconciliation: true,
        mintAddress: mintResult.mintAddress,
        transactionSignature: mintResult.transactionSignature,
        error:
          "The Credential was minted on Solana Devnet, but the archive database could not be updated. Do not press Mint again. Manual reconciliation is required. Record the mint address and transaction reference below and contact the operator.",
      };
    }
  } catch (error) {
    console.error(
      "[credentials] On-chain mint succeeded but database update failed",
      {
        credentialId,
        mintAddress: mintResult.mintAddress,
        transactionSignature: mintResult.transactionSignature,
        network: "devnet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    );

    return {
      success: false,
      reconciliation: true,
      mintAddress: mintResult.mintAddress,
      transactionSignature: mintResult.transactionSignature,
      error:
        "The Credential was minted on Solana Devnet, but the archive database could not be updated. Do not press Mint again. Manual reconciliation is required. Record the mint address and transaction reference below and contact the operator.",
    };
  }

  revalidatePath("/admin/credentials");
  revalidatePath(`/admin/credentials/${credentialId}`);

  return {
    success: true,
    mintAddress: mintResult.mintAddress,
    transactionSignature: mintResult.transactionSignature,
  };
}
