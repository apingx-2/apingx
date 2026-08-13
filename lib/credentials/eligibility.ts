import { prisma } from "@/lib/prisma";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";

export type MintEligibilityResult =
  | { eligible: true }
  | {
      eligible: false;
      reason:
        | "not_found"
        | "already_minted"
        | "collection_missing"
        | "invalid_wallet"
        | "config_error"
        | "minting_disabled"
        | "production_blocked";
      message: string;
    };

export function isCredentialAlreadyMinted(credential: {
  mintAddress: string | null;
  mintedAt: Date | null;
}): boolean {
  return Boolean(credential.mintAddress || credential.mintedAt);
}

export async function evaluateMintEligibility(
  credentialId: string,
  recipientWallet: string,
): Promise<
  MintEligibilityResult & {
    credential?: CredentialDetail;
  }
> {
  const { getCredentialById } = await import(
    "@/lib/credentials/get-credential-by-id"
  );
  const { isValidSolanaPublicKey } = await import(
    "@/lib/solana/validate-public-key"
  );
  const {
    getSolanaConfigForMinting,
    getSolanaConfigErrorMessage,
    isProductionMintBlocked,
    isSolanaMintingExplicitlyEnabled,
  } = await import("@/lib/solana/config");

  const credentialResult = await getCredentialById(credentialId);

  if (credentialResult.status === "unavailable") {
    return {
      eligible: false,
      reason: "not_found",
      message: "Credential records are unavailable.",
    };
  }

  if (credentialResult.status === "not_found") {
    return {
      eligible: false,
      reason: "not_found",
      message: "This Credential could not be found in the archive.",
    };
  }

  const { credential } = credentialResult;

  if (!credential.collection) {
    return {
      eligible: false,
      reason: "collection_missing",
      message: "The parent Collection for this Credential could not be found.",
      credential,
    };
  }

  if (isCredentialAlreadyMinted(credential)) {
    return {
      eligible: false,
      reason: "already_minted",
      message:
        "This Credential is already associated with an on-chain asset. A second mint cannot be created.",
      credential,
    };
  }

  if (!recipientWallet.trim()) {
    return {
      eligible: false,
      reason: "invalid_wallet",
      message: "A recipient wallet address is required.",
      credential,
    };
  }

  if (!isValidSolanaPublicKey(recipientWallet)) {
    return {
      eligible: false,
      reason: "invalid_wallet",
      message: "Enter a valid Solana public wallet address.",
      credential,
    };
  }

  if (isProductionMintBlocked()) {
    return {
      eligible: false,
      reason: "production_blocked",
      message: "Mint execution is disabled in production deployments.",
      credential,
    };
  }

  if (!isSolanaMintingExplicitlyEnabled()) {
    return {
      eligible: false,
      reason: "minting_disabled",
      message: "Solana minting is not enabled for this environment.",
      credential,
    };
  }

  const config = getSolanaConfigForMinting();

  if (!config.ok) {
    return {
      eligible: false,
      reason: "config_error",
      message: getSolanaConfigErrorMessage(config.error),
      credential,
    };
  }

  return { eligible: true, credential };
}

export async function assertCredentialMintable(
  credentialId: string,
): Promise<
  | { ok: true; credential: CredentialDetail }
  | { ok: false; message: string }
> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
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
    return {
      ok: false,
      message: "This Credential could not be found in the archive.",
    };
  }

  if (!credential.collection) {
    return {
      ok: false,
      message: "The parent Collection for this Credential could not be found.",
    };
  }

  if (isCredentialAlreadyMinted(credential)) {
    return {
      ok: false,
      message:
        "This Credential is already associated with an on-chain asset. A second mint cannot be created.",
    };
  }

  return { ok: true, credential };
}
