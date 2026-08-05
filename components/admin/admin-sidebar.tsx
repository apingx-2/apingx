import { AdminBrandBlock } from "@/components/admin/admin-brand-block";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

export function AdminSidebar() {
  return (
    <aside className="surface-navigation hidden w-72 shrink-0 border-r lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-6 pb-8 pt-5">
        <AdminBrandBlock />

        <div className="flex-1 overflow-y-auto pb-6">
          <AdminNavLinks aria-labelledby="admin-navigation-label" />
        </div>

        <p className="type-status border-t border-[var(--border-subtle)] pt-5">
          Internal publishing interface for limited-edition collections.
        </p>
      </div>
    </aside>
  );
}
