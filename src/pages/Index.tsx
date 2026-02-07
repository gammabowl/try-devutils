import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { utils, Util } from "@/lib/utils";
import { prefetchUtil } from "@/lib/lazyUtils";
import { Keyboard, Heart } from "lucide-react";
import { isTauri } from "@/lib/platform";

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

interface UtilCardProps {
  util: Util;
  isFavourite: boolean;
  onToggleFavourite: (utilId: string) => void;
  compact?: boolean;
}

/** Web-style card for the grid view */
function UtilCard({ util, isFavourite, onToggleFavourite, compact }: UtilCardProps) {
  const IconComponent = util.icon;
  
  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavourite(util.id);
  };

  // Desktop: card-style layout
  if (compact) {
    return (
      <Link
        to={`/${util.id}`}
        onMouseEnter={() => prefetchUtil(util.id)}
        className="group cursor-pointer bg-card/60 border border-border/40 rounded-lg hover:bg-accent/60 hover:border-border/60 transition-all duration-200 relative overflow-hidden p-4"
      >
        <button
          onClick={handleFavouriteClick}
          className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-all z-10 ${
            isFavourite
              ? "text-red-500 bg-red-500/10"
              : "text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10"
          }`}
          title={isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={`h-3.5 w-3.5 ${isFavourite ? "fill-current" : ""}`} />
        </button>
        <div className="flex flex-col items-center text-center space-y-2 min-w-0">
          <div className={`p-2.5 rounded-lg ${util.bgColor} shrink-0`}>
            <IconComponent className={`h-6 w-6 ${util.textColor}`} />
          </div>
          <div className="min-w-0 w-full">
            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{util.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{util.description}</p>
            {/* Hidden category tag for search */}
            <span className="sr-only">{util.category}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Web: centred card
  return (
    <Link
      to={`/${util.id}`}
      onMouseEnter={() => prefetchUtil(util.id)}
      className="group cursor-pointer bg-card/50 border border-border/50 rounded-lg hover:bg-card/80 hover:border-dev-primary/50 transition-all duration-200 hover:shadow-md hover:scale-105 relative overflow-hidden p-6"
    >
      <button
        onClick={handleFavouriteClick}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-all z-10 ${
          isFavourite
            ? "text-red-500 bg-red-500/10"
            : "text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10"
        }`}
        title={isFavourite ? "Remove from favourites" : "Add to favourites"}
      >
        <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
      </button>
      <div className="flex flex-col items-center text-center space-y-3 min-w-0">
        <div className={`p-3 rounded-lg ${util.bgColor} group-hover:shadow-lg transition-all shrink-0`}>
          <IconComponent className={`h-8 w-8 ${util.textColor}`} />
        </div>
        <div className="min-w-0 w-full">
          <h3 className="font-semibold text-foreground leading-tight truncate">{util.label}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-snug">{util.description}</p>
          {/* Hidden category tag for search */}
          <span className="sr-only">{util.category}</span>
        </div>
      </div>
    </Link>
  );
}

const Index = () => {
  const [favourites, setFavourites] = useState<string[]>([]);
  const isDesktop = isTauri();

  useEffect(() => {
    setFavourites(getFavorites());
  }, []);

  const toggleFavourite = (utilId: string) => {
    setFavourites((prev) => {
      const newFavourites = prev.includes(utilId)
        ? prev.filter((id) => id !== utilId)
        : [...prev, utilId];
      saveFavorites(newFavourites);
      return newFavourites;
    });
  };

  const favouriteUtils = utils.filter((util) => favourites.includes(util.id));
  const nonFavouriteUtils = utils
    .filter((util) => !favourites.includes(util.id))
    .sort((a, b) => a.label.localeCompare(b.label));

  const gridCols = isDesktop
    ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={isDesktop ? "space-y-5 flex-1" : "space-y-6"}>
      {/* Hints (web only) */}
      {!isDesktop && (
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
      )}

      {/* Favorites Section */}
      {favouriteUtils.length > 0 && (
        <div className={isDesktop ? "space-y-2" : "space-y-4"}>
          {isDesktop ? (
            <>
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                <h3 className="text-sm font-semibold text-foreground">Favourites</h3>
                <span className="text-[11px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-full">{favouriteUtils.length}</span>
              </div>
              <div className={`grid ${gridCols} gap-3`}>
                {favouriteUtils.map((util) => (
                  <UtilCard key={util.id} util={util} isFavourite={true} onToggleFavourite={toggleFavourite} compact />
                ))}
              </div>
            </>
          ) : (
            <div className="border rounded-xl bg-card/30 border-blue-200/30 dark:border-blue-800/30 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Heart className="text-blue-500 fill-blue-500 h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Favourites</h3>
                  <p className="text-xs text-muted-foreground">Quick access to your most-used utilities</p>
                </div>
              </div>
              <div className={`grid ${gridCols} gap-4`}>
                {favouriteUtils.map((util) => (
                  <UtilCard key={util.id} util={util} isFavourite={true} onToggleFavourite={toggleFavourite} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Utils */}
      <div className={isDesktop ? "space-y-2" : ""}>
        {isDesktop && favouriteUtils.length > 0 && (
          <div className="flex items-center gap-2">
            <Keyboard className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">All Utilities</h3>
            <span className="text-[11px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-full">{nonFavouriteUtils.length}</span>
          </div>
        )}
        <div className={`grid ${gridCols} ${isDesktop ? "gap-3" : "gap-4"}`}>
          {nonFavouriteUtils.map((util) => (
            <UtilCard
              key={util.id}
              util={util}
              isFavourite={false}
              onToggleFavourite={toggleFavourite}
              compact={isDesktop}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
