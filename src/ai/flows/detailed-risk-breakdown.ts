
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
    detailedAnalysis: z.string().describe('A detailed breakdown of each identified risk, formatted as bullet points separated by newlines (e.g., "• Point 1\\n• Point 2").'),
  }).describe('The risk assessment of the URL.'),
});
export type AnalyzeUrlDetailedOutput = z.infer<typeof AnalyzeUrlDetailedOutputSchema>;

export async function analyzeUrlDetailed(input: AnalyzeUrlDetailedInput): Promise<AnalyzeUrlDetailedOutput> {
  return analyzeUrlDetailedFlow(input);
}

const analyzeUrlPrompt = ai.definePrompt({
  name: 'analyzeUrlDetailedPrompt',
  input: {
    schema: z.object({
      url: z.string().describe('The URL to analyze.'),
      riskReasons: z.array(z.string()).describe('An array of reasons why the URL might be risky.'),
    }),
  },
  output: {
    schema: z.object({
      detailedAnalysis: z.string().describe('A detailed breakdown of each identified risk, formatted as bullet points separated by newlines (e.g., "• Point 1\\n• Point 2").'),
    }),
  },
  prompt: `You are an AI assistant specializing in cybersecurity. A user has provided a URL that has been flagged as potentially risky for the following reasons: {{{riskReasons}}}.\n\nYour task is to provide a detailed breakdown of each identified risk. For each risk, explain what it is, how it can harm the user, and what specific characteristics of the URL might indicate this risk. Focus on providing transparent and actionable information.\n\nURL: {{{url}}}\n\nFormat the detailed analysis as a list of concise bullet points, separated by newline characters (\\n). For example:\n• Point 1\n• Point 2\n• Point 3`,
});

/**
 * Builds a plain-text detailed analysis from heuristic risk reasons without AI.
 * Used as a fallback when the AI service is unavailable.
 */
function buildHeuristicDetailedAnalysis(riskReasons: string[], isSafe: boolean): string {
  if (isSafe) {
    return [
      '• No suspicious patterns detected in the URL structure.',
      '• HTTPS encryption is in use, protecting data in transit.',
      '• The domain does not match any known phishing or malware patterns.',
      '• Always verify the site\'s identity before sharing sensitive information.',
    ].join('\n');
  }

  const bullets = riskReasons.map((reason) => `• ${reason}`);
  bullets.push(
    '• Do not enter any personal, financial, or login credentials on this page.',
    '• Consider reporting this URL to your browser\'s safe browsing service.',
    '• Keep your browser and security software up to date.',
  );
  return bullets.join('\n');
}

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

    let detailedAnalysis: string;

    if (riskAssessment.riskReasons.length === 0) {
      // Safe URL — provide a confirmation message without needing AI
      detailedAnalysis = buildHeuristicDetailedAnalysis([], true);
    } else {
      // Risky URL — try AI enrichment, fall back to heuristic bullets on failure
      try {
        const { output } = await analyzeUrlPrompt({
          url: input.url,
          riskReasons: riskAssessment.riskReasons,
        });
        detailedAnalysis = output?.detailedAnalysis ?? buildHeuristicDetailedAnalysis(riskAssessment.riskReasons, false);
      } catch {
        detailedAnalysis = buildHeuristicDetailedAnalysis(riskAssessment.riskReasons, false);
      }
    }

    return {
      riskAssessment: {
        ...riskAssessment,
        detailedAnalysis,
      },
    };
  }
);
