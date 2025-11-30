import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Braces, Copy, AlertCircle, CheckCircle, Minimize2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonFormatterProps {
  initialContent?: string;
  action?: string;
}

export function JsonFormatter({ initialContent, action }: JsonFormatterProps) {
  const [input, setInput] = useState(initialContent || "");
  const [output, setOutput] = useState("");
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isMinified, setIsMinified] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "format") {
      formatJson(false);
    }
  }, [initialContent, action]);

  const examples = [
    {
      json: '{"name":"John Doe","age":30,"city":"New York","active":true}',
      desc: "Simple user object"
    },
    {
      json: '[{"id":1,"product":"Laptop","price":999.99},{"id":2,"product":"Mouse","price":29.99}]',
      desc: "Product array"
    },
    {
      json: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}},"posts":[{"title":"Hello World","tags":["intro","welcome"]}]}}',
      desc: "Nested object structure"
    },
    {
      json: '{"timestamp":"2024-01-01T00:00:00Z","data":null,"count":0,"tags":[]}',
      desc: "Mixed data types"
    }
  ];

  const formatJson = (minify = false) => {
    try {
      setError("");
      
      if (!input.trim()) {
        setOutput("");
        setParsedJson(null);
        setIsValid(null);
        return;
      }

      const parsed = JSON.parse(input);
      const formatted = minify 
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, 2);
      
      setOutput(formatted);
      setParsedJson(parsed);
      setIsValid(true);
      setIsMinified(minify);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setIsValid(false);
      setOutput("");
      setParsedJson(null);
    }
  };

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied!",
        description: "Formatted JSON copied to clipboard",
      });
    }
  };


  const clearAll = () => {
    setInput("");
    setOutput("");
    setParsedJson(null);
    setError("");
    setIsValid(null);
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Braces className="h-5 w-5 text-dev-primary" />
          JSON Formatter & Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            JSON Input
          </label>
          <Textarea
            placeholder="Paste your JSON here..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              formatJson(isMinified);
            }}
            className="w-full min-h-[150px] font-mono text-sm bg-background border-2 border-input focus:border-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            onClick={() => formatJson(false)}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Format
          </Button>

          <Button
            onClick={() => formatJson(true)}
            variant="outline"
            size="sm"
          >
            <Minimize2 className="h-4 w-4 mr-1" />
            Minify
          </Button>

          {output && (
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          )}

          <Button
            onClick={clearAll}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        </div>

        {isValid !== null && (
          <div className="flex items-center gap-2">
            {isValid ? (
              <Badge className="bg-dev-success text-dev-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid JSON
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Invalid JSON
              </Badge>
            )}
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
                {isMinified ? "Minified" : "Pretty"}
              </Badge>
            </div>

            <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-auto max-h-[300px] border border-border/50">
              {output}
            </pre>
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
            {examples.map((example, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-foreground truncate">
                    {example.json}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {example.desc}
                  </div>
                </div>
                <Button
                  onClick={() => setInput(example.json)}
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