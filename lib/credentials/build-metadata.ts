import { getAppUrl } from "@/lib/checkout/get-app-url";
import {
  formatCredentialNumber,
  formatCredentialType,
} from "@/lib/credentials/format-credential-number";
import { formatCollectionNumber } from "@/lib/collections/format-collection-number";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";

export type CredentialMetadataJson = {
  name: string;
  symbol: string;
  description: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
};

export function buildCredentialMetadataName(
  credentialNumber: number,
): string {
  return `ApingX Credential ${String(credentialNumber).padStart(3, "0")}`;
}

export function buildCredentialMetadata(
  credential: CredentialDetail,
): CredentialMetadataJson {
  const collectionLabel = formatCollectionNumber(
    credential.collection.collectionNumber,
  );
  const credentialLabel = formatCredentialNumber(credential.credentialNumber);
  const appUrl = getAppUrl();

  const attributes: CredentialMetadataJson["attributes"] = [
    {
      trait_type: "Credential Number",
      value: credentialLabel,
    },
    {
      trait_type: "Credential Type",
      value: formatCredentialType(credential.type),
    },
    {
      trait_type: "Collection Number",
      value: collectionLabel,
    },
    {
      trait_type: "Collection Name",
      value: credential.collection.name,
    },
  ];

  if (credential.contributor?.displayName) {
    attributes.push({
      trait_type: "Contributor",
      value: credential.contributor.displayName,
    });
  }

  return {
    name: buildCredentialMetadataName(credential.credentialNumber),
    symbol: "APXCR",
    description: `${credentialLabel} records participation and provenance within ${collectionLabel} — ${credential.collection.name}. This archive object represents recognised participation within the ApingX collection record.`,
    ...(appUrl
      ? {
          external_url: `${appUrl}/admin/credentials/${credential.id}`,
        }
      : {}),
    attributes,
  };
}

export function getCredentialMetadataUri(credentialId: string): string | null {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return null;
  }

  return `${appUrl}/api/metadata/credentials/${credentialId}`;
}
