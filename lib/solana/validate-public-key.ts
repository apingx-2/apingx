import { PublicKey } from "@solana/web3.js";

export function isValidSolanaPublicKey(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    const publicKey = new PublicKey(trimmed);

    return PublicKey.isOnCurve(publicKey.toBytes());
  } catch {
    return false;
  }
}

export function parseSolanaPublicKey(value: string): PublicKey | null {
  if (!isValidSolanaPublicKey(value)) {
    return null;
  }

  return new PublicKey(value.trim());
}

export function normaliseSolanaPublicKey(value: string): string {
  const publicKey = parseSolanaPublicKey(value);

  if (!publicKey) {
    throw new Error("Invalid Solana public key");
  }

  return publicKey.toBase58();
}
