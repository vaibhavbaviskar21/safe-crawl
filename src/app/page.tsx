"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { analyzeUrlDetailed } from "@/ai/flows/detailed-risk-breakdown";
import { UrlRiskAssessment } from "@/services/url-scan";
import { Info, ShieldCheck, AlertTriangle, XOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

const riskLevels = {
  safe: { label: "Safe", color: "text-green-500", icon: ShieldCheck },
  warning: { label: "Warning", color: "text-orange-500", icon: AlertTriangle },
  dangerous: { label: "Dangerous", color: "text-red-500", icon: XOctagon },
};

const getRiskLevel = (riskAssessment: UrlRiskAssessment | null) => {
  if (!riskAssessment) return null;
  if (riskAssessment.isSafe) return riskLevels.safe;
  if (riskAssessment.riskReasons.length > 0 && riskAssessment.confidenceScore > 70) return riskLevels.dangerous;
  return riskLevels.warning;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [riskAssessment, setRiskAssessment] = useState<UrlRiskAssessment | null>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(async () => {
    setIsLoading(true);
    setProgress(30); // Simulate initial loading

    try {
      const result = await analyzeUrlDetailed({ url });

      setRiskAssessment(result.riskAssessment);
      setDetailedAnalysis(result.riskAssessment.detailedAnalysis);
      setProgress(100);
    } catch (error) {
      console.error("Error analyzing URL:", error);
      setRiskAssessment({
        isSafe: false,
        riskReasons: ["Analysis Failed"],
        confidenceScore: 100,
      });
      setDetailedAnalysis("The AI analysis failed to complete. Please try again later.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [url]);

  const riskLevel = getRiskLevel(riskAssessment);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const droppedUrl = e.dataTransfer.getData("URL") || e.dataTransfer.getData("text");
    if (droppedUrl) {
      setUrl(droppedUrl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-24 px-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-primary">
        SafeCrawl - URL Risk Analyzer
      </h1>

      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-4 mb-8">
        <Input
          type="url"
          placeholder="Enter or drag a URL to analyze"
          className="flex-grow rounded-md shadow-sm focus:ring-primary focus:border-primary"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        <Button onClick={analyze} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md shadow-sm">
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      {isLoading && (
        <div className="w-full max-w-2xl mb-8">
          <Progress value={progress} className="bg-secondary h-2 rounded-full" />
        </div>
      )}

      {riskAssessment && (
        <Card className="w-full max-w-2xl rounded-lg shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              {riskLevel ? (
                <>
                  <riskLevel.icon className={riskLevel.color + " h-5 w-5"} />
                  {`Risk Level: ${riskLevel.label}`}
                </>
              ) : "Analysis Results"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {riskLevel ? `This URL has been assessed as ${riskLevel.label}.` : "Analyzing URL..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Summary <Info className="h-4 w-4 text-muted-foreground cursor-help" title="Quick overview of risk level." />
              </h2>
              {riskLevel ? (
                <p className={cn(riskLevel.color, "font-medium")}>
                  {riskLevel.label} - Confidence: {riskAssessment.confidenceScore}%
                </p>
              ) : (
                <p>Analyzing...</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Details <Info className="h-4 w-4 text-muted-foreground cursor-help" title="In-depth explanation of the detected risks." />
              </h2>
              {detailedAnalysis ? (
                <p>{detailedAnalysis}</p>
              ) : (
                <p>No details available.</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Recommendations <Info className="h-4 w-4 text-muted-foreground cursor-help" title="Steps for the user to take based on analysis." />
              </h2>
              {riskLevel && riskLevel.label === "Dangerous" ? (
                <ul className="list-disc list-inside">
                  <li>Avoid this URL.</li>
                  <li>Report to relevant authorities.</li>
                </ul>
              ) : riskLevel && riskLevel.label === "Warning" ? (
                <ul className="list-disc list-inside">
                  <li>Proceed with caution.</li>
                  <li>Verify the authenticity of the website.</li>
                </ul>
              ) : (
                <p>This URL is considered safe.</p>
              )}
            </section>
          </CardContent>
        </Card>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="mt-8 rounded-md shadow-sm">Dynamic AI Feedback</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-lg shadow-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Feedback</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This feature is not implemented yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md shadow-sm">Accept</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
