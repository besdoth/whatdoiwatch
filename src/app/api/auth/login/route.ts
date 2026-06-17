export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRAKT_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
  });
  return NextResponse.redirect(
    `https://trakt.tv/oauth/authorize?${params}`
  );
}
