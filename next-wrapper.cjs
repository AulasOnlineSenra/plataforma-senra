#!/usr/bin/env node
// Patch localStorage BEFORE anything else loads
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const memory = {};
  globalThis.localStorage = {
    getItem: (key) => memory[key] ?? null,
    setItem: (key, value) => { memory[key] = String(value); },
    removeItem: (key) => { delete memory[key]; },
    clear: () => { for (const k in memory) delete memory[k]; },
    key: (index) => Object.keys(memory)[index] ?? null,
    get length() { return Object.keys(memory).length; },
  };
}
// Now load Next.js
require('./node_modules/next/dist/bin/next');
