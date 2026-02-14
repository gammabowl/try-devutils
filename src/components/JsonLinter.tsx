import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Braces, TreePine, GitCompare, Search, BookOpen, ArrowRightLeft, ShieldCheck, Upload, WandSparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormatterTab } from "@/components/tabs/FormatterTab";
import { TreeViewTab } from "@/components/tabs/TreeViewTab";
import { DiffTab } from "@/components/tabs/DiffTab";
import { PathQueryTab } from "@/components/tabs/PathQueryTab";
import { ConvertTab } from "@/components/tabs/ConvertTab";
import { SchemaTab } from "@/components/tabs/SchemaTab";
import { isTauri } from "@/lib/platform";

const examples = [
  { json: '{"name":"John Doe","age":30,"city":"New York","active":true}', desc: "Simple object" },
  { json: '[{"id":1,"product":"Laptop","price":999.99},{"id":2,"product":"Mouse","price":29.99}]', desc: "Array of objects" },
  { json: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}},"posts":[{"title":"Hello World","tags":["intro","welcome"]}]}}', desc: "Nested structure" },
  { json: '{"timestamp":"2024-01-01T00:00:00Z","data":null,"count":0,"tags":[]}', desc: "Mixed types" },
];

interface JsonLinterProps {
  initialContent?: string;
  action?: string;
}

export function JsonLinter({ initialContent }: JsonLinterProps) {
  const [sharedJson, setSharedJson] = useState(initialContent || "");
  const [exampleSignal, setExampleSignal] = useState<{ json: string; id: number }>({ json: "", id: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isDesktop = isTauri();

  const handleExampleSelect = (json: string) => {
    setSharedJson(json);
    setExampleSignal((prev) => ({ json, id: prev.id + 1 }));
  };

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") handleExampleSelect(text);
    };
    reader.onerror = () => toast({ title: "Failed to read file", variant: "destructive" });
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (initialContent) {
      setSharedJson(initialContent);
      setExampleSignal((prev) => ({ json: initialContent, id: prev.id + 1 }));
    }
  }, [initialContent]);

  return (
    <Card className="tool-card">
      {!isDesktop && (
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Braces className="h-5 w-5 text-dev-primary" />
            JSON Toolbox
          </CardTitle>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json,.txt,.geojson,.jsonl" className="hidden" onChange={handleLoadFile} />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Load JSON File
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Examples
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="end">
                <p className="text-xs text-muted-foreground px-2 pb-1.5">Load into the active tab's input</p>
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleSelect(ex.json)}
                    className="w-full text-left p-2 hover:bg-accent rounded text-xs space-y-0.5"
                  >
                    <div className="font-medium text-foreground">{ex.desc}</div>
                    <div className="font-mono text-muted-foreground truncate">{ex.json}</div>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      )}
      <CardContent className="space-y-4 flex flex-col min-h-0">
        {isDesktop && (
          <div className="flex items-center justify-end gap-2 shrink-0">
            <input ref={fileInputRef} type="file" accept=".json,.txt,.geojson,.jsonl" className="hidden" onChange={handleLoadFile} />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Load JSON File
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Examples
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="end">
                <p className="text-xs text-muted-foreground px-2 pb-1.5">Load into the active tab's input</p>
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleSelect(ex.json)}
                    className="w-full text-left p-2 hover:bg-accent rounded text-xs space-y-0.5"
                  >
                    <div className="font-medium text-foreground">{ex.desc}</div>
                    <div className="font-mono text-muted-foreground truncate">{ex.json}</div>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        )}
        <Tabs defaultValue="formatter" className="w-full flex flex-col min-h-0 flex-1">
          <div className="flex justify-center">
            <TabsList className="w-full max-w-3xl mb-4 flex-wrap h-auto gap-1 p-1 justify-center">
            <TabsTrigger value="formatter" className="flex-1 gap-1.5">
              <WandSparkles className="h-3.5 w-3.5" /> Formatter
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex-1 gap-1.5">
              <TreePine className="h-3.5 w-3.5" /> Tree View
            </TabsTrigger>
            <TabsTrigger value="diff" className="flex-1 gap-1.5">
              <GitCompare className="h-3.5 w-3.5" /> Diff
            </TabsTrigger>
            <TabsTrigger value="path" className="flex-1 gap-1.5">
              <Search className="h-3.5 w-3.5" /> Path Query
            </TabsTrigger>
            <TabsTrigger value="convert" className="flex-1 gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Convert
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex-1 gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Schema
            </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="formatter" className="flex-1 min-h-0">
            <FormatterTab exampleSignal={exampleSignal} sharedJson={sharedJson} onSharedJsonChange={setSharedJson} />
          </TabsContent>
          <TabsContent value="tree" className="flex-1 min-h-0">
            <TreeViewTab exampleSignal={exampleSignal} sharedJson={sharedJson} onSharedJsonChange={setSharedJson} />
          </TabsContent>
          <TabsContent value="diff" className="flex-1 min-h-0">
            <DiffTab exampleSignal={exampleSignal} sharedJson={sharedJson} onSharedJsonChange={setSharedJson} />
          </TabsContent>
          <TabsContent value="path" className="flex-1 min-h-0">
            <PathQueryTab exampleSignal={exampleSignal} sharedJson={sharedJson} onSharedJsonChange={setSharedJson} />
          </TabsContent>
          <TabsContent value="convert" className="flex-1 min-h-0">
            <ConvertTab exampleSignal={exampleSignal} sharedJson={sharedJson} onSharedJsonChange={setSharedJson} />
          </TabsContent>
          <TabsContent value="schema" className="flex-1 min-h-0">
            <SchemaTab exampleSignal={exampleSignal} sharedJson={sharedJson} onSharedJsonChange={setSharedJson} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
