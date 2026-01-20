import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileDiff as FileDiffIcon, RotateCcw } from "lucide-react";
import { diffLines, diffWords, Change } from "diff";

interface TextDiffProps {
  initialContent?: string;
  action?: string;
}

export function TextDiff({ initialContent, action }: TextDiffProps) {
  const [leftText, setLeftText] = useState(initialContent || "");
  const [rightText, setRightText] = useState("");
  const [diffResult, setDiffResult] = useState<Change[]>([]);
  const [diffType, setDiffType] = useState<"lines" | "words">("lines");

  useEffect(() => {
    if (initialContent && action === "diff") {
      setLeftText(initialContent);
    }
  }, [initialContent, action]);

  const calculateDiff = () => {
    const diff = diffType === "lines" 
      ? diffLines(leftText, rightText)
      : diffWords(leftText, rightText);
    setDiffResult(diff);
  };

  const clearAll = () => {
    setLeftText("");
    setRightText("");
    setDiffResult([]);
  };

  const renderDiff = () => {
    if (diffResult.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-dev-primary">Differences</h4>
        <div className="bg-muted/30 border border-border/50 rounded-md p-4 max-h-96 overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {diffResult.map((part, index) => {
              const className = part.added 
                ? "bg-green-500/20 text-green-500 dark:text-green-400 dark:bg-green-950/30" 
                : part.removed 
                ? "bg-red-500/20 text-red-500 dark:text-red-400 dark:bg-red-950/30"
                : "text-foreground";
              
              const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
              
              return (
                <span key={index} className={className}>
                  {diffType === "lines" 
                    ? part.value.split('\n').map((line, lineIndex, arr) => 
                        lineIndex < arr.length - 1 ? `${prefix}${line}\n` : 
                        line ? `${prefix}${line}` : ''
                      ).join('')
                    : part.value
                  }
                </span>
              );
            })}
          </pre>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="inline-block w-4 h-4 bg-green-500/20 rounded mr-1"></span>
          Added
          <span className="inline-block w-4 h-4 bg-red-500/20 rounded mr-1 ml-4"></span>
          Removed
        </div>
      </div>
    );
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileDiffIcon className="h-5 w-5 text-dev-primary" />
          Text Diff Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setDiffType("lines")}
            variant={diffType === "lines" ? "default" : "outline"}
            size="sm"
          >
            Line Diff
          </Button>
          <Button
            onClick={() => setDiffType("words")}
            variant={diffType === "words" ? "default" : "outline"}
            size="sm"
          >
            Word Diff
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Original Text
            </label>
            <Textarea
              placeholder="Enter original text..."
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              className="w-full min-h-[200px] font-mono text-sm bg-muted/50 border-border/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Modified Text
            </label>
            <Textarea
              placeholder="Enter modified text..."
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              className="w-full min-h-[200px] font-mono text-sm bg-muted/50 border-border/50"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateDiff} className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground px-4">
            <FileDiffIcon className="h-4 w-4 mr-2" />
            Compare Texts
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {renderDiff()}
      </CardContent>
    </Card>
  );
}