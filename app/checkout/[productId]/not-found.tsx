import Link from "next/link";

export default function CheckoutProductNotFoundPage() {
  return (
    <section className="surface-panel rounded-sm border px-5 py-8 md:px-6">
      <p className="type-archive-id">Checkout</p>
      <h1 className="type-section mt-4">Piece not found</h1>
      <p className="type-body mt-4 max-w-xl">
        This piece could not be located within the archive.
      </p>
      <Link
        href="/"
        className="focus-ring type-label mt-8 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        Return home
      </Link>
    </section>
  );
}
