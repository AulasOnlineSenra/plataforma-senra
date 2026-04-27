const GLOBAL_KEY = "__scheduledMessagesIntervalStarted";

export async function register() {
  // 1. Polyfill do localStorage para compatibilidade com SSR no Next.js
  if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const memory: Record<string, string> = {};
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => memory[key] ?? null,
        setItem: (key: string, value: string) => { memory[key] = String(value); },
        removeItem: (key: string) => { delete memory[key]; },
        clear: () => { for (const k in memory) delete memory[k]; },
        key: (index: number) => Object.keys(memory)[index] ?? null,
        get length() { return Object.keys(memory).length; },
      },
      writable: true,
      configurable: true,
    });
  }

  // 2. Worker de Mensagens Agendadas (Removido: migrado para Vercel Cron Jobs via /api/scheduled-messages)
  console.log("[instrumentation] Polyfills de localStorage iniciados.");
}
