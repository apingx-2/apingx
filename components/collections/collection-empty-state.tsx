import Link from "next/link";

export function CollectionEmptyState() {
  return (
    <section className="surface-panel rounded-sm border border-dashed px-5 py-10 md:px-8 md:py-12">
      <p className="type-archive-id">Archive catalogue</p>
      <h2 className="type-collection mt-4">No Collection records yet</h2>
      <p className="type-body mt-4 max-w-2xl">
        The archive does not yet contain any published Collection records. Create
        the first Collection entry to begin curating the ApingX catalogue.
      </p>
      <Link
        href="/admin/collections/new"
        className="focus-ring type-label mt-8 inline-flex rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      >
        Create first Collection
      </Link>
    </section>
  );
}
