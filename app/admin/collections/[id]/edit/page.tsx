import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  CollectionForm,
} from "@/components/collections/collection-form";
import { collectionToFormValues } from "@/lib/collections/collection-to-form-values";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { getCollectionById } from "@/lib/collections/get-collection-by-id";

export const dynamic = "force-dynamic";

type EditCollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const { id } = await params;
  const result = await getCollectionById(id);

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
          This Collection record is unavailable. Try again once the archive
          database connection is configured.
        </p>
        <Link
          href="/admin/collections"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Collections
        </Link>
      </div>
    );
  }

  const { collection } = result;

  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        <AdminHeader
          title={`Edit ${formatCollectionNumber(collection.collectionNumber)}`}
          description="Revise the catalogue record while preserving the Collection as a permanent archive object."
        />
        <Link
          href={`/admin/collections/${collection.id}`}
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Collection record
        </Link>
      </div>

      <CollectionForm
        mode="edit"
        collectionId={collection.id}
        collectionNumber={collection.collectionNumber}
        initialValues={collectionToFormValues(collection)}
      />
    </div>
  );
}
