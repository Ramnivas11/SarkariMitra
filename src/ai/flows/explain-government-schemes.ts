'use server';
/**
 * @fileOverview Explains government schemes in simple language.
 *
 * - explainGovernmentScheme - A function that handles the government scheme explanation process.
 * - ExplainGovernmentSchemeInput - The input type for the explainGovernmentScheme function.
 * - ExplainGovernmentSchemeOutput - The return type for the explainGovernmentScheme function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainGovernmentSchemeInputSchema = z.object({
  query: z.string().describe('The user query about a government scheme.'),
});
export type ExplainGovernmentSchemeInput = z.infer<typeof ExplainGovernmentSchemeInputSchema>;

const ExplainGovernmentSchemeOutputSchema = z.object({
  explanation: z.string().describe('A simple, clear explanation of the scheme.'),
  eligibility: z.string().describe('Basic eligibility conditions for the scheme.'),
  applicationProcess: z.string().describe('Step-by-step process to apply for the scheme.'),
  officialLink: z.string().optional().describe('Official link to apply for the scheme, if available.'),
  language: z.string().describe('The language of the user query.'),
});
export type ExplainGovernmentSchemeOutput = z.infer<typeof ExplainGovernmentSchemeOutputSchema>;

export async function explainGovernmentScheme(input: ExplainGovernmentSchemeInput): Promise<ExplainGovernmentSchemeOutput> {
  return explainGovernmentSchemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainGovernmentSchemePrompt',
  input: {schema: ExplainGovernmentSchemeInputSchema},
  output: {schema: ExplainGovernmentSchemeOutputSchema},
  prompt: `You are a friendly assistant that explains Indian government schemes to users in simple, clear language.

First, detect the language of the user's query.

Then, provide the following information in the detected language:
1. A short explanation of the scheme.
2. Basic eligibility conditions.
3. A step-by-step process to apply.
4. The official link (if available).
5. The detected language name (e.g., "English", "Hindi").

User Query: {{{query}}}
`,
});

const explainGovernmentSchemeFlow = ai.defineFlow(
  {
    name: 'explainGovernmentSchemeFlow',
    inputSchema: ExplainGovernmentSchemeInputSchema,
    outputSchema: ExplainGovernmentSchemeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
