import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tools, Tool } from "@/lib/tools";
import { prefetchTool } from "@/lib/lazyTools";
import { Keyboard, Heart } from "lucide-react";

const FAVORITES_STORAGE_KEY = "try-devutils-favorites";

function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

interface ToolCardProps {
  tool: Tool;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
}

function ToolCard({ tool, isFavorite, onToggleFavorite }: ToolCardProps) {
  const IconComponent = tool.icon;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(tool.id);
  };

  return (
    <Link
      to={`/${tool.id}`}
      onMouseEnter={() => prefetchTool(tool.id)}
      className="group cursor-pointer p-6 bg-card/50 border border-border/50 rounded-lg hover:bg-card/80 hover:border-dev-primary/50 transition-all duration-200 hover:shadow-md hover:scale-105 relative"
    >
      <button
        onClick={handleFavoriteClick}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-all ${
          isFavorite
            ? "text-red-500 bg-red-500/10"
            : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
        }`}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      </button>
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-lg ${tool.bgColor} group-hover:shadow-lg group-hover:shadow-current transition-all`}>
          <IconComponent className={`h-8 w-8 ${tool.textColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-foreground transition-colors">{tool.label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
        </div>
      </div>
    </Link>
  );
}

const Index = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const toggleFavorite = (toolId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  const favoriteTools = tools.filter((tool) => favorites.includes(tool.id));
  const otherTools = tools.filter((tool) => !favorites.includes(tool.id));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Choose Your Util</h2>
        <p className="text-muted-foreground">Select a developer util to get started</p>
        <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded border bg-background text-xs font-mono">/</kbd>
          <span>to search or</span>
          <kbd className="px-1.5 py-0.5 rounded border bg-background text-xs font-mono">?</kbd>
          <span>for shortcuts</span>
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteTools.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Favorites</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Tools Section */}
      <div className="space-y-3">
        {favoriteTools.length > 0 && (
          <h3 className="text-sm font-medium text-muted-foreground">All Utils</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {otherTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={false}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
