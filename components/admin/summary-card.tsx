import Link from "next/link";

type SummaryCardProps = {
  title: string;
  href: string;
  label: string;
  count: number | null;
  unavailableLabel?: string;
};

export function SummaryCard({
  title,
  href,
  label,
  count,
  unavailableLabel = "Not available",
}: SummaryCardProps) {
  const isUnavailable = count === null;

  return (
    <article className="admin-summary-card group relative overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 transition-colors hover:border-[var(--admin-border-strong)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--admin-highlight)] to-transparent opacity-70" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--admin-text-muted)] uppercase">
            {title}
          </p>
          <p
            className="mt-3 text-4xl font-bold tracking-tight text-[var(--admin-text-primary)] tabular-nums"
            aria-label={
              isUnavailable
                ? `${title} count unavailable`
                : `${title} count ${count}`
            }
          >
            {isUnavailable ? "—" : count.toLocaleString("en-GB")}
          </p>
          <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">
            {isUnavailable ? unavailableLabel : label}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-[var(--admin-accent)] uppercase transition-colors hover:text-[var(--admin-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-accent)]"
      >
        View section
      </Link>
    </article>
  );
}
