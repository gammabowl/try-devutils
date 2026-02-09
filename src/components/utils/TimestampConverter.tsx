import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, ArrowLeftRight, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, fromUnixTime, getUnixTime, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
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

  // Date diff state
  const [diffDate1, setDiffDate1] = useState(new Date().toISOString().slice(0, 16));
  const [diffDate2, setDiffDate2] = useState("");
  const [diffResults, setDiffResults] = useState<Record<string, string>>({});
  const [diffError, setDiffError] = useState("");
  const [diffIncludeBothDates, setDiffIncludeBothDates] = useState(false);

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
        "Local Time": format(date, "EEEE, MMMM do, yyyy 'at' h:mm:ss a"),
        "UTC Time": date.toUTCString(),
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
        "Local Time": format(date, "EEEE, MMMM do, yyyy 'at' h:mm:ss a"),
        "UTC Time": date.toUTCString(),
      });
    } catch (err) {
      setError("Invalid date format. Use ISO format like: 2023-12-25T15:30:00");
      setToTimestampResults({});
    }
  }, [dateTime]);

  const getCurrentTimestamp = () => {
    const now = new Date();
    setCurrentTimestampResults({
      "Local Time": format(now, "EEEE, MMMM do, yyyy 'at' h:mm:ss a"),
      "UTC Time": now.toUTCString(),
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
    setDiffDate1(new Date().toISOString().slice(0, 16));
    setDiffDate2("");
    setDiffResults({});
    setDiffError("");
    setDiffIncludeBothDates(false);
  }, []);

  useUtilKeyboardShortcuts({
    onExecute: () => {
      if (activeMainTab === "from-timestamp") convertFromTimestamp();
      else if (activeMainTab === "to-timestamp") convertToTimestamp();
      else if (activeMainTab === "date-diff") calculateDateDiff();
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

  const calculateDateDiff = useCallback(() => {
    try {
      setDiffError("");
      if (!diffDate1 || !diffDate2) {
        setDiffError("Please enter both dates");
        setDiffResults({});
        return;
      }

      const d1 = new Date(diffDate1);
      const d2 = new Date(diffDate2);

      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        setDiffError("Invalid date format");
        setDiffResults({});
        return;
      }

      const earlier = d1 < d2 ? d1 : d2;
      const later = d1 < d2 ? d2 : d1;
      const diffMs = later.getTime() - earlier.getTime();
      // When including both dates, add 1 day (e.g. Jan 1 to Jan 3 = 3 days, not 2)
      const inclusiveOffset = diffIncludeBothDates ? 1 : 0;

      const totalSeconds = Math.floor(diffMs / 1000);
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + inclusiveOffset;
      const totalWeeks = Math.floor(totalDays / 7);

      // Calculate years, months, days breakdown
      let years = later.getFullYear() - earlier.getFullYear();
      let months = later.getMonth() - earlier.getMonth();
      let days = later.getDate() - earlier.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      // Build human-readable breakdown
      const adjustedDays = days + inclusiveOffset;
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
      if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
      if (adjustedDays > 0) parts.push(`${adjustedDays} day${adjustedDays !== 1 ? "s" : ""}`);
      const breakdown = parts.length > 0 ? parts.join(", ") : (diffIncludeBothDates ? "1 day" : "Same date");

      // Hours and minutes remainder for the day
      const remainderHours = later.getHours() - earlier.getHours() + (days < 0 ? 24 : 0);
      const remainderMinutes = later.getMinutes() - earlier.getMinutes();

      let fullBreakdown = breakdown;
      if (parts.length > 0 && (Math.abs(remainderHours) > 0 || Math.abs(remainderMinutes) > 0)) {
        const hDiff = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mDiff = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hDiff > 0 || mDiff > 0) {
          const timeParts: string[] = [];
          if (hDiff > 0) timeParts.push(`${hDiff} hour${hDiff !== 1 ? "s" : ""}`);
          if (mDiff > 0) timeParts.push(`${mDiff} minute${mDiff !== 1 ? "s" : ""}`);
          fullBreakdown += `, ${timeParts.join(", ")}`;
        }
      }

      setDiffResults({
        "Breakdown": fullBreakdown,
        "Total Days": totalDays.toLocaleString(),
        "Total Weeks": `${totalWeeks.toLocaleString()} weeks, ${totalDays % 7} days`,
        "Total Hours": totalHours.toLocaleString(),
        "Total Minutes": totalMinutes.toLocaleString(),
        "Total Seconds": totalSeconds.toLocaleString(),
      });
    } catch {
      setDiffError("Failed to calculate date difference");
      setDiffResults({});
    }
  }, [diffDate1, diffDate2, diffIncludeBothDates]);

  return (
    <Card className="tool-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-dev-primary" />
            Timestamp/Date Converter
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Examples
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Tabs defaultValue="timestamps" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-b-none">
                  <TabsTrigger value="timestamps" className="text-xs">Timestamps</TabsTrigger>
                  <TabsTrigger value="dates" className="text-xs">Dates</TabsTrigger>
                </TabsList>
                <TabsContent value="timestamps" className="p-2 space-y-1.5 mt-0">
                  {examples.timestamps.map(({ value, desc }) => (
                    <div key={value} className="flex items-center justify-between p-2 bg-muted/50 rounded-md gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-foreground truncate">{value}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Button
                        onClick={() => { setTimestamp(value); setActiveMainTab("from-timestamp"); }}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 shrink-0"
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="dates" className="p-2 space-y-1.5 mt-0">
                  {examples.dates.map(({ value, desc }) => (
                    <div key={value} className="flex items-center justify-between p-2 bg-muted/50 rounded-md gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-foreground truncate">{value}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Button
                        onClick={() => { setDateTime(value); setActiveMainTab("to-timestamp"); }}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 shrink-0"
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="from-timestamp" className="w-full" onValueChange={setActiveMainTab}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="from-timestamp" className="text-xs sm:text-sm">Epoch → Date</TabsTrigger>
            <TabsTrigger value="to-timestamp" className="text-xs sm:text-sm">Date → Epoch</TabsTrigger>
            <TabsTrigger value="date-diff" className="text-xs sm:text-sm">Date Diff</TabsTrigger>
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

          {/* Date Diff Tab */}
          <TabsContent value="date-diff" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Start Date</label>
                  <Input
                    type="datetime-local"
                    value={diffDate1}
                    onChange={(e) => setDiffDate1(e.target.value)}
                    className="font-mono bg-muted/50 border-border/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">End Date</label>
                  <Input
                    type="datetime-local"
                    value={diffDate2}
                    onChange={(e) => setDiffDate2(e.target.value)}
                    className="font-mono bg-muted/50 border-border/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button onClick={calculateDateDiff} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground">
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Calculate Difference
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const now = new Date();
                      setDiffDate1(now.toISOString().slice(0, 16));
                      setDiffDate2("");
                      setDiffResults({});
                      setDiffError("");
                      setDiffIncludeBothDates(false);
                    }}
                  >
                    Reset
                  </Button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={diffIncludeBothDates}
                    onChange={(e) => setDiffIncludeBothDates(e.target.checked)}
                    className="rounded border-border accent-dev-primary h-4 w-4 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">Include both start & end dates</span>
                </label>
              </div>
            </div>

            {diffError && (
              <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/30 max-w-md">
                {diffError}
              </div>
            )}

            {Object.keys(diffResults).length > 0 && (
              <div className="space-y-3 pt-2">
                {/* Breakdown gets a highlighted card */}
                {diffResults["Breakdown"] && (
                  <div className="p-5 bg-gradient-to-br from-dev-primary/5 to-dev-secondary/5 rounded-lg border border-dev-primary/20 max-w-2xl">
                    <div className="text-sm text-muted-foreground mb-1">Breakdown</div>
                    <div className="text-xl font-bold text-dev-primary">{diffResults["Breakdown"]}</div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                  {Object.entries(diffResults)
                    .filter(([label]) => label !== "Breakdown")
                    .map(([label, value]) => (
                    <div key={label} className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-dev-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
                          <div className="text-sm text-foreground font-mono break-all">{value}</div>
                        </div>
                        <CopyButton text={value} className="flex-shrink-0" title={`Copy ${label}`} />
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

      {/* Date & Time Formats Guide */}
      <div className="border-t border-border/50 px-6 py-4">
        <Collapsible defaultOpen={false} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              🌍 Date & Time Formats Around the World
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 mt-3">
            {/* Date Order Formats */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Date Order by Region</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Format</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Example</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Used In</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-sans font-medium text-foreground">DD/MM/YYYY</td>
                      <td className="py-2 pr-4 text-foreground">25/12/2025</td>
                      <td className="py-2 font-sans text-muted-foreground">UK, Europe, India, Australia, most of the world</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-sans font-medium text-foreground">MM/DD/YYYY</td>
                      <td className="py-2 pr-4 text-foreground">12/25/2025</td>
                      <td className="py-2 font-sans text-muted-foreground">United States, Philippines</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-sans font-medium text-foreground">YYYY-MM-DD</td>
                      <td className="py-2 pr-4 text-foreground">2025-12-25</td>
                      <td className="py-2 font-sans text-muted-foreground">ISO 8601 standard, Japan, Korea, China, Canada, Sweden</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-sans font-medium text-foreground">DD.MM.YYYY</td>
                      <td className="py-2 pr-4 text-foreground">25.12.2025</td>
                      <td className="py-2 font-sans text-muted-foreground">Germany, Russia, Finland, Norway</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-sans font-medium text-foreground">DD-MM-YYYY</td>
                      <td className="py-2 pr-4 text-foreground">25-12-2025</td>
                      <td className="py-2 font-sans text-muted-foreground">Netherlands, South Africa</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-sans font-medium text-foreground">YYYY/MM/DD</td>
                      <td className="py-2 pr-4 text-foreground">2025/12/25</td>
                      <td className="py-2 font-sans text-muted-foreground">Japan, Iran</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time Formats */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Time Formats</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-medium text-foreground text-sm mb-1">12-hour clock</div>
                  <div className="font-mono text-sm text-muted-foreground">3:30 PM / 12:00 AM</div>
                  <div className="text-xs text-muted-foreground mt-1">US, UK, Australia, India, Philippines</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-medium text-foreground text-sm mb-1">24-hour clock</div>
                  <div className="font-mono text-sm text-muted-foreground">15:30 / 00:00</div>
                  <div className="text-xs text-muted-foreground mt-1">Most of Europe, Japan, China, military, aviation, computing</div>
                </div>
              </div>
            </div>

            {/* Timezone Concepts */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Timezone Essentials</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Abbreviation</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Offset</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">UTC</td>
                      <td className="py-2 pr-4 font-mono text-foreground">+00:00</td>
                      <td className="py-2 text-muted-foreground">Coordinated Universal Time — the global reference</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">GMT</td>
                      <td className="py-2 pr-4 font-mono text-foreground">+00:00</td>
                      <td className="py-2 text-muted-foreground">Greenwich Mean Time — same as UTC in practice</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">EST / EDT</td>
                      <td className="py-2 pr-4 font-mono text-foreground">-05:00 / -04:00</td>
                      <td className="py-2 text-muted-foreground">US Eastern (Standard / Daylight Saving)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">PST / PDT</td>
                      <td className="py-2 pr-4 font-mono text-foreground">-08:00 / -07:00</td>
                      <td className="py-2 text-muted-foreground">US Pacific (Standard / Daylight Saving)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">CET / CEST</td>
                      <td className="py-2 pr-4 font-mono text-foreground">+01:00 / +02:00</td>
                      <td className="py-2 text-muted-foreground">Central European Time (Germany, France, etc.)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">IST</td>
                      <td className="py-2 pr-4 font-mono text-foreground">+05:30</td>
                      <td className="py-2 text-muted-foreground">India Standard Time</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">JST</td>
                      <td className="py-2 pr-4 font-mono text-foreground">+09:00</td>
                      <td className="py-2 text-muted-foreground">Japan Standard Time (no DST)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono font-medium text-foreground">AEST / AEDT</td>
                      <td className="py-2 pr-4 font-mono text-foreground">+10:00 / +11:00</td>
                      <td className="py-2 text-muted-foreground">Australian Eastern (Standard / Daylight)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Standard Formats for Developers */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Standard Formats for Developers</h4>
              <div className="space-y-2">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">ISO 8601</span>
                    <span className="text-[10px] bg-dev-primary/10 text-dev-primary px-1.5 py-0.5 rounded">Recommended</span>
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">2025-12-25T15:30:00Z</div>
                  <div className="font-mono text-sm text-muted-foreground">2025-12-25T15:30:00+05:30</div>
                  <div className="text-xs text-muted-foreground mt-1">Unambiguous, sortable, universally understood. The <span className="font-mono">Z</span> suffix means UTC. Use offset (<span className="font-mono">+05:30</span>) for local times. Always use this in APIs and databases.</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-medium text-foreground text-sm mb-1">Unix Epoch</div>
                  <div className="font-mono text-sm text-muted-foreground">1766685000 (seconds) · 1766685000000 (milliseconds)</div>
                  <div className="text-xs text-muted-foreground mt-1">Seconds since January 1, 1970 00:00:00 UTC. Timezone-free, compact, ideal for storage and calculations. 10 digits = seconds, 13 digits = milliseconds.</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-medium text-foreground text-sm mb-1">RFC 2822</div>
                  <div className="font-mono text-sm text-muted-foreground">Thu, 25 Dec 2025 15:30:00 +0000</div>
                  <div className="text-xs text-muted-foreground mt-1">Used in email headers (Date field) and HTTP headers. Human-readable but not sortable.</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-medium text-foreground text-sm mb-1">RFC 3339</div>
                  <div className="font-mono text-sm text-muted-foreground">2025-12-25T15:30:00.000Z</div>
                  <div className="text-xs text-muted-foreground mt-1">A profile of ISO 8601 used in internet protocols. Requires the <span className="font-mono">T</span> separator and timezone. Used in JSON APIs, Atom feeds, and OpenAPI specs.</div>
                </div>
              </div>
            </div>

            {/* Common Format Tokens */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Format Tokens Cheat Sheet</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Token</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Output</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">YYYY</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">2025</td>
                      <td className="py-1.5 text-muted-foreground">4-digit year</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">MM</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">01–12</td>
                      <td className="py-1.5 text-muted-foreground">Month (zero-padded)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">DD</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">01–31</td>
                      <td className="py-1.5 text-muted-foreground">Day of month (zero-padded)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">HH</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">00–23</td>
                      <td className="py-1.5 text-muted-foreground">Hours (24-hour, zero-padded)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">hh</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">01–12</td>
                      <td className="py-1.5 text-muted-foreground">Hours (12-hour, zero-padded)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">mm</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">00–59</td>
                      <td className="py-1.5 text-muted-foreground">Minutes (zero-padded)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">ss</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">00–59</td>
                      <td className="py-1.5 text-muted-foreground">Seconds (zero-padded)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">SSS</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">000–999</td>
                      <td className="py-1.5 text-muted-foreground">Milliseconds</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-1.5 pr-4 font-mono text-foreground">Z</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">+05:30</td>
                      <td className="py-1.5 text-muted-foreground">Timezone offset from UTC</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 font-mono text-foreground">A / a</td>
                      <td className="py-1.5 pr-4 font-mono text-foreground">AM / pm</td>
                      <td className="py-1.5 text-muted-foreground">AM/PM marker</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notable Epoch Milestones */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Notable Epoch Milestones</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-mono text-xs text-foreground">0</div>
                  <div className="text-xs text-muted-foreground">Jan 1, 1970 — Unix Epoch start</div>
                </div>
                <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-mono text-xs text-foreground">946684800</div>
                  <div className="text-xs text-muted-foreground">Jan 1, 2000 — Y2K Millennium</div>
                </div>
                <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-mono text-xs text-foreground">1000000000</div>
                  <div className="text-xs text-muted-foreground">Sep 9, 2001 — Billennium</div>
                </div>
                <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-mono text-xs text-foreground">2000000000</div>
                  <div className="text-xs text-muted-foreground">May 18, 2033 — Next billennium</div>
                </div>
                <div className="p-2.5 bg-red-500/5 rounded-lg border border-red-500/20">
                  <div className="font-mono text-xs text-foreground">2147483647</div>
                  <div className="text-xs text-muted-foreground">Jan 19, 2038 — Y2K38 (32-bit overflow) ⚠️</div>
                </div>
                <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
                  <div className="font-mono text-xs text-foreground">-1</div>
                  <div className="text-xs text-muted-foreground">Dec 31, 1969 23:59:59 — Before epoch</div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">💡 Tips for Developers</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Always store dates in <strong>UTC</strong> and convert to local time only for display.</li>
                <li>Use ISO 8601 (<span className="font-mono">YYYY-MM-DD</span>) in APIs — it's the only unambiguous format.</li>
                <li>Never assume <span className="font-mono">01/02/03</span> means the same thing everywhere — it could be Jan 2, Feb 1, or 2003-02-01.</li>
                <li>JavaScript's <span className="font-mono">Date.now()</span> returns <strong>milliseconds</strong>; most Unix tools use <strong>seconds</strong>.</li>
                <li>Use IANA timezone identifiers (<span className="font-mono">America/New_York</span>) instead of abbreviations (<span className="font-mono">EST</span>) — abbreviations are ambiguous (IST = India, Ireland, or Israel).</li>
                <li>Daylight Saving Time changes can cause 1-hour gaps or overlaps — never assume a day is exactly 24 hours.</li>
                <li>Some countries use half-hour (<span className="font-mono">+05:30</span> India) or 45-minute (<span className="font-mono">+05:45</span> Nepal) offsets.</li>
                <li>When comparing dates, always normalise to the same timezone first.</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}