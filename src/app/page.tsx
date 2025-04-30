
"use client";

import { useState, useCallback, ChangeEvent, DragEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { analyzeUrlDetailed, AnalyzeUrlDetailedOutput } from "@/ai/flows/detailed-risk-breakdown";
import { analyzeUrlWithFeedback, AnalyzeUrlWithFeedbackOutput } from "@/ai/flows/dynamic-ai-feedback";
import { UrlRiskAssessment } from "@/services/url-scan";
import { Info, ShieldCheck, AlertTriangle, XOctagon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Combined type for risk assessment results
type RiskResult = AnalyzeUrlDetailedOutput['riskAssessment'] & { detailedAnalysis?: string };

const riskLevels = {
  safe: { label: "Safe", color: "text-green-600", icon: ShieldCheck, bg: "bg-green-100", border: "border-green-300" },
  warning: { label: "Warning", color: "text-orange-600", icon: AlertTriangle, bg: "bg-orange-100", border: "border-orange-300" },
  dangerous: { label: "Dangerous", color: "text-red-600", icon: XOctagon, bg: "bg-red-100", border: "border-red-300" },
};

const getRiskLevel = (riskAssessment: RiskResult | null) => {
  if (!riskAssessment) return null;
  if (riskAssessment.isSafe) return riskLevels.safe;
  if (riskAssessment.confidenceScore >= 70 && riskAssessment.riskReasons.length > 0) return riskLevels.dangerous;
  if (riskAssessment.confidenceScore > 30 && riskAssessment.riskReasons.length > 0) return riskLevels.warning; // Moderate risk
  return riskLevels.safe; // Default to safe if low confidence or no reasons
};


export default function Home() {
  const [url, setUrl] = useState("");
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const analyze = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setRiskResult(null); // Clear previous results
    setProgress(30); // Simulate initial loading

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 300);

      const result = await analyzeUrlDetailed({ url });

      clearInterval(progressInterval);
      setProgress(100);
      setRiskResult(result.riskAssessment);

    } catch (error) {
      console.error("Error analyzing URL:", error);
      setRiskResult({
        isSafe: false,
        riskReasons: ["Analysis Failed"],
        confidenceScore: 100,
        detailedAnalysis: "The initial AI analysis failed to complete. Please check the URL or try again later.",
      });
      setProgress(100); // Ensure progress bar completes on error
    } finally {
      setIsLoading(false);
      // Reset progress slightly delayed for smoother transition
      setTimeout(() => setProgress(0), 500);
    }
  }, [url]);

  const submitFeedback = useCallback(async () => {
    if (!url || !riskResult) return;
    setIsSubmittingFeedback(true);

    try {
      const result: AnalyzeUrlWithFeedbackOutput = await analyzeUrlWithFeedback({ url, feedback: feedbackText });
      // Update the riskResult state with the refined analysis
      setRiskResult({
          ...result.riskAssessment,
          detailedAnalysis: result.explanation, // Use the explanation as the detailed analysis
      });
      setFeedbackText(""); // Clear feedback text
      setFeedbackDialogOpen(false); // Close dialog
    } catch (error) {
        console.error("Error submitting feedback:", error);
        // Optionally show an error message to the user
        // For now, just log it and keep the dialog open
        alert("Failed to submit feedback. Please try again.");
    } finally {
        setIsSubmittingFeedback(false);
    }
  }, [url, feedbackText, riskResult]);

  const riskLevel = getRiskLevel(riskResult);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary'); // Add visual feedback
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('border-primary');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
    const droppedUrl = e.dataTransfer?.getData("URL") || e.dataTransfer?.getData("text");
    if (droppedUrl) {
      // Basic validation if it looks like a URL
      try {
        new URL(droppedUrl);
        setUrl(droppedUrl);
        analyze(); // Optionally trigger analysis on drop
      } catch (_) {
        // Handle invalid URL drop if needed
        console.warn("Dropped text is not a valid URL:", droppedUrl);
      }
    }
  };


  return (
    <TooltipProvider> {/* Wrap the whole page in TooltipProvider */}
        <div className="flex flex-col items-center justify-start min-h-screen bg-[#f5f5f5] py-16 px-4 sm:px-8 font-sans transition-colors duration-300">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1a1a1a] text-center">
            SafeCrawl <span className="text-primary">- URL Risk Analyzer</span>
        </h1>

        <div
            className="w-full max-w-2xl mb-8 p-2 border-2 border-dashed border-gray-300 rounded-lg transition-colors duration-200 hover:border-primary"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            >
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                type="url"
                placeholder="Enter or drag & drop a URL (e.g., https://example.com)"
                className="flex-grow rounded-md shadow-inner bg-white border-gray-300 focus:ring-primary focus:border-primary h-12 text-base px-4"
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                />
                <Button
                onClick={analyze}
                disabled={isLoading || !url}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm h-12 px-6 text-base font-medium transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                {isLoading ? "Analyzing..." : "Analyze"}
                </Button>
            </div>
        </div>


        {isLoading && (
            <div className="w-full max-w-2xl mb-8 px-1">
            <Progress value={progress} className="bg-gray-200 h-2 rounded-full [&>div]:bg-primary" />
            </div>
        )}

        {!isLoading && riskResult && (
            <Card className="w-full max-w-2xl rounded-lg shadow-lg bg-white border border-gray-200/80 transition-all duration-500 ease-out animate-fade-in">
            <CardHeader className={cn("rounded-t-lg p-5 border-b", riskLevel?.bg, riskLevel?.border)}>
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-[#1a1a1a]">
                {riskLevel ? (
                    <>
                    <riskLevel.icon className={cn(riskLevel.color, "h-6 w-6")} />
                    Risk Level:
                    <span className={cn("font-bold", riskLevel.color)}>{riskLevel.label}</span>
                    <span className="text-sm font-normal text-gray-600 ml-auto">
                        (Confidence: {riskResult.confidenceScore}%)
                    </span>
                    </>
                ) : "Analysis Results"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid gap-5">
                {/* Summary Section */}
                <section>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 text-[#1a1a1a]">
                    Summary
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>Quick overview of the analysis findings.</p>
                        </TooltipContent>
                    </Tooltip>
                </h2>
                {riskLevel ? (
                    <p className={cn("font-medium text-base", riskLevel.color)}>
                    {riskResult.isSafe
                        ? "The URL appears to be safe based on current analysis."
                        : `Potential risks identified: ${riskResult.riskReasons.join(', ')}.`}
                    </p>
                ) : (
                    <p className="text-gray-500">Loading summary...</p>
                )}
                </section>

                {/* Details Section - Rendered as bullet points */}
                {riskResult.detailedAnalysis && (
                    <section>
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 text-[#1a1a1a]">
                        Details
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>In-depth explanation of detected risks or safety confirmation.</p>
                            </TooltipContent>
                        </Tooltip>
                    </h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-base leading-relaxed">
                        {riskResult.detailedAnalysis.split('\n').map((point, index) => (
                        point.trim() && <li key={index}>{point.trim()}</li> // Render non-empty lines as list items
                        ))}
                    </ul>
                    </section>
                )}


                {/* Recommendations Section */}
                <section>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 text-[#1a1a1a]">
                    Recommendations
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>Suggested actions based on the analysis results.</p>
                        </TooltipContent>
                    </Tooltip>
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-base">
                    {riskLevel && riskLevel.label === "Dangerous" ? (
                        <>
                        <li><span className="font-semibold">Strongly avoid</span> accessing this URL.</li>
                        <li>Do not enter any personal information.</li>
                        <li>Consider reporting the URL if it seems malicious (e.g., to Google Safe Browsing).</li>
                        </>
                    ) : riskLevel && riskLevel.label === "Warning" ? (
                        <>
                        <li>Proceed with <span className="font-semibold">extreme caution</span>.</li>
                        <li>Verify the website's authenticity before interacting.</li>
                        <li>Be wary of requests for login credentials or personal data.</li>
                        </>
                    ) : (
                        <li>The URL is likely safe to visit.</li>
                    )}
                    <li>Always keep your browser and security software updated.</li>
                </ul>
                </section>
            </CardContent>
            <CardFooter className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
                <AlertDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                    <AlertDialogTrigger asChild>
                    <Button variant="outline" className="rounded-md shadow-sm text-sm hover:bg-gray-100" disabled={!riskResult}>Provide Feedback</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-lg shadow-md bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Provide Feedback on Analysis</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                        Help improve SafeCrawl! If you believe the analysis for <span className="font-medium text-primary break-all">{url}</span> is inaccurate, please provide details below.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="feedback-text" className="text-right text-gray-700">
                            Feedback
                        </Label>
                        <Textarea
                            id="feedback-text"
                            value={feedbackText}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
                            placeholder="e.g., This URL is actually safe because..."
                            className="col-span-3 h-24 rounded-md border-gray-300 focus:ring-primary focus:border-primary"
                        />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md hover:bg-gray-100">Cancel</AlertDialogCancel>
                        <Button
                        onClick={submitFeedback}
                        disabled={isSubmittingFeedback || !feedbackText.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm"
                        >
                        {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                        </Button>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
            </Card>
        )}
        </div>
    </TooltipProvider>
  );
}
