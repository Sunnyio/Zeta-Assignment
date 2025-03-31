
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

interface AttendanceInsightsProps {
  apiUrl: string;
}

export default function AttendanceInsights({ apiUrl }: AttendanceInsightsProps) {
  const [query, setQuery] = useState("");
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_query: query
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      
      const data = await response.json();
      
      if (data.insights) {
        setInsights(data.insights);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch insights");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchInsights();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="query">Ask a question about attendance data</Label>
          <Textarea
            id="query"
            placeholder="Ex: Who has the most absences? Which department has the best attendance?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Generating insights..." : "Generate Insights"}
          <BrainCircuit className="ml-2 h-4 w-4" />
        </Button>
      </form>
      
      {insights && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-medium mb-2">AI Insights</h3>
              <div className="whitespace-pre-line">{insights}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
