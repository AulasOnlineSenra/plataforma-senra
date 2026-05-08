import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import openAI from 'genkitx-openai';
import anthropic from 'genkitx-anthropic';

const globalForAi = global as unknown as { ai: ReturnType<typeof genkit> };

export const ai = globalForAi.ai || genkit({
  plugins: [
    googleAI(),
    openAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' }),
    anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy' }),
  ],
  model: 'googleai/gemini-1.5-flash',
});

if (process.env.NODE_ENV !== 'production') globalForAi.ai = ai;
