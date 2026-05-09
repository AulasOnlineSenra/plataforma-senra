import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Inicialização simples e estável apenas com Google AI
// As chaves das demais APIs são injetadas dinamicamente em ia.ts
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-flash-preview-04-17',
});
