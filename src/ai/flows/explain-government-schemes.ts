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
  language: z.string().describe('The preferred language of the user.'),
});
export type ExplainGovernmentSchemeInput = z.infer<typeof ExplainGovernmentSchemeInputSchema>;

const ExplainGovernmentSchemeOutputSchema = z.object({
  explanation: z.string().describe('A simple, clear explanation of the scheme.'),
  eligibility: z.string().describe('Basic eligibility conditions for the scheme.'),
  applicationProcess: z.string().describe('Step-by-step process to apply for the scheme.'),
  officialLink: z.string().optional().describe('Official link to apply for the scheme, if available.'),
});
export type ExplainGovernmentSchemeOutput = z.infer<typeof ExplainGovernmentSchemeOutputSchema>;

export async function explainGovernmentScheme(input: ExplainGovernmentSchemeInput): Promise<ExplainGovernmentSchemeOutput> {
  return explainGovernmentSchemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainGovernmentSchemePrompt',
  input: {schema: ExplainGovernmentSchemeInputSchema},
  output: {schema: ExplainGovernmentSchemeOutputSchema},
  prompt: `You are a friendly assistant that explains Indian government schemes to users in simple, clear language. Always reply in the user's language.

When asked about a scheme, give:
1. Short explanation of the scheme.
2. Basic eligibility conditions.
3. Step-by-step process to apply.
4. Official link (if available).

User Query: {{{query}}}
Preferred Language: {{{language}}}`,
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

