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
    <section className="rounded-md border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-8">
      <h2 className="text-lg font-semibold text-[var(--admin-text-primary)]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--admin-text-secondary)]">
        {description}
      </p>
      <p className="mt-5 text-xs tracking-[0.14em] text-[var(--admin-text-muted)] uppercase">
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
