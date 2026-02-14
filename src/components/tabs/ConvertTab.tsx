import { useState, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, FileSpreadsheet, FileText } from "lucide-react";
import { validateJson, jsonToCsv, jsonToYaml } from "@/lib/json-validator";
import { CodeEditor } from "@/components/CodeEditor";
import { CopyButton } from "@/components/ui/copy-button";
import { isTauri } from "@/lib/platform";
import { useSharedJsonInput, type ExampleSignal } from "@/hooks/use-shared-json-input";

interface ConvertTabProps {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
}

export function ConvertTab({ exampleSignal, sharedJson, onSharedJsonChange }: ConvertTabProps) {
  const panelHeight = isTauri() ? "100%" : "60vh";
  const panelStyle = { height: panelHeight, minHeight: panelHeight };
  const { input, setInputAndShare } = useSharedJsonInput({ exampleSignal, sharedJson, onSharedJsonChange });
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<"csv" | "yaml">("csv");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [convError, setConvError] = useState("");
  const [outputCursor, setOutputCursor] = useState<{ line: number; column: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const convert = useCallback((text: string, fmt: "csv" | "yaml") => {
    if (!text.trim()) { setIsValid(null); setError(""); setOutput(""); setConvError(""); return; }
    const result = validateJson(text);
    if (!result.valid) {
      setIsValid(false); setError(result.error || "Invalid JSON"); setOutput(""); setConvError("");
      return;
    }
    setIsValid(true); setError("");
    if (fmt === "csv") {
      const csv = jsonToCsv(result.parsed);
      if (csv.error) { setConvError(csv.error); setOutput(""); }
      else { setConvError(""); setOutput(csv.result || ""); }
    } else {
      const yaml = jsonToYaml(result.parsed);
      setConvError(""); setOutput(yaml);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => convert(input, format), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, format, convert]);

  return (
    <div className="space-y-3 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={format} onValueChange={(v) => setFormat(v as "csv" | "yaml")}>
          <TabsList>
            <TabsTrigger value="csv" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" /> CSV</TabsTrigger>
            <TabsTrigger value="yaml" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> YAML</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          {isValid === true && <Badge className="bg-dev-success text-dev-success-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Valid</Badge>}
          {isValid === false && <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Invalid</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 h-full">
        <div className="flex flex-col min-h-0 h-full">
          <div className="text-xs font-medium text-muted-foreground mb-1">JSON Input</div>
          <div className="relative flex-1 min-h-0 h-full">
            <CodeEditor
              value={input}
              onChange={(value) => {
                setInputAndShare(value);
              }}
              placeholder="Paste JSON to convert..."
              minHeight={panelHeight}
            />
          </div>
        </div>
        <div className="flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">{format.toUpperCase()} Output</span>
            {output && outputCursor && (
              <span className="text-xs text-muted-foreground font-mono">
                ln {outputCursor.line}, col {outputCursor.column}
              </span>
            )}
          </div>
          {error && (
            <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
          )}
          {convError && (
            <Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{convError}</AlertDescription></Alert>
          )}
          <div className="relative flex-1 min-h-0 h-full">
            {output ? (
              <CodeEditor
                value={output}
                readOnly
                minHeight={panelHeight}
                onReadOnlySelectionChange={setOutputCursor}
              />
            ) : (
              <div className="border border-border rounded-md bg-card flex items-center justify-center overflow-auto" style={panelStyle}>
                <p className="text-muted-foreground text-sm">{format.toUpperCase()} output appears here</p>
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
