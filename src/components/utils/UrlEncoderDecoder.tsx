import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, ArrowRightLeft, CheckCircle } from "lucide-react";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";

interface UrlEncoderDecoderProps {
  initialContent?: string;
  action?: string;
}

export function UrlEncoderDecoder({ initialContent }: UrlEncoderDecoderProps) {
  const [input, setInput] = useState(initialContent || "");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("decode");
  const [encodeMode, setEncodeMode] = useState<"component" | "full">("component");
  const [examplesOpen, setExamplesOpen] = useState(false);

  const { toast } = useToast();

  const examples = [
    {
      encoded: "https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dvalue%26foo%3Dbar",
      decoded: "https://example.com/path?query=value&foo=bar",
      desc: "Full URL with query params"
    },
    {
      encoded: "Hello%20World%21%20%F0%9F%91%8B",
      decoded: "Hello World! 👋",
      desc: "Text with emoji"
    },
    {
      encoded: "user%40example.com",
      decoded: "user@example.com",
      desc: "Email address"
    },
    {
      encoded: "%7B%22name%22%3A%22John%22%2C%22age%22%3A30%7D",
      decoded: '{"name":"John","age":30}',
      desc: "JSON in URL"
    }
  ];

  const encode = () => {
    try {
      const result = encodeMode === "component" 
        ? encodeURIComponent(input)
        : encodeURI(input);
      setOutput(result);
    } catch (err) {
      setOutput("Error: Invalid input for encoding");
    }
  };

  const decode = () => {
    try {
      const result = decodeURIComponent(input);
      setOutput(result);
    } catch (err) {
      setOutput("Error: Invalid URL-encoded string");
    }
  };

  const process = () => {
    if (mode === "encode") {
      encode();
    } else {
      decode();
    }
  };

  const swap = () => {
    setInput(output);
    setOutput(input);
  };

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
    });
  }, [toast]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  useUtilKeyboardShortcuts({
    onExecute: process,
    onClear: clearAll,
    onCopy: () => { if (output) copyToClipboard(output); }
  });

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Link className="h-5 w-5 text-dev-primary" />
          URL Encoder/Decoder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "encode" | "decode")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="decode">Decode</TabsTrigger>
            <TabsTrigger value="encode">Encode</TabsTrigger>
          </TabsList>

          <TabsContent value="encode" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                variant={encodeMode === "component" ? "default" : "outline"}
                size="sm"
                onClick={() => setEncodeMode("component")}
              >
                encodeURIComponent
              </Button>
              <Button
                variant={encodeMode === "full" ? "default" : "outline"}
                size="sm"
                onClick={() => setEncodeMode("full")}
              >
                encodeURI
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {encodeMode === "component" 
                ? "Encodes all special characters including /, ?, &, =, etc."
                : "Encodes special characters but preserves URL structure (/, ?, &, =, etc.)"}
            </p>
          </TabsContent>

          <TabsContent value="decode" className="mt-4">
            <p className="text-xs text-muted-foreground">
              Decodes URL-encoded strings (percent-encoded characters like %20, %3A, etc.)
            </p>
          </TabsContent>
        </Tabs>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Input {mode === "decode" ? "(URL-encoded)" : "(Plain text)"}
          </label>
          <Textarea
            placeholder={mode === "decode" 
              ? "Paste URL-encoded string here..." 
              : "Enter text to encode..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[100px] font-mono text-sm bg-background border-2 border-input focus:border-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={process}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
          >
            {mode === "decode" ? "Decode" : "Encode"}
          </Button>

          {output && (
            <>
              <Button onClick={swap} variant="outline" size="sm">
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Swap
              </Button>
            </>
          )}

          <Button onClick={clearAll} variant="outline" size="sm">
            Clear
          </Button>
        </div>

        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Output {mode === "decode" ? "(Decoded)" : "(Encoded)"}
              </label>
              <Badge className="bg-dev-success text-dev-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                {mode === "decode" ? "Decoded" : "Encoded"}
              </Badge>
            </div>
            <div className="relative">
              <pre className="bg-muted/50 p-3 rounded-md text-sm font-mono overflow-auto max-h-[200px] border border-border/50 whitespace-pre-wrap break-all pr-16">
                {output}
              </pre>
              <CopyButton
                text={output}
                className="absolute right-2 top-2"
                title="Copy output"
              />
            </div>
          </div>
        )}

        {/* Character mapping reference */}
        <div className="bg-muted/30 rounded-md p-3">
          <div className="text-sm font-medium mb-2">Common Encodings</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div><span className="text-muted-foreground">Space:</span> %20</div>
            <div><span className="text-muted-foreground">!</span> %21</div>
            <div><span className="text-muted-foreground">#</span> %23</div>
            <div><span className="text-muted-foreground">$</span> %24</div>
            <div><span className="text-muted-foreground">&</span> %26</div>
            <div><span className="text-muted-foreground">'</span> %27</div>
            <div><span className="text-muted-foreground">(</span> %28</div>
            <div><span className="text-muted-foreground">)</span> %29</div>
            <div><span className="text-muted-foreground">+</span> %2B</div>
            <div><span className="text-muted-foreground">,</span> %2C</div>
            <div><span className="text-muted-foreground">/</span> %2F</div>
            <div><span className="text-muted-foreground">:</span> %3A</div>
            <div><span className="text-muted-foreground">=</span> %3D</div>
            <div><span className="text-muted-foreground">?</span> %3F</div>
            <div><span className="text-muted-foreground">@</span> %40</div>
            <div><span className="text-muted-foreground">%</span> %25</div>
          </div>
        </div>
      </CardContent>

      <div className="border-t border-border/50 px-6 py-4">
        <Collapsible open={examplesOpen} onOpenChange={setExamplesOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {examplesOpen ? "▼" : "▶"} Examples
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
                    {mode === "decode" ? example.encoded : example.decoded}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {example.desc}
                  </div>
                </div>
                <Button
                  onClick={() => setInput(mode === "decode" ? example.encoded : example.decoded)}
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
