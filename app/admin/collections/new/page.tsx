import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { CollectionForm } from "@/components/collections/collection-form";

export default function NewCollectionPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        <AdminHeader
          title="New Collection"
          description="Prepare a new catalogue entry for the archive. Collections remain in draft until explicitly published."
        />
        <Link
          href="/admin/collections"
          className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
        >
          Back to Collections
        </Link>
      </div>

      <CollectionForm mode="create" />
    </div>
  );
}
