import Link from "next/link";
import { ProductArchiveCard } from "@/components/products/product-archive-card";
import { ProductEmptyState } from "@/components/products/product-empty-state";
import { getProducts } from "@/lib/products/get-products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const result = await getProducts();

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="type-metadata">Archive / Products</p>
            <h1 className="type-section mt-4">Products</h1>
            <p className="type-body mt-4 max-w-3xl md:text-[0.9375rem]">
              Catalogue physical fashion artefacts within their parent
              Collections. Each Product remains part of the archive record.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="focus-ring type-label inline-flex shrink-0 rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            New Product
          </Link>
        </div>
      </header>

      {result.status === "unavailable" ? (
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Product records are unavailable. The catalogue will appear once the
          archive database connection is configured.
        </p>
      ) : null}

      {result.status === "success" && result.products.length === 0 ? (
        <ProductEmptyState />
      ) : null}

      {result.status === "success" && result.products.length > 0 ? (
        <section
          aria-label="Product catalogue"
          className="grid gap-4 xl:grid-cols-2"
        >
          {result.products.map((product) => (
            <ProductArchiveCard key={product.id} product={product} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
