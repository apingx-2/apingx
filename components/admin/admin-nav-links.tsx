"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  adminNavItems,
  isAdminNavActive,
} from "@/lib/admin/navigation";

type AdminNavLinksProps = {
  onNavigate?: () => void;
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
};

export function AdminNavLinks({
  onNavigate,
  className = "",
  linkClassName = "",
  activeLinkClassName = "",
}: AdminNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className={className}>
      <ul className="flex flex-col gap-1">
        {adminNavItems.map((item) => {
          const isActive = isAdminNavActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group block rounded-sm border px-3 py-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-accent)]",
                  isActive
                    ? `border-[var(--admin-border-strong)] bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)] ${activeLinkClassName}`
                    : `border-transparent text-[var(--admin-text-secondary)] hover:border-[var(--admin-border)] hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text-primary)] ${linkClassName}`,
                ].join(" ")}
              >
                <span className="block text-xs font-semibold tracking-[0.18em] uppercase">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-secondary)]">
                  {item.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
