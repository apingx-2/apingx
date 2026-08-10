import Link from "next/link";
import Image from "next/image";
import { CollectionStatusBadge } from "@/components/collections/collection-status-badge";
import { formatArchiveDate } from "@/lib/collections/format-date";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import type { CollectionListItem } from "@/lib/collections/get-collections";

type CollectionArchiveCardProps = {
  collection: CollectionListItem;
};

export function CollectionArchiveCard({
  collection,
}: CollectionArchiveCardProps) {
  const launchDate = formatArchiveDate(collection.launchDate);
  const updatedDate = formatArchiveDate(collection.updatedAt);

  return (
    <article className="surface-card group rounded-sm transition-colors">
      <Link
        href={`/admin/collections/${collection.id}`}
        className="focus-ring block rounded-sm p-5 md:p-6"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
          {collection.coverImageUrl ? (
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-2)] md:w-32">
              <Image
                src={collection.coverImageUrl}
                alt=""
                fill
                unoptimized
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 128px"
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="type-archive-id">
                {formatCollectionNumber(collection.collectionNumber)}
              </p>
              <CollectionStatusBadge status={collection.status} />
            </div>

            <h2 className="type-collection mt-4">{collection.name}</h2>

            {collection.subtitle ? (
              <p className="type-caption mt-2">{collection.subtitle}</p>
            ) : null}

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
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
              {launchDate ? (
                <div>
                  <dt className="type-label">Launch date</dt>
                  <dd className="type-status mt-1">{launchDate}</dd>
                </div>
              ) : null}
              {updatedDate ? (
                <div>
                  <dt className="type-label">Last updated</dt>
                  <dd className="type-status mt-1">{updatedDate}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </Link>
    </article>
  );
}
