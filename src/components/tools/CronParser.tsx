import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import cronstrue from "cronstrue";

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
          <div className="flex gap-2">
            <Input
              placeholder="0 9 * * MON-FRI"
              value={cronExpression}
              onChange={(e) => {
                setCronExpression(e.target.value);
                // Auto-parse as user types
                if (e.target.value.trim()) {
                  setTimeout(() => {
                    try {
                      setError("");
                      const humanReadable = cronstrue.toString(e.target.value, {
                        use24HourTimeFormat: true,
                        verbose: true
                      });
                      setDescription(humanReadable);
                      calculateNextRuns();
                    } catch (err) {
                      // Ignore errors during auto-parsing
                    }
                  }, 500);
                } else {
                  setDescription("");
                  setNextRuns([]);
                  setError("");
                }
              }}
              className="font-mono bg-muted/50 border-border/50"
            />
            <Button onClick={parseCron}>
              Parse
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Format: minute hour day month day-of-week
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">Human Readable</span>
              <Button
                onClick={() => copyToClipboard(cronExpression)}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-3 bg-muted/30 rounded-md border border-border/50">
              <p className="text-sm text-foreground">{description}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-dev-primary">Common Examples</h4>
          <div className="space-y-2">
            {examples.map((example, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                <div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {example.cron}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {example.desc}
                  </div>
                </div>
                <Button
                  onClick={() => loadExample(example.cron)}
                  variant="ghost"
                  size="sm"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>*</strong> - any value</div>
          <div><strong>,</strong> - value list separator</div>
          <div><strong>-</strong> - range of values</div>
          <div><strong>/</strong> - step values</div>
        </div>
      </CardContent>
    </Card>
  );
}