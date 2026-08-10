import Link from "next/link";

export default function ProductNotFoundPage() {
  return (
    <div className="space-y-8">
      <section className="surface-panel rounded-sm border px-5 py-8 md:px-6">
        <p className="type-archive-id">Archive record</p>
        <h1 className="type-section mt-4">Product not found</h1>
        <p className="type-body mt-4 max-w-2xl">
          This Product record could not be located within the archive.
        </p>
        <Link
          href="/admin/products"
          className="focus-ring type-label mt-8 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Return to Products
        </Link>
      </section>
    </div>
  );
}
