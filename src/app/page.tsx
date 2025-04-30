
"use client";

import { useState, useCallback, ChangeEvent, DragEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { analyzeUrlDetailed, AnalyzeUrlDetailedOutput } from "@/ai/flows/detailed-risk-breakdown";
import { analyzeUrlWithFeedback, AnalyzeUrlWithFeedbackOutput } from "@/ai/flows/dynamic-ai-feedback";
import { Info, ShieldCheck, AlertTriangle, XOctagon, Link2, Loader2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, ShieldAlert, Ban, Cpu, BarChart, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"; // Import Badge

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
  // Use confidence score and reasons to determine dangerous vs warning
  if (riskAssessment.confidenceScore >= 70 && riskAssessment.riskReasons.length > 0) return riskLevels.dangerous;
  if (riskAssessment.riskReasons.length > 0) return riskLevels.warning;
  return riskLevels.safe; // Default to safe if no reasons
};

// Placeholder Recent Scan Data
const recentScans = [
  { id: 1, url: "https://example-safe.com", risk: "Safe", tagColor: "bg-success" },
  { id: 2, url: "http://suspicious-site.net", risk: "Warning", tagColor: "bg-warning" },
  { id: 3, url: "https://malicious-url-test.org/login", risk: "Dangerous", tagColor: "bg-danger" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const analyze = useCallback(async (targetUrl?: string) => {
    const urlToAnalyze = targetUrl || url;
    if (!urlToAnalyze) {
      toast({ title: "Input Required", description: "Please enter a URL to analyze.", variant: "destructive" });
      return;
    }
    try {
      new URL(urlToAnalyze);
    } catch (_) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL format (e.g., https://example.com).", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setRiskResult(null);
    setProgress(0);

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 95) {
          clearInterval(timer);
          return 95;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 95);
      });
    }, 300);

    try {
      const result = await analyzeUrlDetailed({ url: urlToAnalyze });
      clearInterval(timer);
      setProgress(100);
      setRiskResult(result.riskAssessment);
      toast({ title: "Analysis Complete", description: `URL ${result.riskAssessment.isSafe ? 'seems safe' : 'has potential risks'}.`, variant: result.riskAssessment.isSafe ? 'default' : 'destructive' });
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
      setTimeout(() => setProgress(0), 1000);
      // Scroll to results after analysis (optional)
       const resultsElement = document.getElementById("results-section");
       resultsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [url, toast]);


   const handleReanalyze = (scanUrl: string) => {
        setUrl(scanUrl); // Set the input field
        analyze(scanUrl); // Trigger analysis with the specific URL
    };


  const submitFeedback = useCallback(async () => {
    if (!url || !feedbackText.trim()) {
      toast({ title: "Feedback Required", description: "Please enter your feedback before submitting.", variant: "destructive" });
      return;
    }
    setIsSubmittingFeedback(true);

    try {
      const result: AnalyzeUrlWithFeedbackOutput = await analyzeUrlWithFeedback({ url, feedback: feedbackText });
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
        // analyze(droppedUrl); // Optionally analyze on drop
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
    } else { // Safe
      specificRecs = [
        { icon: CheckCircle, text: "The URL appears safe, but always browse carefully." },
      ];
    }
    return [...specificRecs, ...baseRecs].map((rec, index) => (
      <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <rec.icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <span>{rec.text}</span>
      </li>
    ));
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-start min-h-screen transition-colors duration-300 pt-8 pb-16">

        {/* Hero Section */}
        <section className="w-full max-w-3xl text-center px-4 sm:px-8 mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              SafeCrawl
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Your shield against malicious links. Analyze any URL instantly with AI.
          </p>
          {/* Search Bar - Enhanced */}
          <div
            className="relative w-full p-1 bg-white/70 dark:bg-black/50 backdrop-filter backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-full shadow-lg"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="Enter or drag & drop URL (e.g., https://example.com)"
                className="flex-grow rounded-full shadow-inner bg-transparent border-none focus:ring-0 h-12 text-base px-5 placeholder-muted-foreground"
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                aria-label="URL Input"
              />
              <Button
                onClick={() => analyze()}
                disabled={isLoading || !url}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-md h-12 px-6 text-base font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed neon-glow-hover flex items-center justify-center gap-2 shrink-0"
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
                 <div className="absolute bottom-0 left-0 right-0 h-1 px-1 pb-1">
                    <Progress value={progress} className="bg-gray-200/50 h-0.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-primary" />
                </div>
             )}
          </div>
        </section>


         {/* Results Section - Appears Conditionally */}
          <section id="results-section" className="w-full max-w-2xl px-4 sm:px-8 mb-12 transition-all duration-500 ease-out">
            {!isLoading && riskResult && (
                <Card className="rounded-xl shadow-lg bg-card border border-border/30 animate-result-appear overflow-hidden">
                    <CardHeader className={cn("rounded-t-xl p-4 border-b flex flex-row items-center justify-between", riskLevelDetails?.bg, riskLevelDetails?.border)}>
                        <div className="flex items-center gap-2">
                            {riskLevelDetails && (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                                    riskLevelDetails.tagColor,
                                    riskLevelDetails.color === 'warning' ? 'text-black' : 'text-white' // Better contrast for warning
                                )}>
                                    <riskLevelDetails.icon className="h-4 w-4" />
                                    {riskLevelDetails.label}
                                </span>
                            )}
                            <CardTitle className="text-lg font-semibold text-foreground">
                                Analysis Result
                            </CardTitle>
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">
                            Confidence: {riskResult.confidenceScore}%
                        </span>
                    </CardHeader>
                    <CardContent className="p-5 grid gap-5">
                         {/* Summary Section */}
                        <section>
                            <h2 className="text-base font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wider">Summary</h2>
                             {riskLevelDetails ? (
                                <div className={cn(
                                    "p-3 rounded-md text-sm",
                                    riskLevelDetails.bg,
                                    riskLevelDetails.border,
                                    riskLevelDetails.textClass,
                                    "border"
                                    )}>
                                     {riskResult.isSafe
                                        ? "This URL appears to be safe based on our analysis."
                                        : `Potential risks identified: ${riskResult.riskReasons.join(', ') || 'General warning raised'}. Exercise caution.`}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">Loading summary...</p>
                            )}
                        </section>


                        {/* Details Section - Collapsible */}
                        {riskResult.detailedAnalysis && (
                            <section>
                                <Accordion type="single" collapsible value={detailsOpen ? "item-1" : ""} onValueChange={(value) => setDetailsOpen(!!value)}>
                                    <AccordionItem value="item-1" className="border-b-0">
                                        <AccordionTrigger className="text-base font-semibold flex items-center justify-between w-full mb-1 text-muted-foreground uppercase tracking-wider hover:no-underline py-1">
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
                                            {/* Chevron is part of AccordionTrigger now */}
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-sm leading-relaxed pl-2">
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
                            <h2 className="text-base font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wider">Recommendations</h2>
                            <ul className="space-y-2">
                                {renderRecommendations(riskLevelDetails)}
                            </ul>
                        </section>
                    </CardContent>
                     {/* Feedback Footer */}
                    <div className="p-4 border-t bg-gray-50/50 dark:bg-black/20 rounded-b-xl flex justify-end">
                        <AlertDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-md shadow-sm text-xs hover:bg-accent/50" disabled={!riskResult}>Provide Feedback</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-lg shadow-md bg-background">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Provide Feedback on Analysis</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                Help improve SafeCrawl! If you believe the analysis for <span className="font-medium text-primary break-all">{url}</span> is inaccurate, please provide details.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="feedback-text" className="text-right text-sm">
                                        Feedback
                                    </Label>
                                    <Textarea
                                        id="feedback-text"
                                        value={feedbackText}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
                                        placeholder="e.g., This URL is actually safe because..."
                                        className="col-span-3 h-24 rounded-md text-sm"
                                    />
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md text-xs px-3 py-1.5 h-auto">Cancel</AlertDialogCancel>
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
        </section>


         {/* Recent Scans Section (Placeholder) */}
         <section className="w-full max-w-4xl px-4 sm:px-8 mb-16">
             <h2 className="text-2xl font-semibold mb-6 text-center text-foreground">Recent Scans</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentScans.map((scan) => (
                    <Card key={scan.id} className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                             <CardTitle className="text-sm font-medium truncate" title={scan.url}>
                                {scan.url}
                            </CardTitle>
                            <Badge variant="outline" className={cn(
                                "text-xs px-2 py-0.5",
                                scan.tagColor,
                                scan.risk === 'Warning' ? 'text-black' : 'text-white'
                                )}>
                                {scan.risk}
                            </Badge>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            {/* Add timestamp or minimal details if needed */}
                             <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" onClick={() => handleReanalyze(scan.url)}>
                                Re-analyze
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* Placeholder if no recent scans */}
            {/* <p className="text-center text-muted-foreground mt-4">No recent scans yet.</p> */}
         </section>


        {/* Features Section */}
        <section className="w-full max-w-5xl px-4 sm:px-8 mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center text-foreground">Why Choose SafeCrawl?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md border border-border/20">
              <Cpu className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-muted-foreground">Leverages advanced AI to detect sophisticated phishing, malware, and scam sites.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md border border-border/20">
              <BarChart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Detailed Risk Breakdown</h3>
              <p className="text-sm text-muted-foreground">Get clear explanations for each identified risk, not just a simple warning.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md border border-border/20">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dynamic Learning</h3>
              <p className="text-sm text-muted-foreground">Continuously improves its accuracy by learning from new threats and user feedback.</p>
            </div>
          </div>
        </section>

      </div>
    </TooltipProvider>
  );
}
