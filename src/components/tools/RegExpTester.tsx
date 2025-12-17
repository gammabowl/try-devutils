import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Regex, Copy, AlertCircle, CheckCircle, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface RegExpTesterProps {
  initialContent?: string;
  action?: string;
}

interface Match {
  fullMatch: string;
  groups: string[];
  index: number;
}

export function RegExpTester({ initialContent, action }: RegExpTesterProps) {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState(initialContent || "");
  const [flags, setFlags] = useState({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  const [replacePattern, setReplacePattern] = useState("");
  const [replaceResult, setReplaceResult] = useState("");
  
  const { toast } = useToast();

  const examples = [
    {
      desc: "Email validation",
      pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      testString: "Contact us at support@example.com or sales@company.org",
      flags: { g: true, i: false, m: false, s: false, u: false, y: false }
    },
    {
      desc: "Phone numbers",
      pattern: "\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}",
      testString: "Call (555) 123-4567 or 555.987.6543 for assistance",
      flags: { g: true, i: false, m: false, s: false, u: false, y: false }
    },
    {
      desc: "URLs",
      pattern: "https?://[^\\s]+",
      testString: "Visit https://example.com or http://test.org for more info",
      flags: { g: true, i: false, m: false, s: false, u: false, y: false }
    },
    {
      desc: "Dates (MM/DD/YYYY)",
      pattern: "(\\d{2})/(\\d{2})/(\\d{4})",
      testString: "Events on 12/25/2024 and 01/01/2025",
      flags: { g: true, i: false, m: false, s: false, u: false, y: false }
    },
    {
      desc: "Hex colors",
      pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})",
      testString: "Colors: #FF5733, #333, #00AAFF, and #F0F",
      flags: { g: true, i: false, m: false, s: false, u: false, y: false }
    },
  ];

  const testRegex = () => {
    try {
      setError("");
      setMatches([]);
      setReplaceResult("");

      if (!pattern) {
        setError("Please enter a regular expression pattern");
        return;
      }

      const flagString = Object.entries(flags)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
        .join('');

      const regex = new RegExp(pattern, flagString);
      const foundMatches: Match[] = [];

      if (flags.g) {
        // Global search
        let match;
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
          });
          // Prevent infinite loop for zero-width matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        // Single match
        const match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
          });
        }
      }

      setMatches(foundMatches);

      if (foundMatches.length === 0) {
        toast({
          title: "No matches",
          description: "The pattern didn't match any text",
        });
      } else {
        toast({
          title: "Success!",
          description: `Found ${foundMatches.length} match${foundMatches.length > 1 ? 'es' : ''}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regular expression");
      setMatches([]);
    }
  };

  const performReplace = () => {
    try {
      setError("");
      
      if (!pattern) {
        setError("Please enter a regular expression pattern");
        return;
      }

      const flagString = Object.entries(flags)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
        .join('');

      const regex = new RegExp(pattern, flagString);
      const result = testString.replace(regex, replacePattern);
      setReplaceResult(result);

      toast({
        title: "Replaced!",
        description: "Text replacement completed",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regular expression");
      setReplaceResult("");
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const loadExample = (example: typeof examples[0]) => {
    setPattern(example.pattern);
    setTestString(example.testString);
    setFlags(example.flags);
    setMatches([]);
    setError("");
  };

  const getHighlightedText = () => {
    if (matches.length === 0) return [{ text: testString, isMatch: false }];

    const parts: { text: string; isMatch: boolean; matchIndex?: number }[] = [];
    let lastIndex = 0;

    matches.forEach((match, idx) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ text: testString.slice(lastIndex, match.index), isMatch: false });
      }
      // Add match
      parts.push({ text: match.fullMatch, isMatch: true, matchIndex: idx });
      lastIndex = match.index + match.fullMatch.length;
    });

    // Add remaining text
    if (lastIndex < testString.length) {
      parts.push({ text: testString.slice(lastIndex), isMatch: false });
    }

    return parts;
  };

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Regex className="h-5 w-5 text-dev-primary" />
          RegExp Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Regular Expression Pattern
            </label>
            <div className="flex gap-1">
              {examples.slice(0, 3).map((example, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  onClick={() => loadExample(example)}
                  className="text-xs h-7"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {example.desc}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-lg">/</span>
            <Input
              id="regex-pattern"
              placeholder="Enter regex pattern (without delimiters)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="font-mono bg-muted/50 border-border/50"
            />
            <span className="text-muted-foreground font-mono text-lg">/</span>
            <div className="flex items-center gap-2 bg-muted/30 rounded-md px-3 py-2">
              {Object.entries(flags).map(([flag, value]) => (
                <label key={flag} className="flex items-center gap-1 cursor-pointer">
                  <Checkbox
                    checked={value}
                    onCheckedChange={(checked) => 
                      setFlags(prev => ({ ...prev, [flag]: checked === true }))
                    }
                  />
                  <span className="text-xs font-mono text-foreground">{flag}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold">Flags:</span> g=global, i=case-insensitive, m=multiline, s=dotAll, u=unicode, y=sticky
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Test String
          </label>
          <Textarea
            placeholder="Enter text to test against the pattern..."
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            className="font-mono text-sm bg-muted/50 border-border/50 min-h-[120px]"
          />
        </div>

        <Button
          onClick={testRegex}
          className="w-full bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
        >
          <Regex className="h-4 w-4 mr-2" />
          Test Pattern
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {matches.length > 0 && (
          <Tabs defaultValue="matches" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
              <TabsTrigger value="replace">Replace</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-4 pt-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Highlighted Matches</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {matches.length} match{matches.length > 1 ? 'es' : ''}
                  </Badge>
                </div>
                <div className="font-mono text-sm bg-background/50 p-3 rounded border border-border/30 whitespace-pre-wrap break-words">
                  {getHighlightedText().map((part, idx) => (
                    part.isMatch ? (
                      <mark
                        key={idx}
                        className="bg-yellow-300/50 dark:bg-yellow-600/30 px-0.5 rounded"
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={idx}>{part.text}</span>
                    )
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Match Details</h4>
                {matches.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-dev-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Match {idx + 1}</Badge>
                          <span className="text-xs text-muted-foreground">Position: {match.index}</span>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Full Match:</div>
                          <div className="font-mono text-sm text-foreground bg-background/50 p-2 rounded border border-border/30 break-all">
                            {match.fullMatch}
                          </div>
                        </div>
                        {match.groups.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Captured Groups:</div>
                            <div className="space-y-1">
                              {match.groups.map((group, groupIdx) => (
                                <div key={groupIdx} className="font-mono text-xs text-foreground bg-background/50 p-1.5 rounded border border-border/30">
                                  <span className="text-muted-foreground">Group {groupIdx + 1}:</span> {group || '(empty)'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => copyToClipboard(match.fullMatch)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="replace" className="space-y-4 pt-4">
              <div>
                <label htmlFor="replace-pattern" className="block text-sm font-medium mb-2 text-foreground">
                  Replacement Pattern
                </label>
                <Input
                  id="replace-pattern"
                  placeholder="Enter replacement text (use $1, $2, etc. for groups)"
                  value={replacePattern}
                  onChange={(e) => setReplacePattern(e.target.value)}
                  className="font-mono bg-muted/50 border-border/50"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Use $1, $2, etc. to reference captured groups. Use $& for the full match.
                </div>
              </div>

              <Button
                onClick={performReplace}
                className="w-full bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
              >
                Replace
              </Button>

              {replaceResult && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Result</h4>
                    <Button
                      onClick={() => copyToClipboard(replaceResult)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={replaceResult}
                    readOnly
                    className="font-mono text-sm bg-background/50 border-border/30 min-h-[120px]"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-xs text-muted-foreground space-y-2">
          <div><strong>Quick Reference:</strong></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
            <div>\d = digit</div>
            <div>\w = word character</div>
            <div>\s = whitespace</div>
            <div>. = any character</div>
            <div>* = 0 or more</div>
            <div>+ = 1 or more</div>
            <div>? = 0 or 1</div>
            <div>[abc] = any of a,b,c</div>
            <div>^ = start of string</div>
            <div>$ = end of string</div>
            <div>(x) = capture group</div>
            <div>x|y = x or y</div>
          </div>
        </div>

        {examples.length > 3 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">More Examples</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.slice(3).map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample(example)}
                  className="text-xs justify-start h-auto py-2"
                >
                  <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{example.desc}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
