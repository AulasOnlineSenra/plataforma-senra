'use server';

/**
 * @fileOverview Extrai palavras-chave frequentes, positivas e negativas, do feedback dos alunos sobre as sessões dos professores.
 *
 * - extractKeyFeedback - Uma função que lida com a extração de feedback chave das avaliações dos alunos.
 * - ExtractKeyFeedbackInput - O tipo de entrada para a função extractKeyFeedback.
 * - ExtractKeyFeedbackOutput - O tipo de retorno para a função extractKeyFeedback.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyFeedbackInputSchema = z.object({
  feedbackText: z
    .string()
    .describe('O texto do feedback do aluno sobre uma sessão de um professor.'),
});
export type ExtractKeyFeedbackInput = z.infer<typeof ExtractKeyFeedbackInputSchema>;

const ExtractKeyFeedbackOutputSchema = z.object({
  positiveKeywords: z
    .string()
    .describe('Palavras-chave que aparecem frequentemente em feedback positivo.'),
  negativeKeywords: z
    .string()
    .describe('Palavras-chave que aparecem frequentemente em feedback negativo.'),
});
export type ExtractKeyFeedbackOutput = z.infer<typeof ExtractKeyFeedbackOutputSchema>;

export async function extractKeyFeedback(input: ExtractKeyFeedbackInput): Promise<ExtractKeyFeedbackOutput> {
  return extractKeyFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyFeedbackPrompt',
  input: {schema: ExtractKeyFeedbackInputSchema},
  output: {schema: ExtractKeyFeedbackOutputSchema},
  prompt: `Você é um assistente de IA projetado para extrair feedback chave de avaliações de alunos sobre sessões de professores.

  Analise o texto de feedback fornecido e identifique as palavras-chave positivas e negativas mais frequentes. Retorne essas palavras-chave no formato JSON especificado.

  Texto do Feedback: {{{feedbackText}}}
  `,
});

const extractKeyFeedbackFlow = ai.defineFlow(
  {
    name: 'extractKeyFeedbackFlow',
    inputSchema: ExtractKeyFeedbackInputSchema,
    outputSchema: ExtractKeyFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
