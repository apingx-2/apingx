import Link from "next/link";
import { CollectionArchiveCard } from "@/components/collections/collection-archive-card";
import { CollectionEmptyState } from "@/components/collections/collection-empty-state";
import { getCollections } from "@/lib/collections/get-collections";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const result = await getCollections();

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="type-metadata">Archive / Collections</p>
            <h1 className="type-section mt-4">Collections</h1>
            <p className="type-body mt-4 max-w-3xl md:text-[0.9375rem]">
              Publish and archive limited-edition fashion collections. Each
              collection is the primary object in the ApingX Archive.
            </p>
          </div>
          <Link
            href="/admin/collections/new"
            className="focus-ring type-label inline-flex shrink-0 rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            New Collection
          </Link>
        </div>
      </header>

      {result.status === "unavailable" ? (
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Collection records are unavailable. The catalogue will appear once the
          archive database connection is configured.
        </p>
      ) : null}

      {result.status === "success" && result.collections.length === 0 ? (
        <CollectionEmptyState />
      ) : null}

      {result.status === "success" && result.collections.length > 0 ? (
        <section
          aria-label="Collection catalogue"
          className="grid gap-4 xl:grid-cols-2"
        >
          {result.collections.map((collection) => (
            <CollectionArchiveCard
              key={collection.id}
              collection={collection}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
