// RUAN MARCELO RAMACIOTI LUZ
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { analyticsEventSchema } from "@/features/analytics/events";
import { env } from "@/lib/env";

const requestWindowMs = 60_000;
const maxRequestsPerAnonymousId = 60;
const requestCounts = new Map<string, { count: number; startedAt: number }>();

function isRateLimited(anonymousId: string) {
  const now = Date.now();
  const current = requestCounts.get(anonymousId);
  if (!current || now - current.startedAt >= requestWindowMs) {
    requestCounts.set(anonymousId, { count: 1, startedAt: now });
    return false;
  }
  current.count += 1;
  return current.count > maxRequestsPerAnonymousId;
}

export async function POST(request: Request) {
  if (!env.DATABASE_URL) return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  if (isRateLimited(parsed.data.anonymousId)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    await prisma.analyticsEvent.create({ data: { name: parsed.data.name, anonymousId: parsed.data.anonymousId, productId: parsed.data.productId, metadata: parsed.data.metadata } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
}
