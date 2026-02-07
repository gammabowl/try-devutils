import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileCode, CheckCircle, AlertCircle, RotateCcw, Wand2 } from "lucide-react";
import * as yaml from "js-yaml";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";

interface YamlValidatorProps {
  initialContent?: string;
  action?: string;
}

export function YamlValidator({ initialContent, action }: YamlValidatorProps) {
  const [yamlInput, setYamlInput] = useState(initialContent || "");
  const [jsonOutput, setJsonOutput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ lines: number; size: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "validate") {
      validateYaml();
    }
  }, [initialContent, action]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateYaml = useCallback(() => {
    try {
      setError("");
      
      if (!yamlInput.trim()) {
        setIsValid(null);
        setJsonOutput("");
        setStats(null);
        return;
      }

      const parsed = yaml.load(yamlInput);
      const jsonString = JSON.stringify(parsed, null, 2);
      
      setJsonOutput(jsonString);
      setIsValid(true);
      setStats({
        lines: yamlInput.split('\n').length,
        size: new Blob([yamlInput]).size
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid YAML format");
      setIsValid(false);
      setJsonOutput("");
      setStats(null);
    }
  }, [yamlInput]);

  const convertJsonToYaml = () => {
    try {
      setError("");
      
      if (!jsonOutput.trim()) {
        return;
      }

      const parsed = JSON.parse(jsonOutput);
      const yamlString = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      
      setYamlInput(yamlString);
    } catch (err) {
      setError("Failed to convert JSON to YAML");
    }
  };

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadExample = () => {
    const exampleYaml = `# Example YAML configuration
server:
  host: localhost
  port: 8080
  ssl:
    enabled: true
    certificate: /path/to/cert.pem

database:
  type: postgresql
  host: db.example.com
  port: 5432
  name: myapp
  credentials:
    username: user
    password: secret

features:
  - authentication
  - logging
  - monitoring
  - caching

settings:
  debug: false
  max_connections: 100
  timeout: 30s`;
    
    setYamlInput(exampleYaml);
    setTimeout(() => validateYaml(), 100);
  };

  const clearAll = useCallback(() => {
    setYamlInput("");
    setJsonOutput("");
    setIsValid(null);
    setError("");
    setStats(null);
  }, []);

  useUtilKeyboardShortcuts({
    onExecute: validateYaml,
    onClear: clearAll,
    onCopy: () => {
      if (jsonOutput) copyToClipboard(jsonOutput, "JSON");
      else if (yamlInput) copyToClipboard(yamlInput, "YAML");
    }
  });

  const formatYaml = () => {
    try {
      if (!yamlInput.trim()) return;
      
      const parsed = yaml.load(yamlInput);
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      
      setYamlInput(formatted);
      validateYaml();
    } catch (err) {
      setError("Cannot format invalid YAML");
    }
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileCode className="h-5 w-5 text-dev-primary" />
          YAML Validator & Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">YAML Input</label>
                {isValid !== null && (
                  <Badge className={isValid ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}>
                    {isValid ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </>
                    )}
                  </Badge>
                )}
                {stats && (
                  <Badge variant="outline">
                    {stats.lines}L · {stats.size}B
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={validateYaml} size="sm" variant="outline">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Validate
                </Button>
                <Button onClick={formatYaml} size="sm" variant="outline">
                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                  Format
                </Button>
                <Button onClick={loadExample} variant="ghost" size="sm">Example</Button>
                <Button onClick={clearAll} variant="ghost" size="sm">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Textarea
                placeholder="Enter YAML content here..."
                value={yamlInput}
                onChange={(e) => {
                      setYamlInput(e.target.value);
                      // Auto-validate as user types
                      if (e.target.value.trim()) {
                        setTimeout(() => {
                          try {
                            setError("");
                            const parsed = yaml.load(e.target.value);
                            const jsonString = JSON.stringify(parsed, null, 2);
                            setJsonOutput(jsonString);
                            setIsValid(true);
                            setStats({
                              lines: e.target.value.split('\n').length,
                              size: new Blob([e.target.value]).size
                            });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Invalid YAML format");
                            setIsValid(false);
                            setJsonOutput("");
                            setStats(null);
                          }
                        }, 500);
                      } else {
                        setIsValid(null);
                        setJsonOutput("");
                        setStats(null);
                        setError("");
                      }
                    }}
                    className="w-full min-h-[400px] font-mono text-sm bg-muted/50 border-border/50 pr-20"
              />
              <CopyButton
                text={yamlInput}
                className="absolute right-2 top-2"
                title="Copy YAML"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">JSON Output</label>
              {jsonOutput && (
                <Button onClick={convertJsonToYaml} variant="outline" size="sm">
                  ← To YAML
                </Button>
              )}
            </div>
            <div className="relative">
              <Textarea
                placeholder="JSON output will appear here..."
                value={jsonOutput}
                onChange={(e) => setJsonOutput(e.target.value)}
                readOnly={!jsonOutput || isValid === true}
                className="w-full min-h-[300px] font-mono text-sm bg-muted/30 border-border/50"
              />
              <CopyButton
                text={jsonOutput}
                className={`absolute right-2 top-2 ${!jsonOutput ? 'opacity-50 pointer-events-none' : ''}`}
                title="Copy JSON"
              />
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1 border-t border-border/50 pt-4">
          <div><strong>YAML Tips:</strong></div>
          <div>• Use 2 spaces for indentation (no tabs)</div>
          <div>• Strings with special characters need quotes</div>
          <div>• Lists use dashes (-) or square brackets []</div>
          <div>• Objects use colons (:) or curly braces {}</div>
          <div>• Comments start with # symbol</div>
        </div>
      </CardContent>
    </Card>
  );
}