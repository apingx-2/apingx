import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/products/product-form";
import { getCollectionOptions } from "@/lib/products/get-collection-options";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const collectionsResult = await getCollectionOptions();

  if (collectionsResult.status === "unavailable") {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Collection records are unavailable. Try again once the archive
          database connection is configured.
        </p>
        <Link
          href="/admin/products"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  if (collectionsResult.collections.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
          <AdminHeader
            title="New Product"
            description="Catalogue a physical artefact within an existing Collection."
          />
          <Link
            href="/admin/products"
            className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
          >
            Back to Products
          </Link>
        </div>
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          A Collection must exist before a Product can be catalogued. Create a
          Collection first.
        </p>
        <Link
          href="/admin/collections/new"
          className="focus-ring type-label inline-flex rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          Create Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        <AdminHeader
          title="New Product"
          description="Catalogue a physical artefact within an existing Collection. Products remain in draft until explicitly activated."
        />
        <Link
          href="/admin/products"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Products
        </Link>
      </div>

      <ProductForm
        mode="create"
        collectionOptions={collectionsResult.collections}
      />
    </div>
  );
}
