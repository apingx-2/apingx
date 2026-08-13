/**
 * TEST / DEV ONLY
 *
 * Local Solana validator client helpers for integration harnesses.
 * Must never be imported from production application routes or server actions.
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { getMintAuthorityKeypair } from "@/lib/solana/get-mint-authority-keypair";

export const LOCAL_VALIDATOR_RPC_URL = "http://localhost:8899";

export function assertLocalValidatorHarnessAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Local validator harness is disabled in production environments.",
    );
  }
}

export function createLocalValidatorReadOnlyUmi() {
  assertLocalValidatorHarnessAllowed();

  return createUmi(LOCAL_VALIDATOR_RPC_URL).use(mplTokenMetadata());
}

export function createLocalValidatorMintingUmi() {
  assertLocalValidatorHarnessAllowed();

  const keypair = getMintAuthorityKeypair();

  if (!keypair) {
    throw new Error(
      "SOLANA_MINT_AUTHORITY_SECRET_KEY is required for the local validator harness.",
    );
  }

  const umi = createUmi(LOCAL_VALIDATOR_RPC_URL).use(mplTokenMetadata());
  const umiKeypair = fromWeb3JsKeypair(keypair);
  const signer = createSignerFromKeypair(umi, umiKeypair);

  umi.use(keypairIdentity(signer));

  return umi;
}

export function getLocalValidatorMintAuthorityPublicKey(): string {
  const keypair = getMintAuthorityKeypair();

  if (!keypair) {
    throw new Error(
      "SOLANA_MINT_AUTHORITY_SECRET_KEY is required for the local validator harness.",
    );
  }

  return keypair.publicKey.toBase58();
}
