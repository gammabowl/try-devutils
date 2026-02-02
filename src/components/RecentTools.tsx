
import { ToolCard } from "./ToolCard";
import { Clock, LucideIcon } from "lucide-react";

interface Tool {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: string;
}

interface RecentToolsProps {
  recentTools: Tool[];
  onToolSelect: (id: string) => void;
}

export const RecentTools = ({ recentTools, onToolSelect }: RecentToolsProps) => {
  if (recentTools.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Recently Used</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {recentTools.slice(0, 4).map((tool) => (
          <ToolCard
            key={tool.id}
            {...tool}
            isRecent={true}
            onClick={onToolSelect}
          />
        ))}
      </div>
    </div>
  );
};
