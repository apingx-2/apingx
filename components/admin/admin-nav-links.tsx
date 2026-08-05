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
  "aria-labelledby"?: string;
};

export function AdminNavLinks({
  onNavigate,
  className = "",
  "aria-labelledby": ariaLabelledBy,
}: AdminNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabelledBy ? undefined : "Admin"}
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      <ul className="flex flex-col gap-0.5">
        {adminNavItems.map((item) => {
          const isActive = isAdminNavActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group focus-ring block rounded-sm border px-3 py-2.5 transition-colors",
                  isActive
                    ? "border-[var(--border-strong)] bg-[var(--surface-4)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <span className="type-label block text-[var(--text-primary)]">
                  {item.label}
                </span>
                <span className="type-status mt-1.5 block group-hover:text-[var(--text-secondary)]">
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
