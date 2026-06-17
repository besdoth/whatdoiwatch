export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

interface KV {
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  get(key: string): Promise<string | null>;
  list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export async function POST(req: NextRequest) {
  const kv = (process.env as unknown as { ANALYTICS_KV: KV }).ANALYTICS_KV;
  if (!kv) return NextResponse.json({ ok: false });

  const cf = (req as unknown as { cf?: Record<string, string> }).cf;
  const body = await req.json() as { page?: string };

  const visit = {
    timestamp: new Date().toISOString(),
    page: body.page || "/",
    country: cf?.country || "Unknown",
    city: cf?.city || "Unknown",
    region: cf?.region || "Unknown",
    ip: req.headers.get("cf-connecting-ip") || "Unknown",
  };

  // Store with timestamp key so we keep all visits
  const key = `visit:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await kv.put(key, JSON.stringify(visit), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days

  return NextResponse.json({ ok: true });
}
