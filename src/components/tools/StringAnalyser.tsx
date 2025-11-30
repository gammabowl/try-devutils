import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Type } from "lucide-react";
import { length, charCount, wordCount, lineCount, toLowerCase, toUpperCase } from "@/lib/stringUtils";
import { toast } from "sonner";

export function StringAnalyser() {
  const [input, setInput] = useState("");
  const [displayText, setDisplayText] = useState("");

  // Compute stats
  const stats = {
    length: length(input),
    charCount: Object.keys(charCount(input)).length,
    wordCount: wordCount(input),
    lineCount: lineCount(input),
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleClear = () => {
    setInput("");
    setDisplayText("");
  };

  const handleToLowerCase = () => {
    const result = toLowerCase(input);
    setDisplayText(result);
  };

  const handleToUpperCase = () => {
    const result = toUpperCase(input);
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

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground font-medium mb-1">Length</div>
            <div className="text-2xl font-bold text-dev-primary">{stats.length}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground font-medium mb-1">Unique Characters</div>
            <div className="text-2xl font-bold text-dev-secondary">{stats.charCount}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground font-medium mb-1">Words</div>
            <div className="text-2xl font-bold text-dev-success">{stats.wordCount}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground font-medium mb-1">Lines</div>
            <div className="text-2xl font-bold text-dev-warning">{stats.lineCount}</div>
          </div>
        </div>

        {/* Case Conversion Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleToLowerCase} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4">
            Lowercase
          </Button>
          <Button onClick={handleToUpperCase} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4">
            UPPERCASE
          </Button>
          <Button onClick={handleClear} variant="outline" size="sm" className="mr-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Output Section */}
        {displayText && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Converted Text
              </label>
              <Button
                onClick={() => handleCopyToClipboard(displayText, "Text")}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <div className="p-4 bg-muted/30 border border-border/50 rounded-lg font-mono text-sm text-foreground break-words max-h-64 overflow-auto">
              {displayText}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <div><strong>Length:</strong> Total number of characters (Unicode code points)</div>
          <div><strong>Unique Characters:</strong> Count of distinct characters</div>
          <div><strong>Words:</strong> Count of space-separated words</div>
          <div><strong>Lines:</strong> Count of line breaks</div>
        </div>
      </CardContent>
    </Card>
  );
}
