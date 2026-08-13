/**
 * TEST / DEV ONLY
 *
 * Minimal localhost HTTP server that serves Credential metadata JSON
 * for local validator integration tests. Avoids bloated inline data URIs
 * in Metaplex Token Metadata `uri` fields.
 */

import http from "node:http";
import { buildCredentialMetadata } from "@/lib/credentials/build-metadata";
import type { CredentialMetadataJson } from "@/lib/credentials/build-metadata";
import type { CredentialDetail } from "@/lib/credentials/get-credential-by-id";

export type LocalMetadataServer = {
  metadataUri: string;
  metadataJson: CredentialMetadataJson;
  close: () => Promise<void>;
};

export function startLocalMetadataServer(
  credential: CredentialDetail,
): Promise<LocalMetadataServer> {
  const metadataJson = buildCredentialMetadata(credential);
  const body = JSON.stringify(metadataJson);

  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.method !== "GET" || request.url !== "/credential.json") {
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      response.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      response.end(body);
    });

    server.on("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Failed to bind local metadata server to 127.0.0.1"));
        return;
      }

      resolve({
        metadataUri: `http://127.0.0.1:${address.port}/credential.json`,
        metadataJson,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }

              closeResolve();
            });
          }),
      });
    });
  });
}

export async function fetchLocalMetadataJson(
  metadataUri: string,
): Promise<CredentialMetadataJson> {
  const response = await fetch(metadataUri);

  if (!response.ok) {
    throw new Error(
      `Local metadata URI did not resolve (${response.status} ${response.statusText}).`,
    );
  }

  return (await response.json()) as CredentialMetadataJson;
}
