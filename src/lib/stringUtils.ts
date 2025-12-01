/**
 * Utility helpers for string analysis and transformations.
 * These provide small, well-typed helpers used across tools.
 */

/**
 * Return the number of Unicode code points in the string.
 * Note: This counts code points (so surrogate pairs like emoji are counted as one),
 * but does not attempt to count grapheme clusters (combined emoji + modifiers).
 */
export function length(str: string): number {
  return Array.from(str).length
}

/**
 * Return an object mapping each character (code point) to its occurrence count.
 * Uses code points (Array.from) so surrogate pairs are treated as a single key.
 */
export function charCount(str: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const ch of Array.from(str)) {
    counts[ch] = (counts[ch] || 0) + 1
  }
  return counts
}

/**
 * Count words in the string. A "word" is considered any run of non-whitespace
 * characters (split by Unicode whitespace). This is intentionally simple and
 * works well for most editor/tooling use cases.
 */
export function wordCount(str: string): number {
  if (!str) return 0
  const matches = str.trim().match(/\S+/gu)
  return matches ? matches.length : 0
}

/**
 * Count the number of lines in the string. Empty string => 0 lines.
 * This counts line breaks using CRLF, CR, or LF as separators.
 */
export function lineCount(str: string): number {
  if (!str) return 0
  // Normalize CRLF to LF then split
  const normalized = str.replace(/\r\n/g, "\n")
  return normalized.split(/\n/).length
}

/**
 * Return a lowercase version of the input string using built-in locale-agnostic behaviour.
 */
export function toLowerCase(str: string): string {
  return str.toLowerCase()
}

/**
 * Return an uppercase version of the input string using built-in locale-agnostic behaviour.
 */
export function toUpperCase(str: string): string {
  return str.toUpperCase()
}

/**
 * Convert string to camelCase.
 * Splits on spaces, underscores, hyphens, and capitalizes first letter of each word except the first.
 */
export function toCamelCase(str: string): string {
  if (!str) return ""
  const words = str
    .trim()
    .split(/[\s_-]+/)
    .filter(word => word.length > 0)
  
  if (words.length === 0) return ""
  
  return words
    .map((word, index) => {
      const lower = word.toLowerCase()
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join("")
}

/**
 * Convert string to snake_case.
 * Splits on spaces, hyphens, and camelCase boundaries, joins with underscores.
 */
export function toSnakeCase(str: string): string {
  if (!str) return ""
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2") // camelCase boundaries
    .replace(/[\s-]+/g, "_") // spaces and hyphens to underscores
    .toLowerCase()
}

/**
 * Convert string to kebab-case.
 * Splits on spaces, underscores, and camelCase boundaries, joins with hyphens.
 */
export function toKebabCase(str: string): string {
  if (!str) return ""
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase boundaries
    .replace(/[\s_]+/g, "-") // spaces and underscores to hyphens
    .toLowerCase()
}

export default {
  length,
  charCount,
  wordCount,
  lineCount,
  toLowerCase,
  toUpperCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
}
