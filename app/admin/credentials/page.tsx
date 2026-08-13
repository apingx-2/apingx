import { CredentialArchiveCard } from "@/components/credentials/credential-archive-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { getCredentials } from "@/lib/credentials/get-credentials";

export const dynamic = "force-dynamic";

export default async function AdminCredentialsPage() {
  const result = await getCredentials();

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Credentials"
        description="Archive overview of Credentials and their on-chain provenance state. Each Credential belongs to exactly one Collection."
      />

      {result.status === "unavailable" ? (
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          Credential records are unavailable. The archive will appear once the
          database connection is configured.
        </p>
      ) : null}

      {result.status === "success" && result.credentials.length === 0 ? (
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          No Credentials are recorded in the archive yet.
        </p>
      ) : null}

      {result.status === "success" && result.credentials.length > 0 ? (
        <section
          aria-label="Credential archive"
          className="grid gap-4 xl:grid-cols-2"
        >
          {result.credentials.map((credential) => (
            <CredentialArchiveCard key={credential.id} credential={credential} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
