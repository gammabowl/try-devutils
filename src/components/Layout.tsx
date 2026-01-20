import { Outlet, Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Why another dev utils?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Most developer utils websites are cluttered with ads and trackers. This project aims to provide quick to use essential utils in a clean, distraction-free interface.
                    </p>
                    <p className="text-xs">
                      Crafted by{" "}
                      <a
                        href="http://x.com/gammabowl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dev-primary hover:underline"
                      >
                        @gammabowl
                      </a>
                    </p>
                    <p className="text-xs">
                      <span className="italic">Assisted by Copilot</span> 🤖✨
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
}
