import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/products/product-form";
import { getCollectionOptions } from "@/lib/products/get-collection-options";
import { getProductById } from "@/lib/products/get-product-by-id";
import { productToFormValues } from "@/lib/products/product-to-form-values";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const [productResult, collectionsResult] = await Promise.all([
    getProductById(id),
    getCollectionOptions(),
  ]);

  if (productResult.status === "not_found") {
    notFound();
  }

  if (
    productResult.status === "unavailable" ||
    collectionsResult.status === "unavailable"
  ) {
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

  const { product } = productResult;

  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        <AdminHeader
          title={`Edit ${product.name}`}
          description="Revise the catalogue record while preserving the Product as a permanent archive object."
        />
        <Link
          href={`/admin/products/${product.id}`}
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Product record
        </Link>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        initialValues={productToFormValues(product)}
        collectionOptions={collectionsResult.collections}
      />
    </div>
  );
}
