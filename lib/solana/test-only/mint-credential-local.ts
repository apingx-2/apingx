/**
 * TEST / DEV ONLY
 *
 * Local-validator mint wrapper with post-confirmation verification retries.
 * Production mint paths remain unchanged.
 */

import {
  createNft,
  fetchDigitalAsset,
  fetchDigitalAssetWithTokenByMint,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
  type Umi,
} from "@metaplex-foundation/umi";
import bs58 from "bs58";
import { buildCredentialMetadataName } from "@/lib/credentials/build-metadata";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";

export type LocalMintCredentialNftResult =
  | {
      success: true;
      mintAddress: string;
      transactionSignature: string;
    }
  | {
      success: false;
      error: string;
    };

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function formatTransactionSignature(signature: unknown): string {
  if (typeof signature === "string") {
    return signature;
  }

  if (signature instanceof Uint8Array) {
    return bs58.encode(signature);
  }

  return String(signature);
}

async function verifyMintWithRetries(
  umi: Umi,
  mintPublicKey: ReturnType<typeof umiPublicKey>,
  attempts = 12,
): Promise<boolean> {
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await fetchDigitalAsset(umi, mintPublicKey);
      await fetchDigitalAssetWithTokenByMint(umi, mintPublicKey);
      return true;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";

      if (attempt === attempts) {
        console.error("[solana-test] Local mint verification failed", {
          attempt,
          error: lastError,
        });
        return false;
      }

      await sleep(750);
    }
  }

  return false;
}

export async function mintCredentialNftOnLocalValidator(
  umi: Umi,
  input: {
    credential: CredentialDetail;
    metadataUri: string;
    recipientWallet: string;
  },
): Promise<LocalMintCredentialNftResult> {
  if (!input.metadataUri.trim()) {
    return {
      success: false,
      error: "Credential metadata URI could not be constructed.",
    };
  }

  const mint = generateSigner(umi);
  const name = buildCredentialMetadataName(input.credential.credentialNumber);

  try {
    const result = await createNft(umi, {
      mint,
      name,
      symbol: "APXCR",
      uri: input.metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      tokenOwner: umiPublicKey(input.recipientWallet),
    }).sendAndConfirm(umi, {
      confirm: { commitment: "finalized" },
    });

    const mintAddress = mint.publicKey.toString();
    const transactionSignature = formatTransactionSignature(result.signature);
    const verified = await verifyMintWithRetries(umi, mint.publicKey);

    if (!verified) {
      return {
        success: false,
        error:
          "The mint transaction completed but the asset could not be verified on the local validator.",
      };
    }

    console.info("[solana-test] Credential NFT minted on local validator", {
      credentialId: input.credential.id,
      mintAddress,
      transactionSignature,
      network: "local-validator",
      status: "confirmed",
    });

    return {
      success: true,
      mintAddress,
      transactionSignature,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "unknown error";

    if (
      message.includes("too large") ||
      message.includes("1232") ||
      message.includes("transaction")
    ) {
      return {
        success: false,
        error: `Local mint transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    if (
      message.includes("insufficient") ||
      message.includes("lamports") ||
      message.includes("0x1")
    ) {
      return {
        success: false,
        error:
          "Minting could not be completed. The local mint authority may require additional SOL.",
      };
    }

    return {
      success: false,
      error: `The local validator mint transaction could not be completed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
