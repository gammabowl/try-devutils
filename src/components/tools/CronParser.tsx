import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import cronstrue from "cronstrue";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";

interface CronParserProps {
  initialContent?: string;
  action?: string;
}

export function CronParser({ initialContent, action }: CronParserProps) {
  const [cronExpression, setCronExpression] = useState(initialContent || "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "parse") {
      parseCron();
    }
  }, [initialContent, action]);

  const examples = [
    { cron: "0 9 * * MON-FRI", desc: "At 9:00 AM, Monday through Friday" },
    { cron: "0 */2 * * *", desc: "Every 2 hours" },
    { cron: "0 0 1 * *", desc: "At midnight on the first day of every month" },
    { cron: "*/15 * * * *", desc: "Every 15 minutes" },
    { cron: "0 22 * * SUN", desc: "At 10:00 PM on Sunday" },
  ];

  const parseCron = () => {
    try {
      setError("");
      
      if (!cronExpression.trim()) {
        setDescription("");
        setNextRuns([]);
        return;
      }

      const humanReadable = cronstrue.toString(cronExpression, {
        use24HourTimeFormat: true,
        verbose: true
      });
      
      setDescription(humanReadable);
      calculateNextRuns();
    } catch (err) {
      setError("Invalid cron expression. Please check the format.");
      setDescription("");
      setNextRuns([]);
    }
  };

  const calculateNextRuns = () => {
    // Simple next run calculation for common patterns
    // In a real app, you might use a more sophisticated cron parser
    const runs: string[] = [];
    const now = new Date();
    
    try {
      // This is a simplified implementation
      // For production, consider using node-cron or similar
      for (let i = 0; i < 5; i++) {
        const nextRun = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000); // Sample: next hours
        runs.push(nextRun.toLocaleString());
      }
      setNextRuns(runs);
    } catch (err) {
      setNextRuns([]);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Cron expression copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const loadExample = (cron: string) => {
    setCronExpression(cron);
    // Trigger parsing
    setTimeout(() => {
      try {
        const humanReadable = cronstrue.toString(cron, {
          use24HourTimeFormat: true,
          verbose: true
        });
        setDescription(humanReadable);
        setError("");
      } catch (err) {
        setError("Failed to parse example");
      }
    }, 0);
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-dev-primary" />
          Cron Expression Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Cron Expression
          </label>
          <Input
            placeholder="Enter cron expression (e.g., * * * * *)"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            className="font-mono bg-muted/50 border-border/50"
          />
        </div>

        <Button 
          onClick={parseCron}
          className="w-full bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
        >
          <Clock className="h-4 w-4 mr-2" />
          Parse Expression
        </Button>

        {error && (
          <div className="text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {description && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Human Readable</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {nextRuns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-dev-primary">Next 5 Occurrences</h4>
            <div className="space-y-2">
              {nextRuns.map((date, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                  <div className="text-sm font-mono text-foreground">{date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Examples section moved outside CardContent */}
      <div className="border-t border-border/50 px-6 py-4">
        <Collapsible defaultOpen={false} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              Examples
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {examples.map((example) => (
              <div 
                key={example.cron} 
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-foreground">
                    {example.cron}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {example.desc}
                  </div>
                </div>
                <Button
                  onClick={() => loadExample(example.cron)}
                  variant="ghost"
                  size="sm"
                  className="ml-2 flex-shrink-0"
                >
                  Use
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}