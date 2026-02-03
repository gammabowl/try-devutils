import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useToolKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";
import cronstrue from "cronstrue";

interface ParsedCron {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
  seconds: number[];
}

interface CronParserProps {
  initialContent?: string;
  action?: string;
}

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
      // Handle ranges like "1-5" or "MON-FRI"
      const [start, end] = part.split("-").map(s => {
        // Convert day names to numbers
        const dayMap: Record<string, number> = {
          'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
        };
        return dayMap[s.toUpperCase()] !== undefined ? dayMap[s.toUpperCase()] : parseInt(s, 10);
      });
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else {
      // Handle single values or day names
      const dayMap: Record<string, number> = {
        'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
      };
      const num = dayMap[part.toUpperCase()] !== undefined ? dayMap[part.toUpperCase()] : parseInt(part, 10);
      if (num >= min && num <= max) {
        values.add(num);
      }
    }
  }

  return Array.from(values)
    .filter((v) => v >= min && v <= max)
    .sort((a, b) => a - b);
};

const parseCronExpression = (expression: string): ParsedCron => {
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

export function CronParser({ initialContent, action }: CronParserProps) {
  const [cronExpression, setCronExpression] = useState(initialContent || "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "parse") {
      parseCron();
    }
  }, [initialContent, action]); // eslint-disable-line react-hooks/exhaustive-deps

  const examples = [
    { cron: "0 9 * * MON-FRI", desc: "At 9:00 AM, Monday through Friday" },
    { cron: "0 */2 * * *", desc: "Every 2 hours" },
    { cron: "0 0 1 * *", desc: "At midnight on the first day of every month" },
    { cron: "*/15 * * * *", desc: "Every 15 minutes" },
    { cron: "0 22 * * SUN", desc: "At 10:00 PM on Sunday" },
  ];

  const parseCron = useCallback(() => {
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
  }, [cronExpression]); // eslint-disable-line react-hooks/exhaustive-deps

  const matchesCron = (date: Date, parsed: ParsedCron): boolean => {
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

  const calculateNextRuns = useCallback(() => {
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
  }, [cronExpression]);

  const copyToClipboard = useCallback(async (text: string) => {
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
  }, [toast]);

  const clearAll = useCallback(() => {
    setCronExpression("");
    setDescription("");
    setError("");
    setNextRuns([]);
  }, []);

  // Keyboard shortcuts
  useToolKeyboardShortcuts({
    onExecute: parseCron,
    onClear: clearAll,
    onCopy: () => copyToClipboard(description),
  });

  const loadExample = (cron: string) => {
    setCronExpression(cron);
    // Trigger parsing after state update
    setTimeout(() => parseCron(), 0);
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-dev-primary" />
          Cron Expression Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two column layout for input and syntax guide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Input and Results */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="cron-expression" className="block text-sm font-medium text-foreground">
                Cron Expression
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="cron-expression"
                    placeholder="* * * * *"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    className="font-mono bg-muted/50 border-border/50 pr-14"
                  />
                  <CopyButton
                    text={cronExpression}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${!cronExpression ? 'opacity-50 pointer-events-none' : ''}`}
                    title="Copy cron expression"
                  />
                </div>
                <Button
                  onClick={parseCron}
                  className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Parse
                </Button>
              </div>
              {/* Field labels below input - like crontab.guru */}
              {cronExpression && (() => {
                const parts = cronExpression.trim().split(/\s+/);
                const fieldLabels = ['minute', 'hour', 'day (month)', 'month', 'day (week)'];
                const fieldColors = ['text-sky-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500', 'text-rose-500'];
                return (
                  <div className="flex justify-start gap-4 mt-2 font-mono text-sm">
                    {parts.slice(0, 5).map((part, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <span className={`font-medium ${fieldColors[index]}`}>{part}</span>
                        <span className="text-xs text-muted-foreground">{fieldLabels[index]}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {error && (
              <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/30">
                {error}
              </div>
            )}

            {description && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Human Readable</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              </div>
            )}

            {nextRuns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-dev-primary">Next 5 Occurrences</h4>
                <div className="space-y-1.5">
                  {nextRuns.map((date, index) => (
                    <div key={index} className="flex items-center p-2 bg-muted/30 rounded-md border border-border/50">
                      <div className="text-sm font-mono text-foreground">{date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            <Collapsible open={examplesOpen} onOpenChange={setExamplesOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-0 hover:bg-transparent">
                  <span className="text-sm text-muted-foreground">
                    {examplesOpen ? "▼" : "▶"} Examples
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 mt-2">
                {examples.map((example) => (
                  <div 
                    key={example.cron} 
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-foreground">{example.cron}</div>
                      <div className="text-xs text-muted-foreground">{example.desc}</div>
                    </div>
                    <Button
                      onClick={() => loadExample(example.cron)}
                      variant="outline"
                      size="sm"
                      className="ml-2 flex-shrink-0 h-7 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right column - Syntax Guide */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <HelpCircle className="h-4 w-4" />
              Syntax Guide
            </div>
            
            {/* Format overview - 5 field boxes */}
            <div className="p-4 bg-muted/30 rounded-md border border-border/50">
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-10 bg-sky-500/20 border border-sky-500/50 rounded flex items-center justify-center font-mono text-base">*</div>
                  <div className="text-xs text-muted-foreground mt-1.5 text-center">Minute<br/><span className="text-foreground">0-59</span></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-10 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center font-mono text-base">*</div>
                  <div className="text-xs text-muted-foreground mt-1.5 text-center">Hour<br/><span className="text-foreground">0-23</span></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-10 bg-amber-500/20 border border-amber-500/50 rounded flex items-center justify-center font-mono text-base">*</div>
                  <div className="text-xs text-muted-foreground mt-1.5 text-center">Day<br/><span className="text-foreground">1-31</span></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-10 bg-purple-500/20 border border-purple-500/50 rounded flex items-center justify-center font-mono text-base">*</div>
                  <div className="text-xs text-muted-foreground mt-1.5 text-center">Month<br/><span className="text-foreground">1-12</span></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-10 bg-rose-500/20 border border-rose-500/50 rounded flex items-center justify-center font-mono text-base">*</div>
                  <div className="text-xs text-muted-foreground mt-1.5 text-center">Weekday<br/><span className="text-foreground">0-6</span></div>
                </div>
              </div>
            </div>

            {/* Special characters & Named values side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-md border border-border/50">
                <div className="text-sm font-medium mb-2">Characters</div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2"><code className="bg-muted px-1.5 py-0.5 rounded font-mono">*</code><span className="text-muted-foreground">Any value</span></div>
                  <div className="flex items-center gap-2"><code className="bg-muted px-1.5 py-0.5 rounded font-mono">,</code><span className="text-muted-foreground">List (1,3,5)</span></div>
                  <div className="flex items-center gap-2"><code className="bg-muted px-1.5 py-0.5 rounded font-mono">-</code><span className="text-muted-foreground">Range (1-5)</span></div>
                  <div className="flex items-center gap-2"><code className="bg-muted px-1.5 py-0.5 rounded font-mono">/</code><span className="text-muted-foreground">Step (*/15)</span></div>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-md border border-border/50">
                <div className="text-sm font-medium mb-2">Names</div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div>Days: <span className="text-foreground">SUN-SAT</span></div>
                  <div>Months: <span className="text-foreground">JAN-DEC</span></div>
                  <div>Range: <span className="text-foreground">MON-FRI</span></div>
                </div>
              </div>
            </div>

            {/* Common patterns */}
            <div className="p-3 bg-muted/30 rounded-md border border-border/50">
              <div className="text-sm font-medium mb-2">Common Patterns</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                <div><code className="bg-muted px-1.5 py-0.5 rounded font-mono">* * * * *</code> <span className="text-muted-foreground">Every min</span></div>
                <div><code className="bg-muted px-1.5 py-0.5 rounded font-mono">0 * * * *</code> <span className="text-muted-foreground">Hourly</span></div>
                <div><code className="bg-muted px-1.5 py-0.5 rounded font-mono">0 0 * * *</code> <span className="text-muted-foreground">Daily</span></div>
                <div><code className="bg-muted px-1.5 py-0.5 rounded font-mono">0 0 * * 0</code> <span className="text-muted-foreground">Weekly</span></div>
                <div><code className="bg-muted px-1.5 py-0.5 rounded font-mono">0 0 1 * *</code> <span className="text-muted-foreground">Monthly</span></div>
                <div><code className="bg-muted px-1.5 py-0.5 rounded font-mono">*/5 * * * *</code> <span className="text-muted-foreground">Every 5m</span></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}