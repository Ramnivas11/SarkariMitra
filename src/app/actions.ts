
'use server';

import { explainGovernmentScheme } from '@/ai/flows/explain-government-schemes';
import { checkSchemeEligibility } from '@/ai/flows/check-scheme-eligibility';
import type { ExplainGovernmentSchemeInput, ExplainGovernmentSchemeOutput } from '@/ai/flows/explain-government-schemes';
import type { CheckSchemeEligibilityInput, CheckSchemeEligibilityOutput } from '@/ai/flows/check-scheme-eligibility';

type ExtendedExplainOutputType = ExplainGovernmentSchemeOutput & {
  schemeName: string;
};

export async function getSchemeExplanation(input: ExplainGovernmentSchemeInput): Promise<ExtendedExplainOutputType | { error: string }> {
  try {
    const result = await explainGovernmentScheme(input);
    
    const queryLower = input.query.toLowerCase();
    let schemeName = 'Unknown Scheme';
    if (queryLower.includes('pmay') || queryLower.includes('pradhan mantri awas yojana')) {
      schemeName = 'PMAY';
    } else if (queryLower.includes('pm-kisan') || queryLower.includes('pradhan mantri kisan samman nidhi')) {
      schemeName = 'PM-Kisan';
    } else if (queryLower.includes('ayushman bharat') || queryLower.includes('pradhan mantri jan arogya yojana')) {
      schemeName = 'Ayushman Bharat';
    }

    return { ...result, schemeName };
  } catch (e) {
    console.error('Error in getSchemeExplanation:', e);
    return { error: 'An error occurred while fetching the scheme explanation. Please try again.' };
  }
}

export async function getEligibility(input: CheckSchemeEligibilityInput): Promise<CheckSchemeEligibilityOutput | { error: string }> {
  try {
    return await checkSchemeEligibility(input);
  } catch (e) {
    console.error('Error in getEligibility:', e);
    return { error: 'An error occurred while checking eligibility. Please try again.' };
  }
}
