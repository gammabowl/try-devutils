import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { tools } from "@/lib/tools";

const Index = () => {
  const navigate = useNavigate();

  // Handle ESC key - no-op on grid, but keep for consistency
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC does nothing on the grid page
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Choose Your Tool</h2>
        <p className="text-muted-foreground">Select a developer tool to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Link
              key={tool.id}
              to={`/${tool.id}`}
              className="group cursor-pointer p-6 bg-card/50 border border-border/50 rounded-lg hover:bg-card/80 hover:border-dev-primary/50 transition-all duration-200 hover:shadow-md hover:scale-105"
            >
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
        })}
      </div>
    </div>
  );
};

export default Index;
