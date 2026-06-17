export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEXTAUTH_URL!;
  const res = NextResponse.redirect(base);
  res.cookies.set("trakt_session", "", { maxAge: 0, path: "/" });
  return res;
}
