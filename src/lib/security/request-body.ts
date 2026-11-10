import { NextResponse } from "next/server";
import { BoundedStreamError, readBoundedStream } from "./bounded-stream";

// Accommodates the existing product schema (5,000 characters and 100 variants), including JSON escapes.
export const maxAdminJsonBytes = 256 * 1024;

export async function readBoundedJson(request: Request, maximum = maxAdminJsonBytes): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > maximum) throw new BoundedStreamError("request_too_large");
  if (!request.body) return null;
  const bytes = await readBoundedStream(request.body, maximum, request.signal);
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { return null; }
}

export function bodyLimitResponse(error: unknown) {
  if (!(error instanceof BoundedStreamError)) return null;
  return NextResponse.json({ error: error.code }, { status: error.code === "request_too_large" ? 413 : error.code === "timeout" ? 408 : 400, headers: { "Cache-Control": "private, no-store" } });
}
