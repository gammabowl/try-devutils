import jsonlint from "jsonlint-mod";
import Ajv from "ajv";
import addFormats from "ajv-formats";

export interface ValidationResult {
  valid: boolean;
  parsed?: unknown;
  error?: string;
  line?: number;
  column?: number;
  errorLine?: string;
}

export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: false, error: "Empty input" };
  }

  try {
    const parsed = jsonlint.parse(input);
    return { valid: true, parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lineMatch = message.match(/line (\d+)/i);
    const colMatch = message.match(/column (\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    const column = colMatch ? parseInt(colMatch[1], 10) : undefined;

    let errorLine: string | undefined;
    if (line) {
      const lines = input.split("\n");
      if (line <= lines.length) {
        errorLine = lines[line - 1];
      }
    }

    return { valid: false, error: message, line, column, errorLine };
  }
}

export function detectHiddenChars(input: string): { index: number; char: string; name: string }[] {
  const hidden: { index: number; char: string; name: string }[] = [];
  const hiddenCharMap: Record<number, string> = {
    0x200B: "Zero Width Space",
    0x200C: "Zero Width Non-Joiner",
    0x200D: "Zero Width Joiner",
    0xFEFF: "BOM",
    0x00A0: "Non-Breaking Space",
    0x2028: "Line Separator",
    0x2029: "Paragraph Separator",
    0x202F: "Narrow No-Break Space",
    0x2060: "Word Joiner",
  };

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (hiddenCharMap[code]) {
      hidden.push({ index: i, char: input[i], name: hiddenCharMap[code] });
    }
  }

  return hidden;
}

// JSON Path query - supports dot notation and brackets
function resolveSingle(current: unknown, part: string): unknown {
  if (current === null || current === undefined || typeof current !== "object") return undefined;
  if (Array.isArray(current)) {
    const idx = parseInt(part, 10);
    return isNaN(idx) ? undefined : current[idx];
  }
  return (current as Record<string, unknown>)[part];
}

function collectRecursive(data: unknown, targetParts: string[], results: unknown[]): void {
  if (data === null || data === undefined || typeof data !== "object") return;

  if (targetParts.length === 1 && targetParts[0] !== "[*]") {
    if (!Array.isArray(data) && targetParts[0] in (data as Record<string, unknown>)) {
      results.push((data as Record<string, unknown>)[targetParts[0]]);
    }
  } else if (targetParts.length > 0) {
    // Try resolving the full target path from here
    let cur: unknown = data;
    let matched = true;
    for (const p of targetParts) {
      cur = resolveSingle(cur, p);
      if (cur === undefined) { matched = false; break; }
    }
    if (matched) results.push(cur);
  }

  // Recurse into children
  if (Array.isArray(data)) {
    for (const item of data) collectRecursive(item, targetParts, results);
  } else {
    for (const val of Object.values(data as Record<string, unknown>)) {
      collectRecursive(val, targetParts, results);
    }
  }
}

export function queryJsonPath(data: unknown, path: string): { result: unknown; error?: string } {
  try {
    if (!path || path === "$") return { result: data };

    const stripped = path.replace(/^\$\.?/, "");
    if (!stripped) return { result: data };

    // Handle recursive descent (..)
    const doubleDotIdx = stripped.indexOf("..");
    if (doubleDotIdx !== -1) {
      const beforeDD = stripped.slice(0, doubleDotIdx);
      const afterDD = stripped.slice(doubleDotIdx + 2);

      let base: unknown = data;
      if (beforeDD) {
        const baseParts = beforeDD.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
        for (const p of baseParts) {
          base = resolveSingle(base, p);
          if (base === undefined) return { result: undefined, error: `No value found at path "${path}"` };
        }
      }

      const targetParts = afterDD.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
      const results: unknown[] = [];
      collectRecursive(base, targetParts, results);
      return results.length === 0
        ? { result: undefined, error: `No value found at path "${path}"` }
        : { result: results.length === 1 ? results[0] : results };
    }

    // Tokenize path into parts, preserving filter expressions as single tokens
    const parts: string[] = [];
    let remaining = stripped;
    while (remaining.length > 0) {
      if (remaining.startsWith(".")) { remaining = remaining.slice(1); continue; }
      // Filter expression [?(...)]
      const filterMatch = remaining.match(/^\[\?\(([^)]+)\)\]/);
      if (filterMatch) {
        parts.push(filterMatch[0]);
        remaining = remaining.slice(filterMatch[0].length);
        continue;
      }
      // Wildcard [*]
      if (remaining.startsWith("[*]")) {
        parts.push("[*]");
        remaining = remaining.slice(3);
        continue;
      }
      // Bracket index/key
      const bracketMatch = remaining.match(/^\[(\d+|'[^']*'|"[^"]*")\]/);
      if (bracketMatch) {
        const inner = bracketMatch[1].replace(/^['"]|['"]$/g, "");
        parts.push(inner);
        remaining = remaining.slice(bracketMatch[0].length);
        continue;
      }
      // Dot key
      const dotMatch = remaining.match(/^([^.[]+)/);
      if (dotMatch) {
        parts.push(dotMatch[1]);
        remaining = remaining.slice(dotMatch[0].length);
        continue;
      }
      break;
    }

    function applyFilter(arr: unknown[], expr: string): unknown[] {
      // Parse: @.field op value
      const m = expr.match(/^@\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
      if (!m) return arr;
      const [, field, op, rawVal] = m;
      const val = rawVal.replace(/^['"]|['"]$/g, "");
      const numVal = Number(val);
      const isNum = !isNaN(numVal) && rawVal.trim() === val;

      return arr.filter((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return false;
        const fieldVal = (item as Record<string, unknown>)[field];
        const a = typeof fieldVal === "number" ? fieldVal : String(fieldVal);
        const b = isNum ? numVal : val;
        switch (op) {
          case "==": return a == b;
          case "!=": return a != b;
          case ">":  return a > b;
          case "<":  return a < b;
          case ">=": return a >= b;
          case "<=": return a <= b;
          default: return false;
        }
      });
    }

    function resolve(current: unknown, partIndex: number): unknown {
      if (partIndex >= parts.length) return current;
      const part = parts[partIndex];
      if (current === null || current === undefined) return undefined;

      // Filter expression
      if (part.startsWith("[?(")) {
        if (!Array.isArray(current)) return undefined;
        const expr = part.slice(3, -2); // strip [?( and )]
        const filtered = applyFilter(current, expr);
        if (filtered.length === 0) return undefined;
        // Continue resolving remaining parts on filtered results
        if (partIndex + 1 >= parts.length) return filtered;
        const results = filtered.map((item) => resolve(item, partIndex + 1)).filter((v) => v !== undefined);
        return results.length === 0 ? undefined : results;
      }

      if (part === "[*]") {
        if (!Array.isArray(current)) return undefined;
        const results = current.map((item) => resolve(item, partIndex + 1)).filter((v) => v !== undefined);
        return results;
      }

      if (typeof current !== "object") return undefined;
      let next: unknown;
      if (Array.isArray(current)) {
        const idx = parseInt(part, 10);
        if (isNaN(idx)) return undefined;
        next = current[idx];
      } else {
        next = (current as Record<string, unknown>)[part];
      }
      return resolve(next, partIndex + 1);
    }

    const result = resolve(data, 0);
    if (result === undefined) return { result: undefined, error: `No value found at path "${path}"` };
    return { result };
  } catch (err) {
    return { result: undefined, error: String(err) };
  }
}

// JSON Diff
export interface DiffLine {
  type: "same" | "added" | "removed" | "changed";
  lineNum: number;
  content: string;
  otherContent?: string;
}

export function computeJsonDiff(
  left: string,
  right: string
): { leftLines: DiffLine[]; rightLines: DiffLine[]; stats: { added: number; removed: number; changed: number } } {
  const lLines = left.split("\n");
  const rLines = right.split("\n");
  const maxLen = Math.max(lLines.length, rLines.length);
  const leftLines: DiffLine[] = [];
  const rightLines: DiffLine[] = [];
  let added = 0, removed = 0, changed = 0;

  // LCS-based diff for better results
  const lcs = computeLCS(lLines, rLines);
  let li = 0, ri = 0, ci = 0;

  while (li < lLines.length || ri < rLines.length) {
    if (ci < lcs.length) {
      // Output removed lines (in left but before next common)
      while (li < lLines.length && lLines[li] !== lcs[ci]) {
        leftLines.push({ type: "removed", lineNum: li + 1, content: lLines[li] });
        rightLines.push({ type: "same", lineNum: -1, content: "" }); // placeholder
        removed++;
        li++;
      }
      // Output added lines (in right but before next common)
      while (ri < rLines.length && rLines[ri] !== lcs[ci]) {
        rightLines.push({ type: "added", lineNum: ri + 1, content: rLines[ri] });
        leftLines.push({ type: "same", lineNum: -1, content: "" }); // placeholder
        added++;
        ri++;
      }
      // Output common line
      if (li < lLines.length && ri < rLines.length) {
        leftLines.push({ type: "same", lineNum: li + 1, content: lLines[li] });
        rightLines.push({ type: "same", lineNum: ri + 1, content: rLines[ri] });
        li++;
        ri++;
        ci++;
      }
    } else {
      // Remaining lines
      while (li < lLines.length) {
        leftLines.push({ type: "removed", lineNum: li + 1, content: lLines[li] });
        rightLines.push({ type: "same", lineNum: -1, content: "" });
        removed++;
        li++;
      }
      while (ri < rLines.length) {
        rightLines.push({ type: "added", lineNum: ri + 1, content: rLines[ri] });
        leftLines.push({ type: "same", lineNum: -1, content: "" });
        added++;
        ri++;
      }
    }
  }

  return { leftLines, rightLines, stats: { added, removed, changed } };
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

// JSON to CSV
export function jsonToCsv(data: unknown): { result?: string; error?: string } {
  try {
    let rows: Record<string, unknown>[];
    if (Array.isArray(data)) {
      if (data.length === 0) return { error: "Empty array — nothing to convert" };
      if (typeof data[0] !== "object" || data[0] === null) return { error: "CSV requires an array of objects" };
      rows = data as Record<string, unknown>[];
    } else if (typeof data === "object" && data !== null) {
      rows = [data as Record<string, unknown>];
    } else {
      return { error: "CSV requires an object or array of objects" };
    }

    const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [allKeys.join(",")];
    for (const row of rows) {
      lines.push(allKeys.map((k) => escape(row[k])).join(","));
    }
    return { result: lines.join("\n") };
  } catch (err) {
    return { error: String(err) };
  }
}

// JSON to YAML
export function jsonToYaml(data: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);

  if (data === null) return `${pad}null`;
  if (data === undefined) return `${pad}~`;
  if (typeof data === "boolean") return `${pad}${data}`;
  if (typeof data === "number") return `${pad}${data}`;
  if (typeof data === "string") {
    if (data.includes("\n")) return `${pad}|\n${data.split("\n").map((l) => pad + "  " + l).join("\n")}`;
    if (/[:{}\[\],&*?|<>=!%@`#'"]/.test(data) || data.trim() !== data || data === "")
      return `${pad}"${data.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    return `${pad}${data}`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return `${pad}[]`;
    return data.map((item) => {
      if (typeof item === "object" && item !== null) {
        const inner = jsonToYaml(item, indent + 1).trimStart();
        return `${pad}- ${inner}`;
      }
      return `${pad}- ${jsonToYaml(item, 0).trimStart()}`;
    }).join("\n");
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return `${pad}{}`;
    return entries.map(([key, val]) => {
      if (typeof val === "object" && val !== null) {
        return `${pad}${key}:\n${jsonToYaml(val, indent + 1)}`;
      }
      return `${pad}${key}: ${jsonToYaml(val, 0).trimStart()}`;
    }).join("\n");
  }

  return `${pad}${String(data)}`;
}

// JSON Schema Validation
export function validateJsonSchema(data: unknown, schema: unknown): { valid: boolean; errors: string[] } {
  try {
    const ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(ajv);
    const validate = ajv.compile(schema as object);
    const valid = validate(data);
    if (valid) return { valid: true, errors: [] };
    const errors = (validate.errors || []).map((e) => {
      const path = e.instancePath || "/";
      return `${path}: ${e.message}${e.params ? ` (${JSON.stringify(e.params)})` : ""}`;
    });
    return { valid: false, errors };
  } catch (err) {
    return { valid: false, errors: [String(err)] };
  }
}
