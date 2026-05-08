import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import openAI from 'genkitx-openai';
import anthropic from 'genkitx-anthropic';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
    anthropic(),
  ],
  model: 'googleai/gemini-1.5-flash',
});
