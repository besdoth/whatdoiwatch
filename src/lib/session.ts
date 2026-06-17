import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-dev-secret"
);
const COOKIE = "trakt_session";

export interface Session {
  accessToken: string;
  username: string;
  name: string;
}

export async function getSession(req: NextRequest): Promise<Session | null> {
  const cookie = req.cookies.get(COOKIE)?.value;
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function createSessionCookie(session: Session): Promise<string> {
  return new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
}
