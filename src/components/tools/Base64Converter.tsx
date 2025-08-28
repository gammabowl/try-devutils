import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, FileText, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Base64ConverterProps {
  initialContent?: string;
  action?: string;
}

export function Base64Converter({ initialContent, action }: Base64ConverterProps) {
  const [input, setInput] = useState(initialContent || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "decode") {
      try {
        setError("");
        const decoded = decodeURIComponent(escape(atob(initialContent)));
        setOutput(decoded);
      } catch (err) {
        setError("Failed to decode. Invalid base64 string.");
        setOutput("");
      }
    }
  }, [initialContent, action]);

  const examples = {
    encode: [
      { text: "Hello World", desc: "Simple greeting" },
      { text: "The quick brown fox", desc: "Common test phrase" },
      { text: "user@example.com", desc: "Email address" },
      { text: "password123", desc: "Common password" },
    ],
    decode: [
      { text: "SGVsbG8gV29ybGQ=", desc: "Decodes to 'Hello World'" },
      { text: "VGhlIHF1aWNrIGJyb3duIGZveA==", desc: "Decodes to 'The quick brown fox'" },
      { text: "dXNlckBleGFtcGxlLmNvbQ==", desc: "Decodes to 'user@example.com'" },
      { text: "cGFzc3dvcmQxMjM=", desc: "Decodes to 'password123'" },
    ],
  };

  const encode = () => {
    try {
      setError("");
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
    } catch (err) {
      setError("Failed to encode. Please check your input.");
      setOutput("");
    }
  };

  const decode = () => {
    try {
      setError("");
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
    } catch (err) {
      setError("Failed to decode. Invalid base64 string.");
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied!",
        description: "Output copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-dev-primary" />
          Base64 Encoder/Decoder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="encode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="encode" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Text to Encode
              </label>
              <Textarea
                placeholder="Enter text to encode..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-encode as user types
                  if (e.target.value.trim()) {
                    try {
                      setError("");
                      const encoded = btoa(unescape(encodeURIComponent(e.target.value)));
                      setOutput(encoded);
                    } catch (err) {
                      setError("Failed to encode. Please check your input.");
                      setOutput("");
                    }
                  } else {
                    setOutput("");
                    setError("");
                  }
                }}
                className="min-h-[120px] bg-muted/50 border-border/50"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-dev-primary">Text Examples</h4>
              <div className="space-y-2">
                {examples.encode.map((example, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                    <div>
                      <div className="text-sm text-foreground">{example.text}</div>
                      <div className="text-xs text-muted-foreground">{example.desc}</div>
                    </div>
                    <Button
                      onClick={() => setInput(example.text)}
                      variant="ghost"
                      size="sm"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="decode" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Base64 to Decode
              </label>
              <Textarea
                placeholder="Enter base64 string to decode..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-decode as user types
                  if (e.target.value.trim()) {
                    try {
                      setError("");
                      const decoded = decodeURIComponent(escape(atob(e.target.value)));
                      setOutput(decoded);
                    } catch (err) {
                      setError("Failed to decode. Invalid base64 string.");
                      setOutput("");
                    }
                  } else {
                    setOutput("");
                    setError("");
                  }
                }}
                className="min-h-[120px] font-mono text-sm bg-muted/50 border-border/50"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-dev-primary">Base64 Examples</h4>
              <div className="space-y-2">
                {examples.decode.map((example, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                    <div>
                      <div className="font-mono text-sm text-foreground">{example.text}</div>
                      <div className="text-xs text-muted-foreground">{example.desc}</div>
                    </div>
                    <Button
                      onClick={() => setInput(example.text)}
                      variant="ghost"
                      size="sm"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Output</label>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button onClick={clearAll} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>
            <Textarea
              value={output}
              readOnly
              className="min-h-[120px] font-mono text-sm bg-muted/30 border-border/50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}