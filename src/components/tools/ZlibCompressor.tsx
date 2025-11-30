import { useState } from "react";
import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";

interface ZlibCompressorProps {
  navigate?: (toolId: string | null) => void;
}

export function ZlibCompressor({ navigate }: ZlibCompressorProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"compress" | "decompress">("decompress");
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

  const handleCopyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
    setStats(null);
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-dev-primary" />
          Zlib Compressor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cross-link to Base64 tool */}
        {navigate && (
          <div className="p-3 rounded-md border border-border/50 bg-muted/30 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Working with plain encoding? Switch to Base64 tool.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("base64")}
              className="flex items-center gap-1"
            >
              <span>Base64 Tool</span>
            </Button>
          </div>
        )}
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            onClick={() => setMode("decompress")}
            variant={mode === "decompress" ? "default" : "outline"}
            size="sm"
          >
            Decompress
          </Button>
          <Button
            onClick={() => setMode("compress")}
            variant={mode === "compress" ? "default" : "outline"}
            size="sm"
          >
            Compress
          </Button>
        </div>

        {/* Input Section */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            {mode === "compress" ? "Input Text" : "Compressed Data (Base64)"}
          </label>
          <Textarea
            placeholder={mode === "compress" ? "Enter text to compress..." : "Enter Base64 compressed data..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[150px] font-mono text-sm bg-muted/50 border-border/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={mode === "compress" ? compress : decompress}
            className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4"
          >
            <Zap className="h-4 w-4 mr-2" />
            {mode === "compress" ? "Compress" : "Decompress"}
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm" className="mr-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <div className="text-xs text-muted-foreground font-medium mb-1">Input Size</div>
              <div className="text-lg font-bold text-dev-primary">{stats.inputSize.toLocaleString()} B</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <div className="text-xs text-muted-foreground font-medium mb-1">Output Size</div>
              <div className="text-lg font-bold text-dev-secondary">{stats.outputSize.toLocaleString()} B</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                {mode === "compress" ? "Reduction" : "Expansion"}
              </div>
              <div className={`text-lg font-bold ${mode === "compress" && stats.ratio > 0 ? "text-dev-success" : "text-dev-warning"}`}>
                {stats.ratio > 0 ? "+" : ""}{stats.ratio.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Output Section */}
        {output && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                {mode === "compress" ? "Compressed Output (Base64)" : "Decompressed Output"}
              </label>
              <Button
                onClick={handleCopyToClipboard}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <div className="p-4 bg-muted/30 border border-border/50 rounded-lg font-mono text-sm text-foreground break-words max-h-64 overflow-auto">
              {output}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <div>
            <strong>Compress:</strong> Reduces text size using zlib deflate algorithm, outputs Base64-encoded result
          </div>
          <div>
            <strong>Decompress:</strong> Takes Base64-encoded zlib compressed data and returns original text
          </div>
          <div>
            <strong>Best for:</strong> Large JSON, logs, or repeated text with high compression ratios
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
