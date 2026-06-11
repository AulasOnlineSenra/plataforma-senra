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

  // 3. Simple Cron Worker
  if (!globalThis[GLOBAL_KEY as keyof typeof globalThis]) {
    // Only run this on the main server instance
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      console.log("[instrumentation] Starting internal Cron Worker...");
      (globalThis as any)[GLOBAL_KEY] = true;
      
      setInterval(async () => {
        try {
          const now = new Date();
          // Backup cron: run at 3 AM
          if (now.getHours() === 3) {
            console.log("[Cron Worker] Disparando rotina de backup diário...");
            await fetch('http://localhost:3000/api/backups/generate', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer senra-cron-secret' }
            });
          }
        } catch(e) {
          console.error("[Cron Worker] Error:", e);
        }
      }, 60 * 60 * 1000); // 1 hr interval
    }
  }
}
