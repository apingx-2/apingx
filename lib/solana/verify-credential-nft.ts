import { fetchDigitalAssetWithTokenByMint } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, type Umi } from "@metaplex-foundation/umi";
import { getReadOnlyUmi } from "@/lib/solana/get-umi";
import { buildCredentialMetadataName } from "@/lib/credentials/build-metadata";

export type CredentialOnChainVerification =
  | {
      status: "verified";
      mintAddress: string;
      onChainOwner: string;
      metadataName: string;
      isNft: boolean;
    }
  | {
      status: "unavailable";
    }
  | {
      status: "not_found";
      mintAddress: string;
    }
  | {
      status: "invalid_mint";
      mintAddress: string;
    };

export async function verifyCredentialOnChainWithUmi(
  umi: Umi,
  mintAddress: string,
): Promise<CredentialOnChainVerification> {
  try {
    const mint = umiPublicKey(mintAddress);
    const asset = await fetchDigitalAssetWithTokenByMint(umi, mint);
    const metadataName = asset.metadata.name.replace(/\0/g, "").trim();
    const tokenAmount = asset.token.amount;

    return {
      status: "verified",
      mintAddress,
      onChainOwner: asset.token.owner.toString(),
      metadataName,
      isNft: tokenAmount === BigInt(1) && asset.mint.supply === BigInt(1),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "unknown error";

    if (message.includes("accountnotfound") || message.includes("not found")) {
      return { status: "not_found", mintAddress };
    }

    return { status: "unavailable" };
  }
}

export async function verifyCredentialOnChain(
  mintAddress: string,
  expectedCredentialNumber: number,
): Promise<CredentialOnChainVerification> {
  const umi = getReadOnlyUmi();

  if (!umi) {
    return { status: "unavailable" };
  }

  const verification = await verifyCredentialOnChainWithUmi(umi, mintAddress);

  if (verification.status === "unavailable") {
    console.error("[solana] On-chain verification failed", {
      mintAddress,
      network: "devnet",
      credentialNumber: expectedCredentialNumber,
    });
  }

  return verification;
}

export function metadataMatchesCredential(
  metadataName: string,
  expectedCredentialNumber: number,
): boolean {
  return metadataName === buildCredentialMetadataName(expectedCredentialNumber);
}
