import { useRef, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  errorLine?: number;
  minHeight?: string;
  onReadOnlySelectionChange?: (pos: { line: number; column: number }) => void;
  onSelectionChange?: (pos: { line: number; column: number }) => void;
}

const LARGE_TEXT_THRESHOLD = 200_000;

function highlightJson(text: string): string {
  // Escape HTML, then wrap JSON tokens in spans
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(?:[^"\\]|\\.)*")\s*:/g, // keys
    '<span class="syntax-key">$1</span>:'
  ).replace(
    /:\s*("(?:[^"\\]|\\.)*")/g, // string values
    ': <span class="syntax-string">$1</span>'
  ).replace(
    // standalone string values in arrays
    /(?<=[\[,]\s*)("(?:[^"\\]|\\.)*")(?=\s*[,\]])/g,
    '<span class="syntax-string">$1</span>'
  ).replace(
    /\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, // numbers
    '<span class="syntax-number">$1</span>'
  ).replace(
    /\b(true|false)\b/g, // booleans
    '<span class="syntax-boolean">$1</span>'
  ).replace(
    /\bnull\b/g, // null
    '<span class="syntax-null">null</span>'
  ).replace(
    /([{}[\]])/g, // brackets
    '<span class="syntax-bracket">$1</span>'
  );
}

export function CodeEditor({ value, onChange, readOnly = false, placeholder, errorLine, minHeight = "400px", onReadOnlySelectionChange, onSelectionChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const readOnlyRef = useRef<HTMLPreElement>(null);
  const lines = useMemo(() => value.split("\n"), [value]);
  const isLarge = value.length > LARGE_TEXT_THRESHOLD;
  const sizeStyle = minHeight === "100%"
    ? { height: "100%", minHeight: "100%" }
    : { height: minHeight, minHeight };

  const highlighted = useMemo(() => (isLarge ? "" : highlightJson(value)), [value, isLarge]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const updateReadOnlySelection = useCallback(() => {
    if (!onReadOnlySelectionChange || !readOnlyRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!readOnlyRef.current.contains(range.startContainer)) return;

    const fullText = readOnlyRef.current.innerText || "";
    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(readOnlyRef.current);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const offset = beforeRange.toString().length;

    const upToCursor = fullText.slice(0, offset);
    const lineParts = upToCursor.split("\n");
    const line = lineParts.length;
    const column = (lineParts[lineParts.length - 1]?.length ?? 0) + 1;
    onReadOnlySelectionChange({ line, column });
  }, [onReadOnlySelectionChange]);

  if (readOnly) {
    return (
      <ScrollArea className="border border-border rounded-md bg-card" style={sizeStyle}>
        <div className="flex codeeditor-row">
          <div className="select-none text-right pr-2 pl-2 py-3 bg-muted/30 text-muted-foreground text-xs font-mono leading-[1.5rem] min-w-[3rem] border-r border-border sticky left-0">
            {lines.map((_, i) => (
              <div key={i} className={errorLine === i + 1 ? "text-destructive font-bold" : ""}>{i + 1}</div>
            ))}
          </div>
          {isLarge ? (
            <pre
              ref={readOnlyRef}
              className="flex-1 p-3 font-mono text-sm leading-[1.5rem] whitespace-pre-wrap break-all select-text outline-none"
              tabIndex={0}
              onMouseUp={updateReadOnlySelection}
              onKeyUp={updateReadOnlySelection}
            >
              {value}
            </pre>
          ) : (
            <pre
              ref={readOnlyRef}
              className="flex-1 p-3 font-mono text-sm leading-[1.5rem] whitespace-pre-wrap break-all syntax-highlight select-text outline-none"
              dangerouslySetInnerHTML={{ __html: highlighted }}
              tabIndex={0}
              onMouseUp={updateReadOnlySelection}
              onKeyUp={updateReadOnlySelection}
            />
          )}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden bg-card" style={sizeStyle}>
      <div className="flex h-full">
        <div className="select-none text-right pr-2 pl-2 py-3 bg-muted/30 text-muted-foreground text-xs font-mono leading-[1.5rem] min-w-[3rem] border-r border-border">
          {lines.map((_, i) => (
            <div key={i} className={errorLine === i + 1 ? "text-destructive font-bold" : ""}>{i + 1}</div>
          ))}
        </div>
        <div className="relative flex-1">
          {!isLarge && (
            <div
              ref={highlightRef}
              className="absolute inset-0 p-3 font-mono text-sm leading-[1.5rem] whitespace-pre-wrap break-all overflow-hidden pointer-events-none opacity-0"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlighted || `<span class="text-muted-foreground">${placeholder ?? ""}</span>` }}
            />
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={!value ? placeholder : undefined}
            className="relative w-full h-full p-3 font-mono text-sm bg-transparent resize-none outline-none leading-[1.5rem] text-foreground caret-foreground placeholder:text-muted-foreground selection:text-foreground selection:bg-dev-primary/30 select-text cursor-text"
            style={sizeStyle}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            inputMode="text"
            aria-label={placeholder ?? "Code editor"}
            onScroll={syncScroll}
            onSelect={(e) => {
              if (!onSelectionChange) return;
              const target = e.currentTarget;
              const start = target.selectionStart ?? 0;
              const before = target.value.slice(0, start);
              const parts = before.split("\n");
              const line = parts.length;
              const column = (parts[parts.length - 1]?.length ?? 0) + 1;
              onSelectionChange({ line, column });
            }}
            onMouseUp={(e) => {
              if (!onSelectionChange) return;
              const target = e.currentTarget;
              const start = target.selectionStart ?? 0;
              const before = target.value.slice(0, start);
              const parts = before.split("\n");
              const line = parts.length;
              const column = (parts[parts.length - 1]?.length ?? 0) + 1;
              onSelectionChange({ line, column });
            }}
            onKeyUp={(e) => {
              if (!onSelectionChange) return;
              const target = e.currentTarget as HTMLTextAreaElement;
              const start = target.selectionStart ?? 0;
              const before = target.value.slice(0, start);
              const parts = before.split("\n");
              const line = parts.length;
              const column = (parts[parts.length - 1]?.length ?? 0) + 1;
              onSelectionChange({ line, column });
            }}
          />
        </div>
      </div>
    </div>
  );
}
