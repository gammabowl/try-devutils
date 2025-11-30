import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type { } from "./stringUtils"
export { length, charCount, wordCount, lineCount, toLowerCase, toUpperCase } from "./stringUtils"
