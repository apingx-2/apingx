import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionMetadata } from "@/components/collections/collection-metadata";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { getCollectionById } from "@/lib/collections/get-collection-by-id";

export const dynamic = "force-dynamic";

type CollectionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { id } = await params;
  const result = await getCollectionById(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          This Collection record is unavailable. Try again once the archive
          database connection is configured.
        </p>
        <Link
          href="/admin/collections"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Collections
        </Link>
      </div>
    );
  }

  const { collection } = result;

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">
          Archive / Collections /{" "}
          {formatCollectionNumber(collection.collectionNumber)}
        </p>
        <Link
          href="/admin/collections"
          className="focus-ring type-label mt-6 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Collections
        </Link>
      </div>

      <CollectionMetadata collection={collection} />
    </div>
  );
}
