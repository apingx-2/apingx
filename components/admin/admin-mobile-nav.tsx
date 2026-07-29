"use client";

import { useEffect, useId, useState } from "react";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="border-b border-[var(--admin-border)] bg-[var(--admin-shell)] lg:hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-base font-bold tracking-[0.22em] text-[var(--admin-text-primary)] uppercase">
            ApingX
          </p>
          <p className="mt-1 text-[11px] tracking-[0.14em] text-[var(--admin-text-muted)] uppercase">
            Archive Administration
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={isOpen ? "Close admin navigation" : "Open admin navigation"}
          onClick={() => setIsOpen((open) => !open)}
          className="rounded-sm border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold tracking-[0.16em] text-[var(--admin-text-primary)] uppercase transition-colors hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-accent)]"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close admin navigation overlay"
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          <div
            id={panelId}
            className="relative z-50 border-t border-[var(--admin-border)] bg-[var(--admin-shell)] px-4 py-4"
          >
            <AdminNavLinks onNavigate={() => setIsOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
