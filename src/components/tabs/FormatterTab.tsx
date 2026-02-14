import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Braces, AlertCircle, CheckCircle, Minimize, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isTauri } from "@/lib/platform";
import { validateJson, detectHiddenChars } from "@/lib/json-validator";
import { CodeEditor } from "@/components/CodeEditor";
import { CopyButton } from "@/components/ui/copy-button";
import { useSharedJsonInput, type ExampleSignal } from "@/hooks/use-shared-json-input";

interface FormatterTabProps {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
}

export function FormatterTab({ exampleSignal, sharedJson, onSharedJsonChange }: FormatterTabProps) {
  const panelHeight = isTauri() ? "100%" : "60vh";
  const { input, setInput, setInputAndShare } = useSharedJsonInput({ exampleSignal, sharedJson, onSharedJsonChange });
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [errorColumn, setErrorColumn] = useState<number | undefined>();
  const [errorSourceLine, setErrorSourceLine] = useState<string | undefined>();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [indentType, setIndentType] = useState<string>("2");
  const [formatMode, setFormatMode] = useState<"pretty" | "minify">("pretty");
  const [hiddenChars, setHiddenChars] = useState<{ index: number; char: string; name: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  const getIndent = (): number | string => {
    if (indentType === "tab") return "\t";
    return parseInt(indentType, 10);
  };

  const doValidate = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput(""); setIsValid(null); setError("");
      setErrorLine(undefined); setErrorColumn(undefined); setErrorSourceLine(undefined);
      setHiddenChars([]);
      return;
    }
    setHiddenChars(detectHiddenChars(text));
    const result = validateJson(text);
    if (result.valid) {
      setIsValid(true); setError("");
      setErrorLine(undefined); setErrorColumn(undefined); setErrorSourceLine(undefined);
      const formatted = formatMode === "minify"
        ? JSON.stringify(result.parsed)
        : JSON.stringify(result.parsed, null, getIndent());
      setOutput(formatted);
    } else {
      setIsValid(false); setOutput("");
      setError(result.error || "Invalid JSON");
      setErrorLine(result.line); setErrorColumn(result.column); setErrorSourceLine(result.errorLine);
    }
  }, [indentType, formatMode]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doValidate(input), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, doValidate]);

  const handleFormat = () => {
    if (!input.trim()) return;
    const result = validateJson(input);
    if (result.valid) {
      const formatted = JSON.stringify(result.parsed, null, getIndent());
      setInput(formatted); setOutput(formatted);
      setFormatMode("pretty");
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    const result = validateJson(input);
    if (result.valid) {
      const minified = JSON.stringify(result.parsed);
      setInput(minified); setOutput(minified);
      setFormatMode("minify");
    }
  };

  const handleClear = () => {
    setInputAndShare(""); setOutput(""); setError(""); setIsValid(null);
    setErrorLine(undefined); setErrorColumn(undefined); setErrorSourceLine(undefined);
    setHiddenChars([]);
    setFormatMode("pretty");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleFormat(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input, indentType]);

  const [isDragging, setIsDragging] = useState(false);
  const lineCount = input.split("\n").length;
  const charCount = input.length;
  const byteCount = new TextEncoder().encode(input).length;

  const [outputCursor, setOutputCursor] = useState<{ line: number; column: number } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setInput(text);
    };
    reader.onerror = () => toast({ title: "Failed to read file", variant: "destructive" });
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3 flex flex-col min-h-0 h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleFormat}
          size="sm"
          className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
        >
          <Braces className="h-4 w-4 mr-1" /> Format
        </Button>
        <Button
          onClick={handleMinify}
          variant="outline"
          size="sm"
        >
          <Minimize className="h-4 w-4 mr-1" /> Minify
        </Button>
        <Button onClick={handleClear} variant="outline" size="sm"><Trash2 className="h-4 w-4 mr-1" /> Clear</Button>
        <Select value={indentType} onValueChange={setIndentType}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card text-foreground border-border">
            <SelectItem className="text-foreground" value="2">2 Spaces</SelectItem>
            <SelectItem className="text-foreground" value="4">4 Spaces</SelectItem>
            <SelectItem className="text-foreground" value="tab">Tabs</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground font-mono ml-auto">{lineCount} lines · {charCount} chars · {byteCount} bytes</span>
        <div className="flex items-center gap-2">
          {isValid === true && <Badge className="bg-dev-success text-dev-success-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Valid</Badge>}
          {isValid === false && <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Invalid</Badge>}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative flex flex-col min-h-0"
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
              <p className="text-sm font-medium text-primary">Drop JSON file here</p>
            </div>
          )}
          <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
          <div className="relative flex-1 min-h-0">
            <CodeEditor
              value={input}
              onChange={(value) => {
                setInputAndShare(value);
              }}
              placeholder="Paste your JSON here or drag & drop a file..."
              errorLine={errorLine}
              minHeight={panelHeight}
            />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
            {outputCursor && (
              <span className="text-xs text-muted-foreground font-mono">
                ln {outputCursor.line}, col {outputCursor.column}
              </span>
            )}
          </div>
          {isValid === false && error && (
            <div className="space-y-2 mb-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Parse Error{errorLine && <span className="ml-1 font-mono text-xs">(line {errorLine}{errorColumn ? `, col ${errorColumn}` : ""})</span>}
                </AlertTitle>
                <AlertDescription className="mt-1 space-y-2">
                  <p className="text-sm">{error}</p>
                  {errorSourceLine && (
                    <pre className="text-xs bg-destructive/10 p-2 rounded font-mono overflow-x-auto">
                      {errorSourceLine}{errorColumn && <>{"\n"}{" ".repeat(Math.max(0, errorColumn - 1))}^</>}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
              {hiddenChars.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Hidden Characters</AlertTitle>
                  <AlertDescription className="text-xs flex flex-wrap gap-1">
                    {hiddenChars.map((h, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">{h.name} @{h.index}</Badge>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <div className="relative flex-1 min-h-0">
            {output ? (
              <CodeEditor
                value={output}
                readOnly
                minHeight={panelHeight}
                onReadOnlySelectionChange={setOutputCursor}
              />
            ) : (
              <div className="border border-border rounded-md bg-card flex items-center justify-center overflow-auto" style={{ minHeight: panelHeight }}>
                <p className="text-muted-foreground text-sm">Output appears here</p>
              </div>
            )}
            {output && (
              <CopyButton
                text={output}
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
