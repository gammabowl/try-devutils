import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { tools } from "@/lib/tools";

export function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  
  const tool = tools.find((t) => t.id === toolId);

  // Handle ESC key to go back to grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Tool not found</h2>
        <p className="text-muted-foreground">The tool "{toolId}" doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dev-primary text-dev-primary-foreground hover:bg-dev-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all tools
        </Link>
      </div>
    );
  }

  const ToolComponent = tool.component;

  // Special handling for tools that need navigation prop
  const needsNavigate = toolId === "base64" || toolId === "zlib";

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex justify-center">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-border/60 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">All tools</span>
          <span className="text-muted-foreground/40">|</span>
          <kbd className="px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-background border border-border/50 rounded shadow-sm">
            ESC
          </kbd>
        </Link>
      </div>

      {/* Tool Component */}
      <div className="max-w-[1400px] mx-auto">
        {needsNavigate ? (
          <ToolComponent navigate={(id: string | null) => navigate(id ? `/${id}` : "/")} />
        ) : (
          <ToolComponent />
        )}
      </div>
    </div>
  );
}
