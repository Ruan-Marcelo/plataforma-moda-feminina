// RUAN MARCELO RAMACIOTI LUZ
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= 10000) {
      for (const [entryKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(entryKey);
      if (buckets.size >= 10000) return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
