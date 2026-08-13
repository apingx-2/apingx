export type SolanaCluster = "devnet";

const DEVNET_RPC_HOST_PATTERNS = [
  "devnet",
  "api.devnet.solana.com",
  "rpc.ankr.com/solana_devnet",
];

const MAINNET_RPC_HOST_PATTERNS = [
  "mainnet",
  "api.mainnet-beta.solana.com",
  "rpc.ankr.com/solana",
];

export type SolanaConfigError =
  | "cluster_missing"
  | "cluster_unsupported"
  | "rpc_missing"
  | "rpc_mainnet"
  | "rpc_inconsistent"
  | "mint_authority_missing"
  | "minting_disabled"
  | "production_mint_blocked";

export type SolanaConfigResult =
  | {
      ok: true;
      cluster: SolanaCluster;
      rpcUrl: string;
      mintingEnabled: boolean;
    }
  | {
      ok: false;
      error: SolanaConfigError;
    };

function normaliseHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function rpcUrlLooksLikeMainnet(rpcUrl: string): boolean {
  const value = rpcUrl.toLowerCase();
  const host = normaliseHost(rpcUrl);

  return MAINNET_RPC_HOST_PATTERNS.some(
    (pattern) => value.includes(pattern) || host.includes(pattern),
  );
}

function rpcUrlLooksLikeDevnet(rpcUrl: string): boolean {
  const value = rpcUrl.toLowerCase();
  const host = normaliseHost(rpcUrl);

  return DEVNET_RPC_HOST_PATTERNS.some(
    (pattern) => value.includes(pattern) || host.includes(pattern),
  );
}

export function isSolanaMintingExplicitlyEnabled(): boolean {
  return process.env.SOLANA_MINTING_ENABLED?.trim().toLowerCase() === "true";
}

export function isProductionMintBlocked(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getSolanaConfig(): SolanaConfigResult {
  const cluster = process.env.SOLANA_CLUSTER?.trim().toLowerCase();
  const rpcUrl = process.env.SOLANA_RPC_URL?.trim();

  if (!cluster) {
    return { ok: false, error: "cluster_missing" };
  }

  if (cluster !== "devnet") {
    return { ok: false, error: "cluster_unsupported" };
  }

  if (!rpcUrl) {
    return { ok: false, error: "rpc_missing" };
  }

  if (rpcUrlLooksLikeMainnet(rpcUrl)) {
    return { ok: false, error: "rpc_mainnet" };
  }

  if (!rpcUrlLooksLikeDevnet(rpcUrl)) {
    return { ok: false, error: "rpc_inconsistent" };
  }

  return {
    ok: true,
    cluster: "devnet",
    rpcUrl,
    mintingEnabled: isSolanaMintingExplicitlyEnabled(),
  };
}

export function getSolanaConfigForMinting(): SolanaConfigResult {
  const config = getSolanaConfig();

  if (!config.ok) {
    return config;
  }

  if (isProductionMintBlocked()) {
    return { ok: false, error: "production_mint_blocked" };
  }

  if (!config.mintingEnabled) {
    return { ok: false, error: "minting_disabled" };
  }

  const mintAuthoritySecret = process.env.SOLANA_MINT_AUTHORITY_SECRET_KEY?.trim();

  if (!mintAuthoritySecret) {
    return { ok: false, error: "mint_authority_missing" };
  }

  return config;
}

export function getSolanaConfigErrorMessage(error: SolanaConfigError): string {
  switch (error) {
    case "cluster_missing":
    case "cluster_unsupported":
    case "rpc_missing":
    case "rpc_mainnet":
    case "rpc_inconsistent":
      return "Solana Devnet is not correctly configured. Minting cannot proceed.";
    case "mint_authority_missing":
      return "Mint authority is not configured. Minting cannot proceed.";
    case "minting_disabled":
      return "Solana minting is not enabled for this environment.";
    case "production_mint_blocked":
      return "Mint execution is disabled in production deployments.";
    default:
      return "Solana minting is unavailable.";
  }
}
