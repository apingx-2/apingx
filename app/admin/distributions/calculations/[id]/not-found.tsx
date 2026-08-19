import Link from "next/link";

export default function DistributionCalculationNotFound() {
  return (
    <div className="space-y-8">
      <p className="surface-panel type-body rounded-sm border px-4 py-3">
        This distribution calculation could not be found.
      </p>
      <Link
        href="/admin/distributions"
        className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        Back to Distributions
      </Link>
    </div>
  );
}
