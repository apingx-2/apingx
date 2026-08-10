import Image from "next/image";
import Link from "next/link";
import { CollectionStatusBadge } from "@/components/collections/collection-status-badge";
import {
  formatArchiveDate,
  formatArchiveDateTime,
} from "@/lib/collections/format-date";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import type { CollectionDetail } from "@/lib/collections/get-collection-by-id";

type CollectionMetadataProps = {
  collection: CollectionDetail;
};

export function CollectionMetadata({ collection }: CollectionMetadataProps) {
  const launchDate = formatArchiveDate(collection.launchDate);
  const createdDate = formatArchiveDateTime(collection.createdAt);
  const updatedDate = formatArchiveDateTime(collection.updatedAt);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="type-archive-id">
            {formatCollectionNumber(collection.collectionNumber)}
          </p>
          <h1 className="type-section mt-4">{collection.name}</h1>
          {collection.subtitle ? (
            <p className="type-caption mt-3">{collection.subtitle}</p>
          ) : null}
          <div className="mt-5">
            <CollectionStatusBadge status={collection.status} />
          </div>
        </div>

        <Link
          href={`/admin/collections/${collection.id}/edit`}
          className="focus-ring type-label inline-flex shrink-0 rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          Edit Collection
        </Link>
      </div>

      {collection.coverImageUrl ? (
        <div className="relative aspect-[16/9] max-w-3xl overflow-hidden rounded-sm border border-[var(--border-default)] bg-[var(--surface-2)]">
          <Image
            src={collection.coverImageUrl}
            alt={`${collection.name} cover`}
            fill
            unoptimized
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      ) : null}

      <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
        <h2 className="type-label">Story</h2>
        <p className="type-body mt-4 whitespace-pre-wrap">{collection.story}</p>
      </section>

      <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
        <h2 className="type-label">Archive metadata</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="type-label">Slug</dt>
            <dd className="type-status mt-1">{collection.slug}</dd>
          </div>
          {launchDate ? (
            <div>
              <dt className="type-label">Launch date</dt>
              <dd className="type-status mt-1">{launchDate}</dd>
            </div>
          ) : null}
          <div>
            <dt className="type-label">Products</dt>
            <dd className="type-status mt-1">
              {collection.productCount.toLocaleString("en-GB")}
            </dd>
          </div>
          <div>
            <dt className="type-label">Credentials</dt>
            <dd className="type-status mt-1">
              {collection.credentialCount.toLocaleString("en-GB")}
            </dd>
          </div>
          {createdDate ? (
            <div>
              <dt className="type-label">Created</dt>
              <dd className="type-status mt-1">{createdDate}</dd>
            </div>
          ) : null}
          {updatedDate ? (
            <div>
              <dt className="type-label">Last updated</dt>
              <dd className="type-status mt-1">{updatedDate}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
