"use client";

import { useState } from "react";

type CopyableAddressProps = {
  value: string;
  label: string;
};

export function CopyableAddress({ value, label }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="type-label">{label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <code className="type-status block min-w-0 flex-1 break-all rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="focus-ring type-label shrink-0 rounded-sm border border-[var(--border-default)] px-3 py-2 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {copied ? (
        <p role="status" className="type-metadata">
          Address copied to clipboard.
        </p>
      ) : null}
    </div>
  );
}
