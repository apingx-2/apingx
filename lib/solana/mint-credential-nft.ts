import {
  createNft,
  fetchDigitalAsset,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
  type Umi,
} from "@metaplex-foundation/umi";
import { getMintingUmi } from "@/lib/solana/get-umi";
import { buildCredentialMetadataName } from "@/lib/credentials/build-metadata";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";

export type MintCredentialNftResult =
  | {
      success: true;
      mintAddress: string;
      transactionSignature: string;
    }
  | {
      success: false;
      error: string;
      code:
        | "config"
        | "metadata_uri"
        | "insufficient_funds"
        | "transaction_failed"
        | "confirmation_failed"
        | "verification_failed";
    };

export async function mintCredentialNftWithUmi(
  umi: Umi,
  input: {
    credential: CredentialDetail;
    metadataUri: string;
    recipientWallet: string;
    networkLabel?: string;
  },
): Promise<MintCredentialNftResult> {
  if (!input.metadataUri.trim()) {
    return {
      success: false,
      error: "Credential metadata URI could not be constructed.",
      code: "metadata_uri",
    };
  }

  const mint = generateSigner(umi);
  const name = buildCredentialMetadataName(input.credential.credentialNumber);
  const networkLabel = input.networkLabel ?? "devnet";

  try {
    const result = await createNft(umi, {
      mint,
      name,
      symbol: "APXCR",
      uri: input.metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      tokenOwner: umiPublicKey(input.recipientWallet),
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    const mintAddress = mint.publicKey.toString();
    const transactionSignature = result.signature.toString();

    try {
      await fetchDigitalAsset(umi, mint.publicKey);
    } catch {
      return {
        success: false,
        error: "The mint transaction completed but the asset could not be verified.",
        code: "verification_failed",
      };
    }

    console.info("[solana] Credential NFT minted", {
      credentialId: input.credential.id,
      mintAddress,
      transactionSignature,
      network: networkLabel,
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
      message.includes("insufficient") ||
      message.includes("lamports") ||
      message.includes("0x1")
    ) {
      console.error("[solana] Mint failed due to insufficient SOL", {
        credentialId: input.credential.id,
        network: networkLabel,
      });

      return {
        success: false,
        error:
          "Minting could not be completed. The mint authority may require additional SOL.",
        code: "insufficient_funds",
      };
    }

    console.error("[solana] Mint transaction failed", {
      credentialId: input.credential.id,
      network: networkLabel,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error: "The mint transaction could not be completed.",
      code: "transaction_failed",
    };
  }
}

export async function mintCredentialNft(input: {
  credential: CredentialDetail;
  metadataUri: string;
  recipientWallet: string;
}): Promise<MintCredentialNftResult> {
  const umi = getMintingUmi();

  if (!umi) {
    return {
      success: false,
      error: "Solana minting is not correctly configured.",
      code: "config",
    };
  }

  return mintCredentialNftWithUmi(umi, input);
}
