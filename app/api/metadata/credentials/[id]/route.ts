import { NextResponse } from "next/server";
import { buildCredentialMetadata } from "@/lib/credentials/build-metadata";
import { getCredentialById } from "@/lib/credentials/get-credential-by-id";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await getCredentialById(id);

  if (result.status === "not_found") {
    return NextResponse.json(
      { error: "Credential metadata not found." },
      { status: 404 },
    );
  }

  if (result.status === "unavailable") {
    return NextResponse.json(
      { error: "Credential metadata is temporarily unavailable." },
      { status: 503 },
    );
  }

  const metadata = buildCredentialMetadata(result.credential);

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
