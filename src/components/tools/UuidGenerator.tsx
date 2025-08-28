import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Copy, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4, v1 as uuidv1 } from "uuid";

interface GeneratedUuid {
  id: string;
  value: string;
  version: string;
  timestamp: string;
}

interface UuidGeneratorProps {
  initialContent?: string;
  action?: string;
}

export function UuidGenerator({ initialContent, action }: UuidGeneratorProps) {
  const [uuids, setUuids] = useState<GeneratedUuid[]>([]);
  const [count, setCount] = useState(1);
  const [validationInput, setValidationInput] = useState(initialContent || "");
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && action === "validate") {
      setValidationInput(initialContent);
    }
  }, [initialContent, action]);

  const generateUuid = (version: 'v1' | 'v4', quantity = 1) => {
    const newUuids: GeneratedUuid[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const value = version === 'v4' ? uuidv4() : uuidv1();
      newUuids.push({
        id: uuidv4(), // For React key
        value,
        version,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    
    setUuids(prev => [...newUuids, ...prev]);
    
    toast({
      title: "Generated!",
      description: `${quantity} UUID${quantity > 1 ? 's' : ''} generated`,
    });
  };

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: "UUID copied to clipboard",
    });
  };

  const copyAllUuids = async () => {
    const allValues = uuids.map(uuid => uuid.value).join('\n');
    await navigator.clipboard.writeText(allValues);
    toast({
      title: "All Copied!",
      description: `${uuids.length} UUIDs copied to clipboard`,
    });
  };

  const clearAll = () => {
    setUuids([]);
    toast({
      title: "Cleared",
      description: "All UUIDs removed",
    });
  };

  const validateUuid = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const isValidUuid = validationInput ? validateUuid(validationInput) : null;

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Hash className="h-5 w-5 text-dev-primary" />
          UUID Generator & Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generator Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-20 bg-muted/50 border-border/50"
            />
            <span className="text-sm text-muted-foreground">UUIDs to generate</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateUuid('v4', count)}
              className="bg-dev-primary hover:bg-dev-primary/80 text-dev-primary-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate UUID v4
            </Button>
            
            <Button
              onClick={() => generateUuid('v1', count)}
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate UUID v1
            </Button>

            {uuids.length > 0 && (
              <>
                <Button
                  onClick={copyAllUuids}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
                
                <Button
                  onClick={clearAll}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Validator Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            UUID Validator
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter UUID to validate..."
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              className="font-mono bg-muted/50 border-border/50"
            />
            {isValidUuid !== null && (
              <Badge 
                className={isValidUuid 
                  ? "bg-dev-success text-dev-success-foreground" 
                  : "bg-dev-error text-dev-error-foreground"
                }
              >
                {isValidUuid ? "Valid" : "Invalid"}
              </Badge>
            )}
          </div>
        </div>

        {/* Generated UUIDs List */}
        {uuids.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Generated UUIDs ({uuids.length})
              </label>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {uuids.map((uuid) => (
                <div
                  key={uuid.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30 group hover:border-dev-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-foreground break-all">
                      {uuid.value}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {uuid.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {uuid.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => copyToClipboard(uuid.value)}
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>UUID v1:</strong> Time-based, includes MAC address</p>
          <p><strong>UUID v4:</strong> Random/pseudo-random generation</p>
        </div>
      </CardContent>
    </Card>
  );
}