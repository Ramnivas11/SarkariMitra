
'use client';

import type { ExplainGovernmentSchemeOutput } from '@/ai/flows/explain-government-schemes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ListChecks, BookUser, FileText, ExternalLink, ShieldQuestion } from 'lucide-react';
import React from 'react';

interface SchemeExplanationProps {
  schemeData: ExplainGovernmentSchemeOutput & { schemeName: string };
  startEligibilityCheck: (schemeName: string) => void;
}

export function SchemeExplanation({ schemeData, startEligibilityCheck }: SchemeExplanationProps) {
  const canCheckEligibility = ['PMAY', 'PM-Kisan', 'Ayushman Bharat'].includes(schemeData.schemeName);

  return (
    <Card className="bg-card/80 backdrop-blur-sm w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BookUser />
          Scheme Details
        </CardTitle>
        <CardDescription>{schemeData.explanation}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-1"><ListChecks />Eligibility</h3>
          <p className="text-muted-foreground text-sm">{schemeData.eligibility}</p>
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-1"><FileText />Application Process</h3>
          <p className="text-muted-foreground text-sm">{schemeData.applicationProcess}</p>
        </div>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        {schemeData.officialLink && (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={schemeData.officialLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Official Link
            </a>
          </Button>
        )}
        {canCheckEligibility && (
          <Button onClick={() => startEligibilityCheck(schemeData.schemeName)} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <ShieldQuestion className="mr-2 h-4 w-4" /> Check Eligibility
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
