import Link from "next/link";

export default function ContributionPeriodNotFound() {
  return (
    <div className="space-y-8">
      <p className="type-body">
        This Contribution Period could not be found in the archive.
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
