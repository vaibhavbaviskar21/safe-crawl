
"use client";

import { useState, useCallback, ChangeEvent, DragEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Remove unused Card components
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { analyzeUrlDetailed, AnalyzeUrlDetailedOutput } from "@/ai/flows/detailed-risk-breakdown";
import { analyzeUrlWithFeedback, AnalyzeUrlWithFeedbackOutput } from "@/ai/flows/dynamic-ai-feedback";
import { Info, ShieldCheck, AlertTriangle, XOctagon, Link2, Loader2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, ShieldAlert, Ban } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion
import { useToast } from "@/hooks/use-toast"; // Import useToast hook
import { cn } from "@/lib/utils";

// Combined type for risk assessment results
type RiskResult = AnalyzeUrlDetailedOutput['riskAssessment'] & { detailedAnalysis?: string };

// Risk Level Definitions with Icons and Colors
const riskLevels = {
  safe: { label: "Safe", color: "success", icon: ShieldCheck, bg: "bg-success/10", border: "border-success/30", tagColor: "bg-success", textClass: "text-success" },
  warning: { label: "Warning", color: "warning", icon: AlertTriangle, bg: "bg-warning/10", border: "border-warning/30", tagColor: "bg-warning", textClass: "text-warning" },
  dangerous: { label: "Dangerous", color: "danger", icon: XOctagon, bg: "bg-danger/10", border: "border-danger/30", tagColor: "bg-danger", textClass: "text-danger" },
};

const getRiskLevelDetails = (riskAssessment: RiskResult | null) => {
  if (!riskAssessment) return null;
  if (riskAssessment.isSafe) return riskLevels.safe;
  if (riskAssessment.confidenceScore >= 70 && riskAssessment.riskReasons.length > 0) return riskLevels.dangerous;
  if (riskAssessment.riskReasons.length > 0) return riskLevels.warning; // Any risk reason defaults to warning if not dangerous
  return riskLevels.safe; // Default to safe if no reasons
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false); // State for collapsible details
  const { toast } = useToast(); // Initialize toast hook

  const analyze = useCallback(async () => {
    if (!url) {
        toast({ title: "Input Required", description: "Please enter a URL to analyze.", variant: "destructive" });
        return;
    }
    // Basic URL validation
    try {
        new URL(url);
    } catch (_) {
        toast({ title: "Invalid URL", description: "Please enter a valid URL format (e.g., https://example.com).", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    setRiskResult(null);
    setProgress(0); // Reset progress

    // Simulate progress more realistically
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 95) {
          clearInterval(timer);
          return 95; // Cap progress before result
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 95);
      });
    }, 300);


    try {
      const result = await analyzeUrlDetailed({ url });
      clearInterval(timer);
      setProgress(100);
      setRiskResult(result.riskAssessment);
      toast({ title: "Analysis Complete", description: `URL ${result.riskAssessment.isSafe ? 'seems safe' : 'has potential risks'}.`, variant: result.riskAssessment.isSafe ? 'default' : 'destructive' }); // Use default for safe, destructive for risky

    } catch (error) {
      console.error("Error analyzing URL:", error);
      clearInterval(timer);
      setProgress(100);
      setRiskResult({
        isSafe: false,
        riskReasons: ["Analysis Error"],
        confidenceScore: 0,
        detailedAnalysis: "An error occurred during the analysis. Please try again later.",
      });
       toast({ title: "Analysis Failed", description: "Could not analyze the URL. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  }, [url, toast]);

  const submitFeedback = useCallback(async () => {
    if (!url || !feedbackText.trim()) {
        toast({ title: "Feedback Required", description: "Please enter your feedback before submitting.", variant: "destructive" });
        return;
    }
    setIsSubmittingFeedback(true);

    try {
      const result: AnalyzeUrlWithFeedbackOutput = await analyzeUrlWithFeedback({ url, feedback: feedbackText });
      // Optionally update the result based on feedback, or just acknowledge
      setRiskResult(prev => prev ? { ...prev, ...result.riskAssessment, detailedAnalysis: result.explanation } : null);
      setFeedbackText("");
      setFeedbackDialogOpen(false);
      toast({ title: "Feedback Submitted", description: "Thank you for helping improve SafeCrawl!" });

    } catch (error) {
        console.error("Error submitting feedback:", error);
        toast({ title: "Feedback Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmittingFeedback(false);
    }
  }, [url, feedbackText, toast]);

  const riskLevelDetails = getRiskLevelDetails(riskResult);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('border-primary');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
    const droppedUrl = e.dataTransfer?.getData("URL") || e.dataTransfer?.getData("text");
    if (droppedUrl) {
      try {
        new URL(droppedUrl);
        setUrl(droppedUrl);
        // Automatically analyze on drop if desired
        // analyze();
      } catch (_) {
         toast({ title: "Invalid Drop", description: "The dropped item is not a valid URL.", variant: "destructive" });
      }
    }
  };

  const renderRecommendations = (level: typeof riskLevels.safe | typeof riskLevels.warning | typeof riskLevels.dangerous | null) => {
        const baseRecs = [
            { icon: CheckCircle, text: "Always keep your browser and security software updated." },
            { icon: ShieldAlert, text: "Be cautious of unsolicited links or downloads." },
        ];

        let specificRecs = [];
        if (level?.label === "Dangerous") {
            specificRecs = [
                { icon: Ban, text: <><span className="font-semibold">Strongly avoid</span> accessing this URL.</> },
                { icon: AlertCircle, text: "Do not enter any personal information." },
                { icon: ShieldAlert, text: "Consider reporting the URL if it seems malicious." },
            ];
        } else if (level?.label === "Warning") {
            specificRecs = [
                { icon: AlertTriangle, text: <>Proceed with <span className="font-semibold">extreme caution</span>.</> },
                { icon: Info, text: "Verify the website's authenticity before interacting." },
                { icon: AlertCircle, text: "Be wary of requests for login credentials or personal data." },
            ];
        } else {
            specificRecs = [
                 { icon: CheckCircle, text: "The URL appears safe, but always browse carefully." },
            ];
        }

        return [...specificRecs, ...baseRecs].map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <rec.icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{rec.text}</span>
            </li>
        ));
    };


  return (
    <TooltipProvider>
        <div className="flex flex-col items-center justify-start min-h-screen py-12 px-4 sm:px-8 transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-8">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                    SafeCrawl
                </h1>
            </div>

            {/* Search Bar Section - Glassmorphism */}
            <div
                className="w-full max-w-2xl mb-8 p-4 glassmorphism-card"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                >
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                        type="url"
                        placeholder="Enter or drag & drop URL (e.g., https://example.com)"
                        className="flex-grow rounded-full shadow-inner bg-white/80 border-transparent focus:ring-primary focus:border-primary h-12 text-base px-5" // Pill shape, inset shadow via className
                        value={url}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                        aria-label="URL Input"
                    />
                    <Button
                        onClick={analyze}
                        disabled={isLoading || !url}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-md h-12 px-6 text-base font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed neon-glow-hover flex items-center justify-center gap-2 w-full sm:w-auto" // Pill shape, neon glow on hover
                        aria-label="Analyze URL"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Analyzing...
                            </>
                            ) : (
                            <>
                                <Link2 className="h-5 w-5" />
                                Analyze
                            </>
                        )}
                    </Button>
                </div>
                 {/* Progress Bar */}
                {isLoading && (
                    <div className="w-full mt-4 px-1">
                        <Progress value={progress} className="bg-gray-200 h-1.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-primary" />
                    </div>
                )}
            </div>


        {/* Results Section */}
        {!isLoading && riskResult && (
            <Card className="w-full max-w-2xl rounded-xl shadow-lg bg-white border border-gray-200/80 transition-all duration-500 ease-out animate-result-appear">
                <CardHeader className={cn("rounded-t-xl p-4 border-b flex flex-row items-center justify-between", riskLevelDetails?.bg, riskLevelDetails?.border)}>
                     {/* Risk Level Badge */}
                    <div className="flex items-center gap-2">
                        {riskLevelDetails && (
                             <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                                riskLevelDetails.tagColor,
                                riskLevelDetails.color === 'warning' ? 'text-black' : 'text-white' // Ensure contrast for warning
                                )}>
                                 <riskLevelDetails.icon className="h-4 w-4" />
                                 {riskLevelDetails.label}
                             </span>
                        )}
                         <CardTitle className="text-lg font-semibold text-foreground">
                            Analysis Result
                        </CardTitle>
                    </div>
                    <span className="text-sm font-normal text-gray-600">
                        Confidence: {riskResult.confidenceScore}%
                    </span>
                </CardHeader>
                <CardContent className="p-5 grid gap-5">
                    {/* Summary Section - Ribbon Style */}
                     <section>
                         <h2 className="text-base font-semibold flex items-center gap-2 mb-2 text-gray-500 uppercase tracking-wider">Summary</h2>
                        {riskLevelDetails ? (
                            <div className={cn("ribbon-label h-7 flex items-center", `bg-${riskLevelDetails.color}`)}>
                                 {riskResult.isSafe
                                    ? "This URL appears to be safe."
                                    : `Potential risks identified: ${riskResult.riskReasons.join(', ') || 'General warning'}.`}
                            </div>
                        ) : (
                             <p className="text-gray-500 italic">Loading summary...</p>
                         )}
                    </section>


                    {/* Details Section - Collapsible */}
                    {riskResult.detailedAnalysis && (
                        <section>
                            <Accordion type="single" collapsible value={detailsOpen ? "item-1" : ""} onValueChange={(value) => setDetailsOpen(!!value)}>
                                <AccordionItem value="item-1" className="border-b-0">
                                    <AccordionTrigger className="text-base font-semibold flex items-center justify-between w-full mb-1 text-gray-500 uppercase tracking-wider hover:no-underline py-1">
                                        <div className="flex items-center gap-2">
                                            Details
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>In-depth explanation of findings.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        {detailsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                        <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm leading-relaxed pl-2">
                                            {riskResult.detailedAnalysis.split('\n').map((point, index) => (
                                            point.trim().startsWith('•') || point.trim() ? <li key={index}>{point.replace(/^•\s*/, '').trim()}</li> : null
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </section>
                    )}


                    {/* Recommendations Section */}
                    <section>
                         <h2 className="text-base font-semibold flex items-center gap-2 mb-2 text-gray-500 uppercase tracking-wider">Recommendations</h2>
                        <ul className="space-y-2">
                            {renderRecommendations(riskLevelDetails)}
                        </ul>
                    </section>
                </CardContent>
                {/* Feedback Footer */}
                 <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <AlertDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-md shadow-sm text-xs hover:bg-gray-100" disabled={!riskResult}>Provide Feedback</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-lg shadow-md bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Provide Feedback on Analysis</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                            Help improve SafeCrawl! If you believe the analysis for <span className="font-medium text-primary break-all">{url}</span> is inaccurate, please provide details.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="feedback-text" className="text-right text-gray-700 text-sm">
                                    Feedback
                                </Label>
                                <Textarea
                                    id="feedback-text"
                                    value={feedbackText}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
                                    placeholder="e.g., This URL is actually safe because..."
                                    className="col-span-3 h-24 rounded-md border-gray-300 focus:ring-primary focus:border-primary text-sm" // Smaller text
                                />
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-md hover:bg-gray-100 text-xs px-3 py-1.5 h-auto">Cancel</AlertDialogCancel>
                            <Button
                                onClick={submitFeedback}
                                disabled={isSubmittingFeedback || !feedbackText.trim()}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm text-xs px-3 py-1.5 h-auto flex items-center gap-1"
                            >
                            {isSubmittingFeedback ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            {isSubmittingFeedback ? "Submitting..." : "Submit"}
                            </Button>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </Card>
        )}
        </div>
    </TooltipProvider>
  );
}
