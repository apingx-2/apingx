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
    <article className="surface-card group rounded-sm p-5 transition-colors">
      <p className="type-archive-id">{title}</p>

      <p
        className="admin-metric mt-4"
        aria-label={
          isUnavailable
            ? `${title} count unavailable`
            : `${title} count ${count}`
        }
      >
        {isUnavailable ? "—" : count.toLocaleString("en-GB")}
      </p>

      <p className="type-status mt-3">
        {isUnavailable ? unavailableLabel : label}
      </p>

      <Link
        href={href}
        className="type-label focus-ring mt-6 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        View section
      </Link>
    </article>
  );
}
