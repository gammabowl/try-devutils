import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tools, Tool } from "@/lib/tools";
import { prefetchTool } from "@/lib/lazyTools";
import { Keyboard, Heart } from "lucide-react";

const FAVORITES_STORAGE_KEY = "try-devutils-favourites";

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
  isFavourite: boolean;
  onToggleFavourite: (toolId: string) => void;
}

function ToolCard({ tool, isFavourite, onToggleFavourite }: ToolCardProps) {
  const IconComponent = tool.icon;
  
  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavourite(tool.id);
  };

  return (
    <Link
      to={`/${tool.id}`}
      onMouseEnter={() => prefetchTool(tool.id)}
      className="group cursor-pointer p-6 bg-card/50 border border-border/50 rounded-lg hover:bg-card/80 hover:border-dev-primary/50 transition-all duration-200 hover:shadow-md hover:scale-105 relative"
    >
      <button
        onClick={handleFavouriteClick}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-all ${
          isFavourite
            ? "text-red-500 bg-red-500/10"
            : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
        }`}
        title={isFavourite ? "Remove from favourites" : "Add to favourites"}
      >
        <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
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
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    setFavourites(getFavorites());
  }, []);

  const toggleFavourite = (toolId: string) => {
    setFavourites((prev) => {
      const newFavourites = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      saveFavorites(newFavourites);
      return newFavourites;
    });
  };

  const favouriteTools = tools.filter((tool) => favourites.includes(tool.id));
  const otherTools = tools.filter((tool) => !favourites.includes(tool.id));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Keyboard className="h-3.5 w-3.5" />
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded border bg-background text-xs font-mono">/</kbd>
            <span>to search or</span>
            <kbd className="px-1.5 py-0.5 rounded border bg-background text-xs font-mono">?</kbd>
            <span>for shortcuts</span>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <span>Hover over utils and click</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span>to favourite them</span>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      {favouriteTools.length > 0 && (
        <div className="space-y-4">
          <div className="border border-blue-200/30 dark:border-blue-800/30 rounded-xl p-6 bg-card/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Heart className="h-5 w-5 text-blue-500 fill-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Your Favourites</h3>
                <p className="text-sm text-muted-foreground">Quick access to your most-used utilities</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favouriteTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  isFavourite={true}
                  onToggleFavourite={toggleFavourite}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Tools Section */}
      <div className="space-y-4">
        {favouriteTools.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-lg">
              <Keyboard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">All Utilities</h3>
              <p className="text-sm text-muted-foreground">Explore all available developer tools</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {otherTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavourite={false}
              onToggleFavourite={toggleFavourite}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
