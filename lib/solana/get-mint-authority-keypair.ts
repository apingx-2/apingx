import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

function parseSecretKey(rawValue: string): Uint8Array {
  const value = rawValue.trim();

  if (value.startsWith("[")) {
    const parsed = JSON.parse(value) as number[];

    if (
      !Array.isArray(parsed) ||
      parsed.length !== 64 ||
      parsed.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
    ) {
      throw new Error("Invalid mint authority secret key format");
    }

    return Uint8Array.from(parsed);
  }

  const decoded = bs58.decode(value);

  if (decoded.length !== 64) {
    throw new Error("Invalid mint authority secret key format");
  }

  return decoded;
}

export function getMintAuthorityKeypair(): Keypair | null {
  const secretKeyValue = process.env.SOLANA_MINT_AUTHORITY_SECRET_KEY?.trim();

  if (!secretKeyValue) {
    return null;
  }

  try {
    return Keypair.fromSecretKey(parseSecretKey(secretKeyValue));
  } catch {
    return null;
  }
}
