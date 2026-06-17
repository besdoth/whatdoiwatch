export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const base = process.env.NEXTAUTH_URL!;

  if (!code) {
    return NextResponse.redirect(`${base}?error=no_code`);
  }

  // Exchange code for token
  const tokenRes = await fetch("https://api.trakt.tv/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: process.env.TRAKT_CLIENT_ID,
      client_secret: process.env.TRAKT_CLIENT_SECRET,
      redirect_uri: `${base}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}?error=token_failed`);
  }

  const { access_token } = await tokenRes.json() as { access_token: string };

  // Fetch user profile
  const profileRes = await fetch("https://api.trakt.tv/users/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "trakt-api-version": "2",
      "trakt-api-key": process.env.TRAKT_CLIENT_ID!,
    },
  });

  const profile = await profileRes.json() as { username: string; name?: string };

  const cookie = await createSessionCookie({
    accessToken: access_token,
    username: profile.username,
    name: profile.name || profile.username,
  });

  const res = NextResponse.redirect(base);
  res.cookies.set("trakt_session", cookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
