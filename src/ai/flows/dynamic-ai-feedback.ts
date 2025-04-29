'use server';
/**
 * @fileOverview Implements a Genkit flow for dynamic AI feedback to improve URL risk analysis over time.
 *
 * - analyzeUrlWithFeedbackFlow - The main flow that analyzes a URL and incorporates feedback.
 * - AnalyzeUrlWithFeedbackInput - The input type for the analyzeUrlWithFeedbackFlow function.
 * - AnalyzeUrlWithFeedbackOutput - The return type for the analyzeUrlWithFeedbackFlow function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {analyzeUrl, UrlRiskAssessment} from '@/services/url-scan';

const AnalyzeUrlWithFeedbackInputSchema = z.object({
  url: z.string().describe('The URL to analyze.'),
  feedback: z
    .string()
    .optional()
    .describe('Optional feedback on previous analysis results.'),
});
export type AnalyzeUrlWithFeedbackInput = z.infer<typeof AnalyzeUrlWithFeedbackInputSchema>;

const AnalyzeUrlWithFeedbackOutputSchema = z.object({
  riskAssessment: z.object({
    isSafe: z.boolean().describe('Indicates whether the URL is considered safe.'),
    riskReasons: z.array(z.string()).describe('Reasons why the URL might be risky.'),
    confidenceScore: z.number().describe('Confidence score for the risk assessment.'),
  }),
  explanation: z
    .string()
    .describe('An explanation of why the URL was determined safe or unsafe.'),
});
export type AnalyzeUrlWithFeedbackOutput = z.infer<typeof AnalyzeUrlWithFeedbackOutputSchema>;

export async function analyzeUrlWithFeedback(input: AnalyzeUrlWithFeedbackInput): Promise<AnalyzeUrlWithFeedbackOutput> {
  return analyzeUrlWithFeedbackFlow(input);
}

const analyzeUrlPrompt = ai.definePrompt({
  name: 'analyzeUrlPrompt',
  input: {
    schema: z.object({
      url: z.string().describe('The URL to analyze.'),
      feedback: z
        .string()
        .optional()
        .describe('Optional feedback on previous analysis results.'),
      previousRiskAssessment: z
        .string()
        .optional()
        .describe('The previous risk assessment as a stringified JSON object.'),
    }),
  },
  output: {
    schema: z.object({
      riskAssessment: z.object({
        isSafe: z.boolean().describe('Indicates whether the URL is considered safe.'),
        riskReasons: z.array(z.string()).describe('Reasons why the URL might be risky.'),
        confidenceScore: z.number().describe('Confidence score for the risk assessment.'),
      }),
      explanation: z
        .string()
        .describe('An explanation of why the URL was determined safe or unsafe.'),
    }),
  },
  prompt: `You are an AI expert in identifying malicious URLs.

Analyze the given URL and determine if it is safe or not. Provide a detailed explanation of your reasoning.
Incorporate any user feedback to improve your analysis.

URL: {{{url}}}
Feedback: {{{feedback}}}
Previous Risk Assessment: {{{previousRiskAssessment}}}

Consider the previous risk assessment and feedback, if any, to refine your analysis.

Output your assessment as a JSON object with 'isSafe', 'riskReasons', 'confidenceScore', and 'explanation' fields.
`,
});

const analyzeUrlWithFeedbackFlow = ai.defineFlow<
  typeof AnalyzeUrlWithFeedbackInputSchema,
  typeof AnalyzeUrlWithFeedbackOutputSchema
>({
  name: 'analyzeUrlWithFeedbackFlow',
  inputSchema: AnalyzeUrlWithFeedbackInputSchema,
  outputSchema: AnalyzeUrlWithFeedbackOutputSchema,
},
async input => {
  // Initial risk assessment from the service
  const initialAssessment: UrlRiskAssessment = await analyzeUrl(input.url);

  // Stringify the initial assessment for the prompt
  const previousRiskAssessment = JSON.stringify(initialAssessment);

  // Call the prompt with the URL, feedback, and previous assessment
  const {output} = await analyzeUrlPrompt({
    url: input.url,
    feedback: input.feedback,
    previousRiskAssessment,
  });

  return output!;
});

