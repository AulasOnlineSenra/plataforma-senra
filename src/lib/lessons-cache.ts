/**
 * Lessons Cache Utility (Persistent Stale-While-Revalidate)
 *
 * Strategy:
 * - Uses localStorage (persists across sessions).
 * - On every page load: show cached data immediately (instant UX).
 * - Even if expired, returns stale data so UI renders instantly.
 * - Always fetches fresh data in the background and updates the cache.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (kept for reference, but we serve stale data anyway)

function cacheKey(userId: string) {
  return senra_lessons_;
}

function cacheTimestampKey(userId: string) {
  return senra_lessons_ts_;
}

/** Read cached lessons. Always returns data if it exists, even if stale. */
export function getCachedLessons(userId: string): any[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Write lessons to cache. */
export function setCachedLessons(userId: string, lessons: any[]): void {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(lessons));
    localStorage.setItem(cacheTimestampKey(userId), String(Date.now()));
  } catch {
    // Storage quota exceeded (unlikely now since we removed Base64 bloat)
  }
}

/** Invalidate cache for a user */
export function clearLessonsCache(userId: string): void {
  try {
    localStorage.removeItem(cacheKey(userId));
    localStorage.removeItem(cacheTimestampKey(userId));
  } catch {
    // ignore
  }
}
