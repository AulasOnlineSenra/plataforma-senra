'use server';

/**
 * @fileOverview Um agente de IA analista financeiro para a plataforma Aulas Online Senra.
 *
 * - financialAnalystAgent - Uma função que lida com a análise financeira com base nas solicitações do usuário.
 * - FinancialAnalystAgentInput - O tipo de entrada para a função financialAnalystAgent.
 * - FinancialAnalystAgentOutput - O tipo de retorno para a função financialAnalystAgent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FinancialAnalystAgentInputSchema = z.object({
  prompt: z.string().describe('A solicitação do usuário para análise financeira.'),
  // Em um cenário real, você passaria dados financeiros em tempo real aqui.
  // Para este protótipo, usaremos uma estrutura de dados simplificada.
  financialData: z.string().describe('Um resumo dos dados financeiros da plataforma em formato JSON.'),
});
export type FinancialAnalystAgentInput = z.infer<typeof FinancialAnalystAgentInputSchema>;

const FinancialAnalystAgentOutputSchema = z.object({
  analysis: z.string().describe('A análise e resposta da IA à solicitação do usuário.'),
});
export type FinancialAnalystAgentOutput = z.infer<typeof FinancialAnalystAgentOutputSchema>;

export async function financialAnalystAgent(input: FinancialAnalystAgentInput): Promise<FinancialAnalystAgentOutput> {
  return financialAnalystAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialAnalystAgentPrompt',
  input: { schema: FinancialAnalystAgentInputSchema },
  output: { schema: FinancialAnalystAgentOutputSchema },
  prompt: `Você é um agente analista financeiro para uma plataforma de tutoria online chamada "Aulas Online Senra".
Sua tarefa é analisar os dados financeiros fornecidos e responder à solicitação do usuário.
Forneça uma análise clara, concisa e útil.

Dados Financeiros (JSON):
{{{financialData}}}

Solicitação do Usuário:
"{{{prompt}}}"

Com base nos dados, forneça sua análise abaixo:
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
