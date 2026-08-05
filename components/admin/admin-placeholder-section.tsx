import { AdminHeader } from "@/components/admin/admin-header";

type AdminPlaceholderSectionProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderSection({
  title,
  description,
}: AdminPlaceholderSectionProps) {
  return (
    <section className="surface-panel rounded-sm border border-dashed px-5 py-8 md:px-6">
      <h2 className="type-collection">{title}</h2>
      <p className="type-body mt-4 max-w-2xl">{description}</p>
      <p className="type-metadata mt-6">
        Management tools will be added in a future task.
      </p>
    </section>
  );
}

export function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderSectionProps) {
  return (
    <div className="space-y-8">
      <AdminHeader title={title} description={description} />
      <AdminPlaceholderSection
        title={`${title} management`}
        description={`This section will host ${title.toLowerCase()} publishing and archive tools. No create, edit or delete functionality is available yet.`}
      />
    </div>
  );
}
