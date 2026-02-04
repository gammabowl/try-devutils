
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface UtilCardProps {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category?: string;
  isRecent?: boolean;
  onClick: (id: string) => void;
}

export const UtilCard = ({ 
  id, 
  label, 
  icon: IconComponent, 
  description, 
  category,
  isRecent = false,
  onClick 
}: UtilCardProps) => {
  return (
    <Card
      onClick={() => onClick(id)}
      className="group cursor-pointer p-4 bg-card/50 border-border/50 hover:bg-card/80 hover:border-dev-primary/50 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] relative overflow-hidden"
    >
      {isRecent && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-dev-primary rounded-full animate-pulse"></div>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-dev-primary/10 group-hover:bg-dev-primary/20 transition-colors flex-shrink-0">
          <IconComponent className="h-5 w-5 text-dev-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-dev-primary transition-colors text-sm mb-1 truncate">
            {label}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
          {category && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-muted/50 text-muted-foreground rounded-md">
              {category}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
