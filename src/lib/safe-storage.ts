/**
 * Safe localStorage wrapper for Next.js SSR compatibility.
 * All functions return null/undefined silently when called on the server.
 */

const isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail on server
    }
  },
  removeItem: (key: string): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail on server
    }
  },
  clear: (): void => {
    if (!isClient) return;
    try {
      localStorage.clear();
    } catch {
      // Silently fail on server
    }
  },
};
