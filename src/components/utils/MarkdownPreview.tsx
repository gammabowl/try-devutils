import { useState, useCallback, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// import ReactMarkdown from "react-markdown" // Moved to dynamic import
import { FileText, Loader2 } from "lucide-react"
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts"
import { CopyButton } from "@/components/ui/copy-button"
import { useToast } from "@/hooks/use-toast"

export function MarkdownPreview() {
  const { toast } = useToast()
  const [markdown, setMarkdown] = useState<string>(
    "# Welcome to Markdown Preview\n\nThis is a **live** preview of your markdown.\n\n## Features:\n- Bold text\n- *Italics*\n- Lists\n- [Links](https://example.com)\n\n```\ncode blocks\n```"
  )
  const [ReactMarkdown, setReactMarkdown] = useState<React.ComponentType<{ children: string }> | null>(null)

  useEffect(() => {
    // Dynamically import react-markdown to reduce initial bundle size
    import("react-markdown").then((module) => {
      setReactMarkdown(() => module.default)
    })
  }, [])

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
  useUtilKeyboardShortcuts({
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
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Editor Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Markdown
              </label>
              <div className="flex items-center gap-1">
                <CopyButton
                  text={markdown}
                  className={!markdown ? 'opacity-50 pointer-events-none' : ''}
                  title="Copy markdown"
                />
                <Button onClick={clearAll} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Enter markdown here..."
              className="w-full min-h-[300px] font-mono text-sm bg-muted/50 border-border/50"
            />
          </div>

          {/* Preview Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Preview
            </label>
            <div className="prose dark:prose-invert max-w-none min-h-[300px] p-4 border rounded-md bg-muted/30 overflow-auto">
              {ReactMarkdown ? (
                <ReactMarkdown>{markdown}</ReactMarkdown>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
