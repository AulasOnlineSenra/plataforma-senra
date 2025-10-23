'use server';

/**
 * @fileOverview A financial analyst AI agent for the Aulas Online Senra platform.
 *
 * - financialAnalystAgent - A function that handles financial analysis based on user prompts.
 * - FinancialAnalystAgentInput - The input type for the financialAnalystAgent function.
 * - FinancialAnalystAgentOutput - The return type for the financialAnalystAgent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialAnalystAgentInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for financial analysis.'),
  // In a real scenario, you would pass real-time financial data here.
  // For this prototype, we'll use a simplified data structure.
  financialData: z.string().describe('A summary of the platform\'s financial data in JSON format.'),
});
export type FinancialAnalystAgentInput = z.infer<typeof FinancialAnalystAgentInputSchema>;

const FinancialAnalystAgentOutputSchema = z.object({
  analysis: z.string().describe('The AI\'s analysis and response to the user\'s prompt.'),
});
export type FinancialAnalystAgentOutput = z.infer<typeof FinancialAnalystAgentOutputSchema>;

export async function financialAnalystAgent(input: FinancialAnalystAgentInput): Promise<FinancialAnalystAgentOutput> {
  return financialAnalystAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialAnalystAgentPrompt',
  input: { schema: FinancialAnalystAgentInputSchema },
  output: { schema: FinancialAnalystAgentOutputSchema },
  prompt: `You are a financial analyst agent for an online tutoring platform called "Aulas Online Senra".
Your task is to analyze the provided financial data and answer the user's prompt.
Provide a clear, concise, and helpful analysis.

Financial Data (JSON):
{{{financialData}}}

User's Request:
"{{{prompt}}}"

Based on the data, provide your analysis below:
`,
});

const financialAnalystAgentFlow = ai.defineFlow(
  {
    name: 'financialAnalystAgentFlow',
    inputSchema: FinancialAnalystAgentInputSchema,
    outputSchema: FinancialAnalystAgentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
