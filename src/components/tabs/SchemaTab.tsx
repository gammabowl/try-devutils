import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";
import { validateJson, validateJsonSchema } from "@/lib/json-validator";
import { CodeEditor } from "@/components/CodeEditor";
import { CopyButton } from "@/components/ui/copy-button";
import { isTauri } from "@/lib/platform";
import { useSharedJsonInput, type ExampleSignal } from "@/hooks/use-shared-json-input";

interface SchemaTabProps {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
}

const exampleSchema = JSON.stringify({
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            name: { type: "string" },
            settings: {
              type: "object",
              properties: {
                theme: { type: "string" },
                notifications: { type: "boolean" }
              },
              required: ["theme", "notifications"],
              additionalProperties: false
            }
          },
          required: ["name", "settings"],
          additionalProperties: false
        },
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["title", "tags"],
            additionalProperties: false
          }
        }
      },
      required: ["profile", "posts"],
      additionalProperties: false
    }
  },
  required: ["user"],
  additionalProperties: false
}, null, 2);

export function SchemaTab({ exampleSignal, sharedJson, onSharedJsonChange }: SchemaTabProps) {
  const panelHeight = isTauri() ? "100%" : "60vh";
  const { input: jsonInput, setInputAndShare: setJsonInputAndShare } = useSharedJsonInput({
    exampleSignal,
    sharedJson,
    onSharedJsonChange,
  });
  const [schemaInput, setSchemaInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [jsonError, setJsonError] = useState("");
  const [schemaError, setSchemaError] = useState("");
  const [schemaCursor, setSchemaCursor] = useState<{ line: number; column: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doValidate = useCallback((json: string, schema: string) => {
    if (!json.trim() || !schema.trim()) { setResult(null); setJsonError(""); setSchemaError(""); return; }

    const jsonResult = validateJson(json);
    if (!jsonResult.valid) { setJsonError(jsonResult.error || "Invalid JSON"); setResult(null); return; }
    setJsonError("");

    const schemaResult = validateJson(schema);
    if (!schemaResult.valid) { setSchemaError(schemaResult.error || "Invalid schema JSON"); setResult(null); return; }
    setSchemaError("");

    const validation = validateJsonSchema(jsonResult.parsed, schemaResult.parsed);
    setResult(validation);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doValidate(jsonInput, schemaInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [jsonInput, schemaInput, doValidate]);

  return (
    <div className="space-y-3 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Validate JSON against a JSON Schema (Draft 7)</span>
        {!schemaInput && (
          <Button
            size="sm"
            className="h-7 text-xs bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
            onClick={() => setSchemaInput(exampleSchema)}
          >
            Load Example Schema
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {result && result.valid && (
            <Badge className="bg-dev-success text-dev-success-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Passes Schema</Badge>
          )}
          {result && !result.valid && (
            <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Fails Schema</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">JSON Data</div>
          <CodeEditor
            value={jsonInput}
            onChange={(value) => {
              setJsonInputAndShare(value);
            }}
            placeholder="Paste JSON data to validate..."
            minHeight={panelHeight}
          />
          {jsonError && (
            <Alert variant="destructive" className="mt-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{jsonError}</AlertDescription></Alert>
          )}
        </div>
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">JSON Schema</span>
            {schemaInput && schemaCursor && (
              <span className="text-xs text-muted-foreground font-mono">
                ln {schemaCursor.line}, col {schemaCursor.column}
              </span>
            )}
          </div>
          <div className="relative flex-1 min-h-0">
            <CodeEditor
              value={schemaInput}
              onChange={setSchemaInput}
              placeholder="Paste JSON Schema here..."
              minHeight={panelHeight}
              onSelectionChange={setSchemaCursor}
            />
            {schemaInput && (
              <CopyButton
                text={schemaInput}
                className="absolute right-2 top-2"
                title="Copy schema"
              />
            )}
          </div>
          {schemaError && (
            <Alert variant="destructive" className="mt-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{schemaError}</AlertDescription></Alert>
          )}
        </div>
      </div>

      {result && !result.valid && result.errors.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-destructive">Validation Errors:</div>
          {result.errors.map((err, i) => (
            <Alert key={i} variant="destructive" className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{err}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
