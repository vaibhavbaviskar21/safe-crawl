'use server';
/**
 * @fileOverview Analyzes a URL to determine its risk and provides a detailed breakdown of identified risks.
 *
 * - analyzeUrlDetailed - A function that analyzes a URL and provides a detailed risk breakdown.
 * - AnalyzeUrlDetailedInput - The input type for the analyzeUrlDetailed function.
 * - AnalyzeUrlDetailedOutput - The return type for the analyzeUrlDetailed function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {analyzeUrl, UrlRiskAssessment} from '@/services/url-scan';

const AnalyzeUrlDetailedInputSchema = z.object({
  url: z.string().describe('The URL to analyze.'),
});
export type AnalyzeUrlDetailedInput = z.infer<typeof AnalyzeUrlDetailedInputSchema>;

const AnalyzeUrlDetailedOutputSchema = z.object({
  riskAssessment: z.object({
    isSafe: z.boolean().describe('Indicates whether the URL is considered safe.'),
    riskReasons: z.array(z.string()).describe('An array of reasons why the URL might be risky.'),
    confidenceScore: z.number().describe('Confidence score for the risk assessment (e.g., 80% risk of phishing).'),
    detailedAnalysis: z.string().describe('A detailed breakdown of each identified risk, including specific details on phishing, malware, and suspicious domains.'),
  }).describe('The risk assessment of the URL.'),
});
export type AnalyzeUrlDetailedOutput = z.infer<typeof AnalyzeUrlDetailedOutputSchema>;

export async function analyzeUrlDetailed(input: AnalyzeUrlDetailedInput): Promise<AnalyzeUrlDetailedOutput> {
  return analyzeUrlDetailedFlow(input);
}

const analyzeUrlPrompt = ai.definePrompt({
  name: 'analyzeUrlPrompt',
  input: {
    schema: z.object({
      url: z.string().describe('The URL to analyze.'),
      riskReasons: z.array(z.string()).describe('An array of reasons why the URL might be risky.'),
    }),
  },
  output: {
    schema: z.object({
      detailedAnalysis: z.string().describe('A detailed breakdown of each identified risk, including specific details on phishing, malware, and suspicious domains.'),
    }),
  },
  prompt: `You are an AI assistant specializing in cybersecurity. A user has provided a URL that has been flagged as potentially risky for the following reasons: {{{riskReasons}}}.\n\nYour task is to provide a detailed breakdown of each identified risk. For each risk, explain what it is, how it can harm the user, and what specific characteristics of the URL might indicate this risk. Focus on providing transparent and actionable information.\n\nURL: {{{url}}} `,
});

const analyzeUrlDetailedFlow = ai.defineFlow<
  typeof AnalyzeUrlDetailedInputSchema,
  typeof AnalyzeUrlDetailedOutputSchema
>(
  {
    name: 'analyzeUrlDetailedFlow',
    inputSchema: AnalyzeUrlDetailedInputSchema,
    outputSchema: AnalyzeUrlDetailedOutputSchema,
  },
  async input => {
    const riskAssessment: UrlRiskAssessment = await analyzeUrl(input.url);

    const {output} = await analyzeUrlPrompt({
      url: input.url,
      riskReasons: riskAssessment.riskReasons,
    });

    return {
      riskAssessment: {
        ...riskAssessment,
        detailedAnalysis: output!.detailedAnalysis,
      },
    };
  }
);
