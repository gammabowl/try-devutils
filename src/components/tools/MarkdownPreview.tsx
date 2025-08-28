import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown"
import { Copy, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MarkdownPreview() {
  const { toast } = useToast()
  const [markdown, setMarkdown] = useState<string>(
    "# Welcome to Markdown Preview\n\nThis is a **live** preview of your markdown.\n\n## Features:\n- Bold text\n- *Italics*\n- Lists\n- [Links](https://example.com)\n\n```\ncode blocks\n```"
  )

  const copyToClipboard = async () => {
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
  }

  const clearAll = () => {
    setMarkdown("")
  }

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
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button onClick={clearAll} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Enter markdown here..."
              className="min-h-[400px] font-mono text-sm bg-muted/50 border-border/50"
            />
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
