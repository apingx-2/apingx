import Link from "next/link";
import { CollectionReference } from "@/components/products/collection-reference";
import { CredentialMintForm } from "@/components/credentials/credential-mint-form";
import { CredentialMintStateBadge } from "@/components/credentials/credential-mint-state-badge";
import { CredentialOnChainStatus } from "@/components/credentials/credential-on-chain-status";
import { formatArchiveDateTime } from "@/lib/collections/format-date";
import {
  formatAllocationBasisPoints,
  formatCredentialNumber,
  formatCredentialType,
} from "@/lib/credentials/format-credential-number";
import { isMintedCredential } from "@/lib/credentials/mint-state";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";
import {
  isProductionMintBlocked,
  isSolanaMintingExplicitlyEnabled,
} from "@/lib/solana/config";

type CredentialMetadataProps = {
  credential: CredentialDetail;
};

export function CredentialMetadata({ credential }: CredentialMetadataProps) {
  const minted = isMintedCredential(credential);
  const mintedDate = formatArchiveDateTime(credential.mintedAt);
  const mintingEnabled =
    isSolanaMintingExplicitlyEnabled() && !isProductionMintBlocked();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <CollectionReference
            collectionNumber={credential.collection.collectionNumber}
            name={credential.collection.name}
          />
          <h1 className="type-section mt-4">
            {formatCredentialNumber(credential.credentialNumber)}
          </h1>
          <p className="type-caption mt-3">
            {formatCredentialType(credential.type)}
          </p>
          <div className="mt-5">
            <CredentialMintStateBadge
              mintAddress={credential.mintAddress}
              mintedAt={credential.mintedAt}
            />
          </div>
        </div>
      </div>

      <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
        <h2 className="type-label">Archive record</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="type-label">Credential type</dt>
            <dd className="type-status mt-1">
              {formatCredentialType(credential.type)}
            </dd>
          </div>
          <div>
            <dt className="type-label">Collection</dt>
            <dd className="type-status mt-1">
              <CollectionReference
                collectionNumber={credential.collection.collectionNumber}
                name={credential.collection.name}
              />
            </dd>
          </div>
          <div>
            <dt className="type-label">Contributor</dt>
            <dd className="type-status mt-1">
              {credential.contributor?.displayName ?? "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="type-label">Reward allocation</dt>
            <dd className="type-status mt-1">
              {formatAllocationBasisPoints(credential.allocationBasisPoints)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="type-label">Marketplace royalties</dt>
            <dd className="type-status mt-1">
              Not configured — reward allocation is separate ApingX business
              metadata and is not mapped to NFT royalties.
            </dd>
          </div>
          {mintedDate ? (
            <div>
              <dt className="type-label">Minted</dt>
              <dd className="type-status mt-1">{mintedDate}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {minted && credential.mintAddress ? (
        <CredentialOnChainStatus
          mintAddress={credential.mintAddress}
          credentialNumber={credential.credentialNumber}
          cachedOwnerWallet={credential.currentOwnerWallet}
        />
      ) : (
        <CredentialMintForm
          credentialId={credential.id}
          credentialNumber={credential.credentialNumber}
          credentialType={credential.type}
          collectionNumber={credential.collection.collectionNumber}
          collectionName={credential.collection.name}
          suggestedWallet={credential.contributor?.walletAddress ?? null}
          mintingEnabled={mintingEnabled}
        />
      )}

      <Link
        href="/admin/credentials"
        className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        Back to Credentials
      </Link>
    </div>
  );
}
