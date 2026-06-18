/**
 * Lessons Cache Utility
 *
 * Strategy:
 * - Uses sessionStorage (cleared on tab close — no stale data risk).
 * - Cache expires after CACHE_TTL_MS (5 minutes). After that, fresh data is fetched.
 * - On every page load: show cached data immediately (instant UX), then silently
 *   refresh in the background so data is always up-to-date.
 * - All storage calls are wrapped in try/catch to handle quota errors gracefully
 *   (e.g. when Base64 materials fill up the storage limit).
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(userId: string) {
  return `senra_lessons_${userId}`;
}

function cacheTimestampKey(userId: string) {
  return `senra_lessons_ts_${userId}`;
}

/** Read cached lessons. Returns null if cache is empty or expired. */
export function getCachedLessons(userId: string): any[] | null {
  try {
    const ts = sessionStorage.getItem(cacheTimestampKey(userId));
    if (!ts) return null;

    const age = Date.now() - parseInt(ts, 10);
    if (age > CACHE_TTL_MS) {
      // Expired — clear so we don't serve stale data
      clearLessonsCache(userId);
      return null;
    }

    const raw = sessionStorage.getItem(cacheKey(userId));
    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    // Quota exceeded or parse error — treat as no cache
    return null;
  }
}

/** Write lessons to cache. Silently fails if storage is full. */
export function setCachedLessons(userId: string, lessons: any[]): void {
  try {
    sessionStorage.setItem(cacheKey(userId), JSON.stringify(lessons));
    sessionStorage.setItem(cacheTimestampKey(userId), String(Date.now()));
  } catch {
    // Storage quota exceeded (large Base64 materials) — just skip caching.
    // The app continues to work normally, just without cache benefit this time.
  }
}

/** Invalidate cache for a user (call after saving new data). */
export function clearLessonsCache(userId: string): void {
  try {
    sessionStorage.removeItem(cacheKey(userId));
    sessionStorage.removeItem(cacheTimestampKey(userId));
  } catch {
    // ignore
  }
}
