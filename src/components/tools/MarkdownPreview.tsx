import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown"
import { Copy, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useToolKeyboardShortcuts } from "@/components/KeyboardShortcuts"

export function MarkdownPreview() {
  const { toast } = useToast()
  const [markdown, setMarkdown] = useState<string>(
    "# Welcome to Markdown Preview\n\nThis is a **live** preview of your markdown.\n\n## Features:\n- Bold text\n- *Italics*\n- Lists\n- [Links](https://example.com)\n\n```\ncode blocks\n```"
  )

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      toast({
        title: "Copied!",
        description: "Markdown content copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }, [markdown, toast])

  const clearAll = useCallback(() => {
    setMarkdown("")
  }, [])

  // Keyboard shortcuts
  useToolKeyboardShortcuts({
    onClear: clearAll,
    onCopy: copyToClipboard,
  })

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-dev-primary" />
          Markdown Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Markdown Editor
              </label>
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            <div className="relative">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Enter markdown here..."
                className="w-full sm:max-w-[720px] min-h-[400px] font-mono text-sm bg-muted/50 border-border/50 pr-16"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-2 px-2 py-0.5 rounded text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors border border-sky-200 dark:border-sky-700 disabled:opacity-50"
                title="Copy markdown"
                type="button"
                disabled={!markdown}
              >
                copy
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Live Preview
            </label>
            <div className="prose dark:prose-invert max-w-none min-h-[400px] p-4 border rounded-md bg-muted/30 overflow-auto">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
