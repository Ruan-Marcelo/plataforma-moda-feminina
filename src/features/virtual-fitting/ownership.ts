import { createHmac, randomBytes } from "node:crypto";

export function fittingOwner(cookieHeader: string | null, secret: string, production: boolean) {
  const name = production ? "__Host-belin-vto" : "belin-vto";
  const supplied = cookieHeader?.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
  const token = supplied && /^[A-Za-z0-9_-]{43}$/.test(supplied) ? supplied : randomBytes(32).toString("base64url");
  return { name, token, hash: createHmac("sha256", secret).update(`virtual-fitting:${token}`).digest("hex") };
}

export function fittingTechnicalEvent(event: "started" | "submitted" | "completed" | "failed", operationId: string, details: { code?: string; durationMs?: number; providerRequestId?: string } = {}) {
  // Explicit allowlist: never accept an image, user identity, URL, provider payload or raw exception.
  console.info(JSON.stringify({ event: `virtual-fitting.${event}`, operationId, code: details.code, durationMs: details.durationMs, providerRequestId: details.providerRequestId }));
}
