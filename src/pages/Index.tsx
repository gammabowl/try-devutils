import { JwtDecoder } from "@/components/tools/JwtDecoder";
import { JsonFormatter } from "@/components/tools/JsonFormatter";
import { UuidGenerator } from "@/components/tools/UuidGenerator";
import { Base64Converter } from "@/components/tools/Base64Converter";
import { TimestampConverter } from "@/components/tools/TimestampConverter";
import { TextDiff } from "@/components/tools/TextDiff";
import { CronParser } from "@/components/tools/CronParser";
import { ColorConverter } from "@/components/tools/ColorConverter";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { YamlValidator } from "@/components/tools/YamlValidator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  KeyRound,
  Braces,
  Hash,
  Clock,
  Calendar,
  Palette,
  Shield,
  FileCode,
  Info,
  X,
  FileText,
  BinaryIcon,
  FileDiffIcon,
  FingerprintIcon,
  FileKeyIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownPreview } from "@/components/tools/MarkdownPreview";

const Index = () => {
  const tools = [
    { id: "jwt", label: "JWT Decoder/Encoder", icon: FileKeyIcon, component: JwtDecoder, description: "Decode, Encode and validate JWT tokens" },
    { id: "json", label: "JSON Formatter", icon: Braces, component: JsonFormatter, description: "Format, validate and minify JSON" },
    { id: "uuid", label: "UUID Generator", icon: FingerprintIcon, component: UuidGenerator, description: "Generate and validate UUIDs" },
    { id: "base64", label: "Base64 Converter", icon: BinaryIcon, component: Base64Converter, description: "Encode and decode Base64 strings" },
    { id: "timestamp", label: "Timestamp Converter", icon: Clock, component: TimestampConverter, description: "Convert Unix timestamps to dates" },
    { id: "diff", label: "Text Diff", icon: FileDiffIcon, component: TextDiff, description: "Compare texts and find differences" },
    { id: "cron", label: "Cron Parser", icon: Calendar, component: CronParser, description: "Parse and explain cron expressions" },
    { id: "color", label: "Colour Converter", icon: Palette, component: ColorConverter, description: "Convert between colour formats" },
    { id: "hash", label: "Hash Generator", icon: Hash, component: HashGenerator, description: "Generate MD5, SHA1, SHA256 hashes" },
    { id: "yaml", label: "YAML Validator", icon: FileCode, component: YamlValidator, description: "Validate and convert YAML" },
    { id: "markdown", label: "Markdown", icon: FileText, component: MarkdownPreview, description: "Live preview of markdown" }
  ];

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showEscHint, setShowEscHint] = useState(false);
  const selectedToolData = tools.find((tool) => tool.id === selectedTool);

  // Handle ESC key to close tool
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTool(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Show ESC hint when tool opens
  useEffect(() => {
    if (selectedTool) {
      setShowEscHint(true);
      const timer = setTimeout(() => setShowEscHint(false), 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg dev-gradient">
                <img src="/logo.png" alt="DevTools Suite Logo" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">DevTools</h1>
                <p className="text-sm text-muted-foreground">Essential developer utilities</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-dev-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">No data leaves your browser</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!selectedTool ? (
          // --- TOOLS GRID ---
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Choose Your Tool</h2>
              <p className="text-muted-foreground">Select a developer tool to get started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className="group cursor-pointer p-6 bg-card/50 border border-border/50 rounded-lg hover:bg-card/80 hover:border-dev-primary/50 transition-all duration-200 hover:shadow-md hover:scale-105"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-lg bg-dev-primary/10 group-hover:bg-dev-primary/20 transition-colors">
                        <IconComponent className="h-8 w-8 text-dev-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-dev-primary transition-colors">{tool.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // --- SELECTED TOOL ---
          <div className="relative max-w-6xl mx-auto">
            {/* Tool Component */}
            {selectedToolData && <selectedToolData.component />}

            {/* Close Icon + optional ESC Hint */}
            <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
              {showEscHint && (
                <span className="text-xs text-muted-foreground bg-background/70 px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                  Press ESC to exit
                </span>
              )}
              <button
                onClick={() => setSelectedTool(null)}
                className="p-2 rounded-full bg-white/30 hover:bg-white/50 shadow-lg transition-all duration-200 transform hover:scale-110"
                aria-label="Close Tool"
              >
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>All processing happens locally</span>
              <span>•</span>
              <span>No tracking, not even analytics</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>🚫 Ad-free</span>
              <span>⚡ Lightning fast</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Why another dev tools?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Most developer tools websites are cluttered with ads and trackers. This project aims to provide quick to use essential utils in a clean, distraction-free interface.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
