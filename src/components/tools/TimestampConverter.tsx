import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, fromUnixTime, getUnixTime, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToolKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";

interface TimestampConverterProps {
  initialContent?: string;
  action?: string;
}

export function TimestampConverter({ initialContent, action }: TimestampConverterProps) {
  const [timestamp, setTimestamp] = useState(initialContent || Date.now().toString());
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 19));
  const [conversionValue, setConversionValue] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [error, setError] = useState("");
  const [activeMainTab, setActiveMainTab] = useState("from-timestamp");

  // Separate state for results in each tab
  const [fromTimestampResults, setFromTimestampResults] = useState<Record<string, string>>({});
  const [toTimestampResults, setToTimestampResults] = useState<Record<string, string>>({});
  const [currentTimestampResults, setCurrentTimestampResults] = useState<Record<string, string>>({});
  const [unitConversionResults, setUnitConversionResults] = useState<Record<string, string>>({});

  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "convert") {
      setTimestamp(initialContent);
      convertFromTimestamp();
    } else {
      // Auto-convert on initial load with default values
      convertFromTimestamp();
      convertToTimestamp();
    }
  }, [action, initialContent]); // eslint-disable-line react-hooks/exhaustive-deps

  const examples = {
    timestamps: [
      { value: "1640995200", desc: "January 1, 2022 (seconds)" },
      { value: "1640995200000", desc: "January 1, 2022 (milliseconds)" },
      { value: "1700000000", desc: "November 14, 2023" },
      { value: "946684800", desc: "Millennium (Jan 1, 2000)" },
    ],
    dates: [
      { value: "2024-01-01T00:00:00.000Z", desc: "New Year 2024" },
      { value: "2023-12-25T12:00:00.000Z", desc: "Christmas 2023" },
      { value: "2023-07-04T16:30:00.000Z", desc: "Independence Day" },
      { value: "2000-01-01T00:00:00.000Z", desc: "Y2K Millennium" },
    ],
  };

  const convertFromTimestamp = useCallback(() => {
    try {
      setError("");
      const ts = parseInt(timestamp);

      if (isNaN(ts)) {
        throw new Error("Invalid timestamp");
      }

      const date = ts.toString().length === 10 ? fromUnixTime(ts) : new Date(ts);

      setFromTimestampResults({
        "Local Time": format(date, "yyyy-MM-dd HH:mm:ss"),
        "UTC Time": format(date, "yyyy-MM-dd HH:mm:ss 'UTC'"),
        "ISO 8601": date.toISOString(),
        "Unix (seconds)": Math.floor(date.getTime() / 1000).toString(),
        "Unix (ms)": date.getTime().toString(),
        "Relative": getRelativeTime(date),
      });
    } catch (err) {
      setError("Invalid timestamp format");
      setFromTimestampResults({});
    }
  }, [timestamp]);

  const convertToTimestamp = useCallback(() => {
    try {
      setError("");
      const date = parseISO(dateTime);

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      setToTimestampResults({
        "Unix (seconds)": getUnixTime(date).toString(),
        "Unix (ms)": date.getTime().toString(),
        "ISO 8601": date.toISOString(),
        "Local Time": format(date, "yyyy-MM-dd HH:mm:ss"),
        "UTC Time": format(date, "yyyy-MM-dd HH:mm:ss 'UTC'"),
      });
    } catch (err) {
      setError("Invalid date format. Use ISO format like: 2023-12-25T15:30:00");
      setToTimestampResults({});
    }
  }, [dateTime]);

  const getCurrentTimestamp = () => {
    const now = new Date();
    setCurrentTimestampResults({
      "Local Time": format(now, "yyyy-MM-dd HH:mm:ss"),
      "UTC Time": format(now, "yyyy-MM-dd HH:mm:ss 'UTC'"),
      "ISO 8601": now.toISOString(),
      "Unix (seconds)": getUnixTime(now).toString(),
      "Unix (ms)": now.getTime().toString(),
    });
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard!" });
  }, [toast]);

  const clearAll = useCallback(() => {
    setTimestamp("");
    setDateTime("");
    setConversionValue("");
    setError("");
    setFromTimestampResults({});
    setToTimestampResults({});
    setCurrentTimestampResults({});
    setUnitConversionResults({});
  }, []);

  useToolKeyboardShortcuts({
    onExecute: () => {
      if (activeMainTab === "from-timestamp") convertFromTimestamp();
      else if (activeMainTab === "to-timestamp") convertToTimestamp();
      else if (activeMainTab === "current") refreshCurrentTime();
      else if (activeMainTab === "convert") {
        // Unit conversion handled separately
      }
    },
    onClear: clearAll,
    onCopy: () => {
      const results = activeMainTab === "from-timestamp" ? fromTimestampResults :
                     activeMainTab === "to-timestamp" ? toTimestampResults :
                     activeMainTab === "current" ? currentTimestampResults : {};
      const firstResult = Object.values(results)[0];
      if (firstResult) copyToClipboard(firstResult);
    }
  });

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMs < 0) {
      return "In the future";
    } else if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hours ago`;
    } else {
      return `${diffDay} days ago`;
    }
  };

  const unitOptions = ["Milliseconds", "Seconds", "Minutes", "Hours", "Days", "Weeks", "Months", "Years"];

  const convertUnits = (value: number, fromUnit: string, toUnit: string) => {
    const unitToSeconds = {
      Milliseconds: 0.001, // 1 millisecond = 0.001 seconds
      Seconds: 1,          // 1 second = 1 second
      Minutes: 60,         // 1 minute = 60 seconds
      Hours: 3600,         // 1 hour = 3600 seconds
      Days: 86400,         // 1 day = 86400 seconds
      Weeks: 604800,       // 1 week = 604800 seconds
      Months: 2629800,     // Approximate (30.44 days = 2629800 seconds)
      Years: 31557600,     // Approximate (365.25 days = 31557600 seconds)
    };

    // Convert the input value to seconds based on the "fromUnit"
    const fromSeconds = value * unitToSeconds[fromUnit];

    // Convert the seconds to the target unit ("toUnit")
    const convertedValue = fromSeconds / unitToSeconds[toUnit];

    // Format the result with appropriate precision
    const formatResult = (num: number): string => {
      if (num === 0) return "0";

      // For extremely small numbers, use scientific notation
      if (Math.abs(num) < 0.000001) {
        return num.toExponential(2);
      }

      // For very small numbers, show many decimal places
      if (Math.abs(num) < 0.0001) {
        return num.toFixed(8);
      }

      // For small numbers, show more decimal places
      if (Math.abs(num) < 0.01) {
        return num.toFixed(6);
      }

      // For numbers less than 1, show 4 decimal places
      if (Math.abs(num) < 1) {
        return num.toFixed(4);
      }

      // For normal numbers, use 2 decimal places
      if (Math.abs(num) < 100) {
        return num.toFixed(2);
      }

      // For large numbers, use fewer decimal places
      return num.toFixed(1);
    };

    // Update the results state
    setUnitConversionResults({
      [`${value} ${fromUnit} to ${toUnit}`]: formatResult(convertedValue),
    });
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-dev-primary" />
          Timestamp/Date Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="from-timestamp" className="w-full" onValueChange={setActiveMainTab}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="from-timestamp" className="text-xs sm:text-sm">Epoch → Date</TabsTrigger>
            <TabsTrigger value="to-timestamp" className="text-xs sm:text-sm">Date → Epoch</TabsTrigger>
            <TabsTrigger value="unit-conversion" className="text-xs sm:text-sm">Units</TabsTrigger>
          </TabsList>

          {/* Epoch to Date Tab */}
          <TabsContent value="from-timestamp" className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  const now = Date.now();
                  setTimestamp(now.toString());
                  setTimeout(() => convertFromTimestamp(), 100);
                }} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Use Current Time
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Unix Timestamp
                </label>
                <Input
                  placeholder="1703516400 or 1703516400000"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="font-mono bg-muted/50 border-border/50"
                />
              </div>
              <Button onClick={convertFromTimestamp} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground w-full sm:w-auto">
                <Calendar className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </div>

            {error && (
              <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/30 max-w-md">
                {error}
              </div>
            )}

            {Object.keys(fromTimestampResults).length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(fromTimestampResults).map(([label, value]) => (
                    <div key={label} className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-dev-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
                          <div className="text-sm text-foreground font-mono break-all">{value}</div>
                        </div>
                        <CopyButton
                          text={value}
                          className="flex-shrink-0"
                          title={`Copy ${label}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Date to Epoch Tab */}
          <TabsContent value="to-timestamp" className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  const now = new Date();
                  setDateTime(now.toISOString().slice(0, 19));
                  setTimeout(() => convertToTimestamp(), 100);
                }} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Use Current Time
              </Button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-md">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Date & Time
                  </label>
                  <Input
                    placeholder="2023-12-25T15:30:00"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="font-mono bg-muted/50 border-border/50"
                  />
                </div>
                <Button onClick={convertToTimestamp} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  Convert
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">ISO 8601: YYYY-MM-DDTHH:mm:ss</p>
            </div>

            {error && (
              <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/30 max-w-md">
                {error}
              </div>
            )}

            {Object.keys(toTimestampResults).length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(toTimestampResults).map(([label, value]) => (
                    <div key={label} className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-dev-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
                          <div className="text-sm text-foreground font-mono break-all">{value}</div>
                        </div>
                        <CopyButton
                          text={value}
                          className="flex-shrink-0"
                          title={`Copy ${label}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Unit Conversion Tab */}
          <TabsContent value="unit-conversion" className="space-y-4 pt-4">
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Value
                </label>
                <Input
                  placeholder="120"
                  value={conversionValue}
                  onChange={(e) => setConversionValue(e.target.value)}
                  className="max-w-xs font-mono bg-muted/50 border-border/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">From</label>
                  <Select value={fromUnit} onValueChange={(value) => setFromUnit(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">To</label>
                  <Select value={toUnit} onValueChange={(value) => setToUnit(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!isNaN(parseFloat(conversionValue)) && fromUnit && toUnit) {
                    convertUnits(parseFloat(conversionValue), fromUnit, toUnit);
                  }
                }}
                className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Convert Units
              </Button>
            </div>

            {Object.keys(unitConversionResults).length > 0 && (
              <div className="space-y-3 pt-2">
                {Object.entries(unitConversionResults).map(([label, value]) => (
                  <div key={label} className="p-5 bg-gradient-to-br from-dev-primary/5 to-dev-secondary/5 rounded-lg border border-dev-primary/20 max-w-md">
                    <div className="text-sm text-muted-foreground mb-2">{label}</div>
                    <div className="text-3xl font-bold text-dev-primary font-mono">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
            <Tabs 
              defaultValue={activeMainTab === "to-timestamp" ? "dates" : "timestamps"} 
              key={activeMainTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dates">Date Examples</TabsTrigger>
                <TabsTrigger value="timestamps">Timestamp Examples</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timestamps" className="space-y-2 mt-2">
                {examples.timestamps.map(({ value, desc }) => (
                  <div key={value} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div>
                      <div className="font-mono text-sm text-foreground">{value}</div>
                      <div className="text-sm text-muted-foreground">{desc}</div>
                    </div>
                    <Button
                      onClick={() => setTimestamp(value)}
                      variant="outline"
                      size="sm"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="dates" className="space-y-2 mt-2">
                {examples.dates.map(({ value, desc }) => (
                  <div key={value} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div>
                      <div className="font-mono text-sm text-foreground">{value}</div>
                      <div className="text-sm text-muted-foreground">{desc}</div>
                    </div>
                    <Button
                      onClick={() => setDateTime(value)}
                      variant="outline"
                      size="sm"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}