export async function register() {
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
}
