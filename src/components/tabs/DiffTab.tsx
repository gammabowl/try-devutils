import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, Plus, Minus } from "lucide-react";
import { validateJson } from "@/lib/json-validator";
import { computeJsonDiff, type DiffLine } from "@/lib/json-validator";
import { CodeEditor } from "@/components/CodeEditor";
import { isTauri } from "@/lib/platform";
import { useSharedJsonInput, type ExampleSignal } from "@/hooks/use-shared-json-input";

interface DiffTabProps {
  exampleSignal: ExampleSignal;
  sharedJson?: string;
  onSharedJsonChange?: (value: string) => void;
}

export function DiffTab({ exampleSignal, sharedJson, onSharedJsonChange }: DiffTabProps) {
  const panelHeight = isTauri() ? "100%" : "60vh";
  const panelStyle = { height: panelHeight, minHeight: panelHeight };
  const { input: leftInput, setInputAndShare: setLeftInputAndShare } = useSharedJsonInput({
    exampleSignal,
    sharedJson,
    onSharedJsonChange,
  });
  const [rightInput, setRightInput] = useState("");
  const [diffResult, setDiffResult] = useState<{ leftLines: DiffLine[]; rightLines: DiffLine[]; stats: { added: number; removed: number; changed: number } } | null>(null);
  const [error, setError] = useState("");
  const [leftCursor, setLeftCursor] = useState<{ line: number; column: number } | null>(null);
  const [rightCursor, setRightCursor] = useState<{ line: number; column: number } | null>(null);

  const handleDiff = useCallback(() => {
    setError("");
    const leftResult = validateJson(leftInput);
    const rightResult = validateJson(rightInput);

    if (!leftResult.valid) { setError("Left input is not valid JSON"); return; }
    if (!rightResult.valid) { setError("Right input is not valid JSON"); return; }

    // Format both for consistent comparison
    const leftFormatted = JSON.stringify(leftResult.parsed, null, 2);
    const rightFormatted = JSON.stringify(rightResult.parsed, null, 2);
    const result = computeJsonDiff(leftFormatted, rightFormatted);
    setDiffResult(result);
  }, [leftInput, rightInput]);

  const getDiffBg = (type: DiffLine["type"]) => {
    switch (type) {
      case "added": return "bg-green-500/15";
      case "removed": return "bg-red-500/15";
      case "changed": return "bg-yellow-500/15";
      default: return "";
    }
  };

  const handleDiffSelection = (side: "left" | "right") => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const anchor = selection.anchorNode;
    if (!anchor) return;
    const element = (anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement)?.closest("[data-line-num]");
    if (!element) return;
    const lineNum = Number(element.getAttribute("data-line-num"));
    if (!lineNum || lineNum < 1) return;
    const textSpan = (anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement)?.closest("[data-line-text]");
    if (!textSpan) return;
    const col = (selection.anchorOffset ?? 0) + 1;
    if (side === "left") setLeftCursor({ line: lineNum, column: col });
    else setRightCursor({ line: lineNum, column: col });
  };

  return (
    <div className="space-y-3 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleDiff}
          size="sm"
          className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
        >
          <GitCompare className="h-4 w-4 mr-1" /> Compare
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
        {diffResult && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="outline" className="text-xs font-mono gap-1"><Plus className="h-3 w-3 text-green-500" />{diffResult.stats.added} added</Badge>
            <Badge variant="outline" className="text-xs font-mono gap-1"><Minus className="h-3 w-3 text-red-500" />{diffResult.stats.removed} removed</Badge>
          </div>
        )}
      </div>

      {/* Input panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 h-full">
        <div className="flex flex-col min-h-0 h-full">
          <div className="text-xs font-medium text-muted-foreground mb-1">Left (Original)</div>
          <div className="relative flex-1 min-h-0 h-full">
            <CodeEditor
              value={leftInput}
              onChange={(value) => {
                setLeftInputAndShare(value);
              }}
              placeholder="Paste original JSON..."
              minHeight={panelHeight}
            />
          </div>
        </div>
        <div className="flex flex-col min-h-0 h-full">
          <div className="text-xs font-medium text-muted-foreground mb-1">Right (Modified)</div>
          <div className="relative flex-1 min-h-0 h-full">
            <CodeEditor
              value={rightInput}
              onChange={setRightInput}
              placeholder="Paste modified JSON..."
              minHeight={panelHeight}
            />
          </div>
        </div>
      </div>

      {/* Diff output */}
      {diffResult && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Diff Result</span>
            <span className="text-xs text-muted-foreground font-mono">
              {leftCursor ? `Left ln ${leftCursor.line}, col ${leftCursor.column}` : "Left ln -, col -"}
              {" · "}
              {rightCursor ? `Right ln ${rightCursor.line}, col ${rightCursor.column}` : "Right ln -, col -"}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border rounded-md overflow-hidden" style={panelStyle}>
            <ScrollArea className="bg-card border-r border-border" style={{ height: panelHeight }}>
              <div className="font-mono text-sm">
                {diffResult.leftLines.map((line, i) => (
                  <div key={i} data-line-num={line.lineNum} className={`flex ${getDiffBg(line.type)} ${line.lineNum === -1 ? "opacity-30" : ""}`} onMouseUp={() => handleDiffSelection("left")}>
                    <span className="select-none text-right pr-2 pl-2 py-0.5 text-muted-foreground text-xs min-w-[3rem] border-r border-border bg-muted/20">
                      {line.lineNum > 0 ? line.lineNum : ""}
                    </span>
                    <span className="px-2 py-0.5 text-xs whitespace-pre" data-line-text="true">
                      {line.type === "removed" && <span className="text-red-500 mr-1">−</span>}
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="bg-card" style={{ height: panelHeight }}>
              <div className="font-mono text-sm">
                {diffResult.rightLines.map((line, i) => (
                  <div key={i} data-line-num={line.lineNum} className={`flex ${getDiffBg(line.type)} ${line.lineNum === -1 ? "opacity-30" : ""}`} onMouseUp={() => handleDiffSelection("right")}>
                    <span className="select-none text-right pr-2 pl-2 py-0.5 text-muted-foreground text-xs min-w-[3rem] border-r border-border bg-muted/20">
                      {line.lineNum > 0 ? line.lineNum : ""}
                    </span>
                    <span className="px-2 py-0.5 text-xs whitespace-pre" data-line-text="true">
                      {line.type === "added" && <span className="text-green-500 mr-1">+</span>}
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
