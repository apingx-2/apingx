import Link from "next/link";

export default function CredentialNotFound() {
  return (
    <div className="space-y-8">
      <p
        role="status"
        className="surface-panel type-body rounded-sm border px-4 py-3"
      >
        This Credential could not be found in the archive.
      </p>
      <Link
        href="/admin/credentials"
        className="focus-ring type-label inline-flex text-[var(--accent-steel)] transition-colors hover:text-[var(--text-primary)]"
      >
        Back to Credentials
      </Link>
    </div>
  );
}
