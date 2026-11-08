/* ==========================================================================
   Minimal in-memory rate limiter — used to slow down brute-force
   attempts on the login endpoint. Resets on process restart, which is
   fine for a single-instance app.
   ========================================================================== */

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, keyPrefix = "rl" } = {}) {
  const hits = new Map();

  // Periodic cleanup so the map cannot grow without bound.
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  timer.unref?.();

  return function limiter(req, res, next) {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ error: "Too many attempts. Please try again in a few minutes." });
    }

    next();
  };
}
