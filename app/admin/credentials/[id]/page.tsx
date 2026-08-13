import Link from "next/link";
import { notFound } from "next/navigation";
import { CredentialMetadata } from "@/components/credentials/credential-metadata";
import { formatCredentialNumber } from "@/lib/credentials/format-credential-number";
import { getCredentialById } from "@/lib/credentials/get-credential-by-id";

export const dynamic = "force-dynamic";

type CredentialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CredentialDetailPage({
  params,
}: CredentialDetailPageProps) {
  const { id } = await params;
  const result = await getCredentialById(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <div className="space-y-8">
        <p
          role="status"
          className="surface-panel type-body rounded-sm border px-4 py-3"
        >
          This Credential record is unavailable. Try again once the archive
          database connection is configured.
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

  const { credential } = result;

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border-subtle)] pb-8">
        <p className="type-metadata">
          Archive / Credentials /{" "}
          {formatCredentialNumber(credential.credentialNumber)}
        </p>
      </div>

      <CredentialMetadata credential={credential} />
    </div>
  );
}
