import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface JsonTreeNodeProps {
  keyName?: string;
  value: unknown;
  path: string;
  onPathClick?: (path: string) => void;
  defaultExpanded?: boolean;
}

function getTypeColor(value: unknown): string {
  if (value === null) return "text-orange-500";
  if (typeof value === "boolean") return "text-purple-500";
  if (typeof value === "number") return "text-blue-500";
  if (typeof value === "string") return "text-green-600";
  return "text-foreground";
}

function getTypeLabel(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return `Object{${Object.keys(value as object).length}}`;
  return typeof value;
}

function JsonTreeNode({ keyName, value, path, onPathClick, defaultExpanded = true }: JsonTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExpandable = value !== null && typeof value === "object";

  const handleClick = () => {
    if (onPathClick) onPathClick(path);
  };

  if (!isExpandable) {
    return (
      <div
        className="flex items-center gap-1 py-0.5 pl-4 hover:bg-accent/50 cursor-pointer rounded text-sm font-mono"
        onClick={handleClick}
        title={path}
      >
        {keyName !== undefined && (
          <span className="text-red-400">"{keyName}"<span className="text-foreground">: </span></span>
        )}
        <span className={getTypeColor(value)}>
          {value === null ? "null" : typeof value === "string" ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as object);

  const bracket = Array.isArray(value) ? ["[", "]"] : ["{", "}"];

  return (
    <div className="text-sm font-mono">
      <div
        className="flex items-center gap-0.5 py-0.5 hover:bg-accent/50 cursor-pointer rounded"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
        {keyName !== undefined && (
          <span className="text-red-400" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            "{keyName}"<span className="text-foreground">: </span>
          </span>
        )}
        <span className="text-foreground">{bracket[0]}</span>
        {!expanded && (
          <span className="text-muted-foreground ml-1">
            {getTypeLabel(value)} {bracket[1]}
          </span>
        )}
      </div>
      {expanded && (
        <div className="ml-4 border-l border-border/50 pl-1">
          {entries.map(([k, v]) => (
            <JsonTreeNode
              key={k}
              keyName={Array.isArray(value) ? undefined : k}
              value={v}
              path={`${path}${Array.isArray(value) ? `[${k}]` : `.${k}`}`}
              onPathClick={onPathClick}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
      {expanded && <div className="py-0.5"><span className="text-foreground">{bracket[1]}</span></div>}
    </div>
  );
}

interface JsonTreeViewProps {
  data: unknown;
  onPathClick?: (path: string) => void;
}

export function JsonTreeView({ data, onPathClick }: JsonTreeViewProps) {
  return (
    <div className="p-3 overflow-auto">
      <JsonTreeNode value={data} path="$" onPathClick={onPathClick} defaultExpanded={true} />
    </div>
  );
}
