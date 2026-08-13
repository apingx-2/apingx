import type { CredentialListItem } from "@/lib/credentials/get-credentials";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";

export type CredentialMintState =
  | "not_minted"
  | "minted"
  | "verification_unavailable";

export function getCredentialMintState(credential: {
  mintAddress: string | null;
  mintedAt: Date | null;
}): CredentialMintState {
  if (credential.mintAddress || credential.mintedAt) {
    return "minted";
  }

  return "not_minted";
}

export function getCredentialMintStateLabel(
  state: CredentialMintState,
  verificationUnavailable = false,
): string {
  if (state === "not_minted") {
    return "Not Minted";
  }

  if (verificationUnavailable) {
    return "Minted — On-chain verification unavailable";
  }

  return "Minted — Devnet";
}

export function isMintedCredential(
  credential: CredentialListItem | CredentialDetail,
): boolean {
  return getCredentialMintState(credential) === "minted";
}
