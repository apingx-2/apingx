"use client";

import { useEffect, useId, useState } from "react";
import { AdminBrandBlock } from "@/components/admin/admin-brand-block";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const navigationLabelId = `${panelId}-navigation-label`;

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
    <div className="surface-navigation border-b lg:hidden">
      <div className="flex items-start justify-between gap-4 px-4 pb-4 pt-3">
        <AdminBrandBlock showNavigationLabel={false} compact />

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={
            isOpen ? "Close admin navigation" : "Open admin navigation"
          }
          onClick={() => setIsOpen((open) => !open)}
          className="surface-interactive focus-ring type-label shrink-0 rounded-sm px-3 py-2 transition-colors"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close admin navigation overlay"
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setIsOpen(false)}
          />
          <div
            id={panelId}
            className="relative z-50 border-t border-[var(--border-subtle)] px-4 py-5"
          >
            <p className="type-label mb-3" id={navigationLabelId}>
              Navigation
            </p>
            <AdminNavLinks
              aria-labelledby={navigationLabelId}
              onNavigate={() => setIsOpen(false)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
