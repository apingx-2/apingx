export function getAppUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  return configuredUrl.replace(/\/$/, "");
}
