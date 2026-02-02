import { lazy } from "react";

// Lazy-loaded tool components with prefetch support
const toolImports = {
  base64: () => import("@/components/tools/Base64Converter"),
  color: () => import("@/components/tools/ColorConverter"),
  cron: () => import("@/components/tools/CronParser"),
  hash: () => import("@/components/tools/HashGenerator"),
  json: () => import("@/components/tools/JsonFormatter"),
  jwt: () => import("@/components/tools/JwtDecoder"),
  markdown: () => import("@/components/tools/MarkdownPreview"),
  numberbase: () => import("@/components/tools/NumberBaseConverter"),
  regex: () => import("@/components/tools/RegExpTester"),
  sql: () => import("@/components/tools/SqlFormatter"),
  ssl: () => import("@/components/tools/SslCertificateDecoder"),
  string: () => import("@/components/tools/StringAnalyser"),
  diff: () => import("@/components/tools/TextDiff"),
  timestamp: () => import("@/components/tools/TimestampConverter"),
  url: () => import("@/components/tools/UrlEncoderDecoder"),
  uuid: () => import("@/components/tools/UuidGeneratorDecoder"),
  yaml: () => import("@/components/tools/YamlValidator"),
  zlib: () => import("@/components/tools/ZlibCompressor"),
} as const;

export type ToolId = keyof typeof toolImports;

// Cache for prefetched modules
const prefetchCache = new Map<string, Promise<unknown>>();

// Prefetch a tool component (call on hover)
// Silently catches errors to avoid issues with page refresh, network failures, etc.
export function prefetchTool(toolId: string): void {
  try {
    if (toolId in toolImports && !prefetchCache.has(toolId)) {
      const importFn = toolImports[toolId as ToolId];
      const promise = importFn().catch(() => {
        // Remove from cache on error so it can be retried
        prefetchCache.delete(toolId);
      });
      prefetchCache.set(toolId, promise);
    }
  } catch {
    // Silently ignore any errors during prefetch
  }
}

// Create lazy components with the same import functions
export const LazyBase64Converter = lazy(() => toolImports.base64().then(m => ({ default: m.Base64Converter })));
export const LazyColorConverter = lazy(() => toolImports.color().then(m => ({ default: m.ColorConverter })));
export const LazyCronParser = lazy(() => toolImports.cron().then(m => ({ default: m.CronParser })));
export const LazyHashGenerator = lazy(() => toolImports.hash().then(m => ({ default: m.HashGenerator })));
export const LazyJsonFormatter = lazy(() => toolImports.json().then(m => ({ default: m.JsonFormatter })));
export const LazyJwtDecoder = lazy(() => toolImports.jwt().then(m => ({ default: m.JwtDecoder })));
export const LazyMarkdownPreview = lazy(() => toolImports.markdown().then(m => ({ default: m.MarkdownPreview })));
export const LazyNumberBaseConverter = lazy(() => toolImports.numberbase().then(m => ({ default: m.NumberBaseConverter })));
export const LazyRegExpTester = lazy(() => toolImports.regex().then(m => ({ default: m.RegExpTester })));
export const LazySqlFormatter = lazy(() => toolImports.sql().then(m => ({ default: m.SqlFormatter })));
export const LazySslCertificateDecoder = lazy(() => toolImports.ssl().then(m => ({ default: m.SslCertificateDecoder })));
export const LazyStringAnalyser = lazy(() => toolImports.string().then(m => ({ default: m.StringAnalyser })));
export const LazyTextDiff = lazy(() => toolImports.diff().then(m => ({ default: m.TextDiff })));
export const LazyTimestampConverter = lazy(() => toolImports.timestamp().then(m => ({ default: m.TimestampConverter })));
export const LazyUrlEncoderDecoder = lazy(() => toolImports.url().then(m => ({ default: m.UrlEncoderDecoder })));
export const LazyUuidGeneratorDecoder = lazy(() => toolImports.uuid().then(m => ({ default: m.UuidGeneratorDecoder })));
export const LazyYamlValidator = lazy(() => toolImports.yaml().then(m => ({ default: m.YamlValidator })));
export const LazyZlibCompressor = lazy(() => toolImports.zlib().then(m => ({ default: m.ZlibCompressor })));
