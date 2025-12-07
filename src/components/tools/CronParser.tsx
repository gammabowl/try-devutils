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

  const parseCronExpression = (expression: string) => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) {
      throw new Error("Cron expression must have 5 or 6 fields");
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek, ...secondsPart] = parts;
    return {
      minute: parseField(minute, 0, 59),
      hour: parseField(hour, 0, 23),
      dayOfMonth: parseField(dayOfMonth, 1, 31),
      month: parseField(month, 1, 12),
      dayOfWeek: parseField(dayOfWeek, 0, 6),
      seconds: secondsPart.length > 0 ? parseField(secondsPart[0], 0, 59) : [0],
    };
  };

  const parseField = (field: string, min: number, max: number): number[] => {
    const values: Set<number> = new Set();

    if (field === "*") {
      for (let i = min; i <= max; i++) {
        values.add(i);
      }
      return Array.from(values).sort((a, b) => a - b);
    }

    const parts = field.split(",");
    for (const part of parts) {
      if (part.includes("/")) {
        // Handle step values like "*/5"
        const [range, step] = part.split("/");
        const stepNum = parseInt(step, 10);
        let rangeMin = min;
        let rangeMax = max;

        if (range !== "*") {
          const [rmin, rmax] = range.includes("-")
            ? range.split("-").map(Number)
            : [parseInt(range, 10), parseInt(range, 10)];
          rangeMin = rmin;
          rangeMax = rmax;
        }

        for (let i = rangeMin; i <= rangeMax; i += stepNum) {
          values.add(i);
        }
      } else if (part.includes("-")) {
        // Handle ranges like "1-5"
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          values.add(i);
        }
      } else {
        // Single value
        values.add(parseInt(part, 10));
      }
    }

    return Array.from(values)
      .filter((v) => v >= min && v <= max)
      .sort((a, b) => a - b);
  };

  const matchesCron = (date: Date, parsed: any): boolean => {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; // 0-indexed
    const dayOfWeek = date.getDay();
    const seconds = date.getSeconds();

    const minuteMatch = parsed.minute.includes(minute);
    const hourMatch = parsed.hour.includes(hour);
    const secondsMatch = parsed.seconds.includes(seconds);
    const monthMatch = parsed.month.includes(month);

    // Day matching: if either day-of-month or day-of-week is restricted, both must match
    const dayOfMonthRestricted = !parsed.dayOfMonth.includes(dayOfMonth);
    const dayOfWeekRestricted = !parsed.dayOfWeek.includes(dayOfWeek);

    let dayMatch = false;
    if (parsed.dayOfMonth.length === 31 && parsed.dayOfWeek.length === 7) {
      dayMatch = true;
    } else if (parsed.dayOfMonth.length === 31) {
      dayMatch = parsed.dayOfWeek.includes(dayOfWeek);
    } else if (parsed.dayOfWeek.length === 7) {
      dayMatch = parsed.dayOfMonth.includes(dayOfMonth);
    } else {
      dayMatch =
        parsed.dayOfMonth.includes(dayOfMonth) ||
        parsed.dayOfWeek.includes(dayOfWeek);
    }

    return minuteMatch && hourMatch && secondsMatch && monthMatch && dayMatch;
  };

  const calculateNextRuns = () => {
    try {
      const parsed = parseCronExpression(cronExpression);
      const runs: string[] = [];
      let current = new Date();
      
      // Start from next minute to avoid current minute
      current.setSeconds(0);
      current.setMilliseconds(0);
      current = new Date(current.getTime() + 60000);

      while (runs.length < 5 && current.getFullYear() <= new Date().getFullYear() + 4) {
        if (matchesCron(current, parsed)) {
          runs.push(current.toLocaleString());
        }
        current = new Date(current.getTime() + 60000); // Add 1 minute
      }

      if (runs.length === 0) {
        throw new Error("No matching times found in the next 4 years");
      }

      setNextRuns(runs);
    } catch (err) {
      setError("Failed to calculate next runs for this cron expression.");
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
        
        // Calculate next runs
        const parsed = parseCronExpression(cron);
        const runs: string[] = [];
        let current = new Date();
        
        // Start from next minute to avoid current minute
        current.setSeconds(0);
        current.setMilliseconds(0);
        current = new Date(current.getTime() + 60000);

        while (runs.length < 5 && current.getFullYear() <= new Date().getFullYear() + 4) {
          if (matchesCron(current, parsed)) {
            runs.push(current.toLocaleString());
          }
          current = new Date(current.getTime() + 60000); // Add 1 minute
        }

        setNextRuns(runs);
      } catch (err) {
        setError("Failed to parse example");
        setNextRuns([]);
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
      <CardContent className="space-y-6">
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Cron Expression
            </label>
            <Input
              placeholder="* * * * *"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="font-mono bg-muted/50 border-border/50"
            />
          </div>
          <Button
            onClick={parseCron}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
          >
            <Clock className="h-4 w-4 mr-2" />
            Parse
          </Button>
        </div>

        {error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/30 max-w-md">
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
                  variant="outline"
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