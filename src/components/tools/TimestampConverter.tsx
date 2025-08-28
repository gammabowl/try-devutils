import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, fromUnixTime, getUnixTime, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TimestampConverterProps {
  initialContent?: string;
  action?: string;
}

export function TimestampConverter({ initialContent, action }: TimestampConverterProps) {
  const [timestamp, setTimestamp] = useState(initialContent || "");
  const [dateTime, setDateTime] = useState("");
  const [conversionValue, setConversionValue] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [error, setError] = useState("");

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
    }
  }, [initialContent, action]);

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

  const convertFromTimestamp = () => {
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
        "Unix Timestamp (seconds)": Math.floor(date.getTime() / 1000).toString(),
        "Unix Timestamp (milliseconds)": date.getTime().toString(),
        "Relative": getRelativeTime(date),
      });
    } catch (err) {
      setError("Invalid timestamp format");
      setFromTimestampResults({});
    }
  };

  const convertToTimestamp = () => {
    try {
      setError("");
      const date = parseISO(dateTime);

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      setToTimestampResults({
        "Unix Timestamp (seconds)": getUnixTime(date).toString(),
        "Unix Timestamp (milliseconds)": date.getTime().toString(),
        "ISO 8601": date.toISOString(),
        "Local Time": format(date, "yyyy-MM-dd HH:mm:ss"),
        "UTC Time": format(date, "yyyy-MM-dd HH:mm:ss 'UTC'"),
      });
    } catch (err) {
      setError("Invalid date format. Use ISO format like: 2023-12-25T15:30:00");
      setToTimestampResults({});
    }
  };

  const getCurrentTimestamp = () => {
    const now = new Date();
    setCurrentTimestampResults({
      "Current Unix Timestamp (seconds)": getUnixTime(now).toString(),
      "Current Unix Timestamp (milliseconds)": now.getTime().toString(),
      "Current ISO 8601": now.toISOString(),
      "Current Local Time": format(now, "yyyy-MM-dd HH:mm:ss"),
      "Current UTC Time": format(now, "yyyy-MM-dd HH:mm:ss 'UTC'"),
    });
  };

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

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied!",
        description: "Value copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
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

    // Update the results state
    setUnitConversionResults({
      [`${value} ${fromUnit} to ${toUnit}`]: convertedValue.toFixed(2),
    });
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-dev-primary" />
          Timestamp Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="from-timestamp" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="from-timestamp">Epoch to Date</TabsTrigger>
            <TabsTrigger value="to-timestamp">Date to Epoch</TabsTrigger>
            <TabsTrigger value="current">Current Time</TabsTrigger>
            <TabsTrigger value="unit-conversion">Unit Conversion</TabsTrigger>
          </TabsList>

          {/* Epoch to Date Tab */}
          <TabsContent value="from-timestamp" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Epoch/Unix Timestamp (seconds or milliseconds)
              </label>
              <Input
                placeholder="e.g., 1703516400 or 1703516400000"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="font-mono bg-muted/50 border-border/50"
              />
            </div>
            <Button onClick={convertFromTimestamp} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Convert Epoch to Human Readable
            </Button>

            {Object.keys(fromTimestampResults).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-dev-primary">Epoch to Date Results</h4>
                <div className="space-y-2">
                  {Object.entries(fromTimestampResults).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-sm text-muted-foreground font-mono">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Date to Epoch Tab */}
          <TabsContent value="to-timestamp" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Date/Time (ISO format)
              </label>
              <Input
                placeholder="e.g., 2023-12-25T15:30:00"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="font-mono bg-muted/50 border-border/50"
              />
            </div>
            <Button onClick={convertToTimestamp} className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Convert to Epoch/Unix Timestamp
            </Button>

            {Object.keys(toTimestampResults).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-dev-primary">Date to Epoch Results</h4>
                <div className="space-y-2">
                  {Object.entries(toTimestampResults).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-sm text-muted-foreground font-mono">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Current Time Tab */}
          <TabsContent value="current" className="space-y-4">
            <Button onClick={getCurrentTimestamp} className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Get Current Timestamp
            </Button>

            {Object.keys(currentTimestampResults).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-dev-primary">Current Timestamp Results</h4>
                <div className="space-y-2">
                  {Object.entries(currentTimestampResults).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-sm text-muted-foreground font-mono">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Unit Conversion Tab */}
          <TabsContent value="unit-conversion" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Enter Value for Conversion
              </label>
              <Input
                placeholder="e.g., 120"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
                className="font-mono bg-muted/50 border-border/50"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-2 text-foreground">From</label>
                <Select value={fromUnit} onValueChange={(value) => setFromUnit(value)}>
                  <SelectTrigger className="w-full">
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
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-2 text-foreground">To</label>
                <Select value={toUnit} onValueChange={(value) => setToUnit(value)}>
                  <SelectTrigger className="w-full">
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
              className="w-full mt-4"
            >
              Convert
            </Button>

            {Object.keys(unitConversionResults).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-dev-primary">Unit Conversion Results</h4>
                <div className="space-y-2">
                  {Object.entries(unitConversionResults).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-sm text-muted-foreground font-mono">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-destructive text-sm font-medium">
            {error}
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
            <Tabs defaultValue="timestamps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timestamps">Timestamp Examples</TabsTrigger>
                <TabsTrigger value="dates">Date Examples</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timestamps" className="space-y-2 mt-2">
                {examples.timestamps.map(({ value, desc }) => (
                  <div key={value} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div>
                      <div className="font-mono text-sm text-foreground">{value}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                    <Button
                      onClick={() => setTimestamp(value)}
                      variant="ghost"
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
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                    <Button
                      onClick={() => setDateTime(value)}
                      variant="ghost"
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