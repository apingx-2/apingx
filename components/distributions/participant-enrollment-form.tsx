"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { enrollParticipantAction } from "@/lib/distribution/actions";
import { enrollParticipantSchema } from "@/lib/distribution/schemas";
import type {
  EnrollmentContributorOption,
  EnrollmentCredentialOption,
} from "@/lib/distribution/get-enrollment-options";

type ParticipantEnrollmentFormProps = {
  contributionPeriodId: string;
  contributors: EnrollmentContributorOption[];
  credentials: EnrollmentCredentialOption[];
  enrolledCredentialIds: string[];
  disabled?: boolean;
};

export function ParticipantEnrollmentForm({
  contributionPeriodId,
  contributors,
  credentials,
  enrolledCredentialIds,
  disabled = false,
}: ParticipantEnrollmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [contributorId, setContributorId] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [agreementReference, setAgreementReference] = useState("");

  const availableCredentials = useMemo(() => {
    return credentials.filter(
      (credential) =>
        credential.contributorId === contributorId &&
        !enrolledCredentialIds.includes(credential.id),
    );
  }, [credentials, contributorId, enrolledCredentialIds]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const parsed = enrollParticipantSchema.safeParse({
        contributionPeriodId,
        contributorId,
        credentialId,
        agreementReference,
      });

      if (!parsed.success) {
        setFormError(
          "Please review the enrollment details and correct the highlighted fields.",
        );
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await enrollParticipantAction(parsed.data);

      if (!result.success) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setContributorId("");
      setCredentialId("");
      setAgreementReference("");
      router.refresh();
    });
  }

  if (disabled) {
    return (
      <p className="type-body text-[var(--text-secondary)]">
        Participant enrollment is unavailable while the period is closed.
      </p>
    );
  }

  if (contributors.length === 0) {
    return (
      <p className="type-body text-[var(--text-secondary)]">
        No Contributor Credentials are available for this Collection. Assign
        Contributor Credentials before enrolling participants.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <p role="alert" className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3">
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="contributorId" className="type-label">
          Contributor
        </label>
        <select
          id="contributorId"
          value={contributorId}
          disabled={isPending}
          onChange={(event) => {
            setContributorId(event.target.value);
            setCredentialId("");
          }}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        >
          <option value="">Select a Contributor</option>
          {contributors.map((contributor) => (
            <option key={contributor.id} value={contributor.id}>
              {contributor.displayName}
            </option>
          ))}
        </select>
        {fieldErrors.contributorId?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.contributorId[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="credentialId" className="type-label">
          Credential allocation reference
        </label>
        <select
          id="credentialId"
          value={credentialId}
          disabled={isPending || !contributorId}
          onChange={(event) => setCredentialId(event.target.value)}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        >
          <option value="">Select a Credential</option>
          {availableCredentials.map((credential) => (
            <option key={credential.id} value={credential.id}>
              {credential.label}
            </option>
          ))}
        </select>
        <p className="type-status text-[var(--text-secondary)]">
          The Credential records allocation and provenance. The Contributor is the
          compensated party.
        </p>
        {fieldErrors.credentialId?.[0] ? (
          <p className="type-status text-[var(--text-secondary)]">
            {fieldErrors.credentialId[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="agreementReference" className="type-label">
          Agreement reference (optional)
        </label>
        <input
          id="agreementReference"
          type="text"
          value={agreementReference}
          disabled={isPending}
          onChange={(event) => setAgreementReference(event.target.value)}
          className="focus-ring type-body w-full rounded-sm border border-[var(--border-default)] bg-transparent px-3 py-2.5"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-60"
      >
        Enroll participant
      </button>
    </form>
  );
}
