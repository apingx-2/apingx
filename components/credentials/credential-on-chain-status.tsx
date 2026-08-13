import { CopyableAddress } from "@/components/credentials/copyable-address";
import { CredentialMintStateBadge } from "@/components/credentials/credential-mint-state-badge";
import {
  metadataMatchesCredential,
  verifyCredentialOnChain,
} from "@/lib/solana/verify-credential-nft";
import { getDevnetExplorerAddressUrl } from "@/lib/solana/get-explorer-url";

type CredentialOnChainStatusProps = {
  mintAddress: string;
  credentialNumber: number;
  cachedOwnerWallet: string | null;
};

export async function CredentialOnChainStatus({
  mintAddress,
  credentialNumber,
  cachedOwnerWallet,
}: CredentialOnChainStatusProps) {
  const verification = await verifyCredentialOnChain(
    mintAddress,
    credentialNumber,
  );

  const verificationUnavailable = verification.status === "unavailable";
  const ownerDrift =
    verification.status === "verified" &&
    cachedOwnerWallet &&
    verification.onChainOwner !== cachedOwnerWallet;

  return (
    <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="type-label">On-chain reference</h2>
        <CredentialMintStateBadge
          mintAddress={mintAddress}
          mintedAt={new Date()}
          verificationUnavailable={verificationUnavailable}
        />
      </div>

      <dl className="mt-5 space-y-5">
        <div>
          <dt className="type-label">Network</dt>
          <dd className="type-status mt-1">Devnet</dd>
        </div>

        <CopyableAddress value={mintAddress} label="Mint address" />

        <div>
          <dt className="type-label">Explorer</dt>
          <dd className="type-status mt-1">
            <a
              href={getDevnetExplorerAddressUrl(mintAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring text-[var(--accent-steel)] underline-offset-2 hover:underline"
            >
              View mint on Solana Explorer (Devnet)
            </a>
          </dd>
        </div>

        {verification.status === "verified" ? (
          <>
            <CopyableAddress
              value={verification.onChainOwner}
              label="On-chain owner"
            />
            <div>
              <dt className="type-label">Verification</dt>
              <dd className="type-status mt-1">
                {metadataMatchesCredential(
                  verification.metadataName,
                  credentialNumber,
                )
                  ? "Verified — asset exists and metadata corresponds to this Credential"
                  : "Verified — asset exists on Devnet"}
              </dd>
            </div>
          </>
        ) : (
          <div>
            <dt className="type-label">Verification</dt>
            <dd className="type-status mt-1">On-chain verification unavailable</dd>
          </div>
        )}

        {cachedOwnerWallet ? (
          <CopyableAddress
            value={cachedOwnerWallet}
            label="Database owner cache"
          />
        ) : null}

        {ownerDrift ? (
          <p role="status" className="type-body rounded-sm border px-4 py-3">
            The on-chain owner differs from the database cache. Solana is
            authoritative for current ownership. The cache has not been updated
            automatically.
          </p>
        ) : null}
      </dl>
    </section>
  );
}
