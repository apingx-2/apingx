import Link from "next/link";
import { CollectionReference } from "@/components/products/collection-reference";
import { CredentialMintStateBadge } from "@/components/credentials/credential-mint-state-badge";
import { formatArchiveDateTime } from "@/lib/collections/format-date";
import {
  formatAllocationBasisPoints,
  formatCredentialNumber,
  formatCredentialType,
} from "@/lib/credentials/format-credential-number";
import type { CredentialListItem } from "@/lib/credentials/get-credentials";

type CredentialArchiveCardProps = {
  credential: CredentialListItem;
};

export function CredentialArchiveCard({
  credential,
}: CredentialArchiveCardProps) {
  const mintedDate = formatArchiveDateTime(credential.mintedAt);

  return (
    <article className="surface-card group rounded-sm transition-colors">
      <Link
        href={`/admin/credentials/${credential.id}`}
        className="focus-ring block rounded-sm p-5 md:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="type-archive-id">
            {formatCredentialNumber(credential.credentialNumber)}
          </p>
          <CredentialMintStateBadge
            mintAddress={credential.mintAddress}
            mintedAt={credential.mintedAt}
          />
        </div>

        <p className="type-caption mt-3">
          {formatCredentialType(credential.type)}
        </p>

        <div className="mt-4">
          <CollectionReference
            collectionNumber={credential.collection.collectionNumber}
            name={credential.collection.name}
          />
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
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
          {credential.mintAddress ? (
            <div className="sm:col-span-2">
              <dt className="type-label">Mint address</dt>
              <dd className="type-status mt-1 break-all">
                {credential.mintAddress}
              </dd>
            </div>
          ) : null}
          {credential.currentOwnerWallet ? (
            <div className="sm:col-span-2">
              <dt className="type-label">Cached owner</dt>
              <dd className="type-status mt-1 break-all">
                {credential.currentOwnerWallet}
              </dd>
            </div>
          ) : null}
          {mintedDate ? (
            <div>
              <dt className="type-label">Minted</dt>
              <dd className="type-status mt-1">{mintedDate}</dd>
            </div>
          ) : null}
        </dl>
      </Link>
    </article>
  );
}
