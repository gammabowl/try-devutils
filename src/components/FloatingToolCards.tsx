
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSuggestion } from "@/utils/contentDetector";
import { ToolDefinition } from "@/utils/commandProcessor";
import { InstantResults } from "./InstantResults";
import { Sparkles, ArrowRight, Zap, Clock } from "lucide-react";

interface FloatingToolCardsProps {
  suggestions: ContentSuggestion[];
  tools: ToolDefinition[];
  content: string;
  onToolSelect: (toolId: string, action?: string, content?: string) => void;
}

export function FloatingToolCards({ suggestions, tools, content, onToolSelect }: FloatingToolCardsProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [instantResults, setInstantResults] = useState<{[key: string]: boolean}>({});

  if (suggestions.length === 0) return null;

  const getToolById = (id: string) => tools.find(tool => tool.id === id);

  const canShowInstantResult = (toolId: string, action?: string) => {
    const simpleOperations = {
      "jwt": ["decode"],
      "base64": ["decode"],
      "uuid": ["validate"],
      "json": ["format"],
      "timestamp": ["convert"]
    };
    return simpleOperations[toolId]?.includes(action || "") || false;
  };

  const handleInstantResult = (suggestion: ContentSuggestion) => {
    const key = `${suggestion.toolId}-${suggestion.action}`;
    setInstantResults(prev => ({
      ...prev,
      [key]: true
    }));
  };

  const handleOpenFullTool = (toolId: string, action?: string) => {
    onToolSelect(toolId, action, content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-dev-primary">
          <Zap className="h-5 w-5" />
          <span className="font-medium">Smart Suggestions</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on your content, here's what I can do:
        </p>
      </div>

      {/* Tool Cards and Instant Results */}
      <div className="space-y-4">
        {suggestions.slice(0, 6).map((suggestion, index) => {
          const tool = getToolById(suggestion.toolId);
          if (!tool) return null;

          const isHovered = hoveredTool === suggestion.toolId;
          const confidence = Math.round(suggestion.confidence * 100);
          const resultKey = `${suggestion.toolId}-${suggestion.action}`;
          const showingInstantResult = instantResults[resultKey];
          const canInstant = canShowInstantResult(suggestion.toolId, suggestion.action);

          return (
            <div key={`${suggestion.toolId}-${index}`} className="space-y-3">
              {/* Original Tool Card */}
              {!showingInstantResult && (
                <Card
                  className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50 hover:border-dev-primary/50 bg-gradient-to-br from-card to-card/50"
                  onMouseEnter={() => setHoveredTool(suggestion.toolId)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <CardContent className="p-6 relative overflow-hidden">
                    {/* Confidence Indicator */}
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Sparkles
                              key={star}
                              className={`h-3 w-3 ${
                                star <= confidence / 20
                                  ? "text-dev-primary fill-dev-primary"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-muted-foreground">{confidence}%</span>
                      </div>
                    </div>

                    {/* Tool Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground capitalize">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>

                      {/* Preview */}
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-sm font-medium text-dev-primary">
                          {suggestion.preview}
                        </p>
                        {suggestion.action && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Action: {suggestion.action}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {canInstant && (
                          <Button
                            onClick={() => handleInstantResult(suggestion)}
                            size="sm"
                            className="flex-1 bg-dev-primary hover:bg-dev-primary/90 text-dev-primary-foreground"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Instant Result
                          </Button>
                        )}
                        <Button
                          onClick={() => handleOpenFullTool(suggestion.toolId, suggestion.action)}
                          size="sm"
                          className={`${canInstant ? 'flex-1' : 'w-full'} group-hover:bg-dev-primary group-hover:text-dev-primary-foreground transition-colors`}
                          variant={isHovered ? "default" : "outline"}
                        >
                          <span>{canInstant ? "Full Tool" : "Use Tool"}</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-dev-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </CardContent>
                </Card>
              )}

              {/* Instant Result */}
              {showingInstantResult && (
                <InstantResults
                  suggestion={suggestion}
                  tool={tool}
                  content={content}
                  onOpenFullTool={() => handleOpenFullTool(suggestion.toolId, suggestion.action)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Show All Tools Link */}
      {suggestions.length > 6 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-dev-primary hover:text-dev-primary">
            Show {suggestions.length - 6} more suggestions
          </Button>
        </div>
      )}
    </div>
  );
}
