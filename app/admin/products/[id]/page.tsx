import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductMetadata } from "@/components/products/product-metadata";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { getProductById } from "@/lib/products/get-product-by-id";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const result = await getProductById(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          This Product record is unavailable. Try again once the archive
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

  const { product } = result;

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">
          Archive / Products / {product.name} /{" "}
          {formatCollectionNumber(product.collection.collectionNumber)}
        </p>
        <Link
          href="/admin/products"
          className="focus-ring type-label mt-6 inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Products
        </Link>
      </div>

      <ProductMetadata product={product} />
    </div>
  );
}
