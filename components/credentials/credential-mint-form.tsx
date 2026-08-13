"use client";

import { useState, useTransition } from "react";
import { mintCredentialAction } from "@/lib/credentials/actions";
import {
  formatCredentialNumber,
  formatCredentialType,
} from "@/lib/credentials/format-credential-number";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import { getDevnetExplorerTransactionUrl } from "@/lib/solana/get-explorer-url";

type CredentialMintFormProps = {
  credentialId: string;
  credentialNumber: number;
  credentialType: "FOUNDER" | "CONTRIBUTOR";
  collectionNumber: number;
  collectionName: string;
  suggestedWallet: string | null;
  mintingEnabled: boolean;
};

export function CredentialMintForm({
  credentialId,
  credentialNumber,
  credentialType,
  collectionNumber,
  collectionName,
  suggestedWallet,
  mintingEnabled,
}: CredentialMintFormProps) {
  const [recipientWallet, setRecipientWallet] = useState(suggestedWallet ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconciliation, setReconciliation] = useState<{
    mintAddress: string;
    transactionSignature: string;
    message: string;
  } | null>(null);
  const [success, setSuccess] = useState<{
    mintAddress: string;
    transactionSignature: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setReconciliation(null);
    setSuccess(null);

    if (!confirmed) {
      setError("Confirm the Devnet mint details before proceeding.");
      return;
    }

    startTransition(async () => {
      const result = await mintCredentialAction(credentialId, recipientWallet);

      if (result.success) {
        setSuccess({
          mintAddress: result.mintAddress,
          transactionSignature: result.transactionSignature,
        });
        return;
      }

      if (result.reconciliation) {
        setReconciliation({
          mintAddress: result.mintAddress,
          transactionSignature: result.transactionSignature,
          message: result.error,
        });
        return;
      }

      setError(result.error);
    });
  }

  if (success) {
    return (
      <section
        aria-live="polite"
        className="surface-panel rounded-sm border px-5 py-6 md:px-6"
      >
        <h2 className="type-label">Credential registered on Solana Devnet</h2>
        <p className="type-body mt-4">
          The archive record has been associated with a confirmed on-chain asset.
        </p>
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="type-label">Mint address</dt>
            <dd className="type-status mt-1 break-all">{success.mintAddress}</dd>
          </div>
          <div>
            <dt className="type-label">Transaction</dt>
            <dd className="type-status mt-1 break-all">
              <a
                href={getDevnetExplorerTransactionUrl(success.transactionSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-[var(--accent-steel)] underline-offset-2 hover:underline"
              >
                View on Solana Explorer (Devnet)
              </a>
            </dd>
          </div>
        </dl>
      </section>
    );
  }

  if (reconciliation) {
    return (
      <section
        role="alert"
        className="surface-panel rounded-sm border border-[var(--border-strong)] px-5 py-6 md:px-6"
      >
        <h2 className="type-label">Manual reconciliation required</h2>
        <p className="type-body mt-4">{reconciliation.message}</p>
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="type-label">Mint address</dt>
            <dd className="type-status mt-1 break-all">
              {reconciliation.mintAddress}
            </dd>
          </div>
          <div>
            <dt className="type-label">Transaction</dt>
            <dd className="type-status mt-1 break-all">
              <a
                href={getDevnetExplorerTransactionUrl(
                  reconciliation.transactionSignature,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-[var(--accent-steel)] underline-offset-2 hover:underline"
              >
                View on Solana Explorer (Devnet)
              </a>
            </dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="surface-panel rounded-sm border px-5 py-6 md:px-6">
      <h2 className="type-label">Register on Solana Devnet</h2>
      <p className="type-body mt-4 max-w-3xl">
        Minting creates an irreversible on-chain provenance record for this
        Credential. Review the recipient wallet carefully before proceeding.
      </p>

      {!mintingEnabled ? (
        <p role="status" className="type-body mt-5 rounded-sm border px-4 py-3">
          Devnet minting is not enabled in this environment. Credential data
          remains available for review.
        </p>
      ) : null}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="recipient-wallet" className="type-label">
            Recipient wallet address
          </label>
          <input
            id="recipient-wallet"
            name="recipientWallet"
            type="text"
            value={recipientWallet}
            onChange={(event) => setRecipientWallet(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={isPending || !mintingEnabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "mint-form-error" : "mint-form-help"}
            className="type-body mt-2 w-full rounded-sm border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 outline-none focus:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Solana public wallet address"
          />
          <p id="mint-form-help" className="type-metadata mt-2">
            {suggestedWallet
              ? "Prefilled from the Contributor record. You may enter a different recipient public key."
              : "Enter the recipient Solana public wallet address."}
          </p>
        </div>

        <div className="rounded-sm border border-[var(--border-subtle)] px-4 py-4">
          <h3 className="type-label">Mint confirmation</h3>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="type-metadata">Credential</dt>
              <dd className="type-status mt-1">
                {formatCredentialNumber(credentialNumber)} —{" "}
                {formatCredentialType(credentialType)}
              </dd>
            </div>
            <div>
              <dt className="type-metadata">Collection</dt>
              <dd className="type-status mt-1">
                {formatCollectionNumber(collectionNumber)} — {collectionName}
              </dd>
            </div>
            <div>
              <dt className="type-metadata">Recipient wallet</dt>
              <dd className="type-status mt-1 break-all">
                {recipientWallet.trim() || "Not entered"}
              </dd>
            </div>
            <div>
              <dt className="type-metadata">Network</dt>
              <dd className="type-status mt-1">DEVNET</dd>
            </div>
          </dl>

          <label className="mt-5 flex items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={isPending || !mintingEnabled}
              className="mt-1"
            />
            <span className="type-body">
              I confirm this action will create an on-chain Credential asset on
              Solana Devnet.
            </span>
          </label>
        </div>

        {error ? (
          <p
            id="mint-form-error"
            role="alert"
            className="type-body rounded-sm border border-[var(--border-strong)] px-4 py-3"
          >
            {error}
          </p>
        ) : null}

        {isPending ? (
          <p role="status" className="type-body">
            Registering Credential on Solana…
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !mintingEnabled}
          aria-busy={isPending}
          className="focus-ring type-label rounded-sm border border-[var(--border-strong)] px-4 py-3 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-4)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Registering Credential on Solana…"
            : "Create on-chain Credential (Devnet)"}
        </button>
      </form>
    </section>
  );
}
