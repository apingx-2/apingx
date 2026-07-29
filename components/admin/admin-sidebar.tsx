import { AdminNavLinks } from "@/components/admin/admin-nav-links";

export function AdminSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--admin-border)] bg-[var(--admin-shell)] lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        <div className="border-b border-[var(--admin-border)] pb-6">
          <p className="text-lg font-bold tracking-[0.24em] text-[var(--admin-text-primary)] uppercase">
            ApingX
          </p>
          <p className="mt-2 text-xs tracking-[0.16em] text-[var(--admin-text-muted)] uppercase">
            Archive Administration
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <AdminNavLinks />
        </div>

        <p className="border-t border-[var(--admin-border)] pt-4 text-[11px] leading-relaxed text-[var(--admin-text-muted)]">
          Internal publishing interface for limited-edition collections.
        </p>
      </div>
    </aside>
  );
}
