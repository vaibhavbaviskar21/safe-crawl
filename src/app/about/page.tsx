
// src/app/about/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg rounded-lg overflow-hidden bg-card border border-border/30">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold text-foreground">About SafeCrawl</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-muted-foreground">
          <p>
            SafeCrawl is a modern cybersecurity tool designed to protect users from online threats by analyzing URLs for potential risks. We leverage cutting-edge AI technology to provide accurate and detailed assessments of website safety.
          </p>
          <p>
            Our mission is to make the internet a safer place by empowering users with the information they need to navigate online securely. SafeCrawl checks for various threats, including phishing scams, malware distribution, and suspicious domain activities.
          </p>
           <h3 className="text-lg font-semibold text-foreground pt-4">How it Works</h3>
           <p>
            Simply enter a URL into the analysis bar, and SafeCrawl's AI engine will perform a comprehensive scan. The results provide a clear risk level (Safe, Warning, or Dangerous), a summary of findings, detailed explanations for any identified risks, and actionable recommendations to help you stay safe.
           </p>
           <h3 className="text-lg font-semibold text-foreground pt-4">Our Technology</h3>
           <p>
            We utilize advanced machine learning models trained on vast datasets of known malicious and safe websites. Our system continuously learns and adapts to new threats, ensuring our analysis remains up-to-date and effective. We also incorporate user feedback to further refine our detection capabilities.
           </p>
           <p>
            Built with performance and user experience in mind, SafeCrawl uses modern web technologies like Next.js and relies on robust backend infrastructure to deliver fast and reliable results.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
       