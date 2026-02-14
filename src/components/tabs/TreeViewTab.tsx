import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { validateJson } from "@/lib/json-validator";
import { JsonTreeView } from "@/components/JsonTreeView";
import { CodeEditor } from "@/components/CodeEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/ui/copy-button";
import { isTauri } from "@/lib/platform";
import { useSharedJsonInput, type ExampleSignal } from "@/hooks/use-shared-json-input";

interface TreeViewTabProps {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
}

export function TreeViewTab({ exampleSignal, sharedJson, onSharedJsonChange }: TreeViewTabProps) {
  const panelHeight = isTauri() ? "100%" : "60vh";
  const { input, setInputAndShare } = useSharedJsonInput({ exampleSignal, sharedJson, onSharedJsonChange });
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [jsonPath, setJsonPath] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

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

  return (
    <div className="space-y-3 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2">
        {jsonPath && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Path:</span>
            <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{jsonPath}</code>
            <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => {
              navigator.clipboard.writeText(jsonPath);
              toast({ title: "Path copied!" });
            }}><Copy className="h-3 w-3" /></Button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {isValid === true && <Badge className="bg-dev-success text-dev-success-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Valid</Badge>}
          {isValid === false && <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Invalid</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
          <CodeEditor
            value={input}
            onChange={(value) => {
              setInputAndShare(value);
            }}
            placeholder="Paste JSON to visualize as a tree..."
            minHeight={panelHeight}
          />
        </div>
        <div className="flex flex-col min-h-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">Tree View</div>
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="relative flex-1 min-h-0">
            {parsedJson !== null ? (
              <ScrollArea className="border border-border rounded-md bg-card" style={{ height: panelHeight }}>
                <JsonTreeView data={parsedJson} onPathClick={setJsonPath} />
              </ScrollArea>
            ) : (
              <div className="border border-border rounded-md bg-card flex items-center justify-center" style={{ minHeight: panelHeight }}>
                <p className="text-muted-foreground text-sm">Tree visualization appears here</p>
              </div>
            )}
            {parsedJson !== null && (
              <CopyButton
                text={JSON.stringify(parsedJson, null, 2)}
                className="absolute right-2 top-2"
                title="Copy JSON"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
