import { useState, useCallback } from "react";
import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";
import { useToolKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";

interface ZlibCompressorProps {
  navigate?: (toolId: string | null) => void;
}

export function ZlibCompressor({ navigate }: ZlibCompressorProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("decompress");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{
    inputSize: number;
    outputSize: number;
    ratio: number;
  } | null>(null);

  const compress = () => {
    try {
      setError("");
      const inputBytes = strToU8(input);
      const compressed = deflateSync(inputBytes); // Uint8Array
      // Convert to Base64 for portability
      let binary = "";
      for (let i = 0; i < compressed.length; i++) binary += String.fromCharCode(compressed[i]);
      const base64Compressed = btoa(binary);
      setOutput(base64Compressed);
      const ratio = ((1 - compressed.length / inputBytes.length) * 100) || 0;
      setStats({
        inputSize: inputBytes.length,
        outputSize: compressed.length,
        ratio: parseFloat(ratio.toFixed(2)),
      });
      toast.success("Compressed successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Compression failed";
      setError(errorMsg);
      toast.error("Compression failed");
    }
  };

  const decompress = () => {
    try {
      setError("");
      // Base64 decode
      const binary = atob(input);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const decompressed = inflateSync(bytes);
      const outputString = strFromU8(decompressed);
      setOutput(outputString);
      setStats({
        inputSize: input.length,
        outputSize: outputString.length,
        ratio: parseFloat(((outputString.length - input.length) / input.length * 100).toFixed(2)),
      });
      toast.success("Decompressed successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Decompression failed";
      setError(errorMsg);
      toast.error("Decompression failed");
    }
  };

  const handleCopyToClipboard = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  }, [output]);

  const clearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setStats(null);
  }, []);

  useToolKeyboardShortcuts({
    onExecute: () => activeTab === "compress" ? compress() : decompress(),
    onClear: clearAll,
    onCopy: handleCopyToClipboard
  });

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-dev-primary" />
          Zlib Compressor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cross-link to Base64 tool */}
        {navigate && (
          <div className="p-3 rounded-md border border-border/50 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Working with plain encoding? Switch to Base64 tool.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("base64")}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <span>Base64 Tool</span>
            </Button>
          </div>
        )}

        <Tabs defaultValue="decompress" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="decompress">Decompress</TabsTrigger>
            <TabsTrigger value="compress">Compress</TabsTrigger>
          </TabsList>

          {/* Decompress Tab */}
          <TabsContent value="decompress" className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Compressed Data (Base64)
              </label>
              <Textarea
                placeholder="Enter Base64 compressed data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full min-h-[150px] font-mono text-sm bg-muted/50 border-border/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={decompress}
                className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
              >
                <Zap className="h-4 w-4 mr-2" />
                Decompress
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/30 text-sm">
                {error}
              </div>
            )}

            {output && (
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Decompressed Text
                </label>
                <div className="relative">
                  <Textarea
                    value={output}
                    readOnly
                    className="w-full min-h-[150px] font-mono text-sm bg-background border-border/50 pr-16"
                  />
                  <CopyButton
                    text={output}
                    className="absolute right-2 top-2"
                    title="Copy output"
                  />
                </div>
              </div>
            )}

            {stats && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Input Size</div>
                    <div className="text-lg font-semibold text-foreground">{stats.inputSize} bytes</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Output Size</div>
                    <div className="text-lg font-semibold text-foreground">{stats.outputSize} bytes</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expansion</div>
                    <div className="text-lg font-semibold text-dev-primary">
                      {stats.ratio > 0 ? "+" : ""}{stats.ratio}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Compress Tab */}
          <TabsContent value="compress" className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Input Text
              </label>
              <Textarea
                placeholder="Enter text to compress..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full min-h-[150px] font-mono text-sm bg-muted/50 border-border/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={compress}
                className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
              >
                <Zap className="h-4 w-4 mr-2" />
                Compress
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/30 text-sm">
                {error}
              </div>
            )}

            {output && (
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Compressed Output (Base64)
                </label>
                <div className="relative">
                  <Textarea
                    value={output}
                    readOnly
                    className="w-full min-h-[150px] font-mono text-sm bg-background border-border/50 pr-16"
                  />
                  <CopyButton
                    text={output}
                    className="absolute right-2 top-2"
                    title="Copy output"
                  />
                </div>
              </div>
            )}

            {stats && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Input Size</div>
                    <div className="text-lg font-semibold text-foreground">{stats.inputSize} bytes</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Output Size</div>
                    <div className="text-lg font-semibold text-foreground">{stats.outputSize} bytes</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Compression Ratio</div>
                    <div className="text-lg font-semibold text-dev-primary">
                      {stats.ratio > 0 ? "+" : ""}{stats.ratio}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
