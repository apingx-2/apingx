import Link from "next/link";

export function ProductEmptyState() {
  return (
    <section className="surface-panel rounded-sm border border-dashed px-5 py-10 md:px-8 md:py-12">
      <p className="type-archive-id">Physical archive</p>
      <h2 className="type-collection mt-4">No Products catalogued yet</h2>
      <p className="type-body mt-4 max-w-2xl">
        No physical artefacts have yet been catalogued within the archive. Create
        the first Product record to begin documenting pieces within a Collection.
      </p>
      <Link
        href="/admin/products/new"
        className="focus-ring type-label mt-8 inline-flex rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      >
        Catalogue first Product
      </Link>
    </section>
  );
}
