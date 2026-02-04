
import { UtilCard } from "./UtilCard";
import { Clock, LucideIcon } from "lucide-react";

interface Util {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: string;
}

interface RecentUtilsProps {
  recentUtils: Util[];
  onUtilSelect: (id: string) => void;
}

export const RecentUtils = ({ recentUtils, onUtilSelect }: RecentUtilsProps) => {
  if (recentUtils.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Recently Used</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {recentUtils.slice(0, 4).map((util) => (
          <UtilCard
            key={util.id}
            {...util}
            isRecent={true}
            onClick={onUtilSelect}
          />
        ))}
      </div>
    </div>
  );
};
