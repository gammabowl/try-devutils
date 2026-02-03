import { Outlet, Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Info, Search, Keyboard, Shield, CheckCircle, Twitter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CommandPalette, useCommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp, useGlobalKeyboardShortcuts } from "@/components/KeyboardShortcuts";

export function Layout() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const { showHelp, setShowHelp } = useGlobalKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Command Palette */}
      <CommandPalette isOpen={isOpen} onOpenChange={setIsOpen} />
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp isOpen={showHelp} onOpenChange={setShowHelp} />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-lg dev-gradient">
                <img src="/logo.png" alt="TryDevUtils Logo" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">TryDevUtils</h1>
                <p className="text-sm text-muted-foreground">Essential developer utilities</p>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-4">
              {/* Keyboard shortcuts button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(true)}
                className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground"
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium hidden lg:inline-flex">
                  ?
                </kbd>
              </Button>
              {/* Search button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search...</span>
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium hidden lg:inline-flex">
                  ⌘K
                </kbd>
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-dev-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">No data leaves your browser</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>All processing happens locally</span>
              <span className="hidden sm:inline">•</span>
              <span>No tracking, not even analytics</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>🚫 Ad-free</span>
              <span>⚡ Lightning fast</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                      <img src="/logo.png" alt="TryDevUtils Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Why Choose TryDevUtils?
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-2">
                      Clean, fast, and privacy-focused developer tools
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Most developer utils websites are bloated with ads, trackers, and unnecessary scripts.
                        This project delivers essential tools in a clean, distraction-free interface.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        Privacy First Approach
                      </h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>All processing happens locally in your browser</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>No external fonts or tracking scripts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>No analytics or usage tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>No ads or third-party services</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Only localStorage for your preferences</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4 mt-4">
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span>Crafted by</span>
                        <a
                          href="http://x.com/gammabowl"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-dev-primary hover:underline font-medium"
                        >
                          <Twitter className="h-3 w-3" />
                          @gammabowl
                        </a>
                        <span className="flex items-center gap-1">
                          <span className="italic">Assisted by Copilot</span>
                          <span className="text-lg">🤖✨</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
