import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { getMintAuthorityKeypair } from "@/lib/solana/get-mint-authority-keypair";
import { getSolanaConfig, getSolanaConfigForMinting } from "@/lib/solana/config";

export function getReadOnlyUmi() {
  const config = getSolanaConfig();

  if (!config.ok) {
    return null;
  }

  return createUmi(config.rpcUrl).use(mplTokenMetadata());
}

export function getMintingUmi() {
  const config = getSolanaConfigForMinting();

  if (!config.ok) {
    return null;
  }

  const keypair = getMintAuthorityKeypair();

  if (!keypair) {
    return null;
  }

  const umi = createUmi(config.rpcUrl).use(mplTokenMetadata());
  const umiKeypair = fromWeb3JsKeypair(keypair);
  const signer = createSignerFromKeypair(umi, umiKeypair);

  umi.use(keypairIdentity(signer));

  return umi;
}
