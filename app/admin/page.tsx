import { AdminHeader } from "@/components/admin/admin-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { getOverviewCounts } from "@/lib/admin/get-overview-counts";

export const dynamic = "force-dynamic";

function getCountLabel(
  entity: "collections" | "products" | "contributors" | "credentials",
  count: number,
): string {
  const labels = {
    collections: {
      zero: "No collections published yet",
      one: "Collection in the archive",
      many: "Collections in the archive",
    },
    products: {
      zero: "No products listed yet",
      one: "Product across collections",
      many: "Products across collections",
    },
    contributors: {
      zero: "No contributors recognised yet",
      one: "Contributor recognised",
      many: "Contributors recognised",
    },
    credentials: {
      zero: "No Credentials issued yet",
      one: "Credential issued",
      many: "Credentials issued",
    },
  } as const;

  const copy = labels[entity];

  if (count === 0) {
    return copy.zero;
  }

  if (count === 1) {
    return copy.one;
  }

  return copy.many;
}

export default async function AdminOverviewPage() {
  const overview = await getOverviewCounts();
  const counts =
    overview.status === "success" ? overview.counts : null;
  const unavailableLabel = "Database not connected";

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Overview"
        description="Manage the collections, products, contributors and Credentials that make up the ApingX Archive."
      />

      {counts === null ? (
        <p
          role="status"
          className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text-secondary)]"
        >
          Database counts are unavailable. Summary cards will update once a
          connection is configured.
        </p>
      ) : null}

      <section
        aria-label="Archive summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          title="Collections"
          href="/admin/collections"
          count={counts?.collections ?? null}
          label={
            counts
              ? getCountLabel("collections", counts.collections)
              : unavailableLabel
          }
          unavailableLabel={unavailableLabel}
        />
        <SummaryCard
          title="Products"
          href="/admin/products"
          count={counts?.products ?? null}
          label={
            counts
              ? getCountLabel("products", counts.products)
              : unavailableLabel
          }
          unavailableLabel={unavailableLabel}
        />
        <SummaryCard
          title="Contributors"
          href="/admin/contributors"
          count={counts?.contributors ?? null}
          label={
            counts
              ? getCountLabel("contributors", counts.contributors)
              : unavailableLabel
          }
          unavailableLabel={unavailableLabel}
        />
        <SummaryCard
          title="Credentials"
          href="/admin/credentials"
          count={counts?.credentials ?? null}
          label={
            counts
              ? getCountLabel("credentials", counts.credentials)
              : unavailableLabel
          }
          unavailableLabel={unavailableLabel}
        />
      </section>
    </div>
  );
}
