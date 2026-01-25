import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, DecimalsArrowRight, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Base64ConverterProps {
  initialContent?: string;
  action?: string;
  navigate?: (toolId: string | null) => void;
}

export function Base64Converter({ initialContent, action, navigate }: Base64ConverterProps) {
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
          <DecimalsArrowRight className="h-5 w-5 text-dev-primary" />
          Base64 Encoder/Decoder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cross-link to Zlib compressor */}
        {navigate && (
          <div className="p-3 rounded-md border border-border/50 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="text-sm text-muted-foreground">
              Need compression? Use the Zlib (deflate + Base64) tool.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("zlib")}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <span>Zlib Compressor</span>
            </Button>
          </div>
        )}
        <Tabs defaultValue="decode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="decode">Decode</TabsTrigger>
            <TabsTrigger value="encode">Encode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="decode" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Base64 to Decode
              </label>
              <Textarea
                placeholder="Enter base64 string to decode..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full min-h-[120px] font-mono text-sm bg-muted/50 border-border/50"
              />
              <div className="mt-2">
                <Button 
                  onClick={decode}
                  className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Decode
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="encode" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Text to Encode
              </label>
              <Textarea
                placeholder="Enter text to encode..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full min-h-[120px] bg-muted/50 border-border/50"
              />
              <div className="mt-2">
                <Button 
                  onClick={encode}
                  className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Encode
                </Button>
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
              className="w-full min-h-[120px] font-mono text-sm bg-muted/30 border-border/50"
            />
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
            <Tabs defaultValue="encode" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="encode">Text Examples</TabsTrigger>
                <TabsTrigger value="decode">Base64 Examples</TabsTrigger>
              </TabsList>
              
              <TabsContent value="encode" className="space-y-2 mt-2">
                {examples.encode.map((example, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div>
                      <div className="text-sm text-foreground">{example.text}</div>
                      <div className="text-sm text-muted-foreground">{example.desc}</div>
                    </div>
                    <Button
                      onClick={() => setInput(example.text)}
                      variant="outline"
                      size="sm"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="decode" className="space-y-2 mt-2">
                {examples.decode.map((example, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div>
                      <div className="font-mono text-sm text-foreground">{example.text}</div>
                      <div className="text-sm text-muted-foreground">{example.desc}</div>
                    </div>
                    <Button
                      onClick={() => setInput(example.text)}
                      variant="outline"
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