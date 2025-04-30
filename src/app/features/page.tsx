
// src/app/features/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, BarChart, Users, ShieldCheck, AlertTriangle, Activity, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Analysis",
    description: "Leverages advanced AI to detect sophisticated phishing, malware, and scam sites beyond simple blocklists.",
  },
  {
    icon: BarChart,
    title: "Detailed Risk Breakdown",
    description: "Provides clear explanations for each identified risk, helping you understand the potential threats.",
  },
  {
    icon: ShieldCheck,
    title: "Confidence Scoring",
    description: "Get a confidence score for each analysis, indicating the AI's certainty about the risk assessment.",
  },
  {
    icon: Users,
    title: "Dynamic Learning & Feedback",
    description: "Continuously improves accuracy by learning from new threats and incorporating user feedback.",
  },
    {
    icon: Activity,
    title: "Real-time Scanning",
    description: "Analyzes URLs on-demand, providing up-to-the-minute insights into potential dangers.",
  },
   {
    icon: CheckCircle,
    title: "Actionable Recommendations",
    description: "Offers clear guidance on how to proceed based on the analysis results, helping you stay safe online.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
       <div className="text-center mb-12">
           <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">SafeCrawl Features</h1>
           <p className="text-lg text-muted-foreground">Discover the powerful capabilities that make SafeCrawl your essential online safety companion.</p>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden bg-card border border-border/20">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-primary/5">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
       