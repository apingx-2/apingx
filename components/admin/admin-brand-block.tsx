import { ApingXWordmark } from "@/components/brand/apingx-wordmark";

type AdminBrandBlockProps = {
  variant?: "light" | "dark";
  showNavigationLabel?: boolean;
  compact?: boolean;
};

export function AdminBrandBlock({
  variant = "light",
  showNavigationLabel = true,
  compact = false,
}: AdminBrandBlockProps) {
  return (
    <div
      className={[
        "admin-brand-block",
        compact ? "admin-brand-block--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ApingXWordmark variant={variant} />

      <p className="type-caption mt-3">The Living Archive</p>
      <p className="type-metadata mt-0.5">Archive Administration</p>

      <hr className="admin-divider mt-4" aria-hidden="true" />

      {showNavigationLabel ? (
        <p className="type-label mt-6 mb-3" id="admin-navigation-label">
          Navigation
        </p>
      ) : null}
    </div>
  );
}
