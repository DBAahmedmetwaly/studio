'use server';

/**
 * @fileOverview Financial analysis AI agent.
 *
 * - analyzeJournalEntries - A function that handles the journal entries analysis process.
 * - AnalyzeJournalEntriesInput - The input type for the analyzeJournalEntries function.
 * - AnalyzeJournalEntriesOutput - The return type for the analyzeJournalEntries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJournalEntriesInputSchema = z.object({
  journalEntries: z
    .string()
    .describe('A list of past journal entries to analyze.'),
});
export type AnalyzeJournalEntriesInput = z.infer<
  typeof AnalyzeJournalEntriesInputSchema
>;

const AnalyzeJournalEntriesOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A list of actionable suggestions for financial improvements based on the journal entries.'
    ),
});
export type AnalyzeJournalEntriesOutput = z.infer<
  typeof AnalyzeJournalEntriesOutputSchema
>;

export async function analyzeJournalEntries(
  input: AnalyzeJournalEntriesInput
): Promise<AnalyzeJournalEntriesOutput> {
  return analyzeJournalEntriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeJournalEntriesPrompt',
  input: {schema: AnalyzeJournalEntriesInputSchema},
  output: {schema: AnalyzeJournalEntriesOutputSchema},
  prompt: `You are an expert accountant specializing in financial analysis and providing actionable suggestions for improvement.

You will analyze the provided journal entries and generate a list of suggestions for improving the financial health of the company.

Journal Entries:
{{{journalEntries}}}`,
});

const analyzeJournalEntriesFlow = ai.defineFlow(
  {
    name: 'analyzeJournalEntriesFlow',
    inputSchema: AnalyzeJournalEntriesInputSchema,
    outputSchema: AnalyzeJournalEntriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
