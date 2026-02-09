import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DecimalsArrowRight, ArrowUpDown, BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";

interface Base64ConverterProps {
  initialContent?: string;
  action?: string;
  navigate?: (toolId: string | null) => void;
}

export function Base64Converter({ initialContent, action, navigate }: Base64ConverterProps) {
  const [input, setInput] = useState(initialContent || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("encode");
  const { toast } = useToast();

  const encode = useCallback(() => {
    try {
      setError("");
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
    } catch (err) {
      setError("Failed to encode. Please check your input.");
      setOutput("");
    }
  }, [input]);

  const decode = useCallback(() => {
    try {
      setError("");
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
    } catch (err) {
      setError("Failed to decode. Invalid base64 string.");
      setOutput("");
    }
  }, [input]);

  const copyToClipboard = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied!",
        description: "Output copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  }, [output, toast]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  // Keyboard shortcuts
  useUtilKeyboardShortcuts({
    onExecute: () => activeTab === "encode" ? encode() : decode(),
    onClear: clearAll,
    onCopy: copyToClipboard,
  });

  useEffect(() => {
    if (initialContent && action === "decode") {
      setActiveTab("decode");
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

  return (
    <Card className="tool-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <DecimalsArrowRight className="h-5 w-5 text-dev-primary" />
            Base64 Encoder/Decoder
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Examples
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Tabs defaultValue="encode" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-b-none">
                  <TabsTrigger value="encode">Text Examples</TabsTrigger>
                  <TabsTrigger value="decode">Base64 Examples</TabsTrigger>
                </TabsList>
                <TabsContent value="encode" className="space-y-1 p-3 mt-0">
                  {examples.encode.map((example, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md gap-2">
                      <div className="min-w-0">
                        <div className="text-sm text-foreground truncate font-mono">{example.text}</div>
                        <div className="text-xs text-muted-foreground">{example.desc}</div>
                      </div>
                      <Button onClick={() => setInput(example.text)} variant="outline" size="sm" className="h-7 text-xs flex-shrink-0">Use</Button>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="decode" className="space-y-1 p-3 mt-0">
                  {examples.decode.map((example, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-sm text-foreground truncate">{example.text}</div>
                        <div className="text-xs text-muted-foreground">{example.desc}</div>
                      </div>
                      <Button onClick={() => setInput(example.text)} variant="outline" size="sm" className="h-7 text-xs flex-shrink-0">Use</Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            <div className="relative">
              <Textarea
                value={output}
                readOnly
                className="w-full min-h-[120px] font-mono text-sm bg-muted/30 border-border/50 pr-16"
              />
              <CopyButton
                text={output}
                className="absolute right-2 top-2"
                title="Copy output"
              />
            </div>
          </div>
        )}
      </CardContent>


    </Card>
  );
}