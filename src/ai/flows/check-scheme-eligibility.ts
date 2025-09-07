// This is a server-side file.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking a user's eligibility for a government scheme.
 *
 * checkSchemeEligibility - A function that takes a scheme name and user's answers to eligibility questions, and returns whether the user is eligible.
 * CheckSchemeEligibilityInput - The input type for the checkSchemeEligibility function.
 * CheckSchemeEligibilityOutput - The return type for the checkSchemeEligibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckSchemeEligibilityInputSchema = z.object({
  schemeName: z.string().describe('The name of the government scheme.'),
  answers: z
    .array(z.boolean())
    .describe('An array of boolean values representing the user\'s answers to the eligibility questions.'),
  questions: z
    .array(z.string())
    .describe('An array of strings representing the eligibility questions.'),
});

export type CheckSchemeEligibilityInput = z.infer<
  typeof CheckSchemeEligibilityInputSchema
>;

const CheckSchemeEligibilityOutputSchema = z.object({
  isEligible: z
    .boolean()
    .describe('Whether the user is eligible for the scheme.'),
  reason: z
    .string()
    .optional()
    .describe('The reason for ineligibility, if applicable.'),
});

export type CheckSchemeEligibilityOutput = z.infer<
  typeof CheckSchemeEligibilityOutputSchema
>;

const checkEligibilityPrompt = ai.definePrompt({
  name: 'checkEligibilityPrompt',
  input: {schema: CheckSchemeEligibilityInputSchema},
  output: {schema: CheckSchemeEligibilityOutputSchema},
  prompt: `You are an expert in Indian government schemes. You will use the user's answers to determine their eligibility for the scheme. If the user is not eligible, provide a reason why.

Scheme Name: {{{schemeName}}}

Questions and Answers:
{{#each questions}}
Question: {{{this}}}
Answer: {{../answers.[@index]}}
{{/each}}

Determine if the user is eligible based on their answers.`, // Ensure correct Handlebars usage
});

const checkSchemeEligibilityFlow = ai.defineFlow(
  {
    name: 'checkSchemeEligibilityFlow',
    inputSchema: CheckSchemeEligibilityInputSchema,
    outputSchema: CheckSchemeEligibilityOutputSchema,
  },
  async input => {
    const {output} = await checkEligibilityPrompt(input);
    return output!;
  }
);

export async function checkSchemeEligibility(
  input: CheckSchemeEligibilityInput
): Promise<CheckSchemeEligibilityOutput> {
  return checkSchemeEligibilityFlow(input);
}
