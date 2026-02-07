import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RotateCcw, Type } from "lucide-react";
import { length, charCount, wordCount, lineCount, toLowerCase, toUpperCase, toCamelCase, toSnakeCase, toKebabCase } from "@/lib/stringUtils";
import { toast } from "sonner";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/ui/copy-button";

export function StringAnalyser() {
  const [input, setInput] = useState("");
  const [displayText, setDisplayText] = useState("");

  // Compute stats
  const stats = {
    length: length(input),
    charCount: Object.keys(charCount(input)).length,
    wordCount: wordCount(input),
    lineCount: lineCount(input),
    sizeBytes: new TextEncoder().encode(input).length,
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleCopyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setDisplayText("");
  }, []);

  useUtilKeyboardShortcuts({
    onClear: handleClear,
    onCopy: () => {
      if (displayText) handleCopyToClipboard(displayText, "Result");
      else if (input) handleCopyToClipboard(input, "Input");
    }
  });

  const handleToLowerCase = () => {
    const result = toLowerCase(input);
    setDisplayText(result);
  };

  const handleToUpperCase = () => {
    const result = toUpperCase(input);
    setDisplayText(result);
  };

  const handleToCamelCase = () => {
    const result = toCamelCase(input);
    setDisplayText(result);
  };

  const handleToSnakeCase = () => {
    const result = toSnakeCase(input);
    setDisplayText(result);
  };

  const handleToKebabCase = () => {
    const result = toKebabCase(input);
    setDisplayText(result);
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Type className="h-5 w-5 text-dev-primary" />
          String Analyser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Enter Text
          </label>
          <Textarea
            placeholder="Type or paste your text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[200px] font-mono text-sm bg-muted/50 border-border/50"
          />
        </div>

        {/* Statistics + Case Conversion */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Chars <strong className="text-foreground">{stats.length}</strong></span>
            <span className="text-muted-foreground">Unique <strong className="text-foreground">{stats.charCount}</strong></span>
            <span className="text-muted-foreground">Words <strong className="text-foreground">{stats.wordCount}</strong></span>
            <span className="text-muted-foreground">Lines <strong className="text-foreground">{stats.lineCount}</strong></span>
            <span className="text-muted-foreground">Size <strong className="text-foreground">{formatSize(stats.sizeBytes)}</strong></span>
          </div>
          <div className="h-4 border-l border-border/50 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-1.5">
            <Button onClick={handleToLowerCase} variant="outline" size="sm">lowercase</Button>
            <Button onClick={handleToUpperCase} variant="outline" size="sm">UPPERCASE</Button>
            <Button onClick={handleToCamelCase} variant="outline" size="sm">camelCase</Button>
            <Button onClick={handleToSnakeCase} variant="outline" size="sm">snake_case</Button>
            <Button onClick={handleToKebabCase} variant="outline" size="sm">kebab-case</Button>
            <Button onClick={handleClear} variant="ghost" size="sm" className="ml-auto">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Output Section */}
        {displayText && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Converted Text
            </label>
            <div className="relative">
              <div className="p-4 pr-16 bg-muted/30 border border-border/50 rounded-lg font-mono text-sm text-foreground break-words">
                {displayText}
              </div>
              <CopyButton
                text={displayText}
                className="absolute right-2 top-2"
                title="Copy text"
              />
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
