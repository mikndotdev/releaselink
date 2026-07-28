import { redis } from "bun";
import type { Release } from "./github";

const ENABLED = Boolean(process.env.REDIS_URL);
const PREFIX = "releaselink:release:";

export async function getCachedRelease(key: string): Promise<Release | null> {
  if (!ENABLED) return null;
  try {
    const raw = await redis.get(PREFIX + key);
    return raw ? (JSON.parse(raw) as Release) : null;
  } catch {
    return null;
  }
}

export async function setCachedRelease(
  key: string,
  release: Release,
  ttlSeconds: number,
): Promise<void> {
  if (!ENABLED) return;
  try {
    await redis.set(PREFIX + key, JSON.stringify(release));
    await redis.expire(PREFIX + key, ttlSeconds);
  } catch {}
}
