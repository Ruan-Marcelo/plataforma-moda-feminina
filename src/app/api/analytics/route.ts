// RUAN MARCELO RAMACIOTI LUZ
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { analyticsEventSchema } from "@/features/analytics/events";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { readBoundedJson, bodyLimitResponse } from "@/lib/security/request-body";

const requestWindowMs = 60_000;
const maxRequestsPerAnonymousId = 60;

export async function POST(request: Request) {
  if (!env.DATABASE_URL) return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  let body: unknown;
  try { body = await readBoundedJson(request, 32000); }
  catch (error) { return bodyLimitResponse(error) ?? NextResponse.json({ error: "invalid_event" }, { status: 400 }); }
  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  if (!consumeRateLimit(`analytics:${parsed.data.anonymousId}`, maxRequestsPerAnonymousId, requestWindowMs).allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    await prisma.analyticsEvent.create({ data: { name: parsed.data.name, anonymousId: parsed.data.anonymousId, productId: parsed.data.productId, metadata: parsed.data.metadata } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
}
