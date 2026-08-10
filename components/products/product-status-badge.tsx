import type { ProductStatus } from "@prisma/client";

const STATUS_COPY: Record<
  ProductStatus,
  { label: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    description: "Not yet published",
  },
  ACTIVE: {
    label: "Active",
    description: "Available within the archive",
  },
  SOLD_OUT: {
    label: "Sold out",
    description: "No longer available",
  },
  ARCHIVED: {
    label: "Archived",
    description: "Retained in the historical record",
  },
};

type ProductStatusBadgeProps = {
  status: ProductStatus;
  className?: string;
};

export function ProductStatusBadge({
  status,
  className = "",
}: ProductStatusBadgeProps) {
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
