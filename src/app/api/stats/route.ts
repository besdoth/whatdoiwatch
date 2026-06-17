export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

interface KV {
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
  list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("password");
  if (password !== process.env.STATS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kv = (process.env as unknown as { ANALYTICS_KV: KV }).ANALYTICS_KV;
  if (!kv) return NextResponse.json({ visits: [] });

  const list = await kv.list({ prefix: "visit:" });
  const visits = await Promise.all(
    list.keys.map(async (k) => {
      const val = await kv.get(k.name);
      return val ? JSON.parse(val) : null;
    })
  );

  return NextResponse.json({
    visits: visits.filter(Boolean).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    total: visits.length,
  });
}
