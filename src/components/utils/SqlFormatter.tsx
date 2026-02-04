import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, AlertCircle, CheckCircle, WandSparkles, Minimize, Copy, Loader2 } from "lucide-react";
// import { format } from "sql-formatter"; // Moved to dynamic import
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";

type SqlDialect = "postgresql" | "mysql" | "mariadb" | "plsql";

interface SqlFormatterProps {
  initialContent?: string;
  action?: string;
}

const dialectLabels: Record<SqlDialect, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
  plsql: "PL/SQL (Oracle)",
};

export function SqlFormatter({ initialContent, action }: SqlFormatterProps) {
  const [input, setInput] = useState(initialContent || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isFormatted, setIsFormatted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dialect, setDialect] = useState<SqlDialect>("postgresql");
  const [tabWidth, setTabWidth] = useState(2);
  const [uppercase, setUppercase] = useState(true);

  const { toast } = useToast();

  const examples = [
    {
      sql: "SELECT id, name, email FROM users WHERE status = 'active' AND created_at > '2024-01-01' ORDER BY name ASC LIMIT 10;",
      desc: "Simple SELECT query"
    },
    {
      sql: "SELECT u.id, u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id, u.name HAVING COUNT(o.id) > 5 ORDER BY order_count DESC;",
      desc: "JOIN with aggregation"
    },
    {
      sql: "INSERT INTO products (name, price, category_id, created_at) VALUES ('Laptop', 999.99, 1, NOW()), ('Mouse', 29.99, 2, NOW()), ('Keyboard', 79.99, 2, NOW());",
      desc: "Multi-row INSERT"
    },
    {
      sql: "UPDATE orders SET status = 'shipped', shipped_at = NOW() WHERE status = 'processing' AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);",
      desc: "UPDATE with conditions"
    },
    {
      sql: "WITH monthly_sales AS (SELECT DATE_TRUNC('month', order_date) as month, SUM(total) as revenue FROM orders GROUP BY 1) SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) as prev_month FROM monthly_sales;",
      desc: "CTE with window function"
    }
  ];

  const formatSql = useCallback(async (minify = false) => {
    setIsLoading(true);
    try {
      setError("");

      if (!input.trim()) {
        setOutput("");
        setIsFormatted(false);
        return;
      }

      // Dynamically import sql-formatter to reduce initial bundle size
      const { format } = await import("sql-formatter");

      const formatted = format(input, {
        language: dialect,
        tabWidth: minify ? 0 : tabWidth,
        keywordCase: uppercase ? "upper" : "lower",
        linesBetweenQueries: minify ? 0 : 2,
        indentStyle: "standard",
      });

      // For minify, remove extra whitespace
      const result = minify
        ? formatted.replace(/\s+/g, " ").trim()
        : formatted;

      setOutput(result);
      setIsFormatted(!minify);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to format SQL");
      setOutput("");
      setIsFormatted(false);
    } finally {
      setIsLoading(false);
    }
  }, [input, dialect, tabWidth, uppercase]);

  const copyToClipboard = useCallback(async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied!",
        description: "Formatted SQL copied to clipboard",
      });
    }
  }, [output, toast]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setIsFormatted(false);
  }, []);

  // Keyboard shortcuts
  useUtilKeyboardShortcuts({
    onExecute: () => formatSql(false),
    onClear: clearAll,
    onCopy: copyToClipboard,
  });

  useEffect(() => {
    if (initialContent && action === "format") {
      formatSql(false);
    }
  }, [initialContent, action, formatSql]);

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Database className="h-5 w-5 text-dev-primary" />
          SQL Formatter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-2 text-foreground">
              SQL Dialect
            </label>
            <Select
              value={dialect}
              onValueChange={(value: SqlDialect) => setDialect(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(dialectLabels) as SqlDialect[]).map((d) => (
                  <SelectItem key={d} value={d}>
                    {dialectLabels[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-24">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Tab Width
            </label>
            <Select
              value={tabWidth.toString()}
              onValueChange={(value) => setTabWidth(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Keywords
            </label>
            <Select
              value={uppercase ? "upper" : "lower"}
              onValueChange={(value) => setUppercase(value === "upper")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upper">UPPERCASE</SelectItem>
                <SelectItem value="lower">lowercase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            SQL Input
          </label>
          <Textarea
            placeholder="Paste your SQL query here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[150px] font-mono text-sm bg-background border-2 border-input focus:border-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            onClick={() => formatSql(false)}
            disabled={isLoading}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <WandSparkles className="h-4 w-4 mr-1" />
            )}
            Format
          </Button>

          <Button
            onClick={() => formatSql(true)}
            disabled={isLoading}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Minimize className="h-4 w-4 mr-1" />
            )}
            Minify
          </Button>

          {output && (
            <Button onClick={copyToClipboard} variant="outline" size="sm" className="hidden">
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          )}

          <Button onClick={clearAll} variant="outline" size="sm">
            Clear
          </Button>
        </div>

        {output && !error && (
          <div className="flex items-center gap-2">
            <Badge className="bg-dev-success text-dev-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isFormatted ? "Formatted" : "Minified"}
            </Badge>
            <Badge variant="outline">{dialectLabels[dialect]}</Badge>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Formatted Output
              </label>
              <Badge variant="outline">
                {isFormatted ? "Pretty" : "Minified"}
              </Badge>
            </div>

            <div className="relative">
              <pre className="bg-muted/50 p-3 rounded-md text-sm font-mono overflow-auto max-h-[300px] border border-border/50 whitespace-pre-wrap pr-16">
                {output}
              </pre>
              <CopyButton
                text={output}
                className="absolute right-2 top-2"
                title="Copy output"
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Examples section */}
      <div className="border-t border-border/50 px-6 py-4">
        <Collapsible defaultOpen={false} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              Examples
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {examples.map((example, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-foreground truncate">
                    {example.sql}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {example.desc}
                  </div>
                </div>
                <Button
                  onClick={() => setInput(example.sql)}
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
