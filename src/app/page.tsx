
"use client";

import { useState, useCallback, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { analyzeUrlDetailed, AnalyzeUrlDetailedOutput } from "@/ai/flows/detailed-risk-breakdown";
import { analyzeUrlWithFeedback, AnalyzeUrlWithFeedbackOutput } from "@/ai/flows/dynamic-ai-feedback";
import { Info, ShieldCheck, AlertTriangle, XOctagon, Link2, Loader2, CheckCircle, AlertCircle, ShieldAlert, Ban, Cpu, BarChart, Users, Clock, Globe, Lock, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Combined type for risk assessment results
type RiskResult = AnalyzeUrlDetailedOutput['riskAssessment'] & { detailedAnalysis?: string };

// Recent scan entry stored in localStorage
interface ScanHistoryEntry {
  id: string;
  url: string;
  risk: "Safe" | "Warning" | "Dangerous";
  confidenceScore: number;
  timestamp: number;
}

const HISTORY_KEY = "safecrawl_scan_history";
const MAX_HISTORY = 6;

// Risk Level Definitions with Icons and Colors
const riskLevels = {
  safe: { label: "Safe", color: "success", icon: ShieldCheck, bg: "bg-success/10", border: "border-success/30", tagColor: "bg-success", textClass: "text-success" },
  warning: { label: "Warning", color: "warning", icon: AlertTriangle, bg: "bg-warning/10", border: "border-warning/30", tagColor: "bg-warning", textClass: "text-warning" },
  dangerous: { label: "Dangerous", color: "danger", icon: XOctagon, bg: "bg-danger/10", border: "border-danger/30", tagColor: "bg-danger", textClass: "text-danger" },
};

const getRiskLevelDetails = (riskAssessment: RiskResult | null) => {
  if (!riskAssessment) return null;
  if (riskAssessment.isSafe) return riskLevels.safe;
  // Threshold of 60 aligns with the heuristic scoring in url-scan.ts, where a single
  // high-severity signal (e.g., IP hostname = 40pts, typosquatting = 50pts) reliably
  // crosses this mark, while low-severity single findings stay below it (Warning).
  if (riskAssessment.confidenceScore >= 60 && riskAssessment.riskReasons.length > 0) return riskLevels.dangerous;
  if (riskAssessment.riskReasons.length > 0) return riskLevels.warning;
  return riskLevels.safe;
};

const getRiskLabel = (result: RiskResult): "Safe" | "Warning" | "Dangerous" => {
  if (result.isSafe) return "Safe";
  if (result.confidenceScore >= 60 && result.riskReasons.length > 0) return "Dangerous";
  if (result.riskReasons.length > 0) return "Warning";
  return "Safe";
};

function loadHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ScanHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: ScanHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [scannedUrl, setScannedUrl] = useState(""); // URL that was actually scanned
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const { toast } = useToast();
  const isDraggingRef = useRef(false);

  // Load history from localStorage on mount
  useEffect(() => {
    setScanHistory(loadHistory());
  }, []);

  const addToHistory = useCallback((entry: ScanHistoryEntry) => {
    setScanHistory((prev) => {
      // Deduplicate by URL — keep newest
      const filtered = prev.filter((e) => e.url !== entry.url);
      const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
    saveHistory([]);
    toast({ title: "History Cleared", description: "Your scan history has been removed." });
  }, [toast]);

  const analyze = useCallback(async (targetUrl?: string) => {
    const urlToAnalyze = (targetUrl || url).trim();
    if (!urlToAnalyze) {
      toast({ title: "Input Required", description: "Please enter a URL to analyze.", variant: "destructive" });
      return;
    }
    try {
      new URL(urlToAnalyze);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid URL (e.g., https://example.com).", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setRiskResult(null);
    setProgress(0);
    setDetailsOpen(false);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(timer); return 90; }
        return Math.min(prev + Math.random() * 12, 90);
      });
    }, 280);

    try {
      const start = Date.now();
      const result = await analyzeUrlDetailed({ url: urlToAnalyze });
      clearInterval(timer);
      setProgress(100);
      const elapsed = Date.now() - start;
      setScanTime(elapsed);
      setScannedUrl(urlToAnalyze);
      setRiskResult(result.riskAssessment);

      const riskLabel = getRiskLabel(result.riskAssessment);
      addToHistory({
        id: crypto.randomUUID(),
        url: urlToAnalyze,
        risk: riskLabel,
        confidenceScore: result.riskAssessment.confidenceScore,
        timestamp: Date.now(),
      });

      toast({
        title: "Analysis Complete",
        description: result.riskAssessment.isSafe ? "The URL appears safe." : "Potential risks were identified. Review results carefully.",
        variant: result.riskAssessment.isSafe ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error analyzing URL:", error);
      clearInterval(timer);
      setProgress(100);
      setRiskResult({
        isSafe: false,
        riskReasons: ["Analysis service unavailable"],
        confidenceScore: 0,
        detailedAnalysis: "The analysis service is currently unavailable. Please try again later.",
      });
      toast({ title: "Analysis Failed", description: "Could not complete the analysis. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 800);
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [url, toast, addToHistory]);

  const handleReanalyze = useCallback((scanUrl: string) => {
    setUrl(scanUrl);
    analyze(scanUrl);
  }, [analyze]);

  const submitFeedback = useCallback(async () => {
    if (!scannedUrl || !feedbackText.trim()) {
      toast({ title: "Feedback Required", description: "Please enter your feedback before submitting.", variant: "destructive" });
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      const result: AnalyzeUrlWithFeedbackOutput = await analyzeUrlWithFeedback({ url: scannedUrl, feedback: feedbackText });
      setRiskResult((prev) => prev ? { ...prev, ...result.riskAssessment, detailedAnalysis: result.explanation } : null);
      setFeedbackText("");
      setFeedbackDialogOpen(false);
      toast({ title: "Feedback Submitted", description: "Thank you for helping improve SafeCrawl!" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Feedback Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingFeedback(false);
    }
  }, [scannedUrl, feedbackText, toast]);

  const riskLevelDetails = getRiskLevelDetails(riskResult);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      e.currentTarget.classList.add("ring-2", "ring-primary");
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    e.currentTarget.classList.remove("ring-2", "ring-primary");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = false;
    e.currentTarget.classList.remove("ring-2", "ring-primary");
    const dropped = e.dataTransfer?.getData("URL") || e.dataTransfer?.getData("text");
    if (dropped) {
      try {
        new URL(dropped);
        setUrl(dropped);
        toast({ title: "URL Dropped", description: "Click Analyze to scan the dropped URL." });
      } catch {
        toast({ title: "Invalid Drop", description: "The dropped item is not a valid URL.", variant: "destructive" });
      }
    }
  };

  const renderRecommendations = (level: typeof riskLevels.safe | typeof riskLevels.warning | typeof riskLevels.dangerous | null) => {
    const baseRecs = [
      { icon: CheckCircle, text: "Always keep your browser and security software up to date." },
      { icon: ShieldAlert, text: "Be cautious of unsolicited links or unexpected downloads." },
    ];
    let specificRecs: { icon: typeof CheckCircle; text: React.ReactNode }[] = [];
    if (level?.label === "Dangerous") {
      specificRecs = [
        { icon: Ban, text: <><span className="font-semibold">Do not visit</span> this URL — it has been flagged as high risk.</> },
        { icon: AlertCircle, text: "Never enter personal, financial, or login credentials on this page." },
        { icon: ShieldAlert, text: "Consider reporting this URL to your browser's safe-browsing service." },
      ];
    } else if (level?.label === "Warning") {
      specificRecs = [
        { icon: AlertTriangle, text: <>Proceed with <span className="font-semibold">extreme caution</span> if you must visit.</> },
        { icon: Info, text: "Verify the website's identity independently before interacting." },
        { icon: AlertCircle, text: "Be wary of any requests for credentials or personal data." },
      ];
    } else {
      specificRecs = [
        { icon: CheckCircle, text: "The URL appears safe — always stay alert while browsing." },
        { icon: Lock, text: "Look for the padlock icon in your browser's address bar to confirm HTTPS." },
      ];
    }
    return [...specificRecs, ...baseRecs].map((rec, index) => (
      <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <rec.icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <span>{rec.text}</span>
      </li>
    ));
  };

  // Derive host for display
  let displayHost = scannedUrl;
  try { displayHost = new URL(scannedUrl).hostname; } catch { /* leave as-is */ }

  const historyRiskColors: Record<string, string> = {
    Safe: "bg-success text-white",
    Warning: "bg-warning text-black",
    Dangerous: "bg-danger text-white",
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-start min-h-screen transition-colors duration-300 pt-8 pb-16">

        {/* Hero Section */}
        <section className="w-full max-w-3xl text-center px-4 sm:px-8 mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              SafeCrawl
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-2">
            Your AI-powered shield against malicious links.
          </p>
          <p className="text-sm text-muted-foreground mb-7">
            Instantly analyze any URL for phishing, malware, and suspicious patterns — for free.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-7 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 border border-border/30">
              <Lock className="h-3.5 w-3.5 text-success" /> HTTPS Encrypted
            </span>
            <span className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 border border-border/30">
              <Cpu className="h-3.5 w-3.5 text-primary" /> AI-Powered
            </span>
            <span className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 border border-border/30">
              <Globe className="h-3.5 w-3.5 text-blue-500" /> Real-time Analysis
            </span>
          </div>

          {/* Search Bar */}
          <div
            className="relative w-full p-1 bg-white/70 dark:bg-black/50 backdrop-filter backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-full shadow-lg transition-all duration-200"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="Enter or drag & drop a URL (e.g., https://example.com)"
                className="flex-grow rounded-full shadow-inner bg-transparent border-none focus:ring-0 h-12 text-base px-5 placeholder-muted-foreground"
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !isLoading) analyze(); }}
                aria-label="URL Input"
              />
              <Button
                onClick={() => analyze()}
                disabled={isLoading || !url.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-md h-12 px-6 text-base font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed neon-glow-hover flex items-center justify-center gap-2 shrink-0"
                aria-label="Analyze URL"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Analyzing…</>
                ) : (
                  <><Link2 className="h-5 w-5" />Analyze</>
                )}
              </Button>
            </div>
            {isLoading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 px-1 pb-1">
                <Progress value={progress} className="bg-gray-200/50 h-0.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-primary" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">You can also drag and drop a link directly into the box above.</p>
        </section>

        {/* Loading skeleton */}
        {isLoading && (
          <section className="w-full max-w-2xl px-4 sm:px-8 mb-12">
            <Card className="rounded-xl shadow-lg bg-card border border-border/30 overflow-hidden">
              <CardHeader className="p-4 border-b bg-muted/30">
                <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-4/6 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Results Section */}
        <section id="results-section" className="w-full max-w-2xl px-4 sm:px-8 mb-12 transition-all duration-500 ease-out">
          {!isLoading && riskResult && (
            <Card className="rounded-xl shadow-lg bg-card border border-border/30 animate-result-appear overflow-hidden">
              <CardHeader className={cn("rounded-t-xl p-4 border-b flex flex-row items-center justify-between", riskLevelDetails?.bg, riskLevelDetails?.border)}>
                <div className="flex items-center gap-2 flex-wrap">
                  {riskLevelDetails && (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                      riskLevelDetails.tagColor,
                      riskLevelDetails.color === "warning" ? "text-black" : "text-white"
                    )}>
                      <riskLevelDetails.icon className="h-4 w-4" />
                      {riskLevelDetails.label}
                    </span>
                  )}
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Analysis Result
                  </CardTitle>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    Confidence: <span className="font-semibold text-foreground">{riskResult.confidenceScore}%</span>
                  </span>
                  {scanTime !== null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{(scanTime / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 grid gap-5">

                {/* Scanned URL */}
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40 border border-border/20 text-sm overflow-hidden">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-xs text-muted-foreground" title={scannedUrl}>{displayHost}</span>
                  <Badge variant="outline" className="ml-auto text-xs shrink-0">
                    {scannedUrl.startsWith("https") ? "HTTPS" : "HTTP"}
                  </Badge>
                </div>

                {/* Summary */}
                <section>
                  <h2 className="text-xs font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wider">Summary</h2>
                  {riskLevelDetails ? (
                    <div className={cn("p-3 rounded-md text-sm border", riskLevelDetails.bg, riskLevelDetails.border, riskLevelDetails.textClass)}>
                      {riskResult.isSafe
                        ? "This URL appears to be safe based on our analysis. No significant risks were detected."
                        : `Potential risks identified: ${riskResult.riskReasons.slice(0, 3).join("; ")}${riskResult.riskReasons.length > 3 ? ` (+${riskResult.riskReasons.length - 3} more)` : ""}. Exercise caution.`}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">Loading summary…</p>
                  )}
                </section>

                {/* Risk Reasons as tags */}
                {!riskResult.isSafe && riskResult.riskReasons.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wider">Risk Indicators</h2>
                    <div className="flex flex-wrap gap-2">
                      {riskResult.riskReasons.map((reason, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger border border-danger/20 rounded-full px-2.5 py-1 font-medium">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Detailed Analysis - Collapsible */}
                {riskResult.detailedAnalysis && (
                  <section>
                    <Accordion type="single" collapsible value={detailsOpen ? "item-1" : ""} onValueChange={(v) => setDetailsOpen(!!v)}>
                      <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline py-1">
                          <div className="flex items-center gap-2">
                            Detailed Analysis
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent><p>In-depth explanation of each finding.</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-1">
                            {riskResult.detailedAnalysis.split("\n").map((point, i) =>
                              point.trim() ? (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-primary shrink-0 mt-0.5">•</span>
                                  <span>{point.replace(/^[•\-]\s*/, "").trim()}</span>
                                </li>
                              ) : null
                            )}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </section>
                )}

                {/* Recommendations */}
                <section>
                  <h2 className="text-xs font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wider">Recommendations</h2>
                  <ul className="space-y-2">
                    {renderRecommendations(riskLevelDetails)}
                  </ul>
                </section>
              </CardContent>

              {/* Feedback Footer */}
              <div className="p-4 border-t bg-gray-50/50 dark:bg-black/20 rounded-b-xl flex justify-end">
                <AlertDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-md shadow-sm text-xs hover:bg-accent/50">
                      Provide Feedback
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-lg shadow-md bg-background">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Provide Feedback on Analysis</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Help improve SafeCrawl! If you believe the result for{" "}
                        <span className="font-medium text-primary break-all">{scannedUrl}</span>{" "}
                        is inaccurate, please share your thoughts.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="feedback-text" className="text-right text-sm pt-2">Feedback</Label>
                        <Textarea
                          id="feedback-text"
                          value={feedbackText}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
                          placeholder="e.g., This URL is actually safe because…"
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
                        {isSubmittingFeedback ? "Submitting…" : "Submit"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          )}
        </section>

        {/* Scan History Section */}
        <section className="w-full max-w-4xl px-4 sm:px-8 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Recent Scans</h2>
            {scanHistory.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1" onClick={clearHistory}>
                <Trash2 className="h-3.5 w-3.5" /> Clear history
              </Button>
            )}
          </div>

          {scanHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-muted/20">
              <Clock className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No scans yet — analyze a URL above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scanHistory.map((scan) => (
                <Card key={scan.id} className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                    <CardTitle className="text-sm font-medium truncate max-w-[180px]" title={scan.url}>
                      {(() => { try { return new URL(scan.url).hostname; } catch { return scan.url; } })()}
                    </CardTitle>
                    <Badge className={cn("text-xs px-2 py-0.5 border-0 shrink-0", historyRiskColors[scan.risk])}>
                      {scan.risk}
                    </Badge>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{formatTimeAgo(scan.timestamp)} · {scan.confidenceScore}% confidence
                    </p>
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" onClick={() => handleReanalyze(scan.url)}>
                      Re-analyze →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="w-full max-w-5xl px-4 sm:px-8 mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center text-foreground">Why Choose SafeCrawl?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md border border-border/20 hover:shadow-lg transition-shadow duration-300">
              <Cpu className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-muted-foreground">Leverages advanced AI to detect sophisticated phishing, malware, and scam sites — beyond simple blocklists.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md border border-border/20 hover:shadow-lg transition-shadow duration-300">
              <BarChart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Detailed Risk Breakdown</h3>
              <p className="text-sm text-muted-foreground">Receive clear, actionable explanations for every identified risk indicator — not just a generic warning label.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md border border-border/20 hover:shadow-lg transition-shadow duration-300">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dynamic Learning</h3>
              <p className="text-sm text-muted-foreground">Continuously improves its accuracy by learning from emerging threats and community feedback.</p>
            </div>
          </div>
        </section>

      </div>
    </TooltipProvider>
  );
}
