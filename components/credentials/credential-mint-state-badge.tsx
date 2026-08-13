type CredentialMintStateBadgeProps = {
  mintAddress: string | null;
  mintedAt: Date | null;
  verificationUnavailable?: boolean;
};

export function CredentialMintStateBadge({
  mintAddress,
  mintedAt,
  verificationUnavailable = false,
}: CredentialMintStateBadgeProps) {
  const isMinted = Boolean(mintAddress || mintedAt);

  const label = !isMinted
    ? "Not Minted"
    : verificationUnavailable
      ? "On-chain verification unavailable"
      : "Minted — Devnet";

  return (
    <span
      className={[
        "type-status inline-flex rounded-sm border px-2.5 py-1",
        isMinted
          ? "border-[var(--border-default)] text-[var(--text-primary)]"
          : "border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)]",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
