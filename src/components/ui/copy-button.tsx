import { useState, useCallback } from "react";
import { Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  title?: string;
}

export function CopyButton({ text, className = "", title = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`px-2 py-0.5 rounded text-xs transition-colors border ${
        copied
          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
          : "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800 border-sky-200 dark:border-sky-700"
      } ${className}`}
      title={title}
      type="button"
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3" />
        </span>
      ) : (
        "copy"
      )}
    </button>
  );
}
