import type { CollectionStatus } from "@prisma/client";

const STATUS_COPY: Record<
  CollectionStatus,
  { label: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    description: "Not yet published",
  },
  PUBLISHED: {
    label: "Published",
    description: "Published to the archive",
  },
  ARCHIVED: {
    label: "Archived",
    description: "Retained in the historical record",
  },
};

type CollectionStatusBadgeProps = {
  status: CollectionStatus;
  className?: string;
};

export function CollectionStatusBadge({
  status,
  className = "",
}: CollectionStatusBadgeProps) {
  const copy = STATUS_COPY[status];

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-sm border border-[var(--border-default)] px-2.5 py-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="type-label text-[var(--text-primary)]">{copy.label}</span>
      <span className="type-status hidden sm:inline">{copy.description}</span>
      <span className="sr-only">{copy.description}</span>
    </span>
  );
}
