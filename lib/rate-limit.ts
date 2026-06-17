const buckets = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(key: string) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 30);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  bucket.count += 1;
  return { ok: bucket.count <= max, remaining: Math.max(max - bucket.count, 0) };
}
