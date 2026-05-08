import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openai} from 'genkitx-openai';
import {anthropic} from 'genkitx-anthropic';

export const ai = genkit({
  plugins: [
    googleAI(),
    openai(),
    anthropic(),
  ],
  model: 'googleai/gemini-1.5-flash',
});
