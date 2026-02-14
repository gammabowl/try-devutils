import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, CheckCircle, Search, HelpCircle } from "lucide-react";
import { validateJson, queryJsonPath } from "@/lib/json-validator";
import { CodeEditor } from "@/components/CodeEditor";
import { CopyButton } from "@/components/ui/copy-button";
import { isTauri } from "@/lib/platform";
import { useSharedJsonInput, type ExampleSignal } from "@/hooks/use-shared-json-input";

interface PathQueryTabProps {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
}

export function PathQueryTab({ exampleSignal, sharedJson, onSharedJsonChange }: PathQueryTabProps) {
  const panelHeight = isTauri() ? "100%" : "60vh";
  const panelStyle = { height: panelHeight, minHeight: panelHeight };
  const { input, setInputAndShare } = useSharedJsonInput({ exampleSignal, sharedJson, onSharedJsonChange });
  const [pathExpr, setPathExpr] = useState("$");
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [queryResult, setQueryResult] = useState<string>("");
  const [queryError, setQueryError] = useState("");
  const [outputCursor, setOutputCursor] = useState<{ line: number; column: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doValidate = useCallback((text: string) => {
    if (!text.trim()) { setParsedJson(null); setIsValid(null); setError(""); return; }
    const result = validateJson(text);
    if (result.valid) { setIsValid(true); setParsedJson(result.parsed); setError(""); }
    else { setIsValid(false); setParsedJson(null); setError(result.error || "Invalid JSON"); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doValidate(input), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, doValidate]);

  const handleQuery = useCallback(() => {
    if (!parsedJson) { setQueryError("No valid JSON to query"); return; }
    const result = queryJsonPath(parsedJson, pathExpr);
    if (result.error) {
      setQueryError(result.error); setQueryResult("");
    } else {
      setQueryError("");
      setQueryResult(result.result === undefined ? "undefined" : JSON.stringify(result.result, null, 2));
    }
  }, [parsedJson, pathExpr]);

  // Auto-query on path change
  useEffect(() => {
    if (parsedJson && pathExpr) handleQuery();
  }, [parsedJson, pathExpr, handleQuery]);

  const generatePaths = useCallback((data: unknown, prefix = "$", depth = 0): string[] => {
    if (depth > 3 || data === null || data === undefined || typeof data !== "object") return [];
    const paths: string[] = [];
    if (Array.isArray(data)) {
      if (data.length > 0) {
        paths.push(`${prefix}[0]`);
        paths.push(...generatePaths(data[0], `${prefix}[0]`, depth + 1));
      }
    } else {
      for (const key of Object.keys(data as Record<string, unknown>).slice(0, 5)) {
        const p = `${prefix}.${key}`;
        paths.push(p);
        paths.push(...generatePaths((data as Record<string, unknown>)[key], p, depth + 1));
      }
    }
    return paths;
  }, []);

  const pathExamples = parsedJson ? ["$", ...generatePaths(parsedJson).slice(0, 7)] : ["$"];

  return (
    <div className="space-y-3 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] flex gap-2">
          <Input
            value={pathExpr}
            onChange={(e) => setPathExpr(e.target.value)}
            placeholder="Enter JSON path (e.g. $.user.name)"
            className="font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
          />
          <Button
            onClick={handleQuery}
            size="sm"
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
          >
            <Search className="h-4 w-4 mr-1" /> Query
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-xs space-y-2" align="end">
              <p className="font-semibold text-sm">Path Query Syntax</p>
              <table className="w-full">
                <tbody className="[&_td]:py-1 [&_td:first-child]:font-mono [&_td:first-child]:text-primary [&_td:first-child]:pr-3 [&_td:first-child]:whitespace-nowrap">
                  <tr><td>$</td><td className="text-muted-foreground">Root object</td></tr>
                  <tr><td>$.key</td><td className="text-muted-foreground">Dot notation</td></tr>
                  <tr><td>$['key']</td><td className="text-muted-foreground">Bracket notation</td></tr>
                  <tr><td>$[0]</td><td className="text-muted-foreground">Array index</td></tr>
                  <tr><td>$[*].key</td><td className="text-muted-foreground">Wildcard — all items</td></tr>
                  <tr><td>$..key</td><td className="text-muted-foreground">Recursive descent</td></tr>
                  <tr><td>$[?(@.x&gt;1)]</td><td className="text-muted-foreground">Filter: &gt; &lt; == != &gt;= &lt;=</td></tr>
                </tbody>
              </table>
              <p className="text-muted-foreground pt-1">Combine freely: <span className="font-mono text-primary">$[?(@.price&gt;50)].name</span></p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isValid === true && <Badge className="bg-dev-success text-dev-success-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Valid</Badge>}
          {isValid === false && <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Invalid</Badge>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-muted-foreground">Try:</span>
        {pathExamples.map((p) => (
          <button key={p} onClick={() => setPathExpr(p)}
            className="text-xs font-mono text-primary hover:underline px-1">{p}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 h-full">
        <div className="flex flex-col min-h-0 h-full">
          <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
          <div className="relative flex-1 min-h-0 h-full">
            <CodeEditor
              value={input}
              onChange={(value) => {
                setInputAndShare(value);
              }}
              placeholder="Paste JSON to query..."
              minHeight={panelHeight}
            />
          </div>
        </div>
        <div className="flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Query Result</span>
            {queryResult && outputCursor && (
              <span className="text-xs text-muted-foreground font-mono">
                ln {outputCursor.line}, col {outputCursor.column}
              </span>
            )}
          </div>
          {queryError && (
            <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{queryError}</AlertDescription></Alert>
          )}
          {error && !queryResult && (
            <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
          )}
          <div className="relative flex-1 min-h-0 h-full">
            {queryResult ? (
              <CodeEditor
                value={queryResult}
                readOnly
                minHeight={panelHeight}
                onReadOnlySelectionChange={setOutputCursor}
              />
            ) : (
              <div className="border border-border rounded-md bg-card flex items-center justify-center overflow-auto" style={panelStyle}>
                <p className="text-muted-foreground text-sm">Query results appear here</p>
              </div>
            )}
            {queryResult && (
              <CopyButton
                text={queryResult}
                className="absolute right-2 top-2"
                title="Copy output"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
