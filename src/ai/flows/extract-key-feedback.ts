'use server';

/**
 * @fileOverview Extracts frequent positive and negative keywords from student feedback on professor sessions.
 *
 * - extractKeyFeedback - A function that handles the extraction of key feedback from student reviews.
 * - ExtractKeyFeedbackInput - The input type for the extractKeyFeedback function.
 * - ExtractKeyFeedbackOutput - The return type for the extractKeyFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyFeedbackInputSchema = z.object({
  feedbackText: z
    .string()
    .describe('The text of the student feedback on a professor session.'),
});
export type ExtractKeyFeedbackInput = z.infer<typeof ExtractKeyFeedbackInputSchema>;

const ExtractKeyFeedbackOutputSchema = z.object({
  positiveKeywords: z
    .string()
    .describe('Keywords that frequently appear in positive feedback.'),
  negativeKeywords: z
    .string()
    .describe('Keywords that frequently appear in negative feedback.'),
});
export type ExtractKeyFeedbackOutput = z.infer<typeof ExtractKeyFeedbackOutputSchema>;

export async function extractKeyFeedback(input: ExtractKeyFeedbackInput): Promise<ExtractKeyFeedbackOutput> {
  return extractKeyFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyFeedbackPrompt',
  input: {schema: ExtractKeyFeedbackInputSchema},
  output: {schema: ExtractKeyFeedbackOutputSchema},
  prompt: `You are an AI assistant designed to extract key feedback from student reviews about professor sessions.

  Analyze the provided feedback text and identify the most frequent positive and negative keywords. Return these keywords in the specified JSON format.

  Feedback Text: {{{feedbackText}}}
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
