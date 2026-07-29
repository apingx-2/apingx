import type { Metadata } from "next";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: "Admin | ApingX",
  description: "Archive administration for ApingX collections.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-theme min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)]">
      <AdminMobileNav />
      <div className="lg:flex">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
